# Permission Matrix — RBAC (rev. 2026-06)

Single source of truth: `src/features/rbac/constants.ts` (TS) + tabel `public.permissions` (DB).
Resolusi runtime: `public.has_permission(uid, code)` / `public.get_effective_permissions(uid)`.

## Resolusi (urutan)

1. Override per-user di `public.user_permissions` (granted=true, belum revoked/expired) → menang.
2. Default berbasis role (lihat matriks).
3. Selain itu → ditolak.

## Role hierarchy

| Role | Cakupan | Tulis | Catatan |
|---|---|---|---|
| `super_admin` | global | ya | semua permission |
| `admin_pemda` | lintas OPD | ya (terbatas) | tidak boleh ubah sistem inti / role super_admin |
| `pimpinan` | lintas OPD | read-only kecuali Bupati | Bupati = `pejabat.pimpinan_type='bupati'` |
| `admin_opd` | OPD sendiri | ya | |
| `admin_desa` | desa sendiri | ya (verifikasi) | |
| `asn` | individu | terbatas | |
| `warga` | publik | terbatas | |

## Matriks default (✓ = otomatis dari role; – = perlu grant eksplisit)

| Permission | super | pemda | pimpinan | bupati* | admin_opd | asn |
|---|---|---|---|---|---|---|
| `pemda.view` / `pemda.manage` / `pemda.monitor` | ✓ | ✓ | – | – | – | – |
| `view_all_*` (opd/submissions/attendance/assets/datasets/reports/performance/surveys) | ✓ | ✓ | ✓ | ✓ | – | – |
| `view_kabupaten_dashboard` / `view_executive_dashboard` / `view_cross_opd_analytics` | ✓ | ✓ | ✓ | ✓ | – | – |
| `executive.view` | ✓ | ✓ | ✓ | ✓ | – | – |
| `executive.approve` | ✓ | – | – | ✓ | – | – |
| `executive.sign` | ✓ | – | – | ✓ | – | – |
| `executive.disposition` | ✓ | – | – | ✓ | – | – |
| `can_manage_users` / `can_manage_roles` / `can_manage_opd` / `can_view_audit_logs` / `can_export_data` | ✓ | – | – | – | – | – |
| `can_manage_forms` / `can_publish_form` / `can_verify_submission` | ✓ | – | – | – | ✓ (override) | – |

*Bupati = pimpinan + `pejabat.pimpinan_type='bupati'`.

## Akses route

| Route | Guard | Role yang dibolehkan |
|---|---|---|
| `/_authenticated/pemda` | `ExecutiveGuard mode="pemda"` | super_admin, admin_pemda |
| `/_authenticated/executive` | `ExecutiveGuard mode="executive"` | super_admin, admin_pemda, pimpinan |
| `/_authenticated/admin/*` | `requirePermission(...)` | sesuai permission per route |
| `/_authenticated/admin/digital-signature` | `executive.sign` | super_admin, Bupati |

## RLS

RLS lama tetap berlaku. Helper SQL baru:
- `public.is_bupati(uid)`
- `public.is_executive(uid)`
- `public.has_permission(uid, code)` — diperluas (lihat di atas)
- `public.get_effective_permissions(uid)` — diperluas

`user_permissions` override per-user tetap menang di atas default role.
