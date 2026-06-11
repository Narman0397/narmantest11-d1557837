
-- =========================
-- DIGITAL SIGNATURE MODULE
-- =========================

-- 1) digital_signatures: spesimen TTD per user
CREATE TABLE public.digital_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signature_path text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX digital_signatures_one_active_per_user
  ON public.digital_signatures(user_id) WHERE is_active = true AND revoked_at IS NULL;
CREATE INDEX digital_signatures_user_idx ON public.digital_signatures(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_signatures TO authenticated;
GRANT ALL ON public.digital_signatures TO service_role;
ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY ds_select_own ON public.digital_signatures FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda'));
CREATE POLICY ds_insert_own ON public.digital_signatures FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY ds_update_own ON public.digital_signatures FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY ds_delete_admin ON public.digital_signatures FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));

-- 2) signing_certificates
CREATE TABLE public.signing_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nip text,
  full_name text NOT NULL,
  position text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expired_at timestamptz,
  public_key text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX signing_certificates_user_idx ON public.signing_certificates(user_id);
CREATE INDEX signing_certificates_active_idx ON public.signing_certificates(user_id) WHERE is_active = true;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.signing_certificates TO authenticated;
GRANT ALL ON public.signing_certificates TO service_role;
ALTER TABLE public.signing_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY sc_select ON public.signing_certificates FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda'));
CREATE POLICY sc_insert_admin ON public.signing_certificates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda'));
CREATE POLICY sc_update_admin ON public.signing_certificates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda'));
CREATE POLICY sc_delete_admin ON public.signing_certificates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));

-- 3) documents
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  document_type text NOT NULL,
  generated_by_system boolean NOT NULL DEFAULT false,
  source_module text,
  source_ref_id uuid,
  file_path text NOT NULL,
  opd_id uuid REFERENCES public.opd(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX documents_created_by_idx ON public.documents(created_by);
CREATE INDEX documents_opd_idx ON public.documents(opd_id);
CREATE INDEX documents_source_idx ON public.documents(source_module, source_ref_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_select ON public.documents FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_pemda')
    OR (public.has_role(auth.uid(),'admin_opd') AND opd_id = public.get_user_opd(auth.uid()))
  );
CREATE POLICY documents_insert ON public.documents FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY documents_update ON public.documents FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY documents_delete_admin ON public.documents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));

-- 4) signed_documents
CREATE TABLE public.signed_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  document_hash text NOT NULL,
  verification_token text NOT NULL UNIQUE,
  signed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  signed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'signed' CHECK (status IN ('draft','signed','revoked','expired')),
  signed_file_path text NOT NULL,
  verification_count integer NOT NULL DEFAULT 0,
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX signed_documents_document_idx ON public.signed_documents(document_id);
CREATE INDEX signed_documents_signed_by_idx ON public.signed_documents(signed_by);
CREATE INDEX signed_documents_hash_idx ON public.signed_documents(document_hash);
CREATE INDEX signed_documents_status_idx ON public.signed_documents(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.signed_documents TO authenticated;
GRANT ALL ON public.signed_documents TO service_role;
ALTER TABLE public.signed_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY sd_select ON public.signed_documents FOR SELECT TO authenticated
  USING (
    signed_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND (
      d.created_by = auth.uid()
      OR public.has_role(auth.uid(),'super_admin')
      OR public.has_role(auth.uid(),'admin_pemda')
      OR (public.has_role(auth.uid(),'admin_opd') AND d.opd_id = public.get_user_opd(auth.uid()))
    ))
  );
CREATE POLICY sd_insert ON public.signed_documents FOR INSERT TO authenticated
  WITH CHECK (signed_by = auth.uid());
CREATE POLICY sd_update_admin ON public.signed_documents FOR UPDATE TO authenticated
  USING (signed_by = auth.uid() OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (signed_by = auth.uid() OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY sd_delete_admin ON public.signed_documents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));

-- 5) document_audit (immutable: only INSERT + SELECT policies)
CREATE TABLE public.document_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('GENERATED','UPLOADED','SIGNED','VIEWED','VERIFIED','DOWNLOADED','REVOKED')),
  actor uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX document_audit_document_idx ON public.document_audit(document_id, created_at DESC);
CREATE INDEX document_audit_actor_idx ON public.document_audit(actor);

GRANT SELECT, INSERT ON public.document_audit TO authenticated;
GRANT ALL ON public.document_audit TO service_role;
ALTER TABLE public.document_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY da_insert ON public.document_audit FOR INSERT TO authenticated
  WITH CHECK (actor = auth.uid() OR actor IS NULL);
CREATE POLICY da_select ON public.document_audit FOR SELECT TO authenticated
  USING (
    actor = auth.uid()
    OR EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND (
      d.created_by = auth.uid()
      OR public.has_role(auth.uid(),'super_admin')
      OR public.has_role(auth.uid(),'admin_pemda')
      OR (public.has_role(auth.uid(),'admin_opd') AND d.opd_id = public.get_user_opd(auth.uid()))
    ))
  );
-- NO UPDATE/DELETE policies → immutable via API

-- 6) Seed permissions
INSERT INTO public.permissions(code, label, kategori, description) VALUES
  ('digital_signature.view','Lihat Tanda Tangan Digital','digital_signature','Akses lihat modul TTD digital'),
  ('digital_signature.create','Buat Dokumen Tanda Tangan','digital_signature','Buat / upload dokumen utk TTD'),
  ('digital_signature.sign','Tandatangani Dokumen','digital_signature','Lakukan penandatanganan dokumen'),
  ('digital_signature.verify','Verifikasi Dokumen','digital_signature','Verifikasi keaslian dokumen'),
  ('digital_signature.revoke','Cabut Tanda Tangan','digital_signature','Cabut penandatanganan dokumen'),
  ('digital_signature.admin','Admin Tanda Tangan Digital','digital_signature','Administrasi modul TTD digital')
ON CONFLICT (code) DO NOTHING;

-- 7) Storage.objects policies for new buckets (buckets dibuat via tool)
-- signatures: owner per-folder (folder = user_id)
CREATE POLICY signatures_owner_all ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'signatures' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'super_admin')))
  WITH CHECK (bucket_id = 'signatures' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'super_admin')));

-- documents: owner of file (folder = user_id) + admin
CREATE POLICY documents_owner_all ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'documents' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_pemda')
  ))
  WITH CHECK (bucket_id = 'documents' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_pemda')
  ));

-- signed-documents: hanya admin + service_role yang baca via API; signed URL utk publik
CREATE POLICY signed_documents_admin ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'signed-documents' AND (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_pemda')
    OR auth.uid()::text = (storage.foldername(name))[1]
  ))
  WITH CHECK (bucket_id = 'signed-documents' AND (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_pemda')
    OR auth.uid()::text = (storage.foldername(name))[1]
  ));

-- verification-assets: admin write, semua authenticated read
CREATE POLICY verification_assets_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-assets');
CREATE POLICY verification_assets_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-assets' AND (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda')
  ));
CREATE POLICY verification_assets_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'verification-assets' AND (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda')
  ));
CREATE POLICY verification_assets_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'verification-assets' AND public.has_role(auth.uid(),'super_admin'));
