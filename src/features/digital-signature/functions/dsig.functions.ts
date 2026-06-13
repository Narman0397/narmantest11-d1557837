// Server functions untuk modul Digital Signature.
// - Spesimen TTD (digital_signatures) + sertifikat (signing_certificates)
// - Dokumen (documents) + penandatanganan (signed_documents)
// - Verifikasi public via token / hash upload
// - Audit list
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sha256Hex } from "../services/hash.service";
import { generateVerificationToken, verifyUrlFor } from "../services/verification.service";
import { generateQrPng } from "../services/qr.service";
import { stampSignature, buildBasicPdf } from "../services/pdf.service";
import { insertDocumentAudit, ipHash } from "../services/audit.service";
import { DOC_BUCKETS } from "../types";

const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_SIGNATURE_BYTES = 256 * 1024;

// ====== Helpers (server) ======
async function getOrigin(): Promise<string> {
  const { getRequestHost } = await import("@tanstack/react-start/server");
  try {
    const host = getRequestHost();
    if (host) return `https://${host}`;
  } catch {
    /* fallback */
  }
  return process.env.PUBLIC_SITE_ORIGIN ?? "";
}

async function ensurePermission(userId: string, code: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: superAdmin } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "super_admin",
  });
  if (superAdmin) return;
  const { data: ok } = await supabaseAdmin.rpc("has_permission", {
    _user_id: userId,
    _permission_code: code,
  });
  if (!ok) throw new Error("Forbidden");
}

// ====== SPESIMEN TTD ======
export const uploadSignatureSpecimen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        pngBase64: z
          .string()
          .min(50)
          .max(MAX_SIGNATURE_BYTES * 2),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const bytes = Uint8Array.from(atob(data.pngBase64), (c) => c.charCodeAt(0));
    if (bytes.length > MAX_SIGNATURE_BYTES) throw new Error("Spesimen melebihi 256KB");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${userId}/spesimen-${Date.now()}.png`;
    const { error: upErr } = await supabaseAdmin.storage
      .from(DOC_BUCKETS.signatures)
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) throw new Error(`Upload gagal: ${upErr.message}`);
    // Non-aktifkan spesimen lama
    await supabaseAdmin
      .from("digital_signatures")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_active", true);
    const { data: row, error } = await supabaseAdmin
      .from("digital_signatures")
      .insert({ user_id: userId, signature_path: path, is_active: true })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { signature: row };
  });

export const listMySignatures = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("digital_signatures")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { signatures: data ?? [] };
  });

export const revokeSignature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // A-04 hardening: defense-in-depth — filter eksplisit user_id, jangan andalkan RLS saja.
    const { error } = await supabase
      .from("digital_signatures")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ====== SERTIFIKAT INTERNAL ======
export const issueCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        nip: z.string().max(64).optional().nullable(),
        full_name: z.string().min(2).max(255),
        position: z.string().max(255).optional().nullable(),
        expired_at: z.string().datetime().optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await ensurePermission(context.userId, "digital_signature.admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("signing_certificates")
      .insert({
        user_id: data.user_id,
        nip: data.nip ?? null,
        full_name: data.full_name,
        position: data.position ?? null,
        expired_at: data.expired_at ?? null,
        is_active: true,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { certificate: row };
  });

export const listCertificates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("signing_certificates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { certificates: data ?? [] };
  });

export const revokeCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await ensurePermission(context.userId, "digital_signature.admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("signing_certificates")
      .update({ is_active: false })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ====== DOKUMEN: UPLOAD (Mode B) ======
export const uploadManualDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        title: z.string().min(2).max(255),
        document_type: z.string().min(2).max(64),
        pdfBase64: z.string().min(100),
        opd_id: z.string().uuid().optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await ensurePermission(context.userId, "digital_signature.create");
    const bytes = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));
    if (bytes.length > MAX_PDF_BYTES) throw new Error("PDF melebihi 20MB");
    if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)) {
      throw new Error("File bukan PDF valid");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${context.userId}/${Date.now()}-${data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40)}.pdf`;
    const { error: upErr } = await supabaseAdmin.storage
      .from(DOC_BUCKETS.documents)
      .upload(path, bytes, { contentType: "application/pdf", upsert: false });
    if (upErr) throw new Error(`Upload gagal: ${upErr.message}`);
    const { data: doc, error } = await supabaseAdmin
      .from("documents")
      .insert({
        title: data.title,
        document_type: data.document_type,
        generated_by_system: false,
        source_module: "manual",
        file_path: path,
        opd_id: data.opd_id ?? null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await insertDocumentAudit(supabaseAdmin, {
      document_id: doc.id,
      action: "UPLOADED",
      actor: context.userId,
      metadata: { bytes: bytes.length },
    });
    return { document: doc };
  });

