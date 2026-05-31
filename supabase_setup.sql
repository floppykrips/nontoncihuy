-- =====================================================
-- Jalankan SQL ini di Supabase > SQL Editor
-- =====================================================

-- Tabel films untuk menyimpan film custom
CREATE TABLE IF NOT EXISTS films (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  year        TEXT,
  poster      TEXT NOT NULL,
  video       TEXT,
  desc        TEXT,
  rating      NUMERIC(3,1) DEFAULT 0,
  type        TEXT DEFAULT 'movie'    CHECK (type IN ('movie','serial')),
  category    TEXT DEFAULT 'trending' CHECK (category IN ('trending','terbaru','top','serial','featured')),
  genre       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Index biar query cepat
CREATE INDEX IF NOT EXISTS idx_films_category ON films(category);
CREATE INDEX IF NOT EXISTS idx_films_type     ON films(type);
CREATE INDEX IF NOT EXISTS idx_films_created  ON films(created_at DESC);

-- Row Level Security: tabel ini READ publik, WRITE hanya dari server (service_role key)
ALTER TABLE films ENABLE ROW LEVEL SECURITY;

-- Siapa aja bisa baca (GET /api/films)
CREATE POLICY "films_public_read"
  ON films FOR SELECT
  USING (true);

-- Hanya service_role (backend kita) yang bisa insert/update/delete
-- Frontend tidak punya service_role key, jadi aman

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER films_updated_at
  BEFORE UPDATE ON films
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Selesai! Tabel films sudah siap.
-- =====================================================
