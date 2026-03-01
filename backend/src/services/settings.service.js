import { supabaseAdmin } from '../config/supabase.js';

export const getSetting = async (key) => {
    if (!supabaseAdmin) return null;
    const { data, error } = await supabaseAdmin
        .from('settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error) return null;
    return data.value;
};

export const updateSetting = async (key, value) => {
    if (!supabaseAdmin) throw new Error('Supabase not configured');
    const { data, error } = await supabaseAdmin
        .from('settings')
        .upsert({ key, value, updated_at: new Date() })
        .select()
        .single();

    if (error) throw error;
    return data;
};
