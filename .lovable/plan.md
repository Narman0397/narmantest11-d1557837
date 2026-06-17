# Materi Presentasi Klien Pemda — Penjelasan Menu Super Admin

Dokumen ini disusun sebagai naskah presentasi (talking points) untuk menjelaskan setiap menu pada Dashboard Admin (role Super Admin) sesuai 3 screenshot yang diunggah. Bahasa ditujukan untuk audiens non-teknis (Pimpinan Pemda, Sekda, Kepala OPD).

---

## 0. Pembuka (30 detik)

> "Dashboard Admin adalah pusat kendali seluruh ekosistem layanan digital Pemda — mulai dari data pegawai, layanan publik, aset, hingga laporan eksekutif. Akses Super Admin memiliki visibilitas penuh lintas OPD dengan pengamanan berlapis (RLS + audit log)."

Filter **"Semua OPD"** di atas menu = lensa data. Super Admin dapat memfilter tampilan per OPD atau melihat agregat seluruh Pemda.

---

## 1. SECTION: Dashboard
- **Dashboard** — Ringkasan eksekutif harian: jumlah pengguna aktif, permohonan masuk, SLA layanan, kehadiran ASN real-time, status sistem. *Pintu masuk utama setelah login.*

## 2. SECTION: Pengguna & Organisasi
- **Pengguna & Hak Akses** — Manajemen seluruh akun (warga, ASN, admin). Tetapkan role & permission granular. Mendukung audit jejak perubahan hak akses.
- **Persetujuan Akun** — Antrian approval registrasi baru. Tidak ada role aktif sebelum disetujui (mencegah privilege escalation). Admin OPD menyetujui ASN-nya, Admin Desa menyetujui warga desanya.
- **Master Jabatan** — Referensi jabatan struktural & fungsional (Kepala Dinas, Kasubag, Staf, dst.) yang dipakai saat registrasi ASN.
- **OPD** — Master data Organisasi Perangkat Daerah (nama, singkatan, kepala, kontak).
- **Desa** — Master data desa/kelurahan untuk segmentasi layanan warga.
- **Pejabat** — Pencatatan pejabat aktif termasuk penanda khusus *Bupati* (untuk hak tanda tangan & disposisi eksekutif).
- **Verifikasi Akun (QR)** — Verifikasi warga via QR code di kantor desa/kecamatan, alternatif approval manual.

## 3. SECTION: Layanan Publik
- **Jenis Layanan** — Katalog layanan publik (surat keterangan, izin, rekomendasi). Atur OPD penanggung jawab, persyaratan, SLA, biaya.
- **Pengaduan Masyarakat** — Inbox pengaduan + alur disposisi, eskalasi otomatis bila SLA terlewati.
- **Rating & Evaluasi** — Survei kepuasan (IKM) warga atas tiap layanan; dashboard skor per OPD.

## 4. SECTION: ASN
- **Data ASN** — Database pegawai (PNS/PPPK/Non-ASN) lengkap dengan NIP, jabatan, OPD.
- **Kepatuhan Kehadiran** — Monitoring absensi harian, keterlambatan, ketidakhadiran lintas OPD; integrasi shift & lokasi.
- **Persetujuan Izin/Cuti** — Workflow pengajuan & approval izin/cuti berjenjang.
- **Hari Libur** — Master kalender libur nasional & cuti bersama (mempengaruhi perhitungan kehadiran & SLA).
- **Form Builder** — Pembuatan formulir dinamis (cuti, tugas luar, survey internal) tanpa coding.
- **Review Submission** — Tinjauan & approval data masuk dari form builder.

## 5. SECTION: Aset
- **Data Aset** — Inventaris Barang Milik Daerah (BMD): KIB A–F, lokasi, kondisi, nilai.
- **Mutasi & Pemeliharaan** — Catatan perpindahan aset antar-OPD, BAST, jadwal pemeliharaan, dan penyusutan.

## 6. SECTION: Konten Website
- **Berita & Halaman** — CMS untuk portal publik Pemda (berita, pengumuman, halaman statis "Tentang", "Kontak").

## 7. SECTION: Pemda & Eksekutif
- **Dashboard Pemda** — Tampilan operasional lintas OPD untuk Admin Pemda (KPI agregat, monitoring SLA).
- **Dashboard Eksekutif** — Read-only untuk Pimpinan: indikator strategis kabupaten (kependudukan, layanan, kinerja OPD).
- **Pimpinan (Detail)** — Drill-down per indikator + antrean dokumen menunggu tanda tangan Bupati.

## 8. SECTION: Data & Laporan
- **Pelaporan Data** — Generator laporan periodik (bulanan/triwulan/tahunan) lintas modul, export Excel/PDF.

## 9. SECTION: Data Governance
- **Nomor Surat** — Penomoran otomatis surat resmi per OPD/jenis surat, mencegah duplikasi.
- **Log Verifikasi** — Jejak audit setiap proses verifikasi akun/dokumen (siapa, kapan, hasil) untuk kebutuhan audit BPK/Inspektorat.
- **Tanda Tangan Digital** — Modul TTE tersertifikasi: upload dokumen → hash → tanda tangan Bupati/Kepala OPD → QR verifikasi publik di `/v/{token}`.

---

## 10. Penutup Presentasi (30 detik)

Tekankan 3 nilai jual:
1. **Tata kelola terpusat** — satu portal untuk warga, ASN, dan pimpinan.
2. **Keamanan berlapis** — RLS database, audit log, approval bertingkat, TTE.
3. **Skalabel & modular** — OPD/desa baru ditambahkan tanpa rilis ulang.

---

## Catatan Penyajian
- Durasi target: **15–20 menit** untuk seluruh menu (≈30 detik/menu).
- Saat demo: buka filter "Semua OPD" → tunjukkan satu menu per section sebagai contoh (rekomendasi: Persetujuan Akun, Kepatuhan Kehadiran, Dashboard Eksekutif, Tanda Tangan Digital).
- Output bisa saya ekspor jadi file `.md` di `/mnt/documents/` jika disetujui.

---

**Apakah saya buatkan juga versi file Markdown siap-cetak (PDF-friendly) di `/mnt/documents/presentasi-superadmin.md`?**
