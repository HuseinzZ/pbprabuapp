-- ============================================================
-- PB PRABU BANDUNG - STORAGE BUCKETS & RLS POLICIES SETUP
-- Jalankan file SQL ini di Supabase Dashboard > SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. CREATE STORAGE BUCKETS (JIKA BELUM ADA)
-- ------------------------------------------------------------
-- Memasukkan data ke tabel storage.buckets untuk mendefinisikan bucket baru.
-- 'public = true' membuat file di dalamnya dapat diakses secara publik dengan URL langsung.
-- Menambahkan limit ukuran file & tipe MIME yang diizinkan untuk keamanan ekstra.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'avatars', 
    'avatars', 
    true, 
    2097152, -- Batas ukuran file 2MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  ),
  (
    'gallery', 
    'gallery', 
    true, 
    5242880, -- Batas ukuran file 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  ),
  (
    'tournament-posters', 
    'tournament-posters', 
    true, 
    5242880, -- Batas ukuran file 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------
-- 2. AKTIFKAN ROW LEVEL SECURITY (RLS) DI STORAGE (Sudah Aktif secara Default)
-- ------------------------------------------------------------
-- Secara default, storage.objects sudah memiliki RLS aktif di Supabase,
-- sehingga kita tidak perlu memanggil ALTER TABLE secara manual.


-- ------------------------------------------------------------
-- 3. RESET POLICIES LAMA JIKA ADA (MENGHINDARI DUPLIKASI / ERROR)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Insert Own Avatar" ON storage.objects;
DROP POLICY IF EXISTS "Update Own Avatar" ON storage.objects;
DROP POLICY IF EXISTS "Delete Own Avatar" ON storage.objects;

DROP POLICY IF EXISTS "Public Read Gallery" ON storage.objects;
DROP POLICY IF EXISTS "Admin Manage Gallery" ON storage.objects;

DROP POLICY IF EXISTS "Public Read Posters" ON storage.objects;
DROP POLICY IF EXISTS "Admin Manage Posters" ON storage.objects;


-- ============================================================
-- POLICIES UNTUK BUCKET 'avatars' (Profil & Pemain)
-- ============================================================

-- Kebijakan 1: Siapapun (Public) bisa melihat foto profil dan foto pemain
CREATE POLICY "Public Read Avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Kebijakan 2: User terautentikasi bisa mengunggah ke folder milik sendiri (nama folder = user_id),
-- ATAU Admin memiliki hak penuh untuk mengunggah apa saja (seperti player-avatars/...)
CREATE POLICY "Insert Own Avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND (
      auth.role() = 'authenticated' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
      )
    )
  );

-- Kebijakan 3: User terautentikasi bisa memperbarui file di folder sendiri, atau Admin
CREATE POLICY "Update Own Avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND (
      auth.role() = 'authenticated' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
      )
    )
  );

-- Kebijakan 4: User terautentikasi bisa menghapus file di folder sendiri, atau Admin
CREATE POLICY "Delete Own Avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND (
      auth.role() = 'authenticated' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
      )
    )
  );


-- ============================================================
-- POLICIES UNTUK BUCKET 'gallery' (Galeri Foto)
-- ============================================================

-- Kebijakan 1: Siapapun (Public) bisa melihat foto galeri
CREATE POLICY "Public Read Gallery" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

-- Kebijakan 2: Hanya Admin yang bisa melakukan manajemen file (Upload, Edit, Hapus)
CREATE POLICY "Admin Manage Gallery" ON storage.objects
  FOR ALL USING (
    bucket_id = 'gallery' AND public.is_admin()
  );


-- ============================================================
-- POLICIES UNTUK BUCKET 'tournament-posters' (Poster Turnamen)
-- ============================================================

-- Kebijakan 1: Siapapun (Public) bisa melihat poster turnamen
CREATE POLICY "Public Read Posters" ON storage.objects
  FOR SELECT USING (bucket_id = 'tournament-posters');

-- Kebijakan 2: Hanya Admin yang bisa mengelola poster turnamen
CREATE POLICY "Admin Manage Posters" ON storage.objects
  FOR ALL USING (
    bucket_id = 'tournament-posters' AND public.is_admin()
  );


-- ============================================================
-- 4. OTOMATISASI PENGHAPUSAN FILE DARI STORAGE (CLEANUP TRIGGERS)
-- ketika foto profil/pemain/galeri diganti atau dihapus di database
-- ============================================================

-- A. Helper Function untuk mengambil path relatif file dari URL Publik Supabase
CREATE OR REPLACE FUNCTION public.extract_storage_path(url TEXT, bucket_id TEXT)
RETURNS TEXT AS $$
DECLARE
  search_str TEXT;
  pos INT;
  path_part TEXT;
