-- AFROLUXO — payment settings, subcategories, order payment flow
-- Run in Supabase SQL Editor after supabase-schema.sql

-- Subcategories (optional parent category)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON public.categories (parent_id);

-- Product optional subcategory slug
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Order payment tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'awaiting_payment',
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Expand status values for payment review
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'payment_review',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled'
  ));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (
    payment_status IS NULL OR payment_status IN (
      'awaiting_payment',
      'payment_review',
      'paid',
      'rejected'
    )
  );

-- Default payment / support settings (admin can edit in dashboard)
INSERT INTO public.settings (key, value) VALUES
  ('payment_bank_name', ''),
  ('payment_bank_account', ''),
  ('payment_bank_account_name', ''),
  ('payment_mobile_number', ''),
  ('payment_mobile_name', ''),
  ('payment_paypal_email', ''),
  ('payment_support_phone', ''),
  ('payment_instructions', 'Transfer the total amount using one of the methods below, then submit your payment details so we can confirm your order.')
ON CONFLICT (key) DO NOTHING;
