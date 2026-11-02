-- Add the clothes categories without deleting existing categories or hiding products.

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
