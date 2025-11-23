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
