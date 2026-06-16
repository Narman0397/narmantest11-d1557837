
-- ============================================================
-- REGISTRATION REDESIGN: pending status + no auto-role grant
-- ============================================================

-- 1) profiles: tambah kolom verifikasi & data registrasi
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS requested_role public.app_role,
  ADD COLUMN IF NOT EXISTS verification_status text,
  ADD COLUMN IF NOT EXISTS verification_method text,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS alamat text,
  ADD COLUMN IF NOT EXISTS jabatan_id uuid;

-- Constraint nilai status valid
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_verification_status_chk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_verification_status_chk
  CHECK (verification_status IS NULL OR verification_status IN
    ('pending_verification','pending_superadmin_approval','verified','rejected'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_verification_method_chk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_verification_method_chk
  CHECK (verification_method IS NULL OR verification_method IN ('qr','manual','superadmin','admin_opd','admin_desa'));

-- 2) master_jabatan
CREATE TABLE IF NOT EXISTS public.master_jabatan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode text UNIQUE NOT NULL,
  nama text NOT NULL,
  kategori text,
  urutan integer NOT NULL DEFAULT 0,
  aktif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.master_jabatan TO anon, authenticated;
GRANT ALL ON public.master_jabatan TO service_role;

ALTER TABLE public.master_jabatan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "master_jabatan_read" ON public.master_jabatan;
CREATE POLICY "master_jabatan_read" ON public.master_jabatan
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "master_jabatan_write" ON public.master_jabatan;
CREATE POLICY "master_jabatan_write" ON public.master_jabatan
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda'));

-- FK jabatan_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name='profiles_jabatan_id_fkey' AND table_name='profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_jabatan_id_fkey
      FOREIGN KEY (jabatan_id) REFERENCES public.master_jabatan(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Seed default minimal
INSERT INTO public.master_jabatan (kode, nama, kategori, urutan) VALUES
  ('KEPALA_DINAS','Kepala Dinas','Struktural',10),
  ('SEKRETARIS','Sekretaris','Struktural',20),
  ('KABID','Kepala Bidang','Struktural',30),
  ('KASUBAG','Kepala Sub Bagian','Struktural',40),
  ('KASI','Kepala Seksi','Struktural',50),
  ('STAF','Staf','Pelaksana',60),
  ('OPERATOR','Operator','Pelaksana',70),
  ('GURU','Guru','Fungsional',80),
  ('TENAGA_TEKNIS','Tenaga Teknis','Fungsional',90)
ON CONFLICT (kode) DO NOTHING;

-- 3) Grandfather: existing user dengan role apapun → verified
UPDATE public.profiles p
SET verification_status = 'verified',
    verified_at = COALESCE(p.verified_at, now())
WHERE p.verification_status IS NULL
  AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id);

-- Set requested_role berdasarkan role tertinggi yang dimiliki
UPDATE public.profiles p
SET requested_role = sub.role
FROM (
  SELECT user_id, role,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY
      CASE role
        WHEN 'super_admin' THEN 1
        WHEN 'admin_pemda' THEN 2
        WHEN 'pimpinan' THEN 3
        WHEN 'admin_opd' THEN 4
        WHEN 'admin_desa' THEN 5
        WHEN 'asn' THEN 6
        WHEN 'warga' THEN 7
        ELSE 8
      END
    ) AS rn
  FROM public.user_roles
) sub
WHERE sub.user_id = p.id AND sub.rn = 1 AND p.requested_role IS NULL;

-- Sisanya: profil tanpa role apapun → pending_verification (asumsikan warga)
UPDATE public.profiles
SET verification_status = 'pending_verification',
    requested_role = COALESCE(requested_role, 'warga'::public.app_role)
WHERE verification_status IS NULL;

-- 4) Ganti handle_new_user agar TIDAK auto-grant role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, nama_lengkap, no_hp, nik, desa, alamat,
    verification_status, requested_role
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', ''),
    NEW.raw_user_meta_data->>'no_hp',
    NEW.raw_user_meta_data->>'nik',
    NEW.raw_user_meta_data->>'desa',
    NEW.raw_user_meta_data->>'alamat',
    'pending_verification',
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'requested_role','')::public.app_role,
      'warga'::public.app_role
    )
  )
  ON CONFLICT (id) DO NOTHING;
  -- SENGAJA TIDAK INSERT ke user_roles. Role hanya diberikan via approval.
  RETURN NEW;
END;
$$;

-- 5) Trigger: blokir INSERT ke user_roles bila profile belum verified
CREATE OR REPLACE FUNCTION public.prevent_unverified_role_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _status text;
BEGIN
  -- Role internal yang granted via menu RBAC (super_admin / admin_pemda / pimpinan):
  -- tetap diizinkan tanpa cek status (grant manual super_admin).
  IF NEW.role IN ('super_admin','admin_pemda','pimpinan') THEN
    RETURN NEW;
  END IF;

  SELECT verification_status INTO _status
  FROM public.profiles WHERE id = NEW.user_id;

  IF _status IS DISTINCT FROM 'verified' THEN
    RAISE EXCEPTION 'Role % tidak boleh diberikan: akun belum diverifikasi (status=%)',
      NEW.role, COALESCE(_status,'NULL')
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_unverified_role_insert ON public.user_roles;
CREATE TRIGGER trg_prevent_unverified_role_insert
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_unverified_role_insert();

