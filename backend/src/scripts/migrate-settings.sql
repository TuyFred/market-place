-- Migration to add settings table and hero-videos bucket

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial empty hero_video_url if not exists
INSERT INTO settings (key, value) VALUES ('hero_video_url', '') ON CONFLICT (key) DO NOTHING;

-- Create bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-videos', 'hero-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public viewing
CREATE POLICY "Anyone can view hero videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hero-videos');

-- Admin management (requires authenticated role)
CREATE POLICY "Service role can manage hero videos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'hero-videos')
  WITH CHECK (bucket_id = 'hero-videos');
