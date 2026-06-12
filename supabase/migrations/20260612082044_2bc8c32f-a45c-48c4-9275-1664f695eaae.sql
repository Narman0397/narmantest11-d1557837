-- 0) Tambah kolom pejabat (idempotent)
ALTER TABLE public.pejabat
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pimpinan_type text;
CREATE INDEX IF NOT EXISTS idx_pejabat_user_id ON public.pejabat(user_id);
CREATE INDEX IF NOT EXISTS idx_pejabat_pimpinan_type ON public.pejabat(pimpinan_type) WHERE pimpinan_type IS NOT NULL;
-- is_pimpinan diperlukan oleh getUserContext lama; tambahkan jika belum ada
ALTER TABLE public.pejabat
  ADD COLUMN IF NOT EXISTS is_pimpinan boolean NOT NULL DEFAULT false;

-- 1) Seed permission catalog
INSERT INTO public.permissions (code, label, kategori, description) VALUES
  ('can_create_form','Membuat Formulir','form','Membuat formulir pengisian data'),
  ('can_edit_form','Mengubah Formulir','form','Mengubah formulir'),
  ('can_publish_form','Publikasi Formulir','form','Mempublikasikan formulir'),
  ('can_assign_form','Menugaskan Formulir','form','Menugaskan ke OPD/ASN'),
  ('can_verify_submission','Verifikasi Pengisian','submission','Verifikasi pengisian'),
  ('can_approve_submission','Menyetujui Pengisian','submission','Menyetujui pengisian'),
  ('can_reject_submission','Menolak Pengisian','submission','Menolak pengisian'),
  ('can_request_revision','Meminta Revisi','submission','Minta revisi'),
  ('can_view_sensitive_document','Lihat Dokumen Sensitif','document','Akses dokumen sensitif'),
  ('can_download_document','Unduh Dokumen','document','Unduh dokumen'),
  ('can_share_document','Bagikan Dokumen','document','Bagikan dokumen'),
  ('can_request_document','Minta Dokumen','document','Ajukan permintaan dokumen'),
  ('can_manage_users','Kelola Pengguna','admin','Mengelola pengguna'),
  ('can_manage_opd','Kelola OPD','admin','Mengelola OPD'),
  ('can_view_audit_logs','Lihat Audit Log','admin','Catatan audit sistem'),
  ('can_export_data','Ekspor Data','admin','Ekspor data'),
  ('can_manage_roles','Kelola Peran','admin','Mengelola role'),
  ('can_manage_forms','Kelola Formulir','form','Mengelola seluruh formulir'),
  ('can_request_data','Minta Data','data','Mengajukan permintaan data'),
  ('can_approve_data_request','Setujui Permintaan Data','data','Setujui permintaan data'),
  ('can_approve_registration','Setujui Registrasi','admin','Setujui registrasi akun'),
  ('view_all_opd','Lihat Semua OPD','pemda','Data seluruh OPD'),
  ('view_all_submissions','Lihat Semua Pengisian','pemda','Lintas OPD'),
  ('view_all_attendance','Lihat Semua Absensi','pemda','Lintas OPD'),
  ('view_all_assets','Lihat Semua Aset','pemda','Lintas OPD'),
  ('view_all_datasets','Lihat Semua Dataset','pemda','Lintas OPD'),
  ('view_all_reports','Lihat Semua Laporan','pemda','Lintas OPD'),
  ('view_all_performance','Lihat Kinerja','pemda','Kinerja OPD'),
  ('view_all_surveys','Lihat Survei','pemda','IKM lintas OPD'),
  ('view_kabupaten_dashboard','Dashboard Kabupaten','pemda','Dashboard kabupaten'),
  ('view_executive_dashboard','Dashboard Eksekutif','executive','Dashboard pimpinan'),
  ('view_cross_opd_analytics','Analitik Lintas OPD','pemda','Analitik agregat'),
  ('pemda.view','Pemda: Lihat','pemda','Akses dashboard & data Pemda'),
  ('pemda.manage','Pemda: Kelola','pemda','Kelola monitoring tingkat Pemda (non-sistem inti)'),
  ('pemda.monitor','Pemda: Monitoring','pemda','Monitoring lintas OPD'),
  ('executive.view','Eksekutif: Lihat','executive','Akses dashboard eksekutif'),
  ('executive.approve','Eksekutif: Setujui','executive','Persetujuan dokumen pimpinan'),
  ('executive.sign','Eksekutif: Tanda Tangan','executive','Penandatanganan digital pimpinan'),
  ('executive.disposition','Eksekutif: Disposisi','executive','Disposisi surat pimpinan')
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, kategori = EXCLUDED.kategori, description = EXCLUDED.description;

