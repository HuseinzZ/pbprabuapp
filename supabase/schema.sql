-- ============================================================
-- PB PRABU BANDUNG - DATABASE SCHEMA v3
-- Perubahan dari v2:
--   - Hapus semua kolom category
--   - Tambah grup di matches & rr_standings
--   - Auto-link player by email saat register
--   - Upload galeri via storage
--   - Format: Spin → pasangan → RR per grup → fase gugur
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT NOT NULL,
  username    TEXT UNIQUE,
  email       TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  birth_date  DATE,
  gender      TEXT CHECK (gender IN ('male','female')),
  address     TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PLAYERS
-- Tidak ada kategori — semua sama rata
-- profile_id null = pemain tanpa akun (input admin manual)
-- ============================================================
CREATE TABLE public.players (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name        TEXT NOT NULL,
  nickname         TEXT,
  gender           TEXT CHECK (gender IN ('male','female')),
  birth_date       DATE,
  phone            TEXT,
  email            TEXT UNIQUE,  -- kunci untuk auto-link
  avatar_url       TEXT,
  address          TEXT,
  level            TEXT CHECK (level IN ('pratama','utama')),  -- level pemain
  ranking_points   INTEGER DEFAULT 0,
  ranking_position INTEGER,
  is_active        BOOLEAN DEFAULT true,
  joined_at        DATE DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GALLERY
-- ============================================================
CREATE TABLE public.gallery (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  image_url    TEXT NOT NULL,
  category     TEXT CHECK (category IN ('tournament','training','event','general')),
  taken_at     DATE,
  is_published BOOLEAN DEFAULT true,
  uploaded_by  UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTS (untuk kalender admin)
-- ============================================================
CREATE TABLE public.events (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE,
  level       TEXT CHECK (level IN ('Danger','Success','Primary','Warning')) DEFAULT 'Primary',
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- Tidak ada points_rr — poin berdasarkan fase gugur
-- points_rr tetap ada untuk yang gugur di fase grup RR
-- ============================================================
CREATE TABLE public.tournament_types (
  id                     UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name                   TEXT NOT NULL,
  points_winner          INTEGER NOT NULL DEFAULT 0,
  points_finalist        INTEGER NOT NULL DEFAULT 0,
  points_semifinalist    INTEGER NOT NULL DEFAULT 0,
  points_quarterfinalist INTEGER NOT NULL DEFAULT 0,
  points_r16             INTEGER DEFAULT 0,
  points_r32             INTEGER DEFAULT 0,
  points_r64             INTEGER DEFAULT 0,
  points_rr              INTEGER DEFAULT 0, -- gugur di fase grup
  description            TEXT,
  is_active              BOOLEAN DEFAULT true,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.tournament_types
  (name, code, bwf_grade, points_winner, points_finalist, points_semifinalist, points_quarterfinalist, points_r16, points_r32, points_r64, points_rr)
VALUES
  ('Super 1000',         'S1000', 'Grade 2', 12000, 9500, 7200, 4800, 2700, 1500, 500, 200),
  ('Super 750',          'S750',  'Grade 2',  9500, 7200, 5500, 3700, 2050, 1100, 400, 150),
  ('Super 500',          'S500',  'Grade 2',  8500, 6200, 4500, 3000, 1700,  900, 300, 120),
  ('Super 300',          'S300',  'Grade 2',  6000, 4300, 3200, 2100, 1200,  650, 200,  80),
  ('Super 100',          'S100',  'Grade 2',  3500, 2450, 1700, 1100,  600,  300, 100,  40),
  ('International Series','IS',   'Grade 2',  1200,  840,  600,  390,  210,  110,  40,  20),
  ('Local Series',       'LS',    'Grade 2',   500,  360,  260,  170,   90,   50,  20,  10);

-- ============================================================
-- TOURNAMENTS
-- ============================================================
CREATE TABLE public.tournaments (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_type_id    UUID REFERENCES public.tournament_types(id),
  name                  TEXT NOT NULL,
  description           TEXT,
  location              TEXT,
  start_date            DATE NOT NULL,
  end_date              DATE NOT NULL,
  registration_deadline DATE,
  max_participants      INTEGER,
  entry_fee             DECIMAL(10,2) DEFAULT 0,
  prize_pool            DECIMAL(10,2) DEFAULT 0,
  status                TEXT DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','registration','ongoing','completed','cancelled')),
  poster_url            TEXT,
  rules                 TEXT,
  created_by            UUID REFERENCES public.profiles(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TOURNAMENT PARTICIPANTS
-- status pending = daftar sendiri, menunggu admin approve
-- status confirmed = dikonfirmasi admin / ditambah admin
-- ============================================================
CREATE TABLE public.tournament_participants (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id  UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id      UUID REFERENCES public.players(id) ON DELETE CASCADE,
  status         TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','withdrawn','disqualified')),
  registered_at  TIMESTAMPTZ DEFAULT NOW(),
  payment_status TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','paid','refunded')),
  notes          TEXT,
  UNIQUE (tournament_id, player_id)
);

-- ============================================================
-- SPIN WHEEL SESSIONS
-- Spin = bentuk pasangan/tim dari peserta individu
-- ============================================================
CREATE TABLE public.spin_wheel_sessions (
  id                 UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id      UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  status             TEXT DEFAULT 'waiting'
    CHECK (status IN ('waiting','spinning','done')),
  -- Array player objects {id, full_name} sebelum spin
  initial_players    JSONB DEFAULT '[]',
  -- Array player objects yang sudah keluar dari wheel
  spun_players       JSONB DEFAULT '[]',
  -- Array player objects yang masih di wheel
  remaining_players  JSONB DEFAULT '[]',
  -- Pasangan/tim terbentuk: [{p1:{id,full_name}, p2:{id,full_name}}, ...]
  pairs              JSONB DEFAULT '[]',
  -- Sudah generate jadwal?
  schedule_generated BOOLEAN DEFAULT false,
  created_by         UUID REFERENCES public.profiles(id),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tournament_id)
);

-- ============================================================
-- TEAMS
-- Pasangan yang terbentuk dari spin wheel
-- ============================================================
CREATE TABLE public.teams (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id   UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  spin_session_id UUID REFERENCES public.spin_wheel_sessions(id),
  name            TEXT, -- opsional: "Tim A", auto-generate
  player1_id      UUID REFERENCES public.players(id),
  player2_id      UUID REFERENCES public.players(id), -- null jika BYE partner
  is_bye_team     BOOLEAN DEFAULT false, -- tim dengan partner BYE
  group_name      TEXT, -- 'A', 'B', 'C', dst
  group_position  INTEGER, -- urutan dalam grup (1-4)
  spin_order      INTEGER, -- urutan keluar dari spin (1,2,3,...)
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MATCHES
-- phase: RR = fase grup, QF/SF/F/R16/R32/R64 = fase gugur
-- ============================================================
CREATE TABLE public.matches (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id   UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  spin_session_id UUID REFERENCES public.spin_wheel_sessions(id),
  phase           TEXT NOT NULL DEFAULT 'RR'
    CHECK (phase IN ('RR','R64','R32','R16','QF','SF','F')),
  group_name      TEXT,    -- 'A','B','C' dst (hanya untuk fase RR)
  round_number    INTEGER DEFAULT 1,
  match_number    INTEGER,
  -- tim yang bertanding (dari tabel teams)
  team1_id        UUID REFERENCES public.teams(id),
  team2_id        UUID REFERENCES public.teams(id),
  scheduled_at    TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  is_bye          BOOLEAN DEFAULT false,
  status          TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','live','completed','walkover','bye')),
  -- skor 1 set, max 30
  score_team1     INTEGER DEFAULT 0,
  score_team2     INTEGER DEFAULT 0,
  winner_team_id  UUID REFERENCES public.teams(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RR STANDINGS
-- Standings per grup per turnamen
-- ============================================================
CREATE TABLE public.rr_standings (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id    UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  spin_session_id  UUID REFERENCES public.spin_wheel_sessions(id),
  team_id          UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  group_name       TEXT NOT NULL,
  played           INTEGER DEFAULT 0,
  won              INTEGER DEFAULT 0,
  lost             INTEGER DEFAULT 0,
  standing_points  INTEGER DEFAULT 0, -- 2=menang, 1=kalah
  points_scored    INTEGER DEFAULT 0,
  points_conceded  INTEGER DEFAULT 0,
  rank_in_group    INTEGER, -- posisi dalam grup
  qualified        BOOLEAN DEFAULT false, -- lolos ke fase gugur
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tournament_id, team_id)
);

-- ============================================================
-- POINT HISTORIES
-- ============================================================
CREATE TABLE public.point_histories (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  player_id      UUID REFERENCES public.players(id) ON DELETE CASCADE,
  tournament_id  UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  match_id       UUID REFERENCES public.matches(id),
  team_id        UUID REFERENCES public.teams(id),
  phase_achieved TEXT, -- RR / QF / SF / F / W(winner)
  points_earned  INTEGER NOT NULL DEFAULT 0,
  points_before  INTEGER DEFAULT 0,
  points_after   INTEGER DEFAULT 0,
  notes          TEXT,
  earned_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_types      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_wheel_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rr_standings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_histories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                ENABLE ROW LEVEL SECURITY;

-- Helper: cek admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Public read
CREATE POLICY "Public read players"      ON public.players              FOR SELECT USING (true);
CREATE POLICY "Public read gallery"      ON public.gallery              FOR SELECT USING (is_published = true);
CREATE POLICY "Public read tt"           ON public.tournament_types     FOR SELECT USING (true);
CREATE POLICY "Public read tournaments"  ON public.tournaments          FOR SELECT USING (true);
CREATE POLICY "Public read tp"           ON public.tournament_participants FOR SELECT USING (true);
CREATE POLICY "Public read spin"         ON public.spin_wheel_sessions  FOR SELECT USING (true);
CREATE POLICY "Public read teams"        ON public.teams                FOR SELECT USING (true);
CREATE POLICY "Public read matches"      ON public.matches              FOR SELECT USING (true);
CREATE POLICY "Public read standings"    ON public.rr_standings         FOR SELECT USING (true);
CREATE POLICY "Public read histories"    ON public.point_histories      FOR SELECT USING (true);
CREATE POLICY "Public read events"       ON public.events               FOR SELECT USING (true);

-- Profiles
CREATE POLICY "Users read own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Admin full access
CREATE POLICY "Admin players"    ON public.players                FOR ALL USING (public.is_admin());
CREATE POLICY "Admin gallery"    ON public.gallery                FOR ALL USING (public.is_admin());
CREATE POLICY "Admin tt"         ON public.tournament_types       FOR ALL USING (public.is_admin());
CREATE POLICY "Admin t"          ON public.tournaments            FOR ALL USING (public.is_admin());
CREATE POLICY "Admin tp"         ON public.tournament_participants FOR ALL USING (public.is_admin());
CREATE POLICY "Admin spin"       ON public.spin_wheel_sessions    FOR ALL USING (public.is_admin());
CREATE POLICY "Admin teams"      ON public.teams                  FOR ALL USING (public.is_admin());
CREATE POLICY "Admin matches"    ON public.matches                FOR ALL USING (public.is_admin());
CREATE POLICY "Admin standings"  ON public.rr_standings           FOR ALL USING (public.is_admin());
CREATE POLICY "Admin histories"  ON public.point_histories        FOR ALL USING (public.is_admin());
CREATE POLICY "Admin events"     ON public.events                 FOR ALL USING (public.is_admin());

-- User: daftar turnamen sendiri
CREATE POLICY "Users register tournament" ON public.tournament_participants
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.players
      WHERE id = player_id AND profile_id = auth.uid()
    )
  );

-- User: update pendaftaran sendiri (withdraw)
CREATE POLICY "Users update own registration" ON public.tournament_participants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE id = player_id AND profile_id = auth.uid()
    )
  );

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.spin_wheel_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rr_standings;

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  existing_player_id UUID;
BEGIN
  -- Insert ke profiles
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );

  -- Auto-link: cek apakah email sudah ada di tabel players
  SELECT id INTO existing_player_id
  FROM public.players
  WHERE email = NEW.email AND profile_id IS NULL
  LIMIT 1;

  IF existing_player_id IS NOT NULL THEN
    UPDATE public.players
    SET profile_id = NEW.id, updated_at = NOW()
    WHERE id = existing_player_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: auto-create player when profile is completed
-- Dipanggil ketika user update profil dengan data lengkap
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_profile_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika full_name diisi dan belum ada di players
  IF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.players WHERE profile_id = NEW.id
    ) THEN
      INSERT INTO public.players (
        profile_id, full_name, email, phone,
        avatar_url, birth_date, gender, address
      ) VALUES (
        NEW.id, NEW.full_name, NEW.email, NEW.phone,
        NEW.avatar_url, NEW.birth_date, NEW.gender, NEW.address
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_completed
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.full_name IS NOT NULL AND NEW.full_name != ''
    AND (OLD.phone IS NULL OR OLD.phone = '')
    AND NEW.phone IS NOT NULL AND NEW.phone != '')
  EXECUTE FUNCTION public.handle_profile_completed();

-- ============================================================
-- FUNCTION: recalculate global ranking positions
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_player_rankings()
RETURNS VOID AS $$
BEGIN
  WITH ranked AS (
    SELECT id, RANK() OVER (ORDER BY ranking_points DESC) AS new_rank
    FROM public.players WHERE is_active = true
  )
  UPDATE public.players p
  SET ranking_position = r.new_rank, updated_at = NOW()
  FROM ranked r WHERE p.id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: get knockout phase from team count
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_knockout_phase(team_count INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF team_count <= 2  THEN RETURN 'F';
  ELSIF team_count <= 4  THEN RETURN 'SF';
  ELSIF team_count <= 8  THEN RETURN 'QF';
  ELSIF team_count <= 16 THEN RETURN 'R16';
  ELSIF team_count <= 32 THEN RETURN 'R32';
  ELSE RETURN 'R64';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STORAGE BUCKETS (jalankan di Supabase Dashboard)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tournament-posters', 'tournament-posters', true);
