# Storage Audit Report

## Skor: 25/100 — 🛑 BLOCKER

## Status Saat Ini

```
SELECT * FROM storage.buckets;
-> 0 rows
```

**Tidak ada satu pun bucket yang dibuat.** Seluruh modul yang bergantung upload akan **gagal total**.

## Bucket yang Dibutuhkan (sesuai desain repo sumber)

| Bucket | Public? | MIME | Size limit | Dipakai di |
|---|---|---|---|---|
| `branding` | public | image/* | 2 MB | `/admin/branding`, header logo |
| `pejabat-foto` | public | image/* | 1 MB | `/admin/pejabat`, halaman `pemda` |
| `berkas-permohonan` | private | pdf, image, doc | 10 MB | `permohonan.baru`, `permohonan.$id` |
| `aset-foto` | private | image/* | 5 MB | `admin.aset*`, `asn.aset` |
| `absensi-foto` | private | image/* | 2 MB | `asn.absensi` (check-in selfie) |
| `form-uploads` | private | pdf, image, doc | 20 MB | Form builder file field |
| `share-files` | private | * | 50 MB | `share_paket` distribution |

## Rekomendasi RLS `storage.objects`

Pattern dasar (private bucket):
```sql
-- Read: hanya owner atau admin OPD
CREATE POLICY "berkas_read_owner" ON storage.objects FOR SELECT
USING (
  bucket_id = 'berkas-permohonan' AND
  (owner = auth.uid() OR
   public.has_role(auth.uid(),'super_admin') OR
   public.has_role(auth.uid(),'admin_opd'))
);

-- Insert: authenticated only, path harus mengandung user_id
CREATE POLICY "berkas_insert_auth" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'berkas-permohonan' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Hybrid Provider
`src/lib/storage/provider.server.ts` sudah mendukung Supabase + Cloudflare R2. Konfigurasi via `/admin/system/storage-provider`. Setelah bucket Supabase dibuat default, R2 tetap optional.

## Signed URL Path
- Upload pakai `createSignedUpload(bucket, path, 600s)` ✅
- Download pakai `createSignedDownload(bucket, path, 300s)` ✅
- `removeObjects` ✅

Implementasi storage **kode siap**, hanya bucket fisik belum dibuat.

## Action P0
1. Panggil `supabase--storage_create_bucket` 7 kali (untuk 7 bucket di atas).
2. Migrasi tambahan untuk RLS `storage.objects` per bucket.
3. Tambahkan MIME whitelist & size cap di `app_setting` (`storage.upload_caps`).
