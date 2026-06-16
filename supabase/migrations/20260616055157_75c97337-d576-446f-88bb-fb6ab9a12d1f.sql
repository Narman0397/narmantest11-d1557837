-- Fix: infinite recursion antara policy permohonan & profiles.
-- Buat 2 helper SECURITY DEFINER yang bypass RLS sehingga tidak memicu re-evaluasi policy.

CREATE OR REPLACE FUNCTION public.is_pemohon_in_admin_opd(_admin_uid uuid, _pemohon_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.permohonan p
    WHERE p.pemohon_id = _pemohon_id
      AND p.opd_id = public.get_user_opd(_admin_uid)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_pemohon_in_admin_desa(_admin_uid uuid, _pemohon_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = _pemohon_id
      AND pr.desa IS NOT NULL
      AND pr.desa = public.get_user_desa(_admin_uid)
  );
$$;

-- Recreate policy profiles tanpa subquery cross-table langsung
DROP POLICY IF EXISTS "Admin lihat profil pemohon" ON public.profiles;
CREATE POLICY "Admin lihat profil pemohon" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin_opd'::app_role)
    AND public.is_pemohon_in_admin_opd(auth.uid(), id)
  );

-- Recreate policy permohonan tanpa subquery cross-table langsung
DROP POLICY IF EXISTS "Admin desa lihat permohonan warga" ON public.permohonan;
CREATE POLICY "Admin desa lihat permohonan warga" ON public.permohonan
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin_desa'::app_role)
    AND public.is_pemohon_in_admin_desa(auth.uid(), pemohon_id)
  );