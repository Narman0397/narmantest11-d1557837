# Role: Pimpinan & Bupati

Implementasi: role enum `pimpinan` + atribut `pejabat.pimpinan_type='bupati'`. Bupati BUKAN role enum terpisah (keputusan: tetap subtipe pimpinan supaya backward compatible).

## Pimpinan (umum)
**Hak akses default:**
- Seluruh `view_*` (lintas OPD)
- `view_executive_dashboard`, `view_cross_opd_analytics`
- `executive.view`
**Read-only.** Tidak boleh tulis operasional/sistem.

## Bupati (pimpinan + `pimpinan_type='bupati'`)
Tambahan di atas pimpinan biasa:
- `executive.approve` — persetujuan dokumen tingkat pimpinan
- `executive.sign` — penandatanganan digital
- `executive.disposition` — disposisi surat

## Tidak boleh (semua pimpinan termasuk Bupati)
- Menghapus data operasional
- Mengubah konfigurasi sistem
- Mengubah permission/role

## Cara mengangkat Bupati
1. Pastikan user punya role `pimpinan` (`user_roles`).
2. Insert/update `public.pejabat` dengan `user_id=<uid>`, `pimpinan_type='bupati'`, `aktif=true`.
3. `is_bupati(uid)` akan return true → permission `executive.*` aktif otomatis via `has_permission`.

## Route
- `/_authenticated/executive` — dashboard utama (semua pimpinan)
  - Panel "Antrean Bupati" hanya muncul bila `isBupati=true`.
- `/_authenticated/admin/digital-signature` — link sidebar tambahan untuk Bupati.

## Kode terkait
- `src/lib/auth-context.tsx` — `isBupati`, `pimpinanType`
- `src/features/rbac/guards.ts` — `AuthzContext.isBupati`
- `src/components/admin/AdminShell.tsx` — `bupatiExtraNav`
- SQL: `public.is_bupati(uid)`
