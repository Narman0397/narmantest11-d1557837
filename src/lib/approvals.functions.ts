// Approvals: list pending users + approve/reject via fn_approve_user / fn_reject_user RPC.
// Authorisasi caller dilakukan di sini (server) DAN sekali lagi di RPC SECURITY DEFINER.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin as _admin } from "@/integrations/supabase/client.server";
import { getUserContext } from "@/features/rbac/guards";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAdmin: any = _admin;

type PendingRow = {
  id: string;
  nama_lengkap: string | null;
  nik: string | null;
  no_hp: string | null;
  alamat: string | null;
  desa: string | null;
  opd_id: string | null;
  opd_nama: string | null;
  nip: string | null;
  jabatan_id: string | null;
  jabatan_nama: string | null;
  asn_type: string | null;
  requested_role: string | null;
  verification_status: string | null;
  rejection_reason: string | null;
  created_at: string;
  email: string;
};

async function hydrateRows(rows: Array<Record<string, unknown>>): Promise<PendingRow[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id as string);
  const [{ data: opds }, { data: jab }, listUsers] = await Promise.all([
    supabaseAdmin.from("opd").select("id,nama,singkatan"),
    supabaseAdmin.from("master_jabatan").select("id,nama"),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const opdMap = new Map<string, string>(
    (opds ?? []).map((o: { id: string; nama: string; singkatan: string }) => [o.id, `${o.singkatan} — ${o.nama}`]),
  );
  const jabMap = new Map<string, string>(
    (jab ?? []).map((j: { id: string; nama: string }) => [j.id, j.nama]),
  );
  const emailMap = new Map<string, string>(
    (listUsers?.data?.users ?? []).filter((u: { id: string }) => ids.includes(u.id)).map((u: { id: string; email?: string | null }) => [u.id, u.email ?? ""]),
  );
  return rows.map((r) => ({
    id: r.id as string,
    nama_lengkap: (r.nama_lengkap as string | null) ?? null,
    nik: (r.nik as string | null) ?? null,
    no_hp: (r.no_hp as string | null) ?? null,
    alamat: (r.alamat as string | null) ?? null,
    desa: (r.desa as string | null) ?? null,
    opd_id: (r.opd_id as string | null) ?? null,
    opd_nama: r.opd_id ? (opdMap.get(r.opd_id as string) ?? null) : null,
    nip: (r.nip as string | null) ?? null,
    jabatan_id: (r.jabatan_id as string | null) ?? null,
    jabatan_nama: r.jabatan_id ? (jabMap.get(r.jabatan_id as string) ?? null) : null,
    asn_type: (r.asn_type as string | null) ?? null,
    requested_role: (r.requested_role as string | null) ?? null,
    verification_status: (r.verification_status as string | null) ?? null,
    rejection_reason: (r.rejection_reason as string | null) ?? null,
    created_at: r.created_at as string,
    email: emailMap.get(r.id as string) ?? "",
  }));
}

export const listPendingApprovals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ scope: z.enum(["admin_opd", "admin_desa", "asn", "warga", "all"]).default("all") }).parse(i ?? {}),
  )
  .handler(async ({ data, context }) => {
    const ctx = await getUserContext(supabaseAdmin, context.userId);
    const isSuper = ctx.isSuper;
    const isPemda = ctx.roleSet.has("admin_pemda");
    const isAdminOpd = ctx.roleSet.has("admin_opd");
    const isAdminDesa = ctx.roleSet.has("admin_desa");
    if (!isSuper && !isPemda && !isAdminOpd && !isAdminDesa) throw new Error("Forbidden");

    let q = supabaseAdmin
      .from("profiles")
      .select(
        "id,nama_lengkap,nik,no_hp,alamat,desa,opd_id,nip,jabatan_id,asn_type,requested_role,verification_status,rejection_reason,created_at",
      )
      .in("verification_status", ["pending_verification", "pending_superadmin_approval", "rejected"])
      .order("created_at", { ascending: false })
      .limit(500);

    const scopes: string[] = [];
    if (data.scope === "all") {
      if (isSuper || isPemda) {
        scopes.push("admin_opd", "admin_desa", "asn", "warga");
      } else {
        if (isAdminOpd) scopes.push("asn");
        if (isAdminDesa) scopes.push("warga");
      }
    } else {
      scopes.push(data.scope);
    }
    if (scopes.length) q = q.in("requested_role", scopes);

    // Scope OPD untuk admin_opd
    if (!isSuper && !isPemda && isAdminOpd && !isAdminDesa) {
      if (!ctx.opdId) return { rows: [] };
      q = q.eq("opd_id", ctx.opdId);
    }
    // Scope desa untuk admin_desa
    if (!isSuper && !isPemda && isAdminDesa && !isAdminOpd) {
      if (!ctx.desa) return { rows: [] };
      q = q.eq("desa", ctx.desa);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: await hydrateRows((rows ?? []) as Array<Record<string, unknown>>) };
  });

export const approveUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: z.enum(["warga", "asn", "admin_opd", "admin_desa"]),
        method: z.enum(["manual", "qr", "superadmin", "admin_opd", "admin_desa"]).default("manual"),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { data: out, error } = await supabaseAdmin.rpc("fn_approve_user", {
      _target_user_id: data.user_id,
      _role: data.role,
      _method: data.method,
    });
    if (error) throw new Error(error.message);
    return out as { ok: boolean };
  });

export const rejectUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ user_id: z.string().uuid(), reason: z.string().trim().min(5).max(500) }).parse(i),
  )
  .handler(async ({ data }) => {
    const { data: out, error } = await supabaseAdmin.rpc("fn_reject_user", {
      _target_user_id: data.user_id,
      _reason: data.reason,
    });
    if (error) throw new Error(error.message);
    return out as { ok: boolean };
  });

export const getMyVerificationState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "verification_status,requested_role,verified_at,rejection_reason,desa,opd_id,nama_lengkap,verification_method",
      )
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      status: (data?.verification_status as string | null) ?? "pending_verification",
      requested_role: (data?.requested_role as string | null) ?? null,
      verified_at: (data?.verified_at as string | null) ?? null,
      rejection_reason: (data?.rejection_reason as string | null) ?? null,
      verification_method: (data?.verification_method as string | null) ?? null,
      nama_lengkap: (data?.nama_lengkap as string | null) ?? null,
      desa: (data?.desa as string | null) ?? null,
      opd_id: (data?.opd_id as string | null) ?? null,
    };
  });