BEGIN
  IF url IS NULL OR url = '' THEN
    RETURN NULL;
  END IF;
  
  -- Cari pattern '/public/bucket_id/' di dalam URL
  search_str := '/public/' || bucket_id || '/';
  pos := POSITION(search_str IN url);
  
  IF pos = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Potong URL untuk mengambil path file-nya
  path_part := SUBSTRING(url FROM pos + CHAR_LENGTH(search_str));
  
  -- Singkirkan query parameter cash-buster seperti '?t=123456789' jika ada
  pos := POSITION('?' IN path_part);
  IF pos > 0 THEN
    path_part := SUBSTRING(path_part FROM 1 FOR pos - 1);
  END IF;
  
  RETURN path_part;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- B. Trigger Function untuk membersihkan foto profil (profiles)
CREATE OR REPLACE FUNCTION public.handle_profile_avatar_cleanup()
RETURNS TRIGGER AS $$
DECLARE
  old_path TEXT;
  new_path TEXT;
BEGIN
  -- Saat update data
  IF TG_OP = 'UPDATE' THEN
    IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url THEN
      old_path := public.extract_storage_path(OLD.avatar_url, 'avatars');
      new_path := public.extract_storage_path(NEW.avatar_url, 'avatars');
      
      -- Hapus file lama jika ada dan berbeda dengan file yang baru
      IF old_path IS NOT NULL AND (new_path IS NULL OR old_path <> new_path) THEN
        DELETE FROM storage.objects 
        WHERE bucket_id = 'avatars' AND name = old_path;
      END IF;
    END IF;
    RETURN NEW;
    
  -- Saat hapus data profile
  ELSIF TG_OP = 'DELETE' THEN
    old_path := public.extract_storage_path(OLD.avatar_url, 'avatars');
    IF old_path IS NOT NULL THEN
      DELETE FROM storage.objects 
      WHERE bucket_id = 'avatars' AND name = old_path;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Registrasi Trigger untuk Profiles
DROP TRIGGER IF EXISTS on_profile_avatar_cleanup ON public.profiles;
CREATE TRIGGER on_profile_avatar_cleanup
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_avatar_cleanup();


-- C. Trigger Function untuk membersihkan foto pemain (players)
CREATE OR REPLACE FUNCTION public.handle_player_avatar_cleanup()
RETURNS TRIGGER AS $$
DECLARE
  old_path TEXT;
  new_path TEXT;
BEGIN
  -- Saat update data
  IF TG_OP = 'UPDATE' THEN
    IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url THEN
      old_path := public.extract_storage_path(OLD.avatar_url, 'avatars');
      new_path := public.extract_storage_path(NEW.avatar_url, 'avatars');
      
      -- Hapus file lama jika ada dan berbeda dengan file yang baru
      IF old_path IS NOT NULL AND (new_path IS NULL OR old_path <> new_path) THEN
        DELETE FROM storage.objects 
        WHERE bucket_id = 'avatars' AND name = old_path;
      END IF;
    END IF;
    RETURN NEW;
    
  -- Saat hapus data pemain
  ELSIF TG_OP = 'DELETE' THEN
    old_path := public.extract_storage_path(OLD.avatar_url, 'avatars');
    IF old_path IS NOT NULL THEN
      DELETE FROM storage.objects 
      WHERE bucket_id = 'avatars' AND name = old_path;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Registrasi Trigger untuk Players
DROP TRIGGER IF EXISTS on_player_avatar_cleanup ON public.players;
CREATE TRIGGER on_player_avatar_cleanup
  BEFORE UPDATE OR DELETE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_player_avatar_cleanup();


-- D. Trigger Function untuk membersihkan foto galeri (gallery)
CREATE OR REPLACE FUNCTION public.handle_gallery_image_cleanup()
RETURNS TRIGGER AS $$
DECLARE
  old_path TEXT;
  new_path TEXT;
BEGIN
  -- Saat update data
  IF TG_OP = 'UPDATE' THEN
    IF OLD.image_url IS DISTINCT FROM NEW.image_url THEN
      old_path := public.extract_storage_path(OLD.image_url, 'gallery');
      new_path := public.extract_storage_path(NEW.image_url, 'gallery');
      
      -- Hapus file lama jika ada dan berbeda dengan gambar yang baru
      IF old_path IS NOT NULL AND (new_path IS NULL OR old_path <> new_path) THEN
        DELETE FROM storage.objects 
        WHERE bucket_id = 'gallery' AND name = old_path;
      END IF;
    END IF;
    RETURN NEW;
    
  -- Saat hapus data galeri
  ELSIF TG_OP = 'DELETE' THEN
    old_path := public.extract_storage_path(OLD.image_url, 'gallery');
    IF old_path IS NOT NULL THEN
      DELETE FROM storage.objects 
      WHERE bucket_id = 'gallery' AND name = old_path;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Registrasi Trigger untuk Gallery
DROP TRIGGER IF EXISTS on_gallery_image_cleanup ON public.gallery;
CREATE TRIGGER on_gallery_image_cleanup
  BEFORE UPDATE OR DELETE ON public.gallery
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_gallery_image_cleanup();
