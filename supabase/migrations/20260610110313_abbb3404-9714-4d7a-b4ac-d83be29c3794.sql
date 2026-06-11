CREATE TABLE IF NOT EXISTS public.nomor_surat_sequence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opd_id uuid REFERENCES public.opd(id) ON DELETE CASCADE,
  tahun integer NOT NULL,
  last_number integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (opd_id, tahun)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nomor_surat_sequence TO authenticated;
GRANT ALL ON public.nomor_surat_sequence TO service_role;
ALTER TABLE public.nomor_surat_sequence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin kelola nomor surat sequence" ON public.nomor_surat_sequence;
CREATE POLICY "Admin kelola nomor surat sequence" ON public.nomor_surat_sequence
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin_pemda'::public.app_role) OR (public.has_role(auth.uid(), 'admin_opd'::public.app_role) AND opd_id = public.get_user_opd(auth.uid())))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin_pemda'::public.app_role) OR (public.has_role(auth.uid(), 'admin_opd'::public.app_role) AND opd_id = public.get_user_opd(auth.uid())));

CREATE TABLE IF NOT EXISTS public.nomor_surat_issued (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor text NOT NULL UNIQUE,
  tahun integer NOT NULL,
  opd_id uuid REFERENCES public.opd(id) ON DELETE SET NULL,
  permohonan_id uuid REFERENCES public.permohonan(id) ON DELETE SET NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  issued_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nomor_surat_issued TO authenticated;
GRANT ALL ON public.nomor_surat_issued TO service_role;
ALTER TABLE public.nomor_surat_issued ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin lihat nomor surat issued" ON public.nomor_surat_issued;
CREATE POLICY "Admin lihat nomor surat issued" ON public.nomor_surat_issued
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin_pemda'::public.app_role) OR (public.has_role(auth.uid(), 'admin_opd'::public.app_role) AND opd_id = public.get_user_opd(auth.uid())));
DROP POLICY IF EXISTS "Admin kelola nomor surat issued" ON public.nomor_surat_issued;
CREATE POLICY "Admin kelola nomor surat issued" ON public.nomor_surat_issued
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin_pemda'::public.app_role) OR (public.has_role(auth.uid(), 'admin_opd'::public.app_role) AND opd_id = public.get_user_opd(auth.uid())))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR public.has_role(auth.uid(), 'admin_pemda'::public.app_role) OR (public.has_role(auth.uid(), 'admin_opd'::public.app_role) AND opd_id = public.get_user_opd(auth.uid())));

CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opd_id uuid REFERENCES public.opd(id) ON DELETE SET NULL,
  tahun integer NOT NULL,
  bulan integer NOT NULL,
  locked_at timestamptz,
  locked_by uuid,
  unlocked_at timestamptz,
  unlocked_by uuid,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_periods TO authenticated;
GRANT ALL ON public.payroll_periods TO service_role;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin kelola payroll periods" ON public.payroll_periods;
CREATE POLICY "Admin kelola payroll periods" ON public.payroll_periods
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR (public.has_role(auth.uid(), 'admin_opd'::public.app_role) AND (opd_id IS NULL OR opd_id = public.get_user_opd(auth.uid()))))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role) OR (public.has_role(auth.uid(), 'admin_opd'::public.app_role) AND (opd_id IS NULL OR opd_id = public.get_user_opd(auth.uid()))));
CREATE UNIQUE INDEX IF NOT EXISTS payroll_periods_unique_idx ON public.payroll_periods(COALESCE(opd_id, '00000000-0000-0000-0000-000000000000'::uuid), tahun, bulan);

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS actor_id uuid,
  ADD COLUMN IF NOT EXISTS correlation_id text,
  ADD COLUMN IF NOT EXISTS request_id text;

ALTER TABLE public.app_setting
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS public_visible boolean NOT NULL DEFAULT false;

