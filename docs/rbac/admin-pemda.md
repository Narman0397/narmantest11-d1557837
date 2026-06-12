# Role: `admin_pemda`

Admin tingkat Pemerintah Daerah. Cakupan lintas OPD, fokus monitoring & pelaporan agregat.

## Hak akses (default permission)
- `pemda.view`, `pemda.manage`, `pemda.monitor`
- Seluruh `view_*` (opd, submissions, attendance, assets, datasets, reports, performance, surveys)
- `view_kabupaten_dashboard`, `view_executive_dashboard`, `view_cross_opd_analytics`
- `executive.view`

## Tidak boleh
- Mengubah konfigurasi sistem inti (`/admin/sistem`)
- Mengelola role super_admin / `can_manage_roles`
- Mengelola secret aplikasi
- `executive.approve` / `executive.sign` / `executive.disposition` (hanya Bupati)

## Route utama
- `/_authenticated/pemda` — Dashboard Admin Pemda (operasional cross-OPD)
- `/_authenticated/executive` — Dashboard Eksekutif (read-only)
- `/_authenticated/admin/{layanan,laporan,asn-kepatuhan,aset,dataset,audit}` — monitoring

## Sumber di kode
- Constants: `src/features/rbac/constants.ts`
- Guard UI: `src/components/admin/ExecutiveGuard.tsx` (mode "pemda")
- Helper SQL: `public.is_admin_pemda(uid)`, `public.is_elevated_view(uid)`
