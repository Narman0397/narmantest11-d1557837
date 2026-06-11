# End-to-End UAT Report

**Mode A (anonim) & Mode B (login)** — simulasi statis berbasis review kode + RLS policy (browser session belum dipakai karena 3 blocker P0 menghalangi flow upload/auth).

## Test Matrix (akun yang seharusnya dibuat)
| Role | Status | Catatan |
|---|---|---|
| warga | belum dibuat | trigger `handle_new_user` otomatis assign role `warga` |
| asn (PNS/PPPK/PPPK-PW) | belum dibuat | kolom `asn_type` ada di `profiles` |
| admin_opd / admin_desa | belum dibuat | `user_roles` insert manual |
| admin_pemda / pimpinan / super_admin | belum dibuat | `prevent_self_role_change` aktif → tidak bisa promote diri sendiri ✅ |

## Modul 1 — Layanan Masyarakat
| Sub | Hasil | Catatan |
|---|---|---|
| daftar layanan (`/layanan`) | ✅ siap | RLS public ok |
| permohonan baru | ⚠️ | flow upload **GAGAL** karena bucket `berkas-permohonan` tidak ada |
| disposisi | ✅ | `submission_dispositions` policy lengkap |
| SLA pause/resume | ✅ | `fn_permohonan_effective_sla_seconds` siap |
| escalation | ✅ | hook `/api/public/hooks/sla-escalation` ada |
| nomor surat | ✅ | `fn_generate_nomor_surat` + sequence per OPD+tahun |
| rating | ✅ | 8 policies |
| IKM | ✅ | `fn_ikm_dashboard` siap |

**Bug ditemukan:** flow upload semua modul terblokir P0 STO-1.

## Modul 2 — Kinerja OPD
- `opd_kinerja_agg`, `opd_kinerja_trend`, `opd_skor_komposit`, `layanan_kinerja_agg`, `opd_kategori_benchmark` — **semua RPC ada & terikat `is_elevated_view`** ✅
- Tidak ditemukan kebocoran lintas-OPD.

## Modul 3 — Absensi ASN
- ASN type (PNS/PPPK/PPPK-PW) sudah ada kolom `asn_type` di `profiles` ✅
- `attendance_rekap_bulanan`, `attendance_compliance`, `attendance_device_alert` siap ✅
- ⚠️ Bucket `absensi-foto` tidak ada → check-in foto **gagal**.
- ✅ `device_fingerprint_hash` alert >1 user/device aktif.

## Modul 4 — Tracking Aset
- Tabel `aset_bast/mutasi/opname/penyusutan/riwayat/verification` lengkap ✅
- `fn_susut_bulanan_run` idempoten per `(aset_id, periode)` ✅
- QR token auto-generated via trigger ✅
- ⚠️ Bucket `aset-foto` tidak ada.

## Modul 5 — Dataset & Modul 6 — Form Builder
- 17 kolom `dataset_template` + alias-sync trigger ✅
- `form_fields`, `form_submissions`, `form_submission_files`, `form_submission_versions`, `form_submission_comment` lengkap ✅
- Migrasi dataset → forms (`migrasi_dataset_ke_forms`) berfungsi ✅
- ⚠️ Bucket `form-uploads` tidak ada → file field rusak.

## Modul 7 — Notification Center
- Producer pakai `supabaseAdmin` + dedupe key ✅
- Reader RLS-scoped per user ✅
- Realtime subscription path ada (`src/lib/realtime/manager.ts`).
- Tidak ada duplicate karena `dedupe_key` di `meta`.

## Modul 8 — RBAC
- `has_role`, `has_permission`, `get_effective_permissions` berfungsi ✅
- `prevent_self_role_change` mencegah privilege escalation ✅
- `user_permissions` mendukung grant/revoke/expires_at + audit `rbac_audit` ✅
- ✅ Tidak ada IDOR pada `riwayat_dengan_petugas` (cek owner + role).

## Modul 9 — Pemda Dashboard
- `executive_summary`, `governance_summary`, `governance_inventory`, `production_health_score` semua gated `is_elevated_view` ✅

## Modul 10 — Pimpinan
- Read-only secara default (tidak ada write policy untuk role `pimpinan` di tabel transaksi) ✅
- Akses dashboard via `is_elevated_view` ✅

## Dead Routes / Missing
- `/asn.scan.$token` ada tetapi `verification_token` lifecycle perlu integrasi penuh (cek manual saat preview).
- `_authenticated/` layout tidak ada → auth gating bergantung pada server fn middleware.
