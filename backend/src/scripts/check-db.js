/**
 * Local DB connectivity check.
 * Run: npm run check-db   (from backend/)
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';
import dns from 'dns/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function fail(title, steps) {
  console.error('\n❌  ' + title + '\n');
  steps.forEach((s, i) => console.error(`   ${i + 1}. ${s}`));
  console.error('');
  process.exit(1);
}

async function main() {
  console.log('\nAFROLUXO — database check\n');

  if (!url || !key) {
    fail('Missing Supabase credentials in backend/.env', [
      'Open backend/.env',
      'Set SUPABASE_URL=https://YOUR_REF.supabase.co',
      'Set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key',
      'Get both from Supabase → Project Settings → API'
    ]);
  }

  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    fail('SUPABASE_URL is not a valid URL', [
      'It must look like: https://abcdefgh.supabase.co'
    ]);
  }

  console.log('   URL host:', host);

  try {
    await dns.lookup(host);
    console.log('   DNS: OK');
  } catch {
    fail(
      `DNS cannot find "${host}" — this Supabase project does not exist (deleted or wrong URL).`,
      [
        'Go to https://supabase.com/dashboard and create a NEW project (or open an existing one)',
        'Project Settings → API → copy Project URL + service_role key',
        'Paste them into backend/.env (and matching values into frontend/.env)',
        'In Supabase SQL Editor, run the file: supabase-schema.sql',
        'Then run: npm run check-db',
        'Then: node src/scripts/seed-admin.js',
        'Then start: npm run dev  (backend) and npm run dev (frontend)'
      ]
    );
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase.from('categories').select('name,slug').limit(20);

  if (error) {
    const msg = error.message || String(error);
    if (/relation .*categories.* does not exist|Could not find the table/i.test(msg)) {
      fail('Connected to Supabase, but tables are missing', [
        'Open Supabase → SQL Editor',
        'Paste and run the full file: supabase-schema.sql',
        'Run: npm run check-db again'
      ]);
    }
    fail('Supabase reachable but query failed: ' + msg, [
      'Confirm SUPABASE_SERVICE_ROLE_KEY is the service_role key (not anon)',
      'Confirm the project is not paused in the Supabase dashboard'
    ]);
  }

  console.log('   Database: CONNECTED');
  console.log('   Categories:', (data || []).length);
  if (data?.length) {
    console.log('   Slugs:', data.map((c) => c.slug).join(', '));
  } else {
    console.log('   (No categories yet — run supabase-schema.sql if needed)');
  }
  console.log('\n✅  Ready for local use.\n');
  console.log('   Backend:  cd backend && npm run dev');
  console.log('   Frontend: cd frontend && npm run dev');
  console.log('   Health:   http://localhost:4000/health\n');
}

main().catch((e) => {
  console.error('❌  Unexpected error:', e.message || e);
  process.exit(1);
});
