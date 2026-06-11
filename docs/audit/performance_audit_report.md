# Performance Audit Report

## Skor: 70/100

Pengukuran berdasarkan struktur schema + query pattern di kode (pg_stat_statements belum punya data signifikan karena traffic preview minimal).

## FK Tanpa Index — TOP 30 (semua perlu BTREE index)

Listing dari `pg_constraint` (lebih banyak yang tidak ditampilkan, total 60+):

```
aset_verification_item.opd_id          payroll_periods.opd_id
lokasi_gedung.opd_id                   absensi_asn.opd_id
lokasi_lantai.gedung_id                absensi_asn.user_id
lokasi_ruangan.lantai_id               aset.opd_id
nomor_surat_issued.opd_id              aset.pemegang_user_id
nomor_surat_issued.permohonan_id       aset_riwayat.aset_id
layanan_publik.opd_id                  aset_riwayat.oleh
permohonan.petugas_id                  permohonan_riwayat.oleh
profiles.opd_id                        attendance_shifts.opd_id
attendance_shift_assignment.user_id    attendance_shift_assignment.shift_id
geofence_audit.user_id                 geofence_audit.opd_id
pengajuan_izin.user_id                 pengajuan_izin.opd_id
overtime_requests.user_id              overtime_requests.opd_id
work_schedule.opd_id                   ...
```

**Dampak:** RLS policies yang sering memfilter `opd_id` / `user_id` melakukan seq-scan setiap query.

### Index yang Disarankan (P1)

```sql
CREATE INDEX idx_absensi_user_waktu ON public.absensi_asn(user_id, waktu DESC);
CREATE INDEX idx_absensi_opd_waktu  ON public.absensi_asn(opd_id, waktu DESC);
CREATE INDEX idx_aset_opd           ON public.aset(opd_id);
CREATE INDEX idx_profiles_opd       ON public.profiles(opd_id);
CREATE INDEX idx_permohonan_opd_status ON public.permohonan(opd_id, status, tanggal_masuk DESC);
CREATE INDEX idx_permohonan_pemohon  ON public.permohonan(pemohon_id, tanggal_masuk DESC);
CREATE INDEX idx_form_submissions_form_status ON public.form_submissions(form_id, status);
CREATE INDEX idx_form_submissions_user ON public.form_submissions(user_id, created_at DESC);
CREATE INDEX idx_notif_user_unread ON public.notifications(user_id, dibaca, created_at DESC);
CREATE INDEX idx_pengajuan_user_status ON public.pengajuan_izin(user_id, status);
CREATE INDEX idx_overtime_user_status ON public.overtime_requests(user_id, status);
CREATE INDEX idx_aset_riwayat_aset_tgl ON public.aset_riwayat(aset_id, created_at DESC);
CREATE INDEX idx_audit_log_entitas ON public.audit_log(entitas, entitas_id);
CREATE INDEX idx_rate_limit_hits_window ON public.rate_limit_hits(scope, subject, window_start);
CREATE INDEX idx_dataset_submission_template ON public.dataset_submission(template_id, status);
```

## Potential Hotspot (kode → query)
| # | Lokasi | Pola | Risiko |
|---|---|---|---|
| H-1 | `src/lib/notifications.functions.ts:listMyNotifications` | `select(... count: exact)` per page | OK kalau ada index `(user_id, dibaca, created_at)` |
| H-2 | `src/lib/queries.dashboard.ts` | multiple agg RPC | Sudah pakai RPC, OK |
| H-3 | `riwayat_dengan_petugas` | `LEFT JOIN auth.users` | OK (kecil) |
| H-4 | `opd_skor_komposit` | CTE multi-pass + AVG | Bisa heavy di scale; cache 5 menit |
| H-5 | Realtime channel di `src/lib/realtime/manager.ts` | tidak ada explicit `removeChannel` cleanup verifikasi | Cek leaking sub |

## N+1 yang Dicurigai
- Tidak ditemukan via grep — sebagian besar fetch sudah join atau ambil `.in()`. ✅

## VACUUM/ANALYZE
Tidak ada auto-vacuum tuning custom. Untuk tabel high-write (`absensi_asn`, `notifications`, `audit_log`, `rate_limit_hits`) tambahkan reloption `autovacuum_vacuum_scale_factor=0.05` setelah live.

## Rekomendasi Prioritas
1. P1: 15 index di atas — estimasi <2 menit migrasi, dampak besar.
2. P2: Cache `opd_skor_komposit` di memori (router context) selama 5 menit.
3. P3: Aktifkan slow query monitoring (gunakan tool `supabase--slow_queries`) seminggu sekali.
