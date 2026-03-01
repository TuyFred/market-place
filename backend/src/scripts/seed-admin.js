/**
 * Seed script – creates the admin user in Supabase Auth.
 * Run once:  node backend/src/scripts/seed-admin.js
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: new URL('../../.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const ADMIN_EMAIL = 'admin@system.com';
const ADMIN_PASSWORD = 'admin123@';

async function seed() {
    console.log(`\n🔑  Seeding admin user: ${ADMIN_EMAIL}\n`);

    // Check if user already exists
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find((u) => u.email === ADMIN_EMAIL);

    if (found) {
        // Make sure role is admin
        const { error: updateErr } = await supabase.auth.admin.updateUserById(found.id, {
            user_metadata: { ...found.user_metadata, role: 'admin', full_name: 'Admin' }
        });
        if (updateErr) {
            console.error('❌  Could not update existing user:', updateErr.message);
            process.exit(1);
        }
        console.log('✅  Admin user already exists – role confirmed as admin.');
        return;
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
            full_name: 'Admin',
            role: 'admin'
        }
    });

    if (error) {
        console.error('❌  Failed to create admin:', error.message);
        process.exit(1);
    }

    console.log('✅  Admin user created successfully!');
    console.log(`    id   : ${data.user.id}`);
    console.log(`    email: ${data.user.email}`);
    console.log(`    role : admin`);
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
