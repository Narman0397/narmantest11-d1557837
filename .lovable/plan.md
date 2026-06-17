## Masalah
Di `/admin/asn-kepatuhan`, saat tab "Dashboard Hari Ini" dibuka, muncul toast error Zod: `invalid_type expected object received undefined`.

Penyebab: di `src/routes/_authenticated/admin.asn-kepatuhan.tsx` (fungsi `reload`), pemanggilan server function `listSchedules()` dan `listShifts()` tidak menyertakan argumen `{ data: ... }`. Kedua server function tersebut memiliki `.inputValidator(...)` yang `z.object({...}).parse(input)`, sehingga `input === undefined` → ZodError → ditangkap `catch` dan ditampilkan sebagai toast.

`opdAttendanceToday({ data: { opd_id: null } })` sudah benar dan dibungkus `.catch(() => null)`, jadi bukan sumber error.

## Perbaikan
File: `src/routes/_authenticated/admin.asn-kepatuhan.tsx`

Ubah pemanggilan menjadi:
```ts
const s = await listSchedules({ data: {} });
const sh = await listShifts({ data: {} });
```

Itu saja — fix minimal, hanya menyesuaikan kontrak input server function. Tidak ada perubahan UI/logika lain.

## Verifikasi
- Buka `/admin/asn-kepatuhan` sebagai super_admin → tab Dashboard Hari Ini load tanpa toast error, kartu Total ASN / Hadir / Terlambat / Belum Hadir tampil.
- Tab Jadwal & Shift tetap memuat daftar.
