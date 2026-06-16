## Arsitektur baru

```
SIGNUP                          STATUS                              ROLE GRANTED
─────────────────────────────────────────────────────────────────────────────────
warga      → profile + token QR  pending_verification              setelah scan QR oleh admin_desa
asn        → profile (asn meta)  pending_verification              setelah verifikasi admin_opd/super_admin
admin_desa → profile             pending_superadmin_approval       setelah approve super_admin
admin_opd  → profile             pending_superadmin_approval       setelah approve super_admin
```

**Prinsip:** signup TIDAK PERNAH menulis ke `user_roles`. Role hanya ditulis oleh server function approval terotorisasi.

## Migration (satu file)

1. **enum** `verification_status_t` = pending_verification | pending_superadmin_approval | verified | rejected
2. **enum** `asn_type_t` = pns | pppk | pppk_pw (alias kompatibel ke kolom lama `asn_type` text)
3. **profiles** tambah/normalisasi:
   - `requested_role app_role NULL`
   - `verification_status verification_status_t NULL`
   - `verification_method text NULL` (`qr` | `manual` | `superadmin`)
   - `verified_by uuid NULL`, `verified_at` (sudah ada)
   - `rejected_at`, `rejected_by`, `rejection_reason`
   - `alamat text NULL`, `jabatan_id uuid NULL` (FK ke `master_jabatan`)
4. **master_jabatan**: `id, kode, nama, kategori, urutan, aktif` + GRANT + RLS (read: authenticated; write: super_admin/admin_pemda). Seed 9 jabatan default.
5. **warga_verification_token**: `id, user_id UNIQUE, token text UNIQUE, expires_at, used_at, used_by` + GRANT + RLS (insert via service role saja; admin_desa boleh select untuk OPD desanya; user boleh select milik sendiri).
6. **Grandfathering:** `UPDATE profiles SET verification_status='verified'` untuk semua user yang sudah punya baris di `user_roles`. Sisanya `pending_verification`.
7. **`handle_new_user` trigger**: hapus `INSERT INTO user_roles … 'warga'`. Hanya buat baris profile dengan `verification_status='pending_verification'`, `requested_role='warga'`.
8. **`prevent_unverified_role_insert` trigger** di `user_roles`: blok INSERT bila `profiles.verification_status <> 'verified'` (kecuali dilakukan service_role; gunakan setting `app.bypass_verification_guard`).
9. **`fn_approve_user`(`_target, _role, _method`)** SECURITY DEFINER: cek caller berhak (super_admin selalu; admin_pemda untuk admin_opd/admin_desa; admin_opd untuk asn di OPD-nya; admin_desa untuk warga di desanya via QR), lalu insert user_roles + update profile + audit_log.
10. **`fn_verify_warga_by_qr`(`_token`)**: validasi token (belum kedaluwarsa, belum dipakai), pastikan caller admin_desa di desa yg sama, panggil `fn_approve_user` dengan method='qr', tandai token used.
11. **`fn_reject_user`(`_target, _reason`)**: tandai rejected, hapus role bila ada, audit.

## Server functions baru/diubah (`src/lib/`, `src/features/rbac/`)

- `auth-username.functions.ts` (signup) → hapus blok `user_roles` insert; set `requested_role`, `verification_status`. Untuk warga: generate QR token via RPC.
- `registration.functions.ts` → idem; jangan insert ke user_roles, hanya update profile + status.
- `verify.functions.ts` **(baru)**:
  - `listPendingApprovals(role)` super_admin only (admin_opd/admin_desa)
  - `listPendingAsn()` super_admin + admin_opd (scoped)
  - `listPendingWarga()` super_admin + admin_desa (scoped)
  - `approveUser({user_id, role})`, `rejectUser({user_id, reason})`
  - `getMyVerificationStatus()`, `getMyQrToken()` (warga)
  - `verifyWargaByQr({token})` (admin_desa scan)
- `master-jabatan.functions.ts` **(baru)**: list/create/update/delete (super_admin/admin_pemda).

## UI

- `src/routes/pending-verification.tsx` **(baru, public-auth)**: tampil bila login tapi belum verified. Untuk warga: QR besar + instruksi datang ke kantor desa. Untuk lainnya: pesan menunggu approval.
- `src/lib/auth-context.tsx`: tambah `verificationStatus`. Bila bukan `verified`, redirect ke `/pending-verification` (kecuali route auth/pending sendiri).
- `src/routes/_authenticated/admin.approvals.tsx` **(baru)**: tabs Admin Desa / Admin OPD (super_admin); ASN (super_admin & admin_opd); Warga QR (admin_desa & super_admin).
- `src/routes/_authenticated/admin.approvals.scan.tsx` **(baru)**: QR scanner reuse `QrScanner`.
- `src/routes/_authenticated/admin.master-jabatan.tsx` **(baru)**: CRUD.
- Form signup ASN: dropdown `asn_type` (PNS/PPPK/PPPK PW) + dropdown `jabatan_id` dari master.
- Sidebar super_admin: link "Persetujuan Akun" + "Master Jabatan".

## Audit insert ke `user_roles`

Disisir lewat `rg "from\\(\"user_roles\"\\)|INTO user_roles"`. Yang menulis (selain SQL trigger lama yg dihapus):
- `auth-username.functions.ts` → dihapus
- `registration.functions.ts` → dihapus
- `admin.functions.ts` rbac → tetap, tapi panggil `fn_approve_user`
Trigger `prevent_unverified_role_insert` jadi safety net global.

## Security impact

- Tidak ada jalur grant role tanpa caller berstatus super_admin / admin_pemda / admin_opd-scoped / admin_desa-scoped.
- Token QR: 32 byte random, expiry 30 hari, single-use, hanya bisa di-scan admin_desa di desa pemohon.
- Grandfather: tidak ada lockout user lama.
- `prevent_self_role_change` (sudah ada) tetap aktif.

## Deliverables yg saya buat setelah approve

- 1 migration SQL (~300 baris)
- 6 file baru server fn + UI
- Edit ~5 file existing (auth context, signup forms, sidebar, registration fn)
- Laporan singkat di `/mnt/documents/REGISTRATION_REDESIGN_REPORT.md` (ringkasan + checklist test)

## Testing checklist

1. Signup warga → `user_roles` kosong, profile `pending_verification`, token QR ada.
2. Login warga → diarahkan ke `/pending-verification` dgn QR.
3. Admin_desa scan QR (desa benar) → warga jadi verified + role warga muncul.
4. Admin_desa scan QR desa lain → ditolak.
5. Signup asn → tanpa role; admin_opd OPD sama approve → role asn aktif.
6. Admin_opd OPD lain approve asn → ditolak.
7. Signup admin_opd / admin_desa → status `pending_superadmin_approval`; admin_pemda tidak bisa approve admin_opd via path warga; super_admin approve → role aktif.
8. Direct INSERT ke `user_roles` via service-less context → ditolak trigger.
9. Reject flow → status rejected, audit ada.
10. Akun existing (narman, uat_*) tetap login normal.