import dotenv from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

dotenv.config();

// The supabase URL is usually https://[PROJECT_ID].supabase.co
// We need the direct DB connection string.
// Wait, do we have a DATABASE_URL in the .env? Let's check.
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf-8');
const lines = envFile.split('\n');
let dbUrl = '';
for (const line of lines) {
    if (line.startsWith('DATABASE_URL=')) {
        dbUrl = line.split('=')[1].trim().replace(/^"|"$/g, '');
    }
}

if (!dbUrl) {
    console.error('No DATABASE_URL found in .env. We might need to ask the user to run the SQL in Supabase directly.');
    process.exit(1);
}

const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    console.log('Connecting to Postgres directly...');
    try {
        await client.connect();
        console.log('Connected! Creating settings table...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              updated_at TIMESTAMPTZ DEFAULT now()
            );
        `);
        console.log('Settings table ready.');

        await client.query(`
            INSERT INTO settings (key, value) VALUES ('hero_video_url', '') ON CONFLICT (key) DO NOTHING;
        `);
        console.log('Initial row inserted.');

        console.log('All migrations done.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
