import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: './backend/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
    console.log('🚀 Starting migration: Adding image_urls column...');

    // Check if column exists by trying to select it or just running the alter table via a sql rpc if available.
    // Since we don't have a direct SQL runner, we'll try to update the schema if possible or use the REST API to check if it's there.

    // Note: To run ALTER TABLE, we usually need the SQL Editor or a postgres function.
    // If we can't run ALTER TABLE, we'll have to ask the user to do it in the Supabase Dashboard.

    console.log('Please run this in your Supabase SQL Editor:');
    console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS "imageUrls" text[];');
    console.log('UPDATE products SET "imageUrls" = ARRAY["imageUrl"] WHERE "imageUrl" IS NOT NULL AND "imageUrls" IS NULL;');
}

migrate();