// ====== DOKUMEN: GENERATE SYSTEM (Mode A) ======
export const generateSystemDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        title: z.string().min(2).max(255),
        document_type: z.string().min(2).max(64),
        source_module: z.string().max(64).optional().nullable(),
        source_ref_id: z.string().uuid().optional().nullable(),
        opd_id: z.string().uuid().optional().nullable(),
        document_number: z.string().max(64).optional().nullable(),
        body_paragraphs: z.array(z.string().max(2000)).min(1).max(20),
        pemohon_nama: z.string().max(255).optional().nullable(),
        pemohon_nip: z.string().max(64).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await ensurePermission(context.userId, "digital_signature.create");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let opdNama = "Pemerintah Daerah",
      opdSingkatan = "OPD";
    if (data.opd_id) {
      const { data: opd } = await supabaseAdmin
        .from("opd")
        .select("nama,singkatan")
        .eq("id", data.opd_id)
        .maybeSingle();
      if (opd) {
        opdNama = opd.nama;
        opdSingkatan = opd.singkatan;
      }
    }
    const pdfBytes = await buildBasicPdf({
      opdNama,
      opdSingkatan,
      documentNumber: data.document_number,
      title: data.title,
      bodyParagraphs: data.body_paragraphs,
      pemohonNama: data.pemohon_nama,
      pemohonNip: data.pemohon_nip,
    });
    const path = `${context.userId}/${Date.now()}-${data.document_type}.pdf`;
    const { error: upErr } = await supabaseAdmin.storage
      .from(DOC_BUCKETS.documents)
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: false });
    if (upErr) throw new Error(`Upload gagal: ${upErr.message}`);
    const { data: doc, error } = await supabaseAdmin
      .from("documents")
      .insert({
        title: data.title,
        document_type: data.document_type,
        generated_by_system: true,
        source_module: data.source_module ?? null,
        source_ref_id: data.source_ref_id ?? null,
        file_path: path,
        opd_id: data.opd_id ?? null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await insertDocumentAudit(supabaseAdmin, {
      document_id: doc.id,
      action: "GENERATED",
      actor: context.userId,
      metadata: { document_type: data.document_type },
    });
    return { document: doc };
  });

