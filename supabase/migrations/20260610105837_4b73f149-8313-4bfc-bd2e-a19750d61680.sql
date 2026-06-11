ALTER TABLE public.forms
  ADD COLUMN IF NOT EXISTS deadline timestamptz,
  ADD COLUMN IF NOT EXISTS allow_multiple_submit boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_by uuid;

ALTER TABLE public.form_targets
  ADD COLUMN IF NOT EXISTS target_value text;

UPDATE public.form_targets
SET target_value = COALESCE(target_value, target_id::text)
WHERE target_value IS NULL;

ALTER TABLE public.form_assignments
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz NOT NULL DEFAULT now();

UPDATE public.form_assignments
SET assigned_at = COALESCE(assigned_at, created_at, now());

ALTER TABLE public.dataset_template
  ADD COLUMN IF NOT EXISTS kode text,
  ADD COLUMN IF NOT EXISTS opd_pemilik_id uuid;

UPDATE public.dataset_template
SET opd_pemilik_id = COALESCE(opd_pemilik_id, opd_id),
    kode = COALESCE(kode, 'DST-' || upper(substr(id::text, 1, 8)))
WHERE opd_pemilik_id IS NULL OR kode IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS dataset_template_kode_uidx
  ON public.dataset_template(kode)
  WHERE kode IS NOT NULL;

ALTER TABLE public.dataset_submission
  ADD COLUMN IF NOT EXISTS oleh_user_id uuid,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS review_note text;

UPDATE public.dataset_submission
SET oleh_user_id = COALESCE(oleh_user_id, user_id),
    review_note = COALESCE(review_note, catatan_review)
WHERE oleh_user_id IS NULL OR review_note IS NULL;

ALTER TABLE public.dataset_submission_review
  ADD COLUMN IF NOT EXISTS aksi text;

UPDATE public.dataset_submission_review
SET aksi = COALESCE(aksi, action)
WHERE aksi IS NULL;

ALTER TABLE public.hari_libur
  ADD COLUMN IF NOT EXISTS nasional boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS catatan text;

CREATE UNIQUE INDEX IF NOT EXISTS hari_libur_tanggal_uidx
  ON public.hari_libur(tanggal);

ALTER TABLE public.user_permissions
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

