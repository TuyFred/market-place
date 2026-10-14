/**
 * Bootstrap the FIRST administrator (server-side only).
 * Never expose this as a public HTTP endpoint.
 *
 * Run once:  npm run seed-admin   (from backend/)
 * Credentials (default): admin@system.com / admin123@
 * Override with ADMIN_EMAIL / ADMIN_PASSWORD in backend/.env
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || SUPABASE_URL.includes('YOUR_PROJECT')) {
  console.error('Set real SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@system.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123@';

async function seed() {
  console.log(`\nBootstrapping admin (server-side only): ${ADMIN_EMAIL}\n`);

  const { data: existing, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error('Could not list users:', listErr.message);
    process.exit(1);
  }

  const found = existing?.users?.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);

  if (found) {
    const { error: updateErr } = await supabase.auth.admin.updateUserById(found.id, {
      password: ADMIN_PASSWORD,
      app_metadata: { ...(found.app_metadata || {}), role: 'admin' },
      user_metadata: {
        ...(found.user_metadata || {}),
        full_name: found.user_metadata?.full_name || 'Admin'
      }
    });
    if (updateErr) {
      console.error('Could not update existing user:', updateErr.message);
      process.exit(1);
    }
    console.log('Admin already exists — role confirmed in app_metadata (admin).');
    console.log(`Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    app_metadata: { role: 'admin' },
    user_metadata: { full_name: 'Admin' }
  });

  if (error) {
    console.error('Failed to create admin:', error.message);
    process.exit(1);
  }

  console.log('Admin user created successfully!');
  console.log(`id   : ${data.user.id}`);
  console.log(`email: ${data.user.email}`);
  console.log(`role : admin (app_metadata)`);
  console.log(`Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('\nKeep this password private. Create more admins via POST /api/auth/admins (authenticated).');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
