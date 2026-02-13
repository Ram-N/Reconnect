import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export async function processAudio(audioBlob: Blob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const { data, error } = await supabase.functions.invoke('process', {
        body: formData,
    });

    if (error) {
        console.error('Edge Function Error:', error);
        throw new Error(error.message || 'Edge Function failed');
    }

    if (data && data.error) {
        console.error('Edge Function returned error:', data.error);
        throw new Error(data.error);
    }

    return data;
}

export async function saveInteraction(interaction: any) {
    const { data, error } = await supabase
        .from('interactions')
        .insert(interaction)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getContacts() {
    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .not('display_name', 'in', '("__Self","__Unassigned")')
        .order('display_name');

    if (error) throw error;
    return data;
}

export async function getUpNext() {
    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .lt('next_checkin_date', new Date().toISOString())
        .order('next_checkin_date');

    if (error) throw error;
    return data;
}

export async function getContact(id: string) {
    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function getContactInteractions(contactId: string) {
    const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('contact_id', contactId)
        .order('occurred_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getContactPeople(contactId: string) {
    const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('contact_id', contactId);

    if (error) throw error;
    return data;
}

export async function getFollowUps(filter?: 'all' | 'overdue' | 'today' | 'week') {
    let query = supabase
        .from('followups')
        .select(`
            id,
            contact_id,
            interaction_id,
            task,
            due_date,
            completed,
            contacts (display_name)
        `)
        .order('due_date', { ascending: true });

    // Apply filters based on filter parameter
    if (filter === 'overdue') {
        const today = new Date().toISOString().split('T')[0];
        query = query.lt('due_date', today).eq('completed', false);
    } else if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.eq('due_date', today).eq('completed', false);
    } else if (filter === 'week') {
        const today = new Date();
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        query = query
            .gte('due_date', today.toISOString().split('T')[0])
            .lte('due_date', weekFromNow.toISOString().split('T')[0])
            .eq('completed', false);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
}

export async function toggleFollowUpComplete(id: string, completed: boolean) {
    const { data, error } = await supabase
        .from('followups')
        .update({
            completed,
            completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function createFollowUp(followup: {
    contact_id: string;
    interaction_id: string;
    task: string;
    due_date: string;
}) {
    const { data, error } = await supabase
        .from('followups')
        .insert(followup)
        .select()
        .single();

    if (error) throw error;
    return data;
}
