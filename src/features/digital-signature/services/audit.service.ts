// Insert document_audit record (server-side; admin client because public verify has no auth).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { DocumentAuditAction } from "../types";

export async function insertDocumentAudit(
  client: SupabaseClient<Database>,
  args: {
    document_id: string;
    action: DocumentAuditAction;
    actor: string | null;
    metadata?: Record<string, unknown>;
    ip_hash?: string | null;
    user_agent?: string | null;
  },
): Promise<void> {
  await client.from("document_audit").insert({
    document_id: args.document_id,
    action: args.action,
    actor: args.actor,
    metadata: (args.metadata ?? {}) as never,
    ip_hash: args.ip_hash ?? null,
    user_agent: args.user_agent ?? null,
  });
}

export async function ipHash(ip: string | null | undefined): Promise<string | null> {
  if (!ip) return null;
  const enc = new TextEncoder().encode(ip);
  const h = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(h).slice(0, 8), (x) => x.toString(16).padStart(2, "0")).join("");
}
