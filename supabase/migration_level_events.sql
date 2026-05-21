-- ============================================================
-- MIGRATION: Tambah level pemain & tabel events untuk kalender
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tambah kolom level ke tabel players
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS level TEXT CHECK (level IN ('pratama', 'utama', 'all'));

-- 2. Tambah kolom code & bwf_grade ke tournament_types (jika belum ada)
ALTER TABLE public.tournament_types
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS bwf_grade TEXT;

-- 3. Buat tabel events untuk kalender
CREATE TABLE IF NOT EXISTS public.events (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE,
  level       TEXT CHECK (level IN ('Danger','Success','Primary','Warning')) DEFAULT 'Primary',
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS untuk events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies untuk events
DROP POLICY IF EXISTS "Public read events" ON public.events;
CREATE POLICY "Public read events"
  ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin events" ON public.events;
CREATE POLICY "Admin events"
  ON public.events FOR ALL USING (public.is_admin());
