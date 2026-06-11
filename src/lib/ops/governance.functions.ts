// F4.7 + F5.6 — Governance summary + production health score (super_admin).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertElevated(userId: string) {
  const checks = await Promise.all([
    supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "super_admin" }),
    supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin_pemda" }),
    supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "pimpinan" }),
  ]);
  if (!checks.some((r) => r.data === true)) throw new Error("Forbidden");
}

export const getGovernanceSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    await assertElevated(userId);
    const [{ data: summary }, { data: score }] = await Promise.all([
      supabaseAdmin.rpc("governance_summary"),
      supabaseAdmin.rpc("production_health_score"),
    ]);
    return { summary: summary ?? {}, score: score ?? {} };
  });
