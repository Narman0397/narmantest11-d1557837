
-- 1) Add expires_at to signed_documents
ALTER TABLE public.signed_documents
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS signed_documents_expires_at_idx
  ON public.signed_documents (expires_at);

-- 2) Uniqueness on (document_id, document_hash)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'signed_documents_doc_hash_uniq'
  ) THEN
    ALTER TABLE public.signed_documents
      ADD CONSTRAINT signed_documents_doc_hash_uniq UNIQUE (document_id, document_hash);
  END IF;
END $$;

-- 3) Expand audit actions
ALTER TABLE public.document_audit
  DROP CONSTRAINT IF EXISTS document_audit_action_check;
ALTER TABLE public.document_audit
  ADD CONSTRAINT document_audit_action_check
  CHECK (action = ANY (ARRAY[
    'GENERATED','UPLOADED','SIGNED','VIEWED','VERIFIED','DOWNLOADED','REVOKED',
    'HASH_MISMATCH','VERIFY_UPLOAD','EXPIRED'
  ]));

-- 4) Validation trigger: revoke_reason min 10 chars when status = revoked
CREATE OR REPLACE FUNCTION public.tg_signed_documents_validate_revoke()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'revoked' THEN
    IF NEW.revoke_reason IS NULL OR length(btrim(NEW.revoke_reason)) < 10 THEN
      RAISE EXCEPTION 'revoke_reason wajib diisi minimal 10 karakter';
    END IF;
    IF NEW.revoked_at IS NULL THEN
      NEW.revoked_at := now();
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_signed_documents_validate_revoke ON public.signed_documents;
CREATE TRIGGER trg_signed_documents_validate_revoke
  BEFORE INSERT OR UPDATE ON public.signed_documents
  FOR EACH ROW EXECUTE FUNCTION public.tg_signed_documents_validate_revoke();

-- 5) Helper: checkDocumentStatus equivalent (SQL function)
CREATE OR REPLACE FUNCTION public.check_signed_document_status(_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN s.status = 'revoked' THEN 'REVOKED'
    WHEN s.expires_at IS NOT NULL AND s.expires_at < now() THEN 'EXPIRED'
    WHEN s.status = 'signed' THEN 'VALID'
    ELSE upper(s.status)
  END
  FROM public.signed_documents s
  WHERE s.id = _id;
$$;
