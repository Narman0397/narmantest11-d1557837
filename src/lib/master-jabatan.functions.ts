// CRUD master jabatan untuk super_admin / admin_pemda.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin as _admin } from "@/integrations/supabase/client.server";
import { getUserContext } from "@/features/rbac/guards";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAdmin: any = _admin;

async function assertAdmin(userId: string) {
  const ctx = await getUserContext(supabaseAdmin, userId);
  if (!ctx.isSuper && !ctx.roleSet.has("admin_pemda")) throw new Error("Forbidden");
}

export const listMasterJabatan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("master_jabatan")
      .select("id,kode,nama,kategori,urutan,aktif,created_at,updated_at")
      .order("urutan");
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  kode: z.string().trim().min(2).max(40).regex(/^[A-Z0-9_]+$/, "Huruf besar / angka / _ saja"),
  nama: z.string().trim().min(2).max(120),
  kategori: z.string().trim().max(60).nullable().optional(),
  urutan: z.number().int().min(0).max(9999).default(0),
  aktif: z.boolean().default(true),
});

export const upsertMasterJabatan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => upsertSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const payload = {
      kode: data.kode,
      nama: data.nama,
      kategori: data.kategori ?? null,
      urutan: data.urutan,
      aktif: data.aktif,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("master_jabatan").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("master_jabatan")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id as string };
  });

export const deleteMasterJabatan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("master_jabatan").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
