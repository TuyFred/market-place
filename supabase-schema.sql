-- ============================================================
--  Ass Market Place – Supabase SQL Setup
--  Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. CATEGORIES TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- allow public read, admin write is handled via service-role key
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage categories"
  ON categories FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 2. PRODUCTS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  category     TEXT NOT NULL,
  size         TEXT,
  "imageUrl"   TEXT,
  "imageUrls"  TEXT[] DEFAULT '{}',
  stock        INTEGER DEFAULT 0,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage products"
  ON products FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 3. ORDERS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,
  customer_address  TEXT NOT NULL,
  product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
  notes             TEXT,
  proof_url         TEXT,
  user_id           UUID,
  user_email        TEXT,
  status            TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage orders"
  ON orders FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 4. STORAGE BUCKET (product images)
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('order-proofs', 'order-proofs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ─────────────────────────────────────────────
-- 5. SEED CATEGORIES
-- ─────────────────────────────────────────────
INSERT INTO categories (name, slug) VALUES
  ('Children Shoes', 'children-shoes'),
  ('Women Shoes',    'women-shoes'),
  ('Small Bags',     'small-bags'),
  ('Electronics',    'electronics')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────
-- 6. REGISTER ADMIN USER
-- ─────────────────────────────────────────────
-- Supabase Auth users cannot be created with plain SQL.
-- After running this script, run the seed command from
-- your terminal to register the admin:
--
--   cd backend
--   node src/scripts/seed-admin.js
--
-- This will create:
--   Email    : admin@gmail.com
--   Password : admin1232
--   Role     : admin
--
-- Alternatively, you can create the admin user manually
-- in the Supabase Dashboard → Authentication → Users → Add User:
--   Email    : admin@gmail.com
--   Password : admin1232
--   Then go to the user → Edit → user_metadata and add:
--   { "full_name": "Admin", "role": "admin" }
-- ─────────────────────────────────────────────


-- ✅ Done!  Now run:  node backend/src/scripts/seed-admin.js

-- Run this in your Supabase SQL Editor to support the Video Upload:
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO settings (key, value) VALUES ('hero_video_url', '') ON CONFLICT (key) DO NOTHING;
