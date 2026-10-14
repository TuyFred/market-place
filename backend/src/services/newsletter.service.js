import { supabaseAdmin } from '../config/supabase.js';

export async function subscribeNewsletter(email) {
  if (!supabaseAdmin) {
    const err = new Error('Supabase is not configured');
    err.statusCode = 500;
    throw err;
  }

  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    const err = new Error('Enter a valid email address');
    err.statusCode = 400;
    throw err;
  }

  const { error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .upsert({ email: normalized }, { onConflict: 'email', ignoreDuplicates: true });

  if (error) {
    // Unique violation = already subscribed — treat as success
    if (!/duplicate|unique/i.test(error.message)) {
      const err = new Error(
        error.message.includes('newsletter_subscribers')
          ? 'Newsletter table missing. Run supabase-migrate-auth-newsletter.sql'
          : error.message
      );
      err.statusCode = 400;
      throw err;
    }
  }

  return { message: 'Thanks for subscribing!' };
}
