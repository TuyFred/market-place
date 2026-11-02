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

const bucketsToEnsure = [
    { name: 'product-images', fileSizeLimit: 5 * 1024 * 1024 },
    { name: 'order-proofs', fileSizeLimit: 5 * 1024 * 1024 },
    { name: 'hero-videos', fileSizeLimit: 40 * 1024 * 1024 }
];

async function main() {
    const { data: buckets, error: getErr } = await supabase.storage.listBuckets();
    if (getErr) throw new Error(`Error listing buckets: ${getErr.message}`);

    for (const bucketConfig of bucketsToEnsure) {
        const existing = buckets.find((bucket) => bucket.name === bucketConfig.name);
        if (!existing) {
            const { error } = await supabase.storage.createBucket(bucketConfig.name, {
                public: true,
                fileSizeLimit: bucketConfig.fileSizeLimit
            });
            if (error) throw new Error(`Could not create ${bucketConfig.name}: ${error.message}`);
            console.log(`Created public bucket ${bucketConfig.name}.`);
            continue;
        }

        const { error } = await supabase.storage.updateBucket(bucketConfig.name, {
            public: true,
            fileSizeLimit: bucketConfig.fileSizeLimit
        });
        if (error) throw new Error(`Could not configure ${bucketConfig.name}: ${error.message}`);
        console.log(`Verified public bucket ${bucketConfig.name}.`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
