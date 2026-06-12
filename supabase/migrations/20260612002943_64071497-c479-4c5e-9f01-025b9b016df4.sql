
-- RLS policies for new storage buckets
-- Pattern: authenticated insert (own folder for private user-scoped buckets),
-- read/delete restricted to owner or admin roles.

-- Helper: admin check (super_admin OR admin_pemda OR admin_opd)
-- Uses existing public.has_role(uuid, app_role)

-- =========================================================
-- branding (logos, public-ish but private bucket → signed URL)
-- =========================================================
CREATE POLICY "branding_read_all_auth" ON storage.objects FOR SELECT
TO authenticated USING (bucket_id = 'branding');
CREATE POLICY "branding_write_admin" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (
  bucket_id = 'branding' AND (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda')
  )
);
CREATE POLICY "branding_update_admin" ON storage.objects FOR UPDATE
TO authenticated USING (
  bucket_id = 'branding' AND (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda')
  )
);
CREATE POLICY "branding_delete_admin" ON storage.objects FOR DELETE
TO authenticated USING (
  bucket_id = 'branding' AND (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda')
  )
);

-- =========================================================
-- pejabat-foto
-- =========================================================
CREATE POLICY "pejabat_read_all_auth" ON storage.objects FOR SELECT
TO authenticated USING (bucket_id = 'pejabat-foto');
CREATE POLICY "pejabat_write_admin" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (
  bucket_id = 'pejabat-foto' AND (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda')
  )
);
CREATE POLICY "pejabat_update_admin" ON storage.objects FOR UPDATE
TO authenticated USING (
  bucket_id = 'pejabat-foto' AND (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda')
  )
);
CREATE POLICY "pejabat_delete_admin" ON storage.objects FOR DELETE
TO authenticated USING (
  bucket_id = 'pejabat-foto' AND (
    public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin_pemda')
  )
);

-- =========================================================
-- berkas-permohonan (private, path prefix = user_id)
-- =========================================================
CREATE POLICY "berkas_read_owner_or_admin" ON storage.objects FOR SELECT
TO authenticated USING (
  bucket_id = 'berkas-permohonan' AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_opd')
    OR public.has_role(auth.uid(),'admin_pemda')
  )
);
CREATE POLICY "berkas_insert_own_folder" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (
  bucket_id = 'berkas-permohonan' AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "berkas_delete_owner_or_admin" ON storage.objects FOR DELETE
TO authenticated USING (
  bucket_id = 'berkas-permohonan' AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_opd')
  )
);

-- =========================================================
-- aset-foto (admin/asn write, admin read)
-- =========================================================
CREATE POLICY "aset_read_auth" ON storage.objects FOR SELECT
TO authenticated USING (
  bucket_id = 'aset-foto' AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_opd')
    OR public.has_role(auth.uid(),'admin_pemda')
    OR public.has_role(auth.uid(),'asn')
  )
);
CREATE POLICY "aset_insert_auth" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (
  bucket_id = 'aset-foto' AND auth.uid() IS NOT NULL
);
CREATE POLICY "aset_delete_owner_or_admin" ON storage.objects FOR DELETE
TO authenticated USING (
  bucket_id = 'aset-foto' AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_opd')
  )
);

-- =========================================================
-- absensi-foto (ASN selfie, owner-only path)
-- =========================================================
CREATE POLICY "absensi_read_owner_or_admin" ON storage.objects FOR SELECT
TO authenticated USING (
  bucket_id = 'absensi-foto' AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_opd')
    OR public.has_role(auth.uid(),'admin_pemda')
  )
);
CREATE POLICY "absensi_insert_own_folder" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (
  bucket_id = 'absensi-foto' AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "absensi_delete_admin" ON storage.objects FOR DELETE
TO authenticated USING (
  bucket_id = 'absensi-foto' AND (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_opd')
  )
);

-- =========================================================
-- form-uploads (form builder file field)
-- =========================================================
CREATE POLICY "form_uploads_read_owner_or_admin" ON storage.objects FOR SELECT
TO authenticated USING (
  bucket_id = 'form-uploads' AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_opd')
    OR public.has_role(auth.uid(),'admin_pemda')
  )
);
CREATE POLICY "form_uploads_insert_own_folder" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (
  bucket_id = 'form-uploads' AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "form_uploads_delete_owner_or_admin" ON storage.objects FOR DELETE
TO authenticated USING (
  bucket_id = 'form-uploads' AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_opd')
  )
);

-- =========================================================
-- share-files (paket distribusi)
-- =========================================================
CREATE POLICY "share_files_read_auth" ON storage.objects FOR SELECT
TO authenticated USING (
  bucket_id = 'share-files' AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_opd')
    OR public.has_role(auth.uid(),'admin_pemda')
  )
);
CREATE POLICY "share_files_write_admin" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (
  bucket_id = 'share-files' AND (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_opd')
    OR public.has_role(auth.uid(),'admin_pemda')
  )
);
CREATE POLICY "share_files_delete_admin" ON storage.objects FOR DELETE
TO authenticated USING (
  bucket_id = 'share-files' AND (
    public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin_opd')
    OR public.has_role(auth.uid(),'admin_pemda')
  )
);
