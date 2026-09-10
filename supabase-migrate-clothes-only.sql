-- Migrate existing DB to clothes-only categories
-- Run in Supabase SQL Editor if you already ran the old schema

UPDATE products
SET is_active = false
WHERE category IN ('children-shoes', 'women-shoes', 'small-bags', 'electronics');

DELETE FROM categories WHERE slug IN (
  'children-shoes', 'women-shoes', 'small-bags', 'electronics'
);

INSERT INTO categories (name, slug) VALUES
  ('African Traditional', 'african-traditional'),
  ('Ankara & Prints',     'ankara-prints'),
  ('Modern Casual',       'modern-casual'),
  ('Women Wear',          'women-wear'),
  ('Men Wear',            'men-wear'),
  ('Kids Wear',           'kids-wear'),
  ('Formal & Occasion',   'formal-occasion'),
  ('Street Style',        'street-style')
ON CONFLICT (slug) DO NOTHING;
