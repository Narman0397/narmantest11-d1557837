# DB ↔ TypeScript Sync Report

## Skor: 92/100

## Snapshot
- **Tabel public:** 83
- **Tabel tanpa RLS:** 0 ✅
- **Tabel tanpa policy:** 0 ✅
- **Enum public:** 14 (`app_role`, `bast_status`, `checklist_status`, `izin_jenis`, `izin_status`, `job_status`, `metode_susut`, `mutasi_status`, `retry_status`, `shift_jenis`, `sla_event_type`, `status_permohonan`, `submission_status`, `uat_result_status`)
- **RPC public:** 48
- **Index total:** ≥80
- **FK tanpa index:** 30+ (lihat performance report)

## Types.ts Status
File `src/integrations/supabase/types.ts` di-regenerate setiap migrasi. Verifikasi:
- Tidak ada `Database = any` di kode (grep clean) ✅
- RPC `aset_compliance`, `aset_due_warranty`, `fn_susut_bulanan_run`, `attendance_compliance`, `attendance_device_alert` muncul ✅
- Enum `app_role` punya 7 nilai sesuai DB ✅

## Orphan / Dead Object Check

| Object | Status |
|---|---|
| Trigger orphan | tidak ditemukan (semua trigger merujuk fungsi yang ada) |
| Function tak terpakai | `_lovable_exec_sql` (migrasi-only) — pertimbangkan drop pasca-go-live |
| Duplicate policy | tidak ditemukan |
| View | tidak ada SECURITY DEFINER view → aman |

## Cross-check: Kolom yang Sering Direferensi Kode
| Kolom | Status |
|---|---|
| `profiles.asn_type` | ✅ exists |
| `aset.lifecycle_status`, `garansi_sampai`, `kalibrasi_berikut`, `metode_susut`, `umur_ekonomis_bulan` | ✅ |
| `permohonan.sla_paused_at`, `sla_total_pause_seconds`, `nomor_surat`, `tenggat` | ✅ |
| `forms.opd_pemilik_id`, `deadline`, `target_value`, `target_scope`, `target_opd_ids` | ✅ |
| `absensi_asn.device_fingerprint_hash`, `is_late`, `late_minutes`, `tipe` | ✅ |
| `dataset_template.kode`, `opd_pemilik_id`, `allow_multiple_submit` | ✅ |

## Rekomendasi
1. **P2** drop `_lovable_exec_sql` setelah seluruh migrasi setup beres.
2. **P3** Tambahkan comment SQL pada semua tabel & kolom kritis untuk dokumentasi.
3. **P3** Jalankan `supabase--linter` rutin di CI.

## Synchronization Verdict
DB schema dan `types.ts` **selaras**. Hanya beberapa polish dokumentasi & cleanup.