// ====== SIGN ======
export const signDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        document_id: z.string().uuid(),
        document_number: z.string().max(64).optional().nullable(),
        expires_at: z.string().datetime().optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await ensurePermission(context.userId, "digital_signature.sign");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: doc, error: dErr } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", data.document_id)
      .maybeSingle();
    if (dErr || !doc) throw new Error("Dokumen tidak ditemukan");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("nama_lengkap,nip,jabatan")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: cert } = await supabaseAdmin
      .from("signing_certificates")
      .select("*")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .order("issued_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const signerName = cert?.full_name ?? profile?.nama_lengkap ?? "Penandatangan";
    const nip = cert?.nip ?? profile?.nip ?? null;
    const position = cert?.position ?? profile?.jabatan ?? null;

    const { data: spec } = await supabaseAdmin
      .from("digital_signatures")
      .select("signature_path")
      .eq("user_id", context.userId)
      .eq("is_active", true)
      .maybeSingle();
    let signaturePng: Uint8Array | null = null;
    if (spec?.signature_path) {
      const { data: dl } = await supabaseAdmin.storage
        .from(DOC_BUCKETS.signatures)
        .download(spec.signature_path);
      if (dl) signaturePng = new Uint8Array(await dl.arrayBuffer());
    }

    const { data: pdfBlob, error: dlErr } = await supabaseAdmin.storage
      .from(DOC_BUCKETS.documents)
      .download(doc.file_path);
    if (dlErr || !pdfBlob) throw new Error("Gagal membaca PDF dokumen");
    const pdfBytes = new Uint8Array(await pdfBlob.arrayBuffer());

    const token = generateVerificationToken();
    const origin = await getOrigin();
    const verifyUrl = verifyUrlFor(origin || "https://verify.local", token);
    const qrPng = await generateQrPng(verifyUrl);
    const signedBytes = await stampSignature(pdfBytes, {
      qrPng,
      signaturePng,
      signerName,
      nip,
      position,
      documentNumber: data.document_number ?? null,
      signedAt: new Date(),
      verifyUrl,
      verificationToken: token,
    });
    const hash = await sha256Hex(signedBytes);
    const signedPath = `${context.userId}/${data.document_id}-${token.slice(0, 8)}.pdf`;
    const { error: upErr } = await supabaseAdmin.storage
      .from(DOC_BUCKETS.signed)
      .upload(signedPath, signedBytes, { contentType: "application/pdf", upsert: true });
    if (upErr) throw new Error(`Upload signed gagal: ${upErr.message}`);

    const { data: signed, error: sErr } = await supabaseAdmin
      .from("signed_documents")
      .insert({
        document_id: doc.id,
        document_hash: hash,
        verification_token: token,
        signed_by: context.userId,
        signed_at: new Date().toISOString(),
        status: "signed",
        signed_file_path: signedPath,
        expires_at: data.expires_at ?? null,
      })
      .select("*")
      .single();
    if (sErr) throw new Error(sErr.message);

    await insertDocumentAudit(supabaseAdmin, {
      document_id: doc.id,
      action: "SIGNED",
      actor: context.userId,
      metadata: { verification_token: token, hash },
    });
    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      aksi: "digital_signature.sign",
      entitas: "documents",
      entitas_id: doc.id,
      data_sesudah: { token, hash },
    });

    try {
      const { enqueueNotification } = await import("@/lib/notifications.functions");
      await enqueueNotification({
        userId: context.userId,
        tipe: "ttd_digital",
        judul: "Dokumen ditandatangani",
        body: doc.title,
        link: `/verify/${token}`,
        dedupeKey: `sign-${signed.id}`,
      });
      if (doc.created_by && doc.created_by !== context.userId) {
        await enqueueNotification({
          userId: doc.created_by,
          tipe: "ttd_digital",
          judul: "Dokumen Anda telah ditandatangani",
          body: doc.title,
          link: `/verify/${token}`,
          dedupeKey: `sign-${signed.id}-creator`,
        });
      }
    } catch {
      /* ignore */
    }

    return { signed, verify_url: verifyUrl };
  });

// ====== REVOKE SIGNED DOCUMENT ======
export const revokeSignedDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        reason: z.string().trim().min(10, "Alasan minimal 10 karakter").max(500),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await ensurePermission(context.userId, "digital_signature.revoke");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("signed_documents")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
        revoke_reason: data.reason,
      })
      .eq("id", data.id)
      .select("document_id,signed_by")
      .single();
    if (error) throw new Error(error.message);
    await insertDocumentAudit(supabaseAdmin, {
      document_id: row.document_id,
      action: "REVOKED",
      actor: context.userId,
      metadata: { reason: data.reason },
    });
    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      aksi: "digital_signature.revoke",
      entitas: "signed_documents",
      entitas_id: data.id,
      data_sesudah: { reason: data.reason },
    });
    try {
      const { enqueueNotification } = await import("@/lib/notifications.functions");
      if (row.signed_by) {
        await enqueueNotification({
          userId: row.signed_by,
          tipe: "ttd_digital",
          judul: "Tanda tangan dicabut",
          body: data.reason,
          dedupeKey: `revoke-${data.id}`,
        });
      }
    } catch {
      /* ignore */
    }
    return { ok: true };
  });

// ====== SIGNED URL ======
export const getSignedDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ signed_document_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("signed_documents")
      .select("signed_file_path,document_id")
      .eq("id", data.signed_document_id)
      .maybeSingle();
    if (error || !row) throw new Error("Tidak ditemukan");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed } = await supabaseAdmin.storage
      .from(DOC_BUCKETS.signed)
      .createSignedUrl(row.signed_file_path, 60 * 15);
    await insertDocumentAudit(supabaseAdmin, {
      document_id: row.document_id,
      action: "DOWNLOADED",
      actor: context.userId,
    });
    return { url: signed?.signedUrl ?? null };
  });

// ====== LIST DOKUMEN ======
export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { documents: data ?? [] };
  });

export const listSignedDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("signed_documents")
      .select("*")
      .order("signed_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { signed: data ?? [] };
  });

export const listMyDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { documents: data ?? [] };
  });