-- 2) Helper baru
CREATE OR REPLACE FUNCTION public.is_bupati(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pejabat
    WHERE user_id = _uid
      AND COALESCE(aktif, true) = true
      AND pimpinan_type = 'bupati'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_executive(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid,'super_admin'::app_role)
      OR public.has_role(_uid,'admin_pemda'::app_role)
      OR public.has_role(_uid,'pimpinan'::app_role);
$$;

-- 3) has_permission() default berbasis role
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_code text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _ok boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions up
    WHERE up.user_id = _user_id AND up.permission_code = _permission_code
      AND up.granted = true AND up.revoked_at IS NULL
      AND (up.expires_at IS NULL OR up.expires_at > now())
  ) INTO _ok;
  IF _ok THEN RETURN true; END IF;

  IF public.has_role(_user_id,'super_admin'::app_role) THEN RETURN true; END IF;

  IF public.has_role(_user_id,'admin_pemda'::app_role) THEN
    IF _permission_code LIKE 'view_%' OR _permission_code LIKE 'pemda.%'
       OR _permission_code = 'executive.view' THEN RETURN true; END IF;
  END IF;

  IF public.has_role(_user_id,'pimpinan'::app_role) THEN
    IF _permission_code LIKE 'view_%' OR _permission_code = 'executive.view' THEN RETURN true; END IF;
    IF public.is_bupati(_user_id)
       AND _permission_code IN ('executive.approve','executive.sign','executive.disposition')
    THEN RETURN true; END IF;
  END IF;

  RETURN false;
END;
$$;

-- 4) get_effective_permissions diperluas
CREATE OR REPLACE FUNCTION public.get_effective_permissions(_user_id uuid)
RETURNS TABLE(permission_code text, code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT p.permission_code, p.permission_code
  FROM public.user_permissions p
  WHERE p.user_id = _user_id AND p.granted = true AND p.revoked_at IS NULL
    AND (p.expires_at IS NULL OR p.expires_at > now())
  UNION
  SELECT perm.code, perm.code FROM public.permissions perm
  WHERE public.has_role(_user_id,'super_admin'::public.app_role)
  UNION
  SELECT perm.code, perm.code FROM public.permissions perm
  WHERE public.has_role(_user_id,'admin_pemda'::public.app_role)
    AND (perm.code LIKE 'view_%' OR perm.code LIKE 'pemda.%' OR perm.code = 'executive.view')
  UNION
  SELECT perm.code, perm.code FROM public.permissions perm
  WHERE public.has_role(_user_id,'pimpinan'::public.app_role)
    AND (perm.code LIKE 'view_%' OR perm.code = 'executive.view')
  UNION
  SELECT perm.code, perm.code FROM public.permissions perm
  WHERE public.has_role(_user_id,'pimpinan'::public.app_role)
    AND public.is_bupati(_user_id)
    AND perm.code IN ('executive.approve','executive.sign','executive.disposition');
$$;

GRANT EXECUTE ON FUNCTION public.is_bupati(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_executive(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_effective_permissions(uuid) TO authenticated, anon;