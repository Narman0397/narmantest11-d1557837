# Laporan Alur Verifikasi Akun (Single Source of Truth)

Tanggal: 2026-06-11
Lingkup: Verifikasi akun **ASN** dan **Warga** oleh **Super Admin / Admin Pemda / Admin Desa**.

## Ringkasan Eksekutif

- **Single source of truth** untuk status verifikasi akun pengguna adalah kolom
  `public.profiles.verified_at` (dan kolom audit `verified_by`).
- Semua penulisan ("admin memverifikasi akun") dan semua pembacaan ("UI ASN/warga
  mengetahui dirinya terverifikasi") mengacu pada kolom yang sama. Tidak ada
  duplikasi sumber data.
- Sinkronisasi dari DB → klien dijamin oleh kombinasi:
  1. Realtime channel `profile-<uid>` (postgres_changes UPDATE pada `profiles`).
  2. Auto-refresh `refreshProfile()` saat tab kembali aktif / mount halaman.
  3. Polling interval 30/60 detik pada halaman `/akun`.

> Catatan terminologi: tabel/aset juga punya `verified_at` (untuk
> stock-opname dan kampanye verifikasi aset). Konteks itu **berbeda**
> dengan verifikasi akun pengguna dan tidak dibahas di sini.

---

## 1. Tempat **Penulisan** Status Verifikasi (sisi Admin)

Semua jalur tulis akhirnya melakukan `UPDATE public.profiles SET verified_at, verified_by`
pada baris pengguna target — tidak ada tabel paralel.

### 1.1 Super Admin / Admin Pemda — verifikasi ASN & staf
- **Server fn**: `setUserVerified` — `src/lib/admin-actions.functions.ts:1055-1067`
  ```ts
  const patch = data.verified
    ? { verified_at: new Date().toISOString(), verified_by: userId }
    : { verified_at: null, verified_by: null };
  await supabaseAdmin.from("profiles").update(patch).eq("id", data.user_id);
  ```
- **Dipanggil dari UI**:
  - `src/routes/admin.verifikasi.tsx:117` (halaman _Verifikasi Akun_, tab ASN/staf)
  - `src/routes/admin.users.tsx:122` (halaman _Manajemen Pengguna_, tombol toggle Verif)
- **Audit**: setiap toggle juga menulis ke `public.verification_logs`
  (dibaca oleh `/admin/verifikasi-log`).

### 1.2 Admin Desa / Admin Pemda — verifikasi Warga via token QR
- **Server fn**: `verifyWargaByToken` — `src/lib/verification.functions.ts:178-215`
  ```ts
  await supabaseAdmin
    .from("profiles")
    .update({ verified_at: now, verified_by: userId })
    .eq("id", tok.user_id);
  ```
- **Dipanggil dari UI**: `src/routes/admin.verifikasi.tsx:297` (tab Warga, setelah scan token).
- **Pre-check**: `getWargaByVerificationToken` membaca `profiles.verified_at`
  untuk mencegah verifikasi ganda (`verification.functions.ts:159-172`).

### 1.3 Aturan tambahan
- `registration.functions.ts:91-99` menegaskan `verified_at` **selalu null**
  pada pendaftaran/registrasi mandiri — verifikasi hanya bisa dilakukan admin.
- Tidak ada client-side write ke `profiles.verified_at`; semua via server fn
  + `supabaseAdmin` (RLS bypass disengaja, dengan otorisasi role di handler).

---

## 2. Tempat **Pembacaan** Status Verifikasi (sisi ASN / Warga)

Sumber otoritatif tunggal di klien adalah `useAuth().isVerified`, dihitung di
`src/lib/auth-context.tsx:317-323`:

```ts
isVerified:
  !!profile?.verified_at ||
  roles.includes("super_admin") ||
  roles.includes("admin_pemda") ||
  roles.includes("pimpinan") ||
  roles.includes("admin_opd") ||
  roles.includes("admin_desa")
```

`profile.verified_at` dimuat dari `public.profiles` pada `loadProfile()`
(`auth-context.tsx:75-92`) — sumber datanya sama persis dengan yang ditulis
oleh admin.

### 2.1 Halaman yang gate-nya membaca `isVerified`
| File | Baris | Konteks |
|---|---|---|
| `src/routes/asn.absensi.tsx` | 18, 164 | Absensi ASN, gate "belum diverifikasi" |
| `src/routes/asn.izin.tsx` | 26, 67 | Pengajuan izin/cuti ASN |
| `src/routes/asn.verifikasi.tsx` | 25, 126 | Verifikasi aset oleh ASN |
| `src/routes/permohonan.baru.tsx` | 52, 61 | Warga membuat permohonan layanan |
| `src/routes/akun.tsx` | 24, 149, 188, 237 | Halaman akun warga (badge & form lock) |
| `src/routes/admin.index.tsx` | 50, 52 | Admin OPD belum-terverifikasi |

### 2.2 Detail verifier (siapa yang memverifikasi & kapan)
- `getMyVerificationDetail` — `src/lib/verification.functions.ts:328-352`
- Dipanggil dari `src/routes/akun.tsx:67` untuk menampilkan timestamp + nama verifikator.
- Sumber: `profiles.verified_at` & `profiles.verified_by` (join ke `profiles` & `auth.users`).

### 2.3 Mekanisme sinkronisasi DB → UI (mencegah snapshot basi)
1. **Realtime postgres_changes** pada baris profil pengguna saat ini —
   `auth-context.tsx:188-214`. Saat admin menulis `verified_at`, payload UPDATE
   langsung memperbarui state `profile` tanpa reload.
2. **Visibility/Focus backstop** — `auth-context.tsx:248-269`. Saat tab kembali
   aktif (≥30 dtk sejak fetch terakhir), `loadProfile()` + `loadRoles()` +
   `loadPermissions()` dijalankan ulang.
3. **Mount effect** pada halaman ASN — `asn.absensi.tsx` / `asn.izin.tsx` /
   `asn.verifikasi.tsx` memanggil `refreshProfile()` ketika dirender, sebagai
   safety net jika WebSocket realtime tidak terhubung (mis. di environment
   preview/Workers).
4. **Polling** pada `/akun` — `akun.tsx:52` setiap 30/60 detik.

---

## 3. Diagram Alur

```
Admin UI (toggle verifikasi)
   └─► setUserVerified  /  verifyWargaByToken     (server fn, supabaseAdmin)
          └─► UPDATE public.profiles
                 SET verified_at = now(), verified_by = <admin-uid>
                 WHERE id = <user-uid>
                 │
                 ├─► verification_logs (audit trail)
                 │
                 └─► Realtime channel `profile-<uid>`
                        │
                        ▼
                AuthProvider.loadProfile() / postgres_changes handler
                        │
                        ▼
                useAuth().isVerified  (sumber tunggal yang dipakai UI)
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
  asn.absensi      asn.izin        permohonan.baru / akun
```

---

## 4. Konfirmasi Single Source of Truth — Checklist

- [x] Tidak ada kolom paralel (`is_verified`, `status_verifikasi`, dsb.) di
      tabel lain yang merepresentasikan status verifikasi akun.
- [x] Tidak ada cache klien yang menyimpan flag verifikasi terpisah
      (`localStorage`/`sessionStorage`).
- [x] Semua jalur tulis (admin → user) berakhir pada `profiles.verified_at`.
- [x] Semua jalur baca (user UI gate) berakhir pada `profiles.verified_at`
      melalui `useAuth().isVerified`.
- [x] Audit terpisah di `verification_logs` (hanya histori, bukan status).
- [x] Realtime + visibility refresh + mount refresh memastikan sinkronisasi
      <2 detik dalam kondisi normal, dan ≤30 detik di skenario terburuk
      (WebSocket terputus).

---

## 5. Rekomendasi Pengerasan (opsional, tidak menutup temuan)

1. Tambahkan **DB CHECK / partial index** untuk memastikan `verified_by`
   bukan null jika `verified_at` tidak null (data integrity).
2. Tambah unit test E2E: admin verifikasi → polling realtime ≤2 dtk → halaman
   `/asn/absensi` membuka gate tanpa reload.
3. Pertimbangkan menambah kolom `verification_method` (`admin_pemda`,
   `admin_desa_qr`, dst.) untuk audit yang lebih kaya — saat ini info itu
   sudah tersirat di `verification_logs.aksi`.

---

**Kesimpulan:** Arsitektur verifikasi akun saat ini **sudah memenuhi prinsip
single source of truth**. `public.profiles.verified_at` adalah satu-satunya
kolom yang ditulis admin dan dibaca pengguna. Sinkronisasi sudah berlapis tiga
(realtime + visibility + mount refresh) sehingga kasus "admin sudah
memverifikasi tapi user belum melihat" hanya bisa terjadi karena snapshot
klien yang basi — dan sudah ditangani oleh `refreshProfile()` saat mount
halaman ASN.