// ====== AUDIT ======
export const listDocumentAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ document_id: z.string().uuid().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("document_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.document_id) q = q.eq("document_id", data.document_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { audit: rows ?? [] };
  });

// ====== VERIFY (PUBLIC — no auth middleware) ======
// Mengembalikan status efektif termasuk EXPIRED (lazy: cek expires_at saat baca).
export const verifyByToken = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: z.string().min(8).max(128) }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed } = await supabaseAdmin
      .from("signed_documents")
      .select("*")
      .eq("verification_token", data.token)
      .maybeSingle();
    if (!signed) return { valid: false as const, reason: "not_found" as const };

    // Lazy-expire: jika expires_at lewat, tandai expired sekali, audit EXPIRED.
    let effectiveStatus = signed.status as string;
    if (
      effectiveStatus === "signed" &&
      signed.expires_at &&
      new Date(signed.expires_at) < new Date()
    ) {
      await supabaseAdmin
        .from("signed_documents")
        .update({ status: "expired" })
        .eq("id", signed.id);
      await insertDocumentAudit(supabaseAdmin, {
        document_id: signed.document_id,
        action: "EXPIRED",
        actor: null,
        metadata: { expires_at: signed.expires_at },
      });
      effectiveStatus = "expired";
    }

    await supabaseAdmin
      .from("signed_documents")
      .update({ verification_count: (signed.verification_count ?? 0) + 1 })
      .eq("id", signed.id);

    const { data: doc } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", signed.document_id)
      .maybeSingle();
    if (!doc) return { valid: false as const, reason: "not_found" as const };
    const { data: cert } = await supabaseAdmin
      .from("signing_certificates")
      .select("full_name,nip,position")
      .eq("user_id", signed.signed_by)
      .eq("is_active", true)
      .order("issued_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    let signerInfo: { full_name: string; nip: string | null; position: string | null } | null = cert
      ? { full_name: cert.full_name, nip: cert.nip, position: cert.position }
      : null;
    if (!signerInfo) {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("nama_lengkap")
        .eq("id", signed.signed_by)
        .maybeSingle();
      signerInfo = prof
        ? { full_name: prof.nama_lengkap ?? "Penandatangan", nip: null, position: null }
        : null;
    }
    await insertDocumentAudit(supabaseAdmin, {
      document_id: doc.id,
      action: "VERIFIED",
      actor: null,
      metadata: { via: "token", status: effectiveStatus },
    });

    if (effectiveStatus === "revoked") {
      return {
        valid: false as const,
        reason: "revoked" as const,
        signed: { ...signed, document: doc },
        signer: signerInfo,
      };
    }
    if (effectiveStatus === "expired") {
      return {
        valid: false as const,
        reason: "expired" as const,
        signed: { ...signed, status: "expired", document: doc },
        signer: signerInfo,
      };
    }
    return { valid: true as const, signed: { ...signed, document: doc }, signer: signerInfo };
  });

// Verifikasi via UPLOAD PDF — SERVER yang menghitung SHA-256.
// Client cukup mengirim base64 PDF; server tidak mempercayai hash dari client.
export const verifyUploadedPdf = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        pdfBase64: z.string().min(100),
        token: z.string().min(8).max(128).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const bytes = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));
    if (bytes.length === 0) throw new Error("File kosong");
    if (bytes.length > MAX_PDF_BYTES) throw new Error("PDF melebihi 20MB");
    if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)) {
      throw new Error("File bukan PDF valid");
    }
    const computedHash = await sha256Hex(bytes);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = supabaseAdmin
      .from("signed_documents")
      .select("id,document_hash,status,signed_at,document_id,verification_token,expires_at")
      .eq("document_hash", computedHash)
      .limit(1);
    if (data.token) q = q.eq("verification_token", data.token);
    const { data: row } = await q.maybeSingle();

    if (!row) {
      // HASH_MISMATCH: jika token disertakan dan token valid namun hash tidak cocok → audit
      if (data.token) {
        const { data: tokenRow } = await supabaseAdmin
          .from("signed_documents")
          .select("id,document_id,document_hash")
          .eq("verification_token", data.token)
          .maybeSingle();
        if (tokenRow) {
          await insertDocumentAudit(supabaseAdmin, {
            document_id: tokenRow.document_id,
            action: "HASH_MISMATCH",
            actor: null,
            metadata: {
              uploaded_hash: computedHash,
              stored_hash: tokenRow.document_hash,
              verification_token: data.token,
            },
          });
        }
      }
      await insertDocumentAudit(supabaseAdmin, {
        document_id: "00000000-0000-0000-0000-000000000000",
        action: "VERIFY_UPLOAD",
        actor: null,
        metadata: { uploaded_hash: computedHash, result: "mismatch" },
      }).catch(() => {
        /* ignore: dummy FK fail */
      });
      return {
        match: false as const,
        reason: "hash_mismatch" as const,
        uploaded_hash: computedHash,
      };
    }

    // Lazy-expire
    let effective = row.status as string;
    if (effective === "signed" && row.expires_at && new Date(row.expires_at) < new Date()) {
      await supabaseAdmin.from("signed_documents").update({ status: "expired" }).eq("id", row.id);
      effective = "expired";
    }
    await insertDocumentAudit(supabaseAdmin, {
      document_id: row.document_id,
      action: "VERIFY_UPLOAD",
      actor: null,
      metadata: { uploaded_hash: computedHash, result: effective },
    });
    if (effective !== "signed") {
      return {
        match: false as const,
        reason: effective as "revoked" | "expired",
        uploaded_hash: computedHash,
        signed_at: row.signed_at,
        verification_token: row.verification_token,
      };
    }
    return {
      match: true as const,
      signed_id: row.id,
      signed_at: row.signed_at,
      verification_token: row.verification_token,
      uploaded_hash: computedHash,
    };
  });

