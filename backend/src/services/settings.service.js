import { supabaseAdmin } from '../config/supabase.js';

export const PAYMENT_SETTING_KEYS = [
  'hero_video_url',
  'payment_bank_name',
  'payment_bank_account',
  'payment_bank_account_name',
  'payment_mobile_number',
  'payment_mobile_name',
  'payment_paypal_email',
  'payment_support_phone',
  'payment_instructions'
];

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

export const getAllSettings = async () => {
  if (!supabaseAdmin) {
    return Object.fromEntries(PAYMENT_SETTING_KEYS.map((k) => [k, '']));
  }

  const { data, error } = await supabaseAdmin.from('settings').select('key,value');
  const map = Object.fromEntries(PAYMENT_SETTING_KEYS.map((k) => [k, '']));
  if (error || !data) return map;
  for (const row of data) {
    map[row.key] = row.value ?? '';
  }
  return map;
};

export const updateSetting = async (key, value) => {
  if (!supabaseAdmin) throw new Error('Supabase not configured');
  const { data, error } = await supabaseAdmin
    .from('settings')
    .upsert({ key, value: value ?? '', updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updatePaymentSettings = async (payload) => {
  const allowed = PAYMENT_SETTING_KEYS.filter((k) => k.startsWith('payment_'));
  const updates = [];
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      updates.push(updateSetting(key, String(payload[key] ?? '')));
    }
  }
  await Promise.all(updates);
  return getAllSettings();
};
