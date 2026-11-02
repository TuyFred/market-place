-- Restore products hidden by the previous clothes-only migration.
-- This does not delete or overwrite product records.
BEGIN;

INSERT INTO public.categories (name, slug) VALUES
  ('Children Shoes', 'children-shoes'),
  ('Women Shoes',   'women-shoes'),
  ('Small Bags',    'small-bags'),
  ('Electronics',   'electronics')
ON CONFLICT (slug) DO NOTHING;

UPDATE public.products
SET is_active = true
WHERE category IN ('children-shoes', 'women-shoes', 'small-bags', 'electronics')
  AND is_active = false;

COMMIT;
