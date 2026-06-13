// Shared cron/webhook authenticator for /api/public/hooks/*.
// A-01 fix: only CRON_SECRET (server-side) is accepted. The publishable key
// is public and must never be used as a bearer secret.
// Accepts:
//   1. `Authorization: Bearer <CRON_SECRET>`, OR
//   2. `x-cron-secret: <CRON_SECRET>`
// Returns null when authorized, or a 401 Response otherwise.
export function verifyCronCaller(request: Request): Response | null {
  const cronSecret = process.env.CRON_SECRET;

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