CREATE OR REPLACE FUNCTION public.sync_dataset_template_aliases()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.opd_pemilik_id IS NULL THEN
    NEW.opd_pemilik_id := NEW.opd_id;
  END IF;
  IF NEW.opd_id IS NULL THEN
    NEW.opd_id := NEW.opd_pemilik_id;
  END IF;
  IF NEW.kode IS NULL OR NEW.kode = '' THEN
    NEW.kode := 'DST-' || upper(substr(COALESCE(NEW.id, gen_random_uuid())::text, 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_dataset_template_aliases ON public.dataset_template;
CREATE TRIGGER trg_sync_dataset_template_aliases
BEFORE INSERT OR UPDATE ON public.dataset_template
FOR EACH ROW EXECUTE FUNCTION public.sync_dataset_template_aliases();

CREATE OR REPLACE FUNCTION public.sync_dataset_submission_aliases()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.oleh_user_id IS NULL THEN
    NEW.oleh_user_id := NEW.user_id;
  END IF;
  IF NEW.user_id IS NULL THEN
    NEW.user_id := NEW.oleh_user_id;
  END IF;
  IF NEW.review_note IS NULL THEN
    NEW.review_note := NEW.catatan_review;
  END IF;
  IF NEW.catatan_review IS NULL THEN
    NEW.catatan_review := NEW.review_note;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_dataset_submission_aliases ON public.dataset_submission;
CREATE TRIGGER trg_sync_dataset_submission_aliases
BEFORE INSERT OR UPDATE ON public.dataset_submission
FOR EACH ROW EXECUTE FUNCTION public.sync_dataset_submission_aliases();

CREATE OR REPLACE FUNCTION public.sync_dataset_review_aliases()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.aksi IS NULL THEN
    NEW.aksi := NEW.action;
  END IF;
  IF NEW.action IS NULL THEN
    NEW.action := NEW.aksi;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_dataset_review_aliases ON public.dataset_submission_review;
CREATE TRIGGER trg_sync_dataset_review_aliases
BEFORE INSERT OR UPDATE ON public.dataset_submission_review
FOR EACH ROW EXECUTE FUNCTION public.sync_dataset_review_aliases();

CREATE OR REPLACE FUNCTION public.get_effective_permissions(_user_id uuid)
RETURNS TABLE(permission_code text, code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT p.permission_code, p.permission_code AS code
  FROM public.user_permissions p
  WHERE p.user_id = _user_id
    AND p.granted = true
    AND p.revoked_at IS NULL
    AND (p.expires_at IS NULL OR p.expires_at > now())
  UNION
  SELECT DISTINCT perm.code AS permission_code, perm.code AS code
  FROM public.permissions perm
  WHERE public.has_role(_user_id, 'super_admin'::public.app_role);
$$;

CREATE OR REPLACE FUNCTION public.attendance_rekap_bulanan(_user_id uuid, _year integer, _month integer)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH bounds AS (
    SELECT make_date(_year, _month, 1) AS d1,
           (make_date(_year, _month, 1) + interval '1 month')::date AS d2
  ), days AS (
    SELECT generate_series((SELECT d1 FROM bounds), (SELECT d2 FROM bounds) - 1, interval '1 day')::date AS tanggal
  ), masuk AS (
    SELECT waktu::date AS tanggal, bool_or(is_late) AS is_late, max(late_minutes) AS late_minutes
    FROM public.absensi_asn, bounds
    WHERE user_id = _user_id
      AND tipe = 'masuk'
      AND waktu::date >= bounds.d1
      AND waktu::date < bounds.d2
    GROUP BY waktu::date
  ), pulang AS (
    SELECT waktu::date AS tanggal
    FROM public.absensi_asn, bounds
    WHERE user_id = _user_id
      AND tipe = 'pulang'
      AND waktu::date >= bounds.d1
      AND waktu::date < bounds.d2
    GROUP BY waktu::date
  )
  SELECT jsonb_build_object(
    'year', _year,
    'month', _month,
    'hari', COUNT(*)::int,
    'hadir', COUNT(masuk.tanggal)::int,
    'pulang', COUNT(pulang.tanggal)::int,
    'terlambat', COUNT(*) FILTER (WHERE COALESCE(masuk.is_late, false))::int,
    'late_minutes', COALESCE(SUM(COALESCE(masuk.late_minutes, 0)), 0)::int,
    'tidak_hadir', (COUNT(*) - COUNT(masuk.tanggal))::int
  )
  FROM days
  LEFT JOIN masuk USING (tanggal)
  LEFT JOIN pulang USING (tanggal);
$$;

CREATE OR REPLACE FUNCTION public.attendance_device_alert(_days integer DEFAULT 7)
RETURNS TABLE(device_fingerprint_hash text, user_count bigint, hit_count bigint, user_ids uuid[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    a.device_fingerprint_hash,
    COUNT(DISTINCT a.user_id)::bigint AS user_count,
    COUNT(*)::bigint AS hit_count,
    array_agg(DISTINCT a.user_id) AS user_ids
  FROM public.absensi_asn a
  WHERE a.device_fingerprint_hash IS NOT NULL
    AND a.waktu >= now() - make_interval(days => GREATEST(_days, 1))
  GROUP BY a.device_fingerprint_hash
  HAVING COUNT(DISTINCT a.user_id) > 1
  ORDER BY COUNT(DISTINCT a.user_id) DESC, COUNT(*) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_effective_permissions(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.attendance_rekap_bulanan(uuid, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.attendance_device_alert(integer) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_effective_permissions(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.attendance_rekap_bulanan(uuid, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.attendance_device_alert(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.aset_compliance(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.aset_due_warranty(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_susut_bulanan_run(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.attendance_compliance(uuid, date, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.opd_attendance_today(uuid) FROM PUBLIC, anon;

ALTER VIEW public.aset_nilai_buku SET (security_invoker = true);

NOTIFY pgrst, 'reload schema';