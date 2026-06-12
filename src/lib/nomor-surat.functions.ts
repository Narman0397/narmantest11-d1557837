// Sprint A + Sprint G — Nomor Surat Resmi
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const issueNomorSurat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ permohonan_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: p } = await supabaseAdmin
      .from("permohonan")
      .select("id,opd_id,nomor_surat")
      .eq("id", data.permohonan_id)
      .maybeSingle();
    if (!p || !p.opd_id) throw new Error("Permohonan tidak valid");
    if (p.nomor_surat) return { nomor: p.nomor_surat, already: true };
    const { data: nomor, error } = await context.supabase.rpc("fn_generate_nomor_surat", {
      _opd_id: p.opd_id,
      _permohonan_id: data.permohonan_id,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      aksi: "nomor_surat.issue",
      entitas: "permohonan",
      entitas_id: data.permohonan_id,
      data_sesudah: { nomor },
    });
    return { nomor: nomor as string, already: false };
  });

export const previewNomorFormat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ opd_id: z.string().uuid(), format: z.string().max(100).optional() }).parse(i),
  )
  .handler(async ({ data }) => {
    const { data: opd } = await supabaseAdmin
      .from("opd")
      .select("singkatan,nomor_surat_format,nomor_surat_kode")
      .eq("id", data.opd_id)
      .maybeSingle();
    const fmt = data.format ?? opd?.nomor_surat_format ?? "{kode}/{seq}/{singkatan}/{tahun}";
    const tahun = new Date().getFullYear();
    const preview = fmt
      .replace("{kode}", opd?.nomor_surat_kode ?? "470")
      .replace("{seq}", "001")
      .replace("{singkatan}", opd?.singkatan ?? "OPD")
      .replace("{tahun}", String(tahun));
    return { preview, format: fmt };
  });

// === Sprint G ===

export const listIssuedNomor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        q: z.string().max(100).optional(),
        opd_id: z.string().uuid().optional(),
        tahun: z.number().int().min(2000).max(2100).optional(),
        limit: z.number().int().min(1).max(200).default(50),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("nomor_surat_issued")
      .select("id, nomor, tahun, opd_id, permohonan_id, issued_at, issued_by")
      .order("issued_at", { ascending: false })
      .limit(data.limit);
    if (data.opd_id) q = q.eq("opd_id", data.opd_id);
    if (data.tahun) q = q.eq("tahun", data.tahun);
    if (data.q) q = q.ilike("nomor", `%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const listSequenceConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data: opds } = await supabaseAdmin
      .from("opd")
      .select("id, nama, singkatan, nomor_surat_format, nomor_surat_kode")
      .order("nama");
    const tahun = new Date().getFullYear();
    const { data: seq } = await supabaseAdmin
      .from("nomor_surat_sequence")
      .select("opd_id, tahun, last_number")
      .eq("tahun", tahun);
    const seqMap = new Map((seq ?? []).map((s) => [s.opd_id, s.last_number]));
    return {
      tahun,
      rows: (opds ?? []).map((o) => ({
        ...o,
        last_number: seqMap.get(o.id) ?? 0,
      })),
    };
  });

export const updateOpdFormat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        opd_id: z.string().uuid(),
        format: z.string().min(1).max(100),
        kode: z.string().min(1).max(20),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    // Hanya super_admin & admin_pemda yang boleh ubah konfigurasi
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    const { data: isPemda } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin_pemda",
    });
    if (!isSuper && !isPemda) throw new Error("Akses ditolak");
    const { error } = await supabaseAdmin
      .from("opd")
      .update({
        nomor_surat_format: data.format,
        nomor_surat_kode: data.kode,
      })
      .eq("id", data.opd_id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      aksi: "nomor_surat.config_update",
      entitas: "opd",
      entitas_id: data.opd_id,
      data_sesudah: { format: data.format, kode: data.kode },
    });
    return { ok: true };
  });
