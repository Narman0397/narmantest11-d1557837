// Server fn: ambil daftar permission efektif user yang sedang login.
// Sumber kebenaran adalah fungsi SQL get_effective_permissions().
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getEffectivePermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_effective_permissions", {
      _user_id: userId,
    });
    if (error) {
      return { permissions: [] as string[] };
    }
    const permissions = ((data ?? []) as Array<{ permission_code: string }>)
      .map((r) => r.permission_code)
      .filter(Boolean);
    return { permissions };
  });
