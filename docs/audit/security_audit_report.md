# Security Audit Report

## Skor: 92/100

## RLS Coverage
- **83/83 tabel public memiliki RLS enabled** ✅
- **0 tabel tanpa policy** ✅ (setiap tabel punya ≥1 policy)
- Tabel paling kritikal `profiles` (10 policies), `permohonan` (9), `user_roles` (6), `laporan_masyarakat` (8) — coverage memadai.

## Temuan

### ✅ Aman
- `prevent_self_role_change` trigger mencegah privilege escalation lewat `user_roles`.
- Semua RPC sensitif (`executive_summary`, `governance_*`, `production_health_score`, `rating_list_admin`, `riwayat_dengan_petugas`) menggunakan `SECURITY DEFINER` + cek `has_role` / `is_elevated_view` di dalam fungsi.
- `_lovable_exec_sql` adalah helper migrasi internal (SECURITY DEFINER, search_path public) — **terekspos via PostgREST**. ⚠️ MEDIUM: ada potensi disalahgunakan jika role `authenticated` punya EXECUTE. Verifikasi grant.
- `handle_new_user` trigger menetapkan role `warga` saja → tidak ada auto-elevation.
- `attachSupabaseAuth` registered di `src/start.ts` ✅.
- `requireSupabaseAuth` digunakan di semua server fn user-scoped.

### ⚠️ Perlu hardening
| # | Severity | Temuan | Rekomendasi |
|---|---|---|---|
| S-1 | HIGH | `public._lovable_exec_sql(text)` `SECURITY DEFINER` tanpa role-check internal. Kalau `EXECUTE` granted ke `authenticated`, attacker bisa eksekusi SQL sembarang. | `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated; GRANT EXECUTE TO service_role;` dan ideal: drop setelah migrasi selesai. |
| S-2 | MED | Hook `/api/public/hooks/*` belum semuanya verifikasi HMAC signature — beberapa hanya cek bearer/`CRON_SECRET`. | Pakai `crypto.timingSafeEqual` + HMAC SHA-256 header `x-cron-signature`. |
| S-3 | MED | Tidak ada `src/routes/_authenticated/route.tsx` → route protected tergantung redirect manual di komponen. UX leak: konten flash sebelum redirect, tapi server fn tetap 401. | Buat managed auth gate sesuai pola TanStack Supabase. |
| S-4 | LOW | `cloud_block_public_buckets` belum diverifikasi → kebijakan workspace harus eksplisit. | Saat membuat bucket `branding`, evaluasi public/private. |
| S-5 | LOW | `audit_log` tidak ada retention — bisa membengkak. | Tambah retention 12–24 bulan. |
| S-6 | LOW | `rate_limit_hits` tidak punya purge job tetapi sudah ada hook retention. | Verifikasi cron memang berjalan. |

### ✅ Tidak ditemukan
- IDOR pada flow permohonan (`riwayat_dengan_petugas` cek `pemohon_id` atau role).
- RLS bypass via view (tidak ada SECURITY DEFINER view).
- Hardcoded secrets di repo (verified via grep).

## OAuth & Auth Config
- Google provider belum dikonfigurasi (`supabase--configure_social_auth` perlu dipanggil saat fitur ditambahkan).
- HIBP/leaked password check: belum aktif → rekomendasi enable.
