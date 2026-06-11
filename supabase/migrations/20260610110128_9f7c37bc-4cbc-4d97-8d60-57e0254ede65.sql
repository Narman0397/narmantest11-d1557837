ALTER TABLE public.form_fields
  ADD COLUMN IF NOT EXISTS placeholder text,
  ADD COLUMN IF NOT EXISTS help_text text,
  ADD COLUMN IF NOT EXISTS validation jsonb DEFAULT '{}'::jsonb;

UPDATE public.form_fields
SET help_text = COALESCE(help_text, help)
WHERE help_text IS NULL;

ALTER TABLE public.forms
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.dokumen_verifikasi
  ADD COLUMN IF NOT EXISTS token text,
  ADD COLUMN IF NOT EXISTS nomor_surat text,
  ADD COLUMN IF NOT EXISTS sha256 text,
  ADD COLUMN IF NOT EXISTS signature_provider text,
  ADD COLUMN IF NOT EXISTS diterbitkan_oleh uuid;

UPDATE public.dokumen_verifikasi
SET sha256 = COALESCE(sha256, hash),
    diterbitkan_oleh = COALESCE(diterbitkan_oleh, created_by)
WHERE sha256 IS NULL OR diterbitkan_oleh IS NULL;

ALTER TABLE public.escalation_config
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS threshold_days integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS target_role text NOT NULL DEFAULT 'admin_opd';

ALTER TABLE public.ikm_surveys
  ADD COLUMN IF NOT EXISTS periode text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

UPDATE public.ikm_surveys
SET periode = COALESCE(periode, CASE WHEN mulai IS NOT NULL THEN to_char(mulai, 'YYYY-MM') ELSE to_char(created_at, 'YYYY-MM') END)
WHERE periode IS NULL;

CREATE TABLE IF NOT EXISTS public.lokasi_gedung (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  alamat text,
  opd_id uuid REFERENCES public.opd(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lokasi_gedung TO authenticated;
GRANT ALL ON public.lokasi_gedung TO service_role;
ALTER TABLE public.lokasi_gedung ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin dapat mengelola lokasi gedung" ON public.lokasi_gedung;
CREATE POLICY "Admin dapat mengelola lokasi gedung" ON public.lokasi_gedung
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR (public.has_role(auth.uid(), 'admin_opd'::public.app_role) AND (opd_id IS NULL OR opd_id = public.get_user_opd(auth.uid()))))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR (public.has_role(auth.uid(), 'admin_opd'::public.app_role) AND (opd_id IS NULL OR opd_id = public.get_user_opd(auth.uid()))));

CREATE TABLE IF NOT EXISTS public.lokasi_lantai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gedung_id uuid NOT NULL REFERENCES public.lokasi_gedung(id) ON DELETE CASCADE,
  nama text NOT NULL,
  urutan integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lokasi_lantai TO authenticated;
GRANT ALL ON public.lokasi_lantai TO service_role;
ALTER TABLE public.lokasi_lantai ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin dapat mengelola lokasi lantai" ON public.lokasi_lantai;
CREATE POLICY "Admin dapat mengelola lokasi lantai" ON public.lokasi_lantai
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin_opd'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin_opd'::public.app_role));

CREATE TABLE IF NOT EXISTS public.lokasi_ruangan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lantai_id uuid NOT NULL REFERENCES public.lokasi_lantai(id) ON DELETE CASCADE,
  nama text NOT NULL,
  kode text,
  pic_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lokasi_ruangan TO authenticated;
GRANT ALL ON public.lokasi_ruangan TO service_role;
ALTER TABLE public.lokasi_ruangan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin dapat mengelola lokasi ruangan" ON public.lokasi_ruangan;
CREATE POLICY "Admin dapat mengelola lokasi ruangan" ON public.lokasi_ruangan
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin_opd'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin_opd'::public.app_role));

DROP TRIGGER IF EXISTS set_lokasi_gedung_updated_at ON public.lokasi_gedung;
CREATE TRIGGER set_lokasi_gedung_updated_at BEFORE UPDATE ON public.lokasi_gedung FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_lokasi_lantai_updated_at ON public.lokasi_lantai;
CREATE TRIGGER set_lokasi_lantai_updated_at BEFORE UPDATE ON public.lokasi_lantai FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_lokasi_ruangan_updated_at ON public.lokasi_ruangan;
CREATE TRIGGER set_lokasi_ruangan_updated_at BEFORE UPDATE ON public.lokasi_ruangan FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.migrasi_dataset_ke_forms(_template_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  t record;
  f_id uuid;
  k jsonb;
  idx integer := 0;
BEGIN
  SELECT * INTO t FROM public.dataset_template WHERE id = _template_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template tidak ditemukan';
  END IF;

  INSERT INTO public.forms (judul, deskripsi, opd_pemilik_id, deadline, allow_multiple_submit, status, created_by)
  VALUES (t.judul, t.deskripsi, COALESCE(t.opd_pemilik_id, t.opd_id), t.deadline, COALESCE(t.allow_multiple_submit, false), 'draft', t.created_by)
  RETURNING id INTO f_id;

  FOR k IN SELECT * FROM jsonb_array_elements(COALESCE(t.kolom, '[]'::jsonb)) LOOP
    INSERT INTO public.form_fields (form_id, kode, label, tipe, required, help, help_text, options, urutan)
    VALUES (
      f_id,
      COALESCE(k->>'key', 'field_' || idx),
      COALESCE(k->>'label', k->>'key', 'Field ' || idx),
      COALESCE(k->>'tipe', 'short_text'),
      COALESCE((k->>'required')::boolean, false),
      k->>'help',
      k->>'help',
      COALESCE(k->'options', '[]'::jsonb),
      idx
    );
    idx := idx + 1;
  END LOOP;

  UPDATE public.dataset_template SET aktif = false WHERE id = _template_id;
  RETURN f_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_ikm_dashboard(_survey_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH r AS (
    SELECT * FROM public.ikm_responses WHERE survey_id = _survey_id
  ), agg AS (
    SELECT
      COUNT(*)::int AS total,
      AVG((COALESCE(u1,0)+COALESCE(u2,0)+COALESCE(u3,0)+COALESCE(u4,0)+COALESCE(u5,0)+COALESCE(u6,0)+COALESCE(u7,0)+COALESCE(u8,0)+COALESCE(u9,0))::numeric / 9.0) AS rata,
      AVG(u1)::numeric AS u1, AVG(u2)::numeric AS u2, AVG(u3)::numeric AS u3,
      AVG(u4)::numeric AS u4, AVG(u5)::numeric AS u5, AVG(u6)::numeric AS u6,
      AVG(u7)::numeric AS u7, AVG(u8)::numeric AS u8, AVG(u9)::numeric AS u9
    FROM r
  )
  SELECT jsonb_build_object(
    'total', total,
    'rata', ROUND(COALESCE(rata,0), 2),
    'nilai_ikm', ROUND(COALESCE(rata,0) * 25, 2),
    'mutu', CASE WHEN COALESCE(rata,0) >= 3.53 THEN 'A' WHEN COALESCE(rata,0) >= 3.06 THEN 'B' WHEN COALESCE(rata,0) >= 2.60 THEN 'C' ELSE 'D' END,
    'u1', ROUND(COALESCE(u1,0),2), 'u2', ROUND(COALESCE(u2,0),2), 'u3', ROUND(COALESCE(u3,0),2),
    'u4', ROUND(COALESCE(u4,0),2), 'u5', ROUND(COALESCE(u5,0),2), 'u6', ROUND(COALESCE(u6,0),2),
    'u7', ROUND(COALESCE(u7,0),2), 'u8', ROUND(COALESCE(u8,0),2), 'u9', ROUND(COALESCE(u9,0),2)
  ) FROM agg;
$$;

CREATE OR REPLACE FUNCTION public.opd_kategori_benchmark(_kategori text)
RETURNS TABLE(opd_id uuid, opd_nama text, opd_singkatan text, total bigint, selesai bigint, sla_pct numeric, rating_avg numeric, skor numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH p AS (
    SELECT * FROM public.permohonan WHERE kategori = _kategori
  ), agg AS (
    SELECT opd_id,
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE status='selesai')::numeric AS selesai,
      COUNT(*) FILTER (WHERE status='selesai' AND tenggat IS NOT NULL AND updated_at <= tenggat)::numeric AS on_time,
      COUNT(*) FILTER (WHERE status='selesai' AND tenggat IS NOT NULL)::numeric AS with_sla
    FROM p GROUP BY opd_id
  ), rate AS (
    SELECT p.opd_id, AVG(r.skor)::numeric AS r
    FROM public.permohonan_rating r JOIN public.permohonan p ON p.id = r.permohonan_id
    WHERE p.kategori = _kategori
    GROUP BY p.opd_id
  )
  SELECT o.id, o.nama, o.singkatan,
    COALESCE(a.total,0)::bigint,
    COALESCE(a.selesai,0)::bigint,
    CASE WHEN a.with_sla > 0 THEN ROUND(a.on_time / a.with_sla * 100, 2) ELSE NULL END,
    ROUND(COALESCE(rate.r,0)::numeric, 2),
    ROUND((COALESCE(a.selesai,0) + COALESCE(rate.r,0))::numeric, 2)
  FROM public.opd o
  LEFT JOIN agg a ON a.opd_id = o.id
  LEFT JOIN rate ON rate.opd_id = o.id
  ORDER BY 8 DESC;
$$;

GRANT EXECUTE ON FUNCTION public.migrasi_dataset_ke_forms(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_ikm_dashboard(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.opd_kategori_benchmark(text) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.migrasi_dataset_ke_forms(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_ikm_dashboard(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.opd_kategori_benchmark(text) FROM PUBLIC, anon;

NOTIFY pgrst, 'reload schema';