// Backward-compat: terima hash dari client (sudah deprecated). Tetap aman karena server
// hanya mencocokkan record, tidak menambah kepercayaan integritas. Disarankan: verifyUploadedPdf.
export const verifyByHash = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        hash: z.string().regex(/^[a-f0-9]{64}$/),
        token: z.string().min(8).max(128).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("signed_documents")
      .select("id,document_hash,status,signed_at,document_id,verification_token,expires_at")
      .eq("document_hash", data.hash)
      .limit(1);
    if (data.token) q = q.eq("verification_token", data.token);
    const { data: row } = await q.maybeSingle();
    if (!row) {
      if (data.token) {
        const { data: tokenRow } = await supabaseAdmin
          .from("signed_documents")
          .select("document_id,document_hash")
          .eq("verification_token", data.token)
          .maybeSingle();
        if (tokenRow) {
          await insertDocumentAudit(supabaseAdmin, {
            document_id: tokenRow.document_id,
            action: "HASH_MISMATCH",
            actor: null,
            metadata: {
              uploaded_hash: data.hash,
              stored_hash: tokenRow.document_hash,
              verification_token: data.token,
            },
          });
        }
      }
      return { match: false as const, reason: "hash_mismatch" as const };
    }
    let effective = row.status as string;
    if (effective === "signed" && row.expires_at && new Date(row.expires_at) < new Date()) {
      await supabaseAdmin.from("signed_documents").update({ status: "expired" }).eq("id", row.id);
      effective = "expired";
    }
    if (effective !== "signed")
      return { match: false as const, reason: effective as "revoked" | "expired" };
    await insertDocumentAudit(supabaseAdmin, {
      document_id: row.document_id,
      action: "VERIFIED",
      actor: null,
      metadata: { via: "hash" },
    });
    return {
      match: true as const,
      signed_id: row.id,
      signed_at: row.signed_at,
      verification_token: row.verification_token,
    };
  });

// ====== STATUS HELPER + FILTERED LISTS ======
export const checkDocumentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ signed_document_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("signed_documents")
      .select("id,status,expires_at,revoked_at,revoke_reason,signed_at")
      .eq("id", data.signed_document_id)
      .maybeSingle();
    if (error || !row) throw new Error("Tidak ditemukan");
    let status: "VALID" | "EXPIRED" | "REVOKED" | "DRAFT" = "VALID";
    if (row.status === "revoked") status = "REVOKED";
    else if (row.status === "expired" || (row.expires_at && new Date(row.expires_at) < new Date()))
      status = "EXPIRED";
    else if (row.status === "draft") status = "DRAFT";
    return { status, row };
  });

export const listExpiredDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("signed_documents")
      .select("*")
      .or(`status.eq.expired,and(status.eq.signed,expires_at.lt.${nowIso})`)
      .order("expires_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { expired: data ?? [] };
  });

export const listRevokedDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("signed_documents")
      .select("*")
      .eq("status", "revoked")
      .order("revoked_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { revoked: data ?? [] };
  });
