// F4.3 — Cron-triggered endpoint for retention cleanup.
import { createFileRoute } from "@tanstack/react-router";
import { runRetentionCleanup } from "@/lib/ops/retention.server";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { verifyCronCaller } from "@/lib/cron-auth.server";

export const Route = createFileRoute("/api/public/hooks/retention-cleanup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = verifyCronCaller(request);
        if (unauth) return unauth;
        try {
          if (!(await isFeatureEnabled("enable_retention_cleanup"))) {
            return new Response(JSON.stringify({ ok: true, skipped: "flag off" }), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }
          const result = await runRetentionCleanup();
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (e) {
          return new Response(
            JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
