-- Product reviews (Amazon-style) + likes for popularity
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  user_email  TEXT,
  user_name   TEXT,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title       TEXT,
  body        TEXT NOT NULL,
  is_visible  BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_reviews_product_id_idx ON public.product_reviews (product_id);
CREATE INDEX IF NOT EXISTS product_reviews_created_at_idx ON public.product_reviews (created_at DESC);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read visible reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Service role manages reviews" ON public.product_reviews;

CREATE POLICY "Anyone can read visible reviews"
  ON public.product_reviews FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Service role manages reviews"
  ON public.product_reviews FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.product_likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS product_likes_product_id_idx ON public.product_likes (product_id);

ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read likes" ON public.product_likes;
DROP POLICY IF EXISTS "Service role manages likes" ON public.product_likes;

CREATE POLICY "Anyone can read likes"
  ON public.product_likes FOR SELECT
  USING (true);

CREATE POLICY "Service role manages likes"
  ON public.product_likes FOR ALL
  USING (true)
  WITH CHECK (true);
