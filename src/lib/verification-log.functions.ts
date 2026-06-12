// Sprint G — Verification Logs (timeline per entitas)
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TargetType = z.enum([
  "permohonan",
  "dataset_submission",
  "aset",
  "form_submission",
  "profile",
]);

export const listVerificationLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        target_type: TargetType,
        target_id: z.string().uuid(),
        limit: z.number().int().min(1).max(200).default(50),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("verification_logs")
      .select("id, target_type, target_id, actor_id, action, catatan, meta, created_at")
      .eq("target_type", data.target_type)
      .eq("target_id", data.target_id)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    // Resolve actor names
    const actorIds = Array.from(
      new Set((rows ?? []).map((r) => r.actor_id).filter(Boolean) as string[]),
    );
    let actors: Record<string, { nama: string | null }> = {};
    if (actorIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, nama_lengkap")
        .in("id", actorIds);
      actors = Object.fromEntries((profs ?? []).map((p) => [p.id, { nama: p.nama_lengkap }]));
    }
    return {
      rows: (rows ?? []).map((r) => ({
        ...r,
        actor_nama: r.actor_id ? (actors[r.actor_id]?.nama ?? null) : null,
      })),
    };
  });

export const writeVerificationLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        target_type: TargetType,
        target_id: z.string().uuid(),
        action: z.string().min(1).max(50),
        catatan: z.string().max(2000).optional(),
        meta: z.record(z.unknown()).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.from("verification_logs").insert({
      target_type: data.target_type,
      target_id: data.target_id,
      actor_id: context.userId,
      action: data.action,
      catatan: data.catatan ?? null,
      meta: (data.meta ?? null) as never,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
