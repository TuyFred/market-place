/**
 * Seed sample clothes products into Supabase (real DB).
 * Run once after schema:  npm run seed-products   (from backend/)
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
  console.error('Set real SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SAMPLES = [
  {
    name: 'Kente Heritage Robe',
    description: 'African traditional kente robe — AFROLUXO collection.',
    price: 19379,
    category: 'african-traditional',
    stock: 12,
    imageUrl:
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Adire Wrap Blouse',
    description: 'Hand-dyed Adire wrap blouse.',
    price: 20758,
    category: 'african-traditional',
    stock: 10,
    imageUrl:
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Ankara Midi Dress',
    description: 'Bold Ankara print midi dress.',
    price: 24500,
    category: 'ankara-prints',
    stock: 15,
    imageUrl:
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Ankara Shirt Pair',
    description: 'Matching Ankara shirt set.',
    price: 18900,
    category: 'ankara-prints',
    stock: 8,
    imageUrl:
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Casual Linen Set',
    description: 'Modern casual linen two-piece.',
    price: 22000,
    category: 'modern-casual',
    stock: 14,
    imageUrl:
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Everyday Tee Pack',
    description: 'Soft everyday tees — pack of essentials.',
    price: 12500,
    category: 'modern-casual',
    stock: 20,
    imageUrl:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Women Flare Gown',
    description: 'Elegant flare gown for women.',
    price: 31000,
    category: 'women-wear',
    stock: 7,
    imageUrl:
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Women Blazer Look',
    description: 'Tailored blazer for modern women.',
    price: 28000,
    category: 'women-wear',
    stock: 9,
    imageUrl:
      'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Men Dashiki Shirt',
    description: 'Classic men dashiki shirt.',
    price: 17500,
    category: 'men-wear',
    stock: 11,
    imageUrl:
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Men Casual Chinos',
    description: 'Comfortable men chinos.',
    price: 16000,
    category: 'men-wear',
    stock: 16,
    imageUrl:
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Kids Party Dress',
    description: 'Bright kids party dress.',
    price: 9800,
    category: 'kids-wear',
    stock: 18,
    imageUrl:
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Kids Play Set',
    description: 'Soft kids play set.',
    price: 8500,
    category: 'kids-wear',
    stock: 22,
    imageUrl:
      'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Formal Evening Suit',
    description: 'Sharp formal evening suit.',
    price: 52000,
    category: 'formal-occasion',
    stock: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Occasion Cocktail Dress',
    description: 'Cocktail dress for special occasions.',
    price: 36000,
    category: 'formal-occasion',
    stock: 6,
    imageUrl:
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Street Hoodie',
    description: 'Urban street-style hoodie.',
    price: 14200,
    category: 'street-style',
    stock: 25,
    imageUrl:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Street Cargo Pants',
    description: 'Street cargo pants.',
    price: 15800,
    category: 'street-style',
    stock: 13,
    imageUrl:
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Boubou Classic',
    description: 'Flowing classic boubou.',
    price: 26500,
    category: 'african-traditional',
    stock: 8,
    imageUrl:
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Print Palazzo Pants',
    description: 'Ankara palazzo pants.',
    price: 13400,
    category: 'ankara-prints',
    stock: 12,
    imageUrl:
      'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Office Sheath Dress',
    description: 'Clean office sheath dress.',
    price: 22900,
    category: 'women-wear',
    stock: 10,
    imageUrl:
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Denim Jacket Classic',
    description: 'Classic denim jacket for street style.',
    price: 19800,
    category: 'street-style',
    stock: 14,
    imageUrl:
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
  },
];

async function seed() {
  console.log('\nSeeding products into Supabase…\n');

  const { count, error: countErr } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error('Cannot read products table:', countErr.message);
    console.error('Run supabase-schema.sql in the Supabase SQL Editor first.');
    process.exit(1);
  }

  if ((count || 0) > 0) {
    console.log(`Products already exist (${count}). Skipping insert.`);
    console.log('To re-seed, delete products in Supabase Table Editor first.\n');
    return;
  }

  const rows = SAMPLES.map((p) => ({
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.category,
    stock: p.stock,
    imageUrl: p.imageUrl,
    imageUrls: [p.imageUrl],
    is_active: true,
  }));

  const { data, error } = await supabase.from('products').insert(rows).select('id,name');

  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }

  console.log(`Inserted ${data?.length || 0} products.`);
  (data || []).slice(0, 5).forEach((p) => console.log('  -', p.name));
  if ((data?.length || 0) > 5) console.log('  …');
  console.log('\nDone. Refresh the shop to see real products.\n');
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
