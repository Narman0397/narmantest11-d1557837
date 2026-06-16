// Registrasi peran staf — sekarang HANYA mengubah profile + verification_status.
// JANGAN PERNAH insert ke user_roles. Role hanya diberikan setelah approve via
// fn_approve_user (admin_opd untuk ASN, super_admin/admin_pemda untuk admin_opd/admin_desa).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SELF_REGISTERABLE_ROLES = ["asn"] as const;

const schema = z
  .object({
    requested_role: z.enum(SELF_REGISTERABLE_ROLES),
    opd_id: z.string().uuid().nullable().optional(),
    desa: z.string().trim().min(2).max(120).nullable().optional(),
    nip: z
      .string()
      .trim()
      .regex(/^\d{8,20}$/, "NIP 8-20 digit")
      .nullable()
      .optional(),
    jabatan_id: z.string().uuid().nullable().optional(),
    asn_type: z.enum(["pns", "pppk_penuh_waktu", "pppk_paruh_waktu"]).nullable().optional(),
  })
  .strict();

export const applyStaffRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => schema.parse(i))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    if (data.requested_role === "asn") {
      if (!data.opd_id) throw new Error("OPD/Instansi wajib dipilih untuk ASN");
      if (!data.nip) throw new Error("NIP wajib diisi untuk ASN");
      if (!data.jabatan_id) throw new Error("Jabatan wajib dipilih untuk ASN");
      if (!data.asn_type) throw new Error("Jenis ASN wajib dipilih");
    }

    // Cegah eskalasi: bila user sudah punya role elevated, tolak.
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const existingRoles = (existing ?? []).map((r) => r.role as string);
    const ELEVATED = ["super_admin", "admin_pemda", "admin_opd", "admin_desa", "asn"];
    if (existingRoles.some((r) => ELEVATED.includes(r))) {
      throw new Error(
        "Akun Anda sudah memiliki peran admin/asn. Hubungi super admin bila perlu perubahan.",
      );
    }

    // Anti-duplicate NIP.
    if (data.nip) {
      const { data: dup } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("nip", data.nip)
        .neq("id", userId)
        .maybeSingle();
      if (dup) throw new Error("NIP sudah terdaftar pada akun lain.");
    }

    // Patch profile: requested_role=asn, status=pending_verification.
    // verified_at / verified_by TETAP null sampai approval.
    const patch: Record<string, unknown> = {
      requested_role: "asn",
      verification_status: "pending_verification",
      verified_at: null,
      verified_by: null,
      verification_method: null,
      opd_id: data.opd_id ?? null,
      nip: data.nip ?? null,
      jabatan_id: data.jabatan_id ?? null,
      asn_type: data.asn_type ?? null,
    };

    const { error: perr } = await supabaseAdmin
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(patch as any)
      .eq("id", userId);
    if (perr) throw new Error(perr.message);

    await supabaseAdmin.from("audit_log").insert({
      user_id: userId,
      aksi: "staff.registration_requested",
      entitas: "profile",
      entitas_id: userId,
      data_sesudah: { requested_role: "asn", status: "pending_verification" } as never,
    });

    return { ok: true };
  });

// Daftar OPD publik untuk dropdown registrasi (read-only nama+singkatan)
export const listOpdPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("opd").select("id,nama,singkatan").order("nama");
  if (error) throw new Error(error.message);
  return { rows: data ?? [] };
});

// Daftar Jabatan publik (untuk dropdown signup ASN)
export const listMasterJabatanPublic = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("master_jabatan" as any)
    .select("id,kode,nama,kategori")
    .eq("aktif", true)
    .order("urutan");
  if (error) throw new Error(error.message);
  return { rows: ((data ?? []) as unknown) as Array<{ id: string; kode: string; nama: string; kategori: string | null }> };
});
