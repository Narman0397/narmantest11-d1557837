
# Rencana Implementasi Modul Digital Signature

Modul ini menambah sistem tanda tangan digital internal pemerintah (bukan BSrE) dengan SHA-256 integrity, QR verification token, audit trail immutable, dan hybrid PDF (system-generated + upload manual). Diintegrasikan penuh ke arsitektur bs12-main yang sudah ada: TanStack Start, Supabase, RBAC `permissions`/`user_permissions`, audit_log, storage hybrid (Supabase + R2 via provider), dan design system existing. **Tidak ada modul baru paralel — semua mengacu pada helper, auth context, dan UI kit yang sudah ada.**

## 1. Database Migration (Supabase)

Satu migration besar mencakup tables + indexes + FK + RLS + GRANT + policies.

**Tabel baru (public):**

- `digital_signatures` — spesimen TTD per user
  - `id`, `user_id` → auth.users, `signature_path` (storage path di bucket `signatures`), `is_active`, `created_at`, `revoked_at`
  - Unique partial index: satu spesimen aktif per user.

- `signing_certificates` — sertifikat internal
  - `id`, `user_id`, `nip`, `full_name`, `position`, `issued_at`, `expired_at`, `public_key` text, `is_active`.

- `documents` — registry dokumen
  - `id`, `title`, `document_type` text, `generated_by_system` bool, `source_module` text (permohonan/asn-izin/asset-bast/manual), `source_ref_id` uuid, `file_path` text (storage path), `opd_id`, `created_by`, `created_at`.

- `signed_documents` — registry penandatanganan
  - `id`, `document_id` → documents, `document_hash` text (SHA-256 hex), `verification_token` text unique (32+ hex, crypto-random), `signed_by`, `signed_at`, `status` (`draft|signed|revoked|expired`), `signed_file_path`, `verification_count` int default 0, `revoked_at`, `revoke_reason`.
  - Index unique `verification_token`, index `document_hash`.

- `document_audit` — append-only audit per dokumen
  - `id`, `document_id`, `action` (`GENERATED|UPLOADED|SIGNED|VIEWED|VERIFIED|DOWNLOADED|REVOKED`), `actor` uuid null (null untuk public verify), `metadata` jsonb, `ip_hash` text, `user_agent` text, `created_at`.
  - Tidak ada `UPDATE`/`DELETE` policy → immutable.

**RLS:**

- Setiap tabel: `ENABLE RLS` + `GRANT SELECT,INSERT,UPDATE,DELETE TO authenticated; GRANT ALL TO service_role`.
- Owner read/write via `auth.uid()`.
- Admin lintas via `has_role(auth.uid(),'super_admin')`, `has_role(...,'admin_pemda')`, `has_role(...,'admin_opd')` dengan filter `opd_id = get_user_opd(auth.uid())`.
- `document_audit`: INSERT untuk authenticated + service_role, SELECT untuk owner & admin, **tidak ada policy UPDATE/DELETE**.
- `signed_documents` public verify: tidak boleh via RLS langsung — verifikasi dilakukan via server fn yang membaca pakai `supabaseAdmin` dan hanya mengembalikan kolom non-sensitif.

**Permissions seed** (`INSERT INTO permissions`):
`digital_signature.view`, `.create`, `.sign`, `.verify`, `.revoke`, `.admin`.

## 2. Storage Buckets

Empat bucket private (semua via `supabase--storage_create_bucket`, `public:false`):

- `signatures` — spesimen PNG TTD (≤ 200 KB, image/png)
- `documents` — file sumber (PDF unsigned)
- `signed-documents` — PDF final dengan QR + metadata
- `verification-assets` — kop surat / template PDF (read-only via signed URL)

RLS pada `storage.objects` lewat migration: owner-folder pattern (`auth.uid()::text = (storage.foldername(name))[1]`) + admin override via `has_role`. `signed-documents` hanya readable via signed URL yang dibuat server fn `getSignedDocumentUrl` (rate-limited).

## 3. Types Regeneration

Setelah migration approved & dijalankan, `src/integrations/supabase/types.ts` di-regenerate otomatis — semua kode di Step 4-7 ditulis SETELAH migration jalan supaya tipe baru tersedia.

## 4. Feature Module — `src/features/digital-signature/`