ALTER TABLE public.retention_policies
  ADD COLUMN IF NOT EXISTS last_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_deleted_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.form_submissions
  ADD COLUMN IF NOT EXISTS schema_version_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS review_note text;

UPDATE public.form_submissions fs
SET schema_version_snapshot = COALESCE(fs.schema_version_snapshot, f.schema_snapshot)
FROM public.forms f
WHERE fs.form_id = f.id AND fs.schema_version_snapshot IS NULL;

ALTER TABLE public.retry_queue
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS next_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS request_id text,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

UPDATE public.retry_queue
SET next_run_at = COALESCE(next_run_at, next_attempt_at, created_at),
    last_error = COALESCE(last_error, error)
WHERE next_run_at IS NULL OR last_error IS NULL;

ALTER TABLE public.dead_letter_jobs
  ADD COLUMN IF NOT EXISTS job_name text,
  ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS request_id text,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_by uuid,
  ADD COLUMN IF NOT EXISTS replayed_to uuid,
  ADD COLUMN IF NOT EXISTS resolution_note text;

ALTER TABLE public.cron_history
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS affected_rows integer,
  ADD COLUMN IF NOT EXISTS finished_at timestamptz,
  ADD COLUMN IF NOT EXISTS detail jsonb;

CREATE OR REPLACE FUNCTION public.fn_generate_nomor_surat(_opd_id uuid, _permohonan_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tahun integer := EXTRACT(YEAR FROM now())::integer;
  _seq integer;
  _fmt text;
  _kode text;
  _singkatan text;
  _nomor text;
BEGIN
  INSERT INTO public.nomor_surat_sequence (opd_id, tahun, last_number)
  VALUES (_opd_id, _tahun, 1)
  ON CONFLICT (opd_id, tahun) DO UPDATE SET last_number = public.nomor_surat_sequence.last_number + 1, updated_at = now()
  RETURNING last_number INTO _seq;

  SELECT COALESCE(nomor_surat_format, '{kode}/{seq}/{singkatan}/{tahun}'), COALESCE(nomor_surat_kode, '470'), COALESCE(singkatan, 'OPD')
  INTO _fmt, _kode, _singkatan
  FROM public.opd WHERE id = _opd_id;

  _nomor := replace(replace(replace(replace(_fmt, '{kode}', _kode), '{seq}', lpad(_seq::text, 3, '0')), '{singkatan}', _singkatan), '{tahun}', _tahun::text);

  UPDATE public.permohonan SET nomor_surat = _nomor WHERE id = _permohonan_id;
  INSERT INTO public.nomor_surat_issued (nomor, tahun, opd_id, permohonan_id, issued_by)
  VALUES (_nomor, _tahun, _opd_id, _permohonan_id, auth.uid())
  ON CONFLICT (nomor) DO NOTHING;
  RETURN _nomor;
END;
$$;

CREATE OR REPLACE FUNCTION public.rate_limit_increment(_scope text, _subject text, _window_start timestamptz)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count integer;
BEGIN
  INSERT INTO public.rate_limit_hits (scope, subject, window_start, count, last_hit_at)
  VALUES (_scope, _subject, _window_start, 1, now())
  ON CONFLICT (scope, subject, window_start)
  DO UPDATE SET count = public.rate_limit_hits.count + 1, last_hit_at = now()
  RETURNING count INTO _count;
  RETURN _count;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_permohonan_effective_sla_seconds(_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(p.updated_at, now()) - p.tanggal_masuk))::integer - COALESCE(p.sla_total_pause_seconds, 0))
  FROM public.permohonan p
  WHERE p.id = _id;
$$;

GRANT EXECUTE ON FUNCTION public.fn_generate_nomor_surat(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rate_limit_increment(text, text, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_permohonan_effective_sla_seconds(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.fn_generate_nomor_surat(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rate_limit_increment(text, text, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_permohonan_effective_sla_seconds(uuid) FROM PUBLIC, anon;

NOTIFY pgrst, 'reload schema';