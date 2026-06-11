// Server fn pendukung picker target Form Builder.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getUserContext } from "@/features/rbac/guards";

async function assertCanManageForms(userId: string) {
  const ctx = await getUserContext(supabaseAdmin, userId);
  if (!ctx.isElevated && !ctx.isAdminOpd) throw new Error("Akses ditolak");
  return ctx;
}

/** Daftar OPD untuk dropdown target form. */
export const listOpdsForTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCanManageForms((context as { userId: string }).userId);
    const { data, error } = await supabaseAdmin
      .from("opd")
      .select("id,nama,singkatan")
      .order("nama");
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

/** Pencarian profil ASN untuk target individu (paging ringan, max 30 hasil). */
export const searchProfilesForTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        q: z.string().trim().min(1).max(80),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = await assertCanManageForms((context as { userId: string }).userId);
    const term = `%${data.q.replace(/[%_]/g, "")}%`;
    let q = supabaseAdmin
      .from("profiles")
      .select("id,nama_lengkap,nip,opd_id, opd:opd!opd_id(nama,singkatan)")
      .or(`nama_lengkap.ilike.${term},nip.ilike.${term}`)
      .order("nama_lengkap")
      .limit(30);
    // Admin OPD dibatasi pada OPD-nya.
    if (!ctx.isElevated && ctx.isAdminOpd && ctx.opdId) {
      q = q.eq("opd_id", ctx.opdId);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });
