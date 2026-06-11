ALTER TABLE public.aset_verification_campaign
  ADD COLUMN IF NOT EXISTS deskripsi text,
  ADD COLUMN IF NOT EXISTS periode_mulai date,
  ADD COLUMN IF NOT EXISTS periode_selesai date,
  ADD COLUMN IF NOT EXISTS target_opd_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

ALTER TABLE public.aset_verification_item
  ADD COLUMN IF NOT EXISTS opd_id uuid REFERENCES public.opd(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'belum',
  ADD COLUMN IF NOT EXISTS lat numeric,
  ADD COLUMN IF NOT EXISTS lng numeric,
  ADD COLUMN IF NOT EXISTS lokasi_text text,
  ADD COLUMN IF NOT EXISTS foto_url text;

UPDATE public.aset_verification_item avi
SET opd_id = a.opd_id
FROM public.aset a
WHERE avi.aset_id = a.id
  AND avi.opd_id IS NULL;

UPDATE public.aset_verification_item
SET status = CASE WHEN COALESCE(verified, false) THEN 'selesai' ELSE status END;

ALTER TABLE public.aset_mutasi
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS catatan_approval text;

ALTER TABLE public.absensi_asn
  ADD COLUMN IF NOT EXISTS device_fingerprint_hash text,
  ADD COLUMN IF NOT EXISTS is_late boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS late_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS schedule_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS aset_penyusutan_history_aset_periode_uidx
  ON public.aset_penyusutan_history(aset_id, periode);

CREATE OR REPLACE VIEW public.aset_nilai_buku AS
SELECT
  a.id,
  a.kode,
  a.nama,
  a.opd_id,
  a.nilai_perolehan,
  a.tanggal_perolehan,
  a.umur_ekonomis_bulan,
  a.metode_susut,
  GREATEST(
    COALESCE(a.nilai_perolehan, 0) - COALESCE((
      SELECT h.akumulasi
      FROM public.aset_penyusutan_history h
      WHERE h.aset_id = a.id
      ORDER BY h.periode DESC, h.created_at DESC
      LIMIT 1
    ), 0),
    COALESCE(a.nilai_sisa, 0)
  )::numeric AS nilai_buku
FROM public.aset a;

GRANT SELECT ON public.aset_nilai_buku TO authenticated;
GRANT SELECT ON public.aset_nilai_buku TO service_role;

CREATE OR REPLACE FUNCTION public.aset_compliance(_opd_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'total', COUNT(*)::int,
    'aktif', COUNT(*) FILTER (WHERE COALESCE(status, lifecycle_status) = 'aktif' OR lifecycle_status = 'aktif')::int,
    'rusak', COUNT(*) FILTER (WHERE status = 'rusak' OR lifecycle_status = 'rusak')::int,
    'hilang', COUNT(*) FILTER (WHERE lifecycle_status = 'hilang')::int,
    'maintenance', COUNT(*) FILTER (WHERE lifecycle_status = 'maintenance')::int,
    'terverifikasi_90d', COUNT(*) FILTER (WHERE last_verified_at >= now() - interval '90 days')::int,
    'belum_verifikasi', COUNT(*) FILTER (WHERE last_verified_at IS NULL OR last_verified_at < now() - interval '90 days')::int
  )
  FROM public.aset
  WHERE _opd_id IS NULL OR opd_id = _opd_id;
$$;

CREATE OR REPLACE FUNCTION public.aset_due_warranty(_days integer DEFAULT 30)
RETURNS TABLE(aset_id uuid, kode text, nama text, opd_id uuid, jenis text, due_date date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT *
  FROM (
    SELECT a.id AS aset_id, a.kode, a.nama, a.opd_id, 'garansi'::text AS jenis, a.garansi_sampai AS due_date
    FROM public.aset a
    WHERE a.garansi_sampai IS NOT NULL
      AND a.garansi_sampai BETWEEN CURRENT_DATE AND CURRENT_DATE + GREATEST(_days, 1)
    UNION ALL
    SELECT a.id AS aset_id, a.kode, a.nama, a.opd_id, 'kalibrasi'::text AS jenis, a.kalibrasi_berikut AS due_date
    FROM public.aset a
    WHERE a.kalibrasi_berikut IS NOT NULL
      AND a.kalibrasi_berikut BETWEEN CURRENT_DATE AND CURRENT_DATE + GREATEST(_days, 1)
  ) due
  ORDER BY due.due_date ASC;
$$;

CREATE OR REPLACE FUNCTION public.fn_susut_bulanan_run(_periode text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _inserted integer := 0;
  _eligible integer := 0;
BEGIN
  IF _periode !~ '^\d{4}-\d{2}$' THEN
    RAISE EXCEPTION 'Format periode harus YYYY-MM';
  END IF;

  WITH eligible AS (
    SELECT
      a.id AS aset_id,
      GREATEST(
        ROUND((COALESCE(a.nilai_perolehan, 0) - COALESCE(a.nilai_sisa, 0)) / GREATEST(COALESCE(a.umur_ekonomis_bulan, 0), 1), 2),
        0
      )::numeric AS susut_bulan,
      COALESCE(a.nilai_perolehan, 0)::numeric AS nilai_perolehan,
      COALESCE(a.nilai_sisa, 0)::numeric AS nilai_sisa,
      COALESCE((
        SELECT h.akumulasi
        FROM public.aset_penyusutan_history h
        WHERE h.aset_id = a.id
        ORDER BY h.periode DESC, h.created_at DESC
        LIMIT 1
      ), 0)::numeric AS akumulasi_lama
    FROM public.aset a
    WHERE COALESCE(a.nilai_perolehan, 0) > 0
      AND COALESCE(a.umur_ekonomis_bulan, 0) > 0
      AND COALESCE(a.metode_susut, 'garis_lurus') = 'garis_lurus'
      AND COALESCE(a.status, 'aktif') <> 'dihapuskan'
  ), counted AS (
    SELECT COUNT(*)::int AS total FROM eligible
  ), ins AS (
    INSERT INTO public.aset_penyusutan_history (aset_id, periode, susut_bulan, akumulasi, nilai_buku)
    SELECT
      e.aset_id,
      _periode,
      LEAST(e.susut_bulan, GREATEST(e.nilai_perolehan - e.nilai_sisa - e.akumulasi_lama, 0)),
      LEAST(e.akumulasi_lama + e.susut_bulan, GREATEST(e.nilai_perolehan - e.nilai_sisa, 0)),
      GREATEST(e.nilai_perolehan - LEAST(e.akumulasi_lama + e.susut_bulan, GREATEST(e.nilai_perolehan - e.nilai_sisa, 0)), e.nilai_sisa)
    FROM eligible e
    ON CONFLICT (aset_id, periode) DO NOTHING
    RETURNING 1
  )
  SELECT (SELECT total FROM counted), COUNT(*)::int
  INTO _eligible, _inserted
  FROM ins;

  RETURN jsonb_build_object('inserted', _inserted, 'skipped', GREATEST(_eligible - _inserted, 0), 'periode', _periode);
END;
$$;

CREATE OR REPLACE FUNCTION public.attendance_compliance(_user_id uuid, _from date, _to date)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH days AS (
    SELECT generate_series(_from, _to, interval '1 day')::date AS tanggal
  ), masuk AS (
    SELECT waktu::date AS tanggal, bool_or(is_late) AS is_late
    FROM public.absensi_asn
    WHERE user_id = _user_id
      AND tipe = 'masuk'
      AND waktu::date BETWEEN _from AND _to
    GROUP BY waktu::date
  )
  SELECT jsonb_build_object(
    'hari', COUNT(*)::int,
    'hadir', COUNT(m.tanggal)::int,
    'terlambat', COUNT(*) FILTER (WHERE COALESCE(m.is_late, false))::int,
    'tidak_hadir', (COUNT(*) - COUNT(m.tanggal))::int,
    'persen_hadir', CASE WHEN COUNT(*) = 0 THEN 0 ELSE ROUND(COUNT(m.tanggal)::numeric / COUNT(*)::numeric * 100, 2) END
  )
  FROM days d
  LEFT JOIN masuk m ON m.tanggal = d.tanggal;
$$;

CREATE OR REPLACE FUNCTION public.opd_attendance_today(_opd_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH asn AS (
    SELECT p.id
    FROM public.profiles p
    WHERE (_opd_id IS NULL OR p.opd_id = _opd_id)
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'asn')
  ), masuk AS (
    SELECT DISTINCT ON (a.user_id) a.user_id, a.is_late
    FROM public.absensi_asn a
    WHERE a.tipe = 'masuk'
      AND a.waktu >= date_trunc('day', now())
      AND a.waktu < date_trunc('day', now()) + interval '1 day'
      AND (_opd_id IS NULL OR a.opd_id = _opd_id)
    ORDER BY a.user_id, a.waktu ASC
  )
  SELECT jsonb_build_object(
    'total_asn', COUNT(asn.id)::int,
    'hadir', COUNT(masuk.user_id)::int,
    'terlambat', COUNT(*) FILTER (WHERE COALESCE(masuk.is_late, false))::int,
    'belum_hadir', GREATEST(COUNT(asn.id) - COUNT(masuk.user_id), 0)::int
  )
  FROM asn
  LEFT JOIN masuk ON masuk.user_id = asn.id;
$$;

GRANT EXECUTE ON FUNCTION public.aset_compliance(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.aset_due_warranty(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_susut_bulanan_run(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.attendance_compliance(uuid, date, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.opd_attendance_today(uuid) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';