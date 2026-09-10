-- ============================================================
-- AFROLUXO by ASI — FULL Supabase setup (run once)
-- Dashboard → SQL Editor → New query → Paste ALL → Run
-- Clothes-only marketplace: African + modern categories
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- 1. CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
DROP POLICY IF EXISTS "Service role can manage categories" ON public.categories;

CREATE POLICY "Anyone can read categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage categories"
  ON public.categories FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 2. PRODUCTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
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

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
DROP POLICY IF EXISTS "Service role can manage products" ON public.products;

CREATE POLICY "Anyone can read active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage products"
  ON public.products FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- 3. ORDERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,
  customer_address  TEXT NOT NULL,
  product_id        UUID REFERENCES public.products(id) ON DELETE SET NULL,
  notes             TEXT,
  proof_url         TEXT,
  user_id           UUID,
  user_email        TEXT,
  status            TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

CREATE POLICY "Service role can manage orders"
  ON public.orders FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 4. SETTINGS (hero video, etc.)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;
DROP POLICY IF EXISTS "Service role can manage settings" ON public.settings;

CREATE POLICY "Anyone can read settings"
  ON public.settings FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage settings"
  ON public.settings FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO public.settings (key, value)
VALUES ('hero_video_url', '')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────
-- 5. STORAGE BUCKETS
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', true),
  ('order-proofs', 'order-proofs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view order proofs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload order proofs" ON storage.objects;

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

CREATE POLICY "Anyone can view order proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'order-proofs');

CREATE POLICY "Authenticated users can upload order proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'order-proofs' AND auth.role() = 'authenticated');

-- ─────────────────────────────────────────────
-- 6. CLOTHES CATEGORIES ONLY
-- ─────────────────────────────────────────────
DELETE FROM public.categories
WHERE slug IN ('children-shoes', 'women-shoes', 'small-bags', 'electronics');

INSERT INTO public.categories (name, slug) VALUES
  ('African Traditional', 'african-traditional'),
  ('Ankara & Prints',     'ankara-prints'),
  ('Modern Casual',       'modern-casual'),
  ('Women Wear',          'women-wear'),
  ('Men Wear',            'men-wear'),
  ('Kids Wear',           'kids-wear'),
  ('Formal & Occasion',   'formal-occasion'),
  ('Street Style',        'street-style')
ON CONFLICT (slug) DO NOTHING;

-- Soft-hide any leftover non-clothes products
UPDATE public.products
SET is_active = false
WHERE category IN ('children-shoes', 'women-shoes', 'small-bags', 'electronics');

-- ─────────────────────────────────────────────
-- 7. ADMIN USER (Auth)
--    Email   : admin@system.com
--    Password: admin123@
--    Role    : admin
-- ─────────────────────────────────────────────
DO $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  -- If admin already exists, update metadata + password
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@system.com'
  LIMIT 1;

  v_encrypted_pw := crypt('admin123@', gen_salt('bf'));

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@system.com',
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin","role":"admin"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      format('{"sub":"%s","email":"admin@system.com"}', v_user_id)::jsonb,
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = v_encrypted_pw,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
        || '{"full_name":"Admin","role":"admin"}'::jsonb,
      updated_at = now()
    WHERE id = v_user_id;

    IF NOT EXISTS (
      SELECT 1 FROM auth.identities
      WHERE user_id = v_user_id AND provider = 'email'
    ) THEN
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        v_user_id,
        v_user_id,
        format('{"sub":"%s","email":"admin@system.com"}', v_user_id)::jsonb,
        'email',
        v_user_id::text,
        now(),
        now(),
        now()
      );
    END IF;
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- DONE
-- Admin login:
--   Email    : admin@system.com
--   Password : admin123@
--   Dashboard: /admin/dashboard
-- ============================================================
