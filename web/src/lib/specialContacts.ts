import { supabase } from './api';

// Special contact identifiers
export const SPECIAL_CONTACTS = {
  SELF: '__Self',
  UNASSIGNED: '__Unassigned',
} as const;

export interface SpecialContact {
  id: string;
  display_name: string;
}

/**
 * Ensures special system contacts exist for the current user.
 * Creates them if they don't exist.
 * Returns the IDs of both special contacts.
 */
export async function ensureSpecialContacts(): Promise<{
  selfContactId: string | null;
  unassignedContactId: string | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No authenticated user - cannot create special contacts');
      return { selfContactId: null, unassignedContactId: null };
    }

    // Check if special contacts exist
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('id, display_name')
      .in('display_name', [SPECIAL_CONTACTS.SELF, SPECIAL_CONTACTS.UNASSIGNED]);

    const selfContact = existingContacts?.find(c => c.display_name === SPECIAL_CONTACTS.SELF);
    const unassignedContact = existingContacts?.find(c => c.display_name === SPECIAL_CONTACTS.UNASSIGNED);

    let selfContactId = selfContact?.id || null;
    let unassignedContactId = unassignedContact?.id || null;

    // Create Self contact if it doesn't exist
    if (!selfContact) {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          owner_uid: user.id,
          display_name: SPECIAL_CONTACTS.SELF,
          notes: 'Personal notes to self',
          cadence_days: null, // No check-in cadence for self notes
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create Self contact:', error);
      } else {
        selfContactId = data.id;
        console.log('Created __Self contact:', selfContactId);
      }
    }

    // Create Unassigned contact if it doesn't exist
    if (!unassignedContact) {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          owner_uid: user.id,
          display_name: SPECIAL_CONTACTS.UNASSIGNED,
          notes: 'Temporary placeholder for unassigned notes',
          cadence_days: null, // No check-in cadence
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create Unassigned contact:', error);
      } else {
        unassignedContactId = data.id;
        console.log('Created __Unassigned contact:', unassignedContactId);
      }
    }

    return { selfContactId, unassignedContactId };
  } catch (error) {
    console.error('Error ensuring special contacts:', error);
    return { selfContactId: null, unassignedContactId: null };
  }
}

/**
 * Get the ID of the Self contact for the current user
 */
export async function getSelfContactId(): Promise<string | null> {
  const { data } = await supabase
    .from('contacts')
    .select('id')
    .eq('display_name', SPECIAL_CONTACTS.SELF)
    .single();

  return data?.id || null;
}

/**
 * Get the ID of the Unassigned contact for the current user
 */
export async function getUnassignedContactId(): Promise<string | null> {
  const { data } = await supabase
    .from('contacts')
    .select('id')
    .eq('display_name', SPECIAL_CONTACTS.UNASSIGNED)
    .single();

  return data?.id || null;
}

/**
 * Check if a contact is a special system contact
 */
export function isSpecialContact(displayName: string): boolean {
  return displayName === SPECIAL_CONTACTS.SELF || displayName === SPECIAL_CONTACTS.UNASSIGNED;
}
