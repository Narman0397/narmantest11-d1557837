// Domain types untuk modul Digital Signature.
import type { Database } from "@/integrations/supabase/types";

export type DigitalSignatureRow = Database["public"]["Tables"]["digital_signatures"]["Row"];
export type SigningCertificateRow = Database["public"]["Tables"]["signing_certificates"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type SignedDocumentRow = Database["public"]["Tables"]["signed_documents"]["Row"];
export type DocumentAuditRow = Database["public"]["Tables"]["document_audit"]["Row"];

export type DocumentAuditAction =
  | "GENERATED"
  | "UPLOADED"
  | "SIGNED"
  | "VIEWED"
  | "VERIFIED"
  | "DOWNLOADED"
  | "REVOKED"
  | "HASH_MISMATCH"
  | "VERIFY_UPLOAD"
  | "EXPIRED";

export type SignedDocumentStatus = "draft" | "signed" | "revoked" | "expired";

export type VerifyResult =
  | {
      valid: true;
      signed: SignedDocumentRow & { document: DocumentRow };
      signer: { full_name: string; nip: string | null; position: string | null } | null;
    }
  | { valid: false; reason: "not_found" | "revoked" | "expired" | "hash_mismatch" };

export const DIGITAL_SIGNATURE_PERMISSIONS = {
  view: "digital_signature.view",
  create: "digital_signature.create",
  sign: "digital_signature.sign",
  verify: "digital_signature.verify",
  revoke: "digital_signature.revoke",
  admin: "digital_signature.admin",
} as const;

export const DOC_BUCKETS = {
  signatures: "signatures",
  documents: "documents",
  signed: "signed-documents",
  assets: "verification-assets",
} as const;