```
features/digital-signature/
├── types/index.ts                  # Domain types (re-export Database row + DTO)
├── services/
│   ├── hash.service.ts             # SHA-256 (WebCrypto, isomorphic)
│   ├── qr.service.ts               # qrcode → PNG bytes; embed URL builder
│   ├── pdf.service.ts              # pdf-lib: stamp QR + metadata block ke PDF
│   ├── signature.service.ts        # CRUD spesimen TTD + sertifikat
│   ├── document.service.ts         # CRUD documents (Mode A + Mode B)
│   ├── verification.service.ts     # token gen, lookup, hash compare
│   └── audit.service.ts            # insert document_audit (server)
├── functions/                      # createServerFn entrypoints
│   ├── signatures.functions.ts     # upload spesimen, list, activate, revoke
│   ├── certificates.functions.ts   # issue/revoke sertifikat internal
│   ├── documents.functions.ts      # generateSystemDocument, uploadManualDocument
│   ├── sign.functions.ts           # signDocument (hash + QR + stamp + persist)
│   ├── verify.functions.ts         # verifyByToken (PUBLIC, no auth), verifyByUpload
│   └── audit.functions.ts          # listDocumentAudit
├── hooks/
│   ├── useDigitalSignatures.ts
│   ├── useSignedDocuments.ts
│   └── useDocumentAudit.ts
├── components/
│   ├── SignatureCanvas.tsx         # react-signature-canvas wrapper
│   ├── SignatureUploader.tsx       # spesimen PNG manager
│   ├── DocumentSignButton.tsx      # tombol "Tandatangani" yg di-reuse modul lain
│   ├── DocumentVerifyCard.tsx      # tampilan VALID/INVALID utk /verify
│   ├── DocumentAuditTable.tsx
│   └── CertificateForm.tsx
├── pdf/
│   ├── templates/                  # template PDF system-generated
│   │   ├── surat-tugas.tsx
│   │   ├── surat-cuti.tsx
│   │   ├── surat-keterangan.tsx
│   │   ├── bast.tsx
│   │   └── berita-acara.tsx
│   └── stamp.ts                    # tempel QR + footer ke PDF (pdf-lib)
└── index.ts                        # public API barrel
```

**Service implementasi singkat:**

- `hash.service.ts`: `sha256Hex(Uint8Array)` via `crypto.subtle.digest("SHA-256", ...)` — sudah ada pola di `dokumen-final.functions.ts`, di-extract jadi service reusable.
- `qr.service.ts`: `generateQrPng(url): Promise<Uint8Array>` via `qrcode` (sudah dipakai project, tidak perlu install).
- `pdf.service.ts`: `stampSignature(pdfBytes, { qrPng, signerName, nip, position, nomor, signedAt, verifyUrl, signaturePng? }) → Uint8Array` via `pdf-lib` (sudah dipakai project).
- `verification.service.ts`: token = 32 byte hex via `crypto.getRandomValues`.

**Tidak ada business logic di route file** — route hanya orchestrate.

## 5. Server Functions (createServerFn)

Semua di `src/features/digital-signature/functions/*.functions.ts`, menggunakan `requireSupabaseAuth`, kecuali `verifyByToken` yang public (di server-route, lihat Step 7).

Permission check pakai `has_permission(userId, code)` RPC yang sudah ada — TIDAK membuat sistem permission baru.

Setiap aksi memanggil `audit.service.insertDocumentAudit({...})` dan `audit_log` (sistem audit existing) — dua-duanya, sesuai aturan "reuse audit existing".

## 6. RBAC Integration

- Tambah permission codes ke `permissions` table via migration (Step 1).
- Auto-grant `digital_signature.*` ke `super_admin`/`admin_pemda` (sudah otomatis via `get_effective_permissions` untuk super_admin).
- UI guards pakai `useHasPermission()` dari `src/features/rbac/hooks.ts` — pola sama dengan modul existing.

## 7. Routes (TanStack Start)

**Admin routes** (di bawah pola admin existing, gunakan `AdminGuard`):

- `src/routes/admin.digital-signature.tsx` — layout (Outlet)
- `src/routes/admin.digital-signature.index.tsx` — dashboard (counts: dokumen ditandatangani, verifikasi 30 hari, spesimen aktif)
- `src/routes/admin.digital-signature.signatures.tsx` — kelola spesimen TTD + sertifikat
- `src/routes/admin.digital-signature.documents.tsx` — daftar dokumen + filter
- `src/routes/admin.digital-signature.audit.tsx` — audit trail global

