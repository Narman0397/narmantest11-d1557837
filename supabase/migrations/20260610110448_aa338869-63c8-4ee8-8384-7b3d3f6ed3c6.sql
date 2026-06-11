ALTER TABLE public.form_submission_files
  ADD COLUMN IF NOT EXISTS uploaded_by uuid,
  ADD COLUMN IF NOT EXISTS finalized_at timestamptz;

ALTER TABLE public.compliance_checklist
  ADD COLUMN IF NOT EXISTS judul text,
  ADD COLUMN IF NOT EXISTS deskripsi text;

UPDATE public.compliance_checklist
SET judul = COALESCE(judul, label),
    deskripsi = COALESCE(deskripsi, catatan)
WHERE judul IS NULL OR deskripsi IS NULL;

ALTER TABLE public.uat_scenarios
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS judul text,
  ADD COLUMN IF NOT EXISTS expected text;

UPDATE public.uat_scenarios
SET code = COALESCE(code, upper(regexp_replace(COALESCE(modul, 'UAT') || '-' || substr(id::text, 1, 6), '[^A-Za-z0-9_-]', '-', 'g'))),
    judul = COALESCE(judul, description),
    expected = COALESCE(expected, description)
WHERE code IS NULL OR judul IS NULL OR expected IS NULL;

ALTER TABLE public.feature_flags
  ADD COLUMN IF NOT EXISTS flag_key text;

UPDATE public.feature_flags
SET flag_key = COALESCE(flag_key, key)
WHERE flag_key IS NULL;

DO $$
BEGIN
  ALTER TYPE public.status_permohonan ADD VALUE IF NOT EXISTS 'menunggu_dokumen';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE OR REPLACE VIEW public.v_permohonan_overdue AS
SELECT
  p.id,
  p.kode,
  p.opd_id,
  GREATEST(0, CEIL(EXTRACT(EPOCH FROM (now() - p.tenggat)) / 86400.0))::integer AS overdue_days,
  p.status::text AS status
FROM public.permohonan p
WHERE p.tenggat IS NOT NULL
  AND p.tenggat < now()
  AND p.status::text NOT IN ('selesai', 'ditolak');

GRANT SELECT ON public.v_permohonan_overdue TO authenticated;
GRANT SELECT ON public.v_permohonan_overdue TO service_role;
ALTER VIEW public.v_permohonan_overdue SET (security_invoker = true);

CREATE OR REPLACE FUNCTION public.sync_compliance_aliases()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.judul IS NULL THEN NEW.judul := NEW.label; END IF;
  IF NEW.label IS NULL THEN NEW.label := NEW.judul; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_sync_compliance_aliases ON public.compliance_checklist;
CREATE TRIGGER trg_sync_compliance_aliases
BEFORE INSERT OR UPDATE ON public.compliance_checklist
FOR EACH ROW EXECUTE FUNCTION public.sync_compliance_aliases();

CREATE OR REPLACE FUNCTION public.sync_uat_aliases()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.code IS NULL THEN NEW.code := upper(regexp_replace(COALESCE(NEW.modul, 'UAT') || '-' || substr(COALESCE(NEW.id, gen_random_uuid())::text, 1, 6), '[^A-Za-z0-9_-]', '-', 'g')); END IF;
  IF NEW.judul IS NULL THEN NEW.judul := NEW.description; END IF;
  IF NEW.expected IS NULL THEN NEW.expected := NEW.description; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_sync_uat_aliases ON public.uat_scenarios;
CREATE TRIGGER trg_sync_uat_aliases
BEFORE INSERT OR UPDATE ON public.uat_scenarios
FOR EACH ROW EXECUTE FUNCTION public.sync_uat_aliases();

CREATE OR REPLACE FUNCTION public.sync_feature_flag_aliases()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.flag_key IS NULL THEN NEW.flag_key := NEW.key; END IF;
  IF NEW.key IS NULL THEN NEW.key := NEW.flag_key; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_sync_feature_flag_aliases ON public.feature_flags;
CREATE TRIGGER trg_sync_feature_flag_aliases
BEFORE INSERT OR UPDATE ON public.feature_flags
FOR EACH ROW EXECUTE FUNCTION public.sync_feature_flag_aliases();

NOTIFY pgrst, 'reload schema';