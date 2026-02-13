import { supabase } from './api';
import { SPECIAL_CONTACTS } from './specialContacts';

/**
 * Cleanup duplicate special contacts - keeps only one of each type
 * Run this once to fix the duplicate contacts issue
 */
export async function cleanupDuplicateSpecialContacts() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user');
      return;
    }

    // Get all Self contacts
    const { data: selfContacts } = await supabase
      .from('contacts')
      .select('id, created_at')
      .eq('display_name', SPECIAL_CONTACTS.SELF)
      .order('created_at', { ascending: true });

    if (selfContacts && selfContacts.length > 1) {
      // Keep the oldest one, delete the rest
      const toDelete = selfContacts.slice(1).map(c => c.id);
      console.log(`Deleting ${toDelete.length} duplicate __Self contacts:`, toDelete);

      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', toDelete);

      if (error) {
        console.error('Failed to delete duplicate Self contacts:', error);
      } else {
        console.log('Successfully cleaned up duplicate __Self contacts');
      }
    }

    // Get all Unassigned contacts
    const { data: unassignedContacts } = await supabase
      .from('contacts')
      .select('id, created_at')
      .eq('display_name', SPECIAL_CONTACTS.UNASSIGNED)
      .order('created_at', { ascending: true });

    if (unassignedContacts && unassignedContacts.length > 1) {
      // Keep the oldest one, delete the rest
      const toDelete = unassignedContacts.slice(1).map(c => c.id);
      console.log(`Deleting ${toDelete.length} duplicate __Unassigned contacts:`, toDelete);

      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', toDelete);

      if (error) {
        console.error('Failed to delete duplicate Unassigned contacts:', error);
      } else {
        console.log('Successfully cleaned up duplicate __Unassigned contacts');
      }
    }

    console.log('Cleanup complete!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}
