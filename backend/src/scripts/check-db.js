import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
    const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
    if (error) {
        console.error('Error checking products table:', error.message);
    } else {
        console.log('Products table exists, count:', data);
    }

    const { data: catData, error: catError } = await supabase.from('categories').select('count', { count: 'exact', head: true });
    if (catError) {
        console.error('Error checking categories table:', catError.message);
    } else {
        console.log('Categories table exists, count:', catData);
    }
}

check();
