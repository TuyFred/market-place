-- Password reset tokens + newsletter subscribers
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  email        TEXT NOT NULL,
  token_hash   TEXT NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_email_idx ON public.password_reset_tokens (email);
CREATE INDEX IF NOT EXISTS password_reset_tokens_hash_idx ON public.password_reset_tokens (token_hash);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manage password_reset_tokens" ON public.password_reset_tokens;
CREATE POLICY "Service role manage password_reset_tokens"
  ON public.password_reset_tokens FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manage newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Service role manage newsletter"
  ON public.newsletter_subscribers FOR ALL USING (true) WITH CHECK (true);

-- Public insert for subscribe (optional — backend uses service role anyway)
DROP POLICY IF EXISTS "Anyone can subscribe newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);
