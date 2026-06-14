-- A-05 / C-04: Tighten app_setting RLS so anon/authenticated cannot read all rows.
-- Strategy: only rows with public_visible=true are world-readable; writes remain super_admin only.

-- 1. Drop overly-permissive policies
DROP POLICY IF EXISTS "App setting publik baca" ON public.app_setting;
DROP POLICY IF EXISTS "as_pubread" ON public.app_setting;

-- 2. Public read ONLY for rows explicitly marked public_visible
CREATE POLICY "app_setting public read (visible only)"
  ON public.app_setting
  FOR SELECT
  TO anon, authenticated
  USING (public_visible = true);

-- 3. Defense-in-depth: keep table grants narrow.
-- service_role and super_admin (via RLS policy) handle writes.
REVOKE INSERT, UPDATE, DELETE ON public.app_setting FROM anon, authenticated;
GRANT SELECT ON public.app_setting TO anon, authenticated;
GRANT ALL ON public.app_setting TO service_role;