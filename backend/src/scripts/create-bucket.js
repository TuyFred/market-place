import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE env vars.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Checking bucket hero-videos...');
    const { data: buckets, error: getErr } = await supabase.storage.listBuckets();
    if (getErr) {
        console.error('Error listing buckets:', getErr.message);
        return;
    }

    const exists = buckets.find(b => b.name === 'hero-videos');
    if (!exists) {
        console.log('Bucket not found. Creating hero-videos...');
        const { data, error } = await supabase.storage.createBucket('hero-videos', {
            public: true,
            fileSizeLimit: 52428800, // 50MB
            allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime']
        });
        if (error) {
            console.error('Error creating bucket:', error.message);
        } else {
            console.log('Bucket created successfully!');
        }
    } else {
        console.log('Bucket hero-videos already exists.');

        // Ensure it's public
        if (!exists.public) {
            await supabase.storage.updateBucket('hero-videos', {
                public: true
            });
            console.log('Updated bucket to be public.');
        }
    }
}

main().catch(console.error);
