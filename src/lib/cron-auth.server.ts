// Shared cron/webhook authenticator for /api/public/hooks/*.
// Accepts EITHER:
//   1. `apikey` header == SUPABASE_PUBLISHABLE_KEY (pg_cron default pattern), OR
//   2. `Authorization: Bearer <CRON_SECRET>` (external scheduler), OR
//   3. `x-cron-secret: <CRON_SECRET>` (alternate header).
// Returns null when authorized, or a 401 Response otherwise.
export function verifyCronCaller(request: Request): Response | null {
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
  const cronSecret = process.env.CRON_SECRET;

  const apikey = request.headers.get("apikey");
  if (apikey && anon && apikey === anon) return null;

  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth?.startsWith("Bearer ") && auth.slice(7) === cronSecret) return null;
    const xs = request.headers.get("x-cron-secret");
    if (xs && xs === cronSecret) return null;
  }

  return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}