-- 6) RPC: approve user (set verified + insert role atomically)
CREATE OR REPLACE FUNCTION public.fn_approve_user(
  _target_user_id uuid,
  _role public.app_role,
  _method text DEFAULT 'manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid := auth.uid();
  _is_super boolean;
  _is_pemda boolean;
  _target_opd uuid;
  _target_desa text;
  _caller_opd uuid;
  _caller_desa text;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Tidak terautentikasi';
  END IF;
  IF _target_user_id = _caller THEN
    RAISE EXCEPTION 'Tidak dapat menyetujui akun sendiri';
  END IF;

  _is_super := public.has_role(_caller,'super_admin');
  _is_pemda := public.has_role(_caller,'admin_pemda');

  SELECT opd_id, desa INTO _target_opd, _target_desa
  FROM public.profiles WHERE id = _target_user_id;

  SELECT opd_id, desa INTO _caller_opd, _caller_desa
  FROM public.profiles WHERE id = _caller;

  -- Otorisasi per role yang akan diberikan
  IF _role IN ('admin_opd','admin_desa') THEN
    IF NOT (_is_super OR _is_pemda) THEN
      RAISE EXCEPTION 'Hanya Super Admin / Admin Pemda yang dapat menyetujui role %', _role;
    END IF;
  ELSIF _role = 'asn' THEN
    IF NOT _is_super THEN
      IF NOT public.has_role(_caller,'admin_opd') OR _caller_opd IS NULL OR _caller_opd <> _target_opd THEN
        RAISE EXCEPTION 'Admin OPD hanya dapat menyetujui ASN di OPD-nya';
      END IF;
    END IF;
  ELSIF _role = 'warga' THEN
    IF NOT _is_super THEN
      IF NOT public.has_role(_caller,'admin_desa') OR _caller_desa IS NULL OR _caller_desa <> _target_desa THEN
        RAISE EXCEPTION 'Admin Desa hanya dapat memverifikasi warga di desanya';
      END IF;
    END IF;
  ELSE
    RAISE EXCEPTION 'Role % tidak dapat di-approve lewat alur ini', _role;
  END IF;

  -- 1. set profile verified (PENTING: dilakukan sebelum insert role agar trigger guard lulus)
  UPDATE public.profiles
  SET verification_status = 'verified',
      verified_at = now(),
      verified_by = _caller,
      verification_method = _method,
      rejected_at = NULL, rejected_by = NULL, rejection_reason = NULL
  WHERE id = _target_user_id;

  -- 2. hapus role lama (kecuali super_admin/admin_pemda/pimpinan agar tidak hilang)
  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id
    AND role NOT IN ('super_admin','admin_pemda','pimpinan');

  -- 3. insert role yang diminta
  INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, _role)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.audit_log (user_id, aksi, entitas, entitas_id, data_sesudah)
  VALUES (_caller, 'user.approved', 'profile', _target_user_id::text,
    jsonb_build_object('role', _role, 'method', _method));

  RETURN jsonb_build_object('ok', true, 'user_id', _target_user_id, 'role', _role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_approve_user(uuid, public.app_role, text) TO authenticated, service_role;

-- 7) RPC: reject user
CREATE OR REPLACE FUNCTION public.fn_reject_user(
  _target_user_id uuid,
  _reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Tidak terautentikasi'; END IF;
  IF _target_user_id = _caller THEN RAISE EXCEPTION 'Tidak dapat menolak akun sendiri'; END IF;
  IF _reason IS NULL OR length(btrim(_reason)) < 5 THEN
    RAISE EXCEPTION 'Alasan penolakan minimal 5 karakter';
  END IF;

  IF NOT (
    public.has_role(_caller,'super_admin')
    OR public.has_role(_caller,'admin_pemda')
    OR public.has_role(_caller,'admin_opd')
    OR public.has_role(_caller,'admin_desa')
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.profiles
  SET verification_status = 'rejected',
      rejected_at = now(),
      rejected_by = _caller,
      rejection_reason = _reason
  WHERE id = _target_user_id;

  -- Cabut role non-elevated
  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id
    AND role NOT IN ('super_admin','admin_pemda','pimpinan');

  INSERT INTO public.audit_log (user_id, aksi, entitas, entitas_id, data_sesudah)
  VALUES (_caller, 'user.rejected', 'profile', _target_user_id::text,
    jsonb_build_object('reason', _reason));

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_reject_user(uuid, text) TO authenticated, service_role;

-- 8) updated_at trigger pada master_jabatan
DROP TRIGGER IF EXISTS trg_master_jabatan_updated_at ON public.master_jabatan;
CREATE TRIGGER trg_master_jabatan_updated_at
  BEFORE UPDATE ON public.master_jabatan
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