**ASN route:**

- `src/routes/asn.dokumen.tsx` — daftar dokumen miliknya, tombol upload (Mode B), tombol sign.

**Public verification:**

- `src/routes/verify.$token.tsx` — VALID/INVALID + metadata + button "Verifikasi Ulang dengan Upload".
- `src/routes/api/public/verify-upload.ts` — server route POST: terima file, hitung hash, bandingkan ke `signed_documents.document_hash`, kembalikan match/mismatch (rate-limited via `rate_limit_increment` existing).

`verify.$token.tsx` memanggil server fn `verifyByToken` (juga public — pakai `createServerFn` tanpa middleware, baca via `supabaseAdmin` import di-handler, increment `verification_count`, insert audit `VERIFIED`).

Route registration otomatis via TanStack file-based routing — tidak perlu edit `routeTree.gen.ts`.

## 8. Navigation Menu

Update `src/components/admin/AdminShell.tsx` (atau file sidebar existing) — tambah item "Tanda Tangan Digital" di section admin, visible jika `has_permission(digital_signature.view)`. Tambah "Dokumen Saya" di ASN nav.

## 9. Notification

Setelah `signDocument` sukses → panggil `notifications.functions.ts` (existing) untuk kirim notifikasi ke `signed_by` dan `created_by`. Push notification via mekanisme `push_subscription` existing jika tersedia.

## 10. Integrasi Lintas Modul (Mode A sumber data)

Tombol "Tandatangani" muncul di:

- `admin.permohonan.$id` → generate Surat Keluar dari permohonan (sudah ada `dokumen-final.functions.ts`, **refactor**: pindahkan generate ke `pdf.service.stampSignature` + simpan ke `signed_documents` bukan `dokumen_verifikasi` lama). `dokumen_verifikasi` tetap ada untuk backward compat, view baru di-prefer.
- `asn.izin` → generate Surat Cuti
- `admin.aset.bast` → generate BAST

Tabel `dokumen_verifikasi` lama TIDAK dihapus (data legacy), tapi semua flow baru pakai `signed_documents`.

## 11. Dependencies

Cek + install jika belum:

- `pdf-lib` ✅ sudah
- `qrcode` ✅ sudah (dipakai di `dokumen-final.functions.ts`)
- `react-signature-canvas` — **perlu install** (`bun add react-signature-canvas @types/react-signature-canvas`)

## 12. Build & Type Validation

Setelah implementasi: build dan typecheck dijalankan otomatis oleh harness. Tidak ada `any`, `@ts-ignore`, atau TODO. Strict mode kompatibel.

## Catatan Teknis Penting

- **Cloudflare Workers compat:** `pdf-lib` + `qrcode` + WebCrypto SHA-256 sudah terbukti jalan (lihat `dokumen-final.functions.ts`). `react-signature-canvas` hanya client-side (dipakai di komponen `"use client"` setara — di TanStack Start, hanya di-render di komponen non-loader).
- **`supabaseAdmin` selalu di-import di dalam handler** (`await import(...)`) sesuai aturan project — tidak top-level di `.functions.ts`.
- **Public verify endpoints** tidak pakai `requireSupabaseAuth`, hash-compare PDF upload dibatasi rate limit + max 20MB.
- **Audit trail immutable**: hanya policy INSERT + SELECT, tidak ada UPDATE/DELETE policy → service_role pun tidak bisa hapus via API (kecuali raw SQL).
- **Single source of truth verifikasi**: status valid hanya berdasar `signed_documents.status='signed'` + hash match + token belum revoked.

## Urutan Eksekusi

1. Migration (tables + RLS + GRANT + permissions seed + storage policies on `storage.objects`)
2. Create 4 storage buckets via tool
3. Tunggu types.ts ter-regenerate
4. Install `react-signature-canvas`
5. Tulis services + functions + hooks
6. Tulis components + routes + nav
7. Refactor titik integrasi (permohonan, izin, BAST) — non-breaking
8. Build & typecheck verification

Setelah disetujui, saya jalankan langkah 1 dulu (migration) supaya types ter-regenerate sebelum nulis kode TS.
