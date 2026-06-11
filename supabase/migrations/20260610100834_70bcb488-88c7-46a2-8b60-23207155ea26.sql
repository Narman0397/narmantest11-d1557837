-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE public.app_role AS ENUM ('warga','admin_opd','super_admin','admin_desa','asn');
CREATE TYPE public.job_status AS ENUM ('pending','running','success','failed','dead');
CREATE TYPE public.status_permohonan AS ENUM ('baru','diproses','selesai','ditolak');

-- Plpgsql-only helper functions (deferred body parse)
CREATE FUNCTION public.set_updated_at() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
  AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE FUNCTION public.prevent_self_role_change() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
  AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Pengguna tidak diizinkan mengubah perannya sendiri';
  END IF;
  RETURN NEW;
END; $$;

-- Tables
CREATE TABLE public.opd (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  nama text NOT NULL, singkatan text NOT NULL,
  kategori text[] DEFAULT '{}'::text[] NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap text DEFAULT '' NOT NULL,
  nik text, no_hp text,
  opd_id uuid REFERENCES public.opd(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active','suspended')),
  desa text, verified_at timestamptz, verified_by uuid,
  nip text, jabatan text, username text
);
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
CREATE UNIQUE INDEX profiles_username_lower_uidx ON public.profiles (lower(username)) WHERE (username IS NOT NULL);

CREATE TABLE public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.desa (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  nama text NOT NULL UNIQUE, kecamatan text,
  aktif boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.absensi_asn (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opd_id uuid REFERENCES public.opd(id) ON DELETE SET NULL,
  tipe text NOT NULL,
  waktu timestamptz DEFAULT now() NOT NULL,
  lokasi text, lat numeric, lng numeric, foto_url text, catatan text, device_info text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.app_setting (
  key text NOT NULL PRIMARY KEY,
  value jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.aset (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  kode text NOT NULL UNIQUE, nama text NOT NULL,
  kategori text, kondisi text DEFAULT 'baik' NOT NULL,
  lokasi text,
  opd_id uuid REFERENCES public.opd(id) ON DELETE SET NULL,
  pemegang_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  nilai_perolehan numeric DEFAULT 0,
  tanggal_perolehan date, deskripsi text, foto_url text,
  merk text, nomor_seri text, lokasi_terkini text, lat numeric, lng numeric,
  status text DEFAULT 'aktif' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  catatan text
);

CREATE TABLE public.aset_riwayat (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  aset_id uuid NOT NULL REFERENCES public.aset(id) ON DELETE CASCADE,
  aksi text NOT NULL, catatan text,
  oleh uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  data jsonb, lat numeric, lng numeric, lokasi_text text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.audit_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid, user_email text,
  aksi text NOT NULL, entitas text NOT NULL, entitas_id text,
  data_sebelum jsonb, data_sesudah jsonb, ip_address text, user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX idx_audit_log_created ON public.audit_log (created_at DESC);
CREATE INDEX idx_audit_log_entitas ON public.audit_log (entitas, entitas_id);
CREATE INDEX idx_audit_log_user ON public.audit_log (user_id);

CREATE TABLE public.backup_snapshot (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  label text NOT NULL, tipe text DEFAULT 'manual' NOT NULL,
  size_bytes bigint DEFAULT 0 NOT NULL,
  table_counts jsonb DEFAULT '{}'::jsonb NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_by uuid
);
CREATE INDEX idx_backup_snapshot_created_at ON public.backup_snapshot (created_at DESC);

CREATE TABLE public.berita (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  judul text NOT NULL, slug text NOT NULL UNIQUE,
  ringkasan text, isi text DEFAULT '' NOT NULL,
  gambar_url text,
  status text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft','terbit')),
  published_at timestamptz, penulis_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX idx_berita_status_pub ON public.berita (status, published_at DESC);

CREATE TABLE public.data_terpadu_item (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  kategori text NOT NULL CHECK (kategori IN ('kpi','chart_layanan','penduduk','anggaran','dataset')),
  label text NOT NULL, nilai_teks text, nilai_num numeric, nilai_num2 numeric,
  satuan text, trend text, ikon text, format text, ukuran text, url text, opd text,
  aktif boolean DEFAULT true NOT NULL, urutan integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX idx_data_terpadu_kat_urut ON public.data_terpadu_item (kategori, urutan);

CREATE TABLE public.job_queue (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  job_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  status public.job_status DEFAULT 'pending' NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  max_attempts integer DEFAULT 3 NOT NULL,
  scheduled_at timestamptz DEFAULT now() NOT NULL,
  started_at timestamptz, finished_at timestamptz,
  error text, result jsonb, created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX idx_job_queue_status_scheduled ON public.job_queue (status, scheduled_at) WHERE (status IN ('pending','failed'));

CREATE TABLE public.kantor_qr (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  opd_id uuid NOT NULL UNIQUE REFERENCES public.opd(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE, label text, lokasi text,
  lat numeric, lng numeric, radius_m integer DEFAULT 100 NOT NULL,
  aktif boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.kategori_layanan (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  nama text NOT NULL UNIQUE, slug text NOT NULL UNIQUE,
  sla_hari integer DEFAULT 7 NOT NULL CHECK (sla_hari > 0 AND sla_hari <= 365),
  deskripsi text, aktif boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.laporan_masyarakat (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  nama text NOT NULL, nik text, email text NOT NULL, no_hp text,
  kategori text NOT NULL, lokasi text, uraian text NOT NULL,
  status text DEFAULT 'baru' NOT NULL,
  opd_id uuid REFERENCES public.opd(id) ON DELETE SET NULL,
  tindak_lanjut text, ditangani_oleh uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX idx_laporan_created ON public.laporan_masyarakat (created_at DESC);
CREATE INDEX idx_laporan_opd ON public.laporan_masyarakat (opd_id);
CREATE INDEX idx_laporan_status ON public.laporan_masyarakat (status);

CREATE TABLE public.layanan_publik (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  judul text NOT NULL, slug text NOT NULL UNIQUE, deskripsi text, ikon text,
  opd_id uuid REFERENCES public.opd(id) ON DELETE SET NULL,
  persyaratan text, alur text,
  aktif boolean DEFAULT true NOT NULL, urutan integer DEFAULT 0 NOT NULL,
  sla_hari integer DEFAULT 14 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.pejabat (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  nama text NOT NULL, jabatan text NOT NULL, foto_url text,
  urutan integer DEFAULT 0 NOT NULL, aktif boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.permohonan (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  kode text NOT NULL UNIQUE,
  pemohon_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opd_id uuid NOT NULL REFERENCES public.opd(id) ON DELETE RESTRICT,
  judul text NOT NULL, kategori text NOT NULL, deskripsi text,
  status public.status_permohonan DEFAULT 'baru' NOT NULL,
  petugas_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tanggal_masuk timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  prioritas text DEFAULT 'normal' NOT NULL CHECK (prioritas IN ('rendah','normal','tinggi')),
  tenggat timestamptz, ringkasan text,
  untuk_orang_lain boolean DEFAULT false NOT NULL,
  atas_nama_nama text, atas_nama_nik text, atas_nama_hp text,
  wakil_ambil_nama text, wakil_ambil_nik text
);
CREATE INDEX idx_permohonan_opd ON public.permohonan (opd_id);
CREATE INDEX idx_permohonan_pemohon ON public.permohonan (pemohon_id);
CREATE INDEX idx_permohonan_status ON public.permohonan (status);

CREATE TABLE public.permohonan_rating (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  permohonan_id uuid NOT NULL REFERENCES public.permohonan(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skor integer NOT NULL CHECK (skor >= 1 AND skor <= 10),
  komentar text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (permohonan_id, user_id)
);

CREATE TABLE public.permohonan_riwayat (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  permohonan_id uuid NOT NULL REFERENCES public.permohonan(id) ON DELETE CASCADE,
  oleh uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  aksi text NOT NULL, catatan text,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX idx_riwayat_permohonan ON public.permohonan_riwayat (permohonan_id);

CREATE TABLE public.push_subscription (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE, p256dh text NOT NULL, auth text NOT NULL,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX idx_push_subscription_user ON public.push_subscription (user_id);

CREATE TABLE public.rate_limit (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  identifier text NOT NULL, bucket text NOT NULL,
  window_start timestamptz DEFAULT now() NOT NULL,
  count integer DEFAULT 1 NOT NULL
);
CREATE INDEX idx_rate_limit_lookup ON public.rate_limit (identifier, bucket, window_start DESC);

CREATE TABLE public.verification_token (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '30 days') NOT NULL,
  used_at timestamptz, used_by uuid
);
CREATE INDEX idx_verification_token_token ON public.verification_token (token);

-- SQL-language functions (after tables exist)
CREATE FUNCTION public.get_user_desa(_user_id uuid) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
  AS $$ SELECT desa FROM public.profiles WHERE id = _user_id LIMIT 1; $$;

CREATE FUNCTION public.get_user_opd(_user_id uuid) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
  AS $$ SELECT opd_id FROM public.profiles WHERE id = _user_id LIMIT 1; $$;

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
  AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE FUNCTION public.count_permohonan_bulan_ini() RETURNS integer
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
  AS $$ SELECT COUNT(*)::int FROM public.permohonan WHERE tanggal_masuk >= date_trunc('month', now()); $$;

CREATE FUNCTION public.opd_kinerja_agg() RETURNS TABLE(opd_id uuid, status text, total bigint, total_hari_selesai numeric, jumlah_selesai bigint, tepat_waktu bigint, selesai_dengan_sla bigint)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
  AS $$
  SELECT p.opd_id, p.status::text, COUNT(*)::bigint,
    COALESCE(SUM(CASE WHEN p.status='selesai' AND p.tanggal_masuk IS NOT NULL AND p.updated_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (p.updated_at - p.tanggal_masuk))/86400.0 ELSE 0 END),0)::numeric,
    COUNT(*) FILTER (WHERE p.status='selesai' AND p.tanggal_masuk IS NOT NULL AND p.updated_at IS NOT NULL)::bigint,
    COUNT(*) FILTER (WHERE p.status='selesai' AND p.tenggat IS NOT NULL AND p.updated_at <= p.tenggat)::bigint,
    COUNT(*) FILTER (WHERE p.status='selesai' AND p.tenggat IS NOT NULL)::bigint
  FROM public.permohonan p GROUP BY p.opd_id, p.status;
$$;

CREATE FUNCTION public.opd_rating_agg() RETURNS TABLE(opd_id uuid, total_rating bigint, jumlah_rating bigint)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
  AS $$
  SELECT p.opd_id, COALESCE(SUM(r.skor),0)::bigint, COUNT(r.id)::bigint
  FROM public.permohonan p JOIN public.permohonan_rating r ON r.permohonan_id = p.id
  WHERE p.opd_id IS NOT NULL GROUP BY p.opd_id;
$$;

CREATE FUNCTION public.rating_list_admin() RETURNS TABLE(rating_id uuid, skor integer, komentar text, created_at timestamptz, user_id uuid, pemohon_nama text, permohonan_id uuid, permohonan_kode text, permohonan_judul text, opd_id uuid, opd_singkatan text, opd_nama text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
  AS $$
  SELECT r.id, r.skor, r.komentar, r.created_at, r.user_id,
    pr.nama_lengkap, p.id, p.kode, p.judul, p.opd_id, o.singkatan, o.nama
  FROM public.permohonan_rating r
  LEFT JOIN public.permohonan p ON p.id = r.permohonan_id
  LEFT JOIN public.opd o ON o.id = p.opd_id
  LEFT JOIN public.profiles pr ON pr.id = r.user_id
  WHERE public.has_role(auth.uid(),'super_admin') ORDER BY r.created_at DESC;
$$;

-- Plpgsql functions referencing tables (deferred but referenced after tables anyway)
CREATE FUNCTION public.handle_new_user() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
  AS $$
BEGIN
  INSERT INTO public.profiles (id, nama_lengkap, no_hp, nik, desa) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', ''),
    NEW.raw_user_meta_data->>'no_hp',
    NEW.raw_user_meta_data->>'nik',
    NEW.raw_user_meta_data->>'desa'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'warga') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE FUNCTION public.log_permohonan_change() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
  AS $$
BEGIN
  IF TG_OP='UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_log (user_id, aksi, entitas, entitas_id, data_sebelum, data_sesudah)
    VALUES (auth.uid(),'permohonan.status_changed','permohonan',NEW.id::text,
      jsonb_build_object('status',OLD.status), jsonb_build_object('status',NEW.status));
  END IF;
  RETURN NEW;
END; $$;

CREATE FUNCTION public.riwayat_dengan_petugas(_permohonan_id uuid) RETURNS TABLE(id uuid, created_at timestamptz, aksi text, catatan text, oleh uuid, nama_petugas text, email_petugas text)
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
  AS $$
DECLARE _opd uuid; _pemohon uuid;
BEGIN
  SELECT opd_id, pemohon_id INTO _opd, _pemohon FROM public.permohonan WHERE id = _permohonan_id;
  IF _opd IS NULL THEN RETURN; END IF;
  IF NOT (auth.uid() = _pemohon OR public.has_role(auth.uid(),'super_admin')
      OR (public.has_role(auth.uid(),'admin_opd') AND _opd = public.get_user_opd(auth.uid()))) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
    SELECT r.id, r.created_at, r.aksi, r.catatan, r.oleh,
      COALESCE(p.nama_lengkap,''), COALESCE(u.email,'')
    FROM public.permohonan_riwayat r
    LEFT JOIN public.profiles p ON p.id = r.oleh
    LEFT JOIN auth.users u ON u.id = r.oleh
    WHERE r.permohonan_id = _permohonan_id ORDER BY r.created_at ASC;
END $$;

-- Triggers
CREATE TRIGGER aset_updated_at BEFORE UPDATE ON public.aset FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER kantor_qr_updated_at BEFORE UPDATE ON public.kantor_qr FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_app_setting_updated_at BEFORE UPDATE ON public.app_setting FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_berita_updated BEFORE UPDATE ON public.berita FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_data_terpadu_updated_at BEFORE UPDATE ON public.data_terpadu_item FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_desa_updated BEFORE UPDATE ON public.desa FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_kategori_updated BEFORE UPDATE ON public.kategori_layanan FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_laporan_updated BEFORE UPDATE ON public.laporan_masyarakat FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_layanan_updated BEFORE UPDATE ON public.layanan_publik FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_pejabat_updated BEFORE UPDATE ON public.pejabat FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_permohonan_audit AFTER UPDATE ON public.permohonan FOR EACH ROW EXECUTE FUNCTION public.log_permohonan_change();
CREATE TRIGGER trg_permohonan_updated BEFORE UPDATE ON public.permohonan FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_prevent_self_role_change BEFORE INSERT OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_change();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_push_sub_updated_at BEFORE UPDATE ON public.push_subscription FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- Enable RLS
ALTER TABLE public.absensi_asn ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_setting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aset_riwayat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.berita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_terpadu_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kantor_qr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kategori_layanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_masyarakat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layanan_publik ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pejabat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permohonan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permohonan_rating ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permohonan_riwayat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_token ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "ASN lihat absensi sendiri" ON public.absensi_asn FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'super_admin'::public.app_role) OR (public.has_role(auth.uid(), 'admin_opd'::public.app_role) AND (opd_id = public.get_user_opd(auth.uid())))));
CREATE POLICY "ASN tambah absensi sendiri" ON public.absensi_asn FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Super admin kelola absensi" ON public.absensi_asn TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "App setting publik baca" ON public.app_setting FOR SELECT USING (true);
CREATE POLICY "Super admin kelola app setting" ON public.app_setting TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Aset baca login" ON public.aset FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin opd kelola aset opd" ON public.aset TO authenticated USING ((public.has_role(auth.uid(), 'admin_opd') AND (opd_id = public.get_user_opd(auth.uid())))) WITH CHECK ((public.has_role(auth.uid(), 'admin_opd') AND (opd_id = public.get_user_opd(auth.uid()))));
CREATE POLICY "Super admin kelola aset" ON public.aset TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Riwayat aset baca login" ON public.aset_riwayat FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tambah riwayat aset" ON public.aset_riwayat FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_opd') OR (auth.uid() = oleh)));

CREATE POLICY "Super admin lihat audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "User insert own audit log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Super admin kelola snapshot" ON public.backup_snapshot TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Berita terbit publik" ON public.berita FOR SELECT USING ((status = 'terbit'));
CREATE POLICY "Super admin kelola berita" ON public.berita TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Item aktif publik baca" ON public.data_terpadu_item FOR SELECT USING (((aktif = true) OR public.has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Super admin kelola item" ON public.data_terpadu_item TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Desa publik baca" ON public.desa FOR SELECT USING (true);
CREATE POLICY "Super admin kelola desa" ON public.desa TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admin lihat semua job" ON public.job_queue FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Kantor QR baca login" ON public.kantor_qr FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin opd kelola qr opd" ON public.kantor_qr TO authenticated USING ((public.has_role(auth.uid(), 'admin_opd') AND (opd_id = public.get_user_opd(auth.uid())))) WITH CHECK ((public.has_role(auth.uid(), 'admin_opd') AND (opd_id = public.get_user_opd(auth.uid()))));
CREATE POLICY "Super admin kelola kantor qr" ON public.kantor_qr TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Kategori publik baca" ON public.kategori_layanan FOR SELECT USING (true);
CREATE POLICY "Super admin kelola kategori" ON public.kategori_layanan TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Publik kirim laporan" ON public.laporan_masyarakat FOR INSERT TO authenticated, anon WITH CHECK (true);
CREATE POLICY "Admin OPD lihat laporan" ON public.laporan_masyarakat FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin_opd'));
CREATE POLICY "Admin OPD update laporan" ON public.laporan_masyarakat FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin_opd') AND ((opd_id IS NULL) OR (opd_id = public.get_user_opd(auth.uid())))));
CREATE POLICY "Super admin kelola laporan" ON public.laporan_masyarakat TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Layanan aktif publik" ON public.layanan_publik FOR SELECT USING ((aktif = true));
CREATE POLICY "Admin OPD kelola layanan" ON public.layanan_publik TO authenticated USING ((public.has_role(auth.uid(), 'admin_opd') AND (opd_id = public.get_user_opd(auth.uid())))) WITH CHECK ((public.has_role(auth.uid(), 'admin_opd') AND (opd_id = public.get_user_opd(auth.uid()))));
CREATE POLICY "Super admin kelola layanan" ON public.layanan_publik TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "OPD readable by all" ON public.opd FOR SELECT USING (true);
CREATE POLICY "Super admin manage OPD" ON public.opd TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Pejabat publik baca" ON public.pejabat FOR SELECT USING ((aktif = true));
CREATE POLICY "Super admin kelola pejabat" ON public.pejabat TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Warga buat permohonan" ON public.permohonan FOR INSERT TO authenticated WITH CHECK ((auth.uid() = pemohon_id));
CREATE POLICY "Warga lihat permohonan sendiri" ON public.permohonan FOR SELECT TO authenticated USING (((auth.uid() = pemohon_id) OR public.has_role(auth.uid(), 'super_admin') OR (public.has_role(auth.uid(), 'admin_opd') AND (opd_id = public.get_user_opd(auth.uid())))));
CREATE POLICY "Admin desa lihat permohonan warga" ON public.permohonan FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin_desa') AND (pemohon_id IN ( SELECT profiles.id FROM public.profiles WHERE (profiles.desa = public.get_user_desa(auth.uid()))))));
CREATE POLICY "Admin update permohonan" ON public.permohonan FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'super_admin') OR (public.has_role(auth.uid(), 'admin_opd') AND (opd_id = public.get_user_opd(auth.uid())))));
CREATE POLICY "Super admin hapus permohonan" ON public.permohonan FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Rating publik baca" ON public.permohonan_rating FOR SELECT USING (true);
CREATE POLICY "User insert rating sendiri" ON public.permohonan_rating FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "User update rating sendiri" ON public.permohonan_rating FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Super admin hapus rating" ON public.permohonan_rating FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Lihat riwayat sesuai permohonan" ON public.permohonan_riwayat FOR SELECT TO authenticated USING ((permohonan_id IN ( SELECT permohonan.id FROM public.permohonan WHERE ((auth.uid() = permohonan.pemohon_id) OR public.has_role(auth.uid(), 'super_admin') OR (public.has_role(auth.uid(), 'admin_opd') AND (permohonan.opd_id = public.get_user_opd(auth.uid())))))));
CREATE POLICY "Admin tambah riwayat" ON public.permohonan_riwayat FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_opd') OR (auth.uid() = oleh)));

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (((auth.uid() = id) OR public.has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (((auth.uid() = id) OR public.has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Super admin insert profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admin desa lihat profil sedesa" ON public.profiles FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin_desa') AND (desa IS NOT NULL) AND (desa = public.get_user_desa(auth.uid()))));
CREATE POLICY "Admin desa update verifikasi sedesa" ON public.profiles FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin_desa') AND (desa IS NOT NULL) AND (desa = public.get_user_desa(auth.uid()))));
CREATE POLICY "Admin lihat profil pemohon" ON public.profiles FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin_opd') AND (id IN ( SELECT permohonan.pemohon_id FROM public.permohonan WHERE (permohonan.opd_id = public.get_user_opd(auth.uid()))))));

CREATE POLICY "user can read own push subs" ON public.push_subscription FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'super_admin')));
CREATE POLICY "user can insert own push subs" ON public.push_subscription FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "user can update own push subs" ON public.push_subscription FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "user can delete own push subs" ON public.push_subscription FOR DELETE USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'super_admin')));

CREATE POLICY "Deny all rate_limit" ON public.rate_limit TO authenticated, anon USING (false) WITH CHECK (false);

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Super admin insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'super_admin') AND (user_id <> auth.uid())));
CREATE POLICY "Super admin update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK ((public.has_role(auth.uid(), 'super_admin') AND (user_id <> auth.uid())));
CREATE POLICY "Super admin delete roles" ON public.user_roles FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'super_admin') AND (user_id <> auth.uid())));

CREATE POLICY "warga insert token sendiri" ON public.verification_token FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "warga lihat token sendiri" ON public.verification_token FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_desa')));

-- Trigger profil otomatis dari auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();