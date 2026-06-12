// Sprint G — Timeline verifikasi yang reusable: tempel di detail
// permohonan / dataset_submission / aset / form_submission.
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { listVerificationLogs } from "@/lib/verification-log.functions";

type Log = {
  id: string;
  action: string;
  catatan: string | null;
  created_at: string;
  actor_nama: string | null;
  meta: Record<string, unknown> | null;
};

const TARGETS = ["permohonan", "dataset_submission", "aset", "form_submission", "profile"] as const;

export function VerificationTimeline({
  targetType,
  targetId,
  className = "",
}: {
  targetType: (typeof TARGETS)[number];
  targetId: string;
  className?: string;
}) {
  const [rows, setRows] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await listVerificationLogs({
        data: { target_type: targetType, target_id: targetId },
      });
      setRows(r.rows as Log[]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [targetType, targetId]);

  return (
    <section className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      <header className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold">Timeline Verifikasi</h3>
        <button
          onClick={load}
          aria-label="Muat ulang"
          className="rounded p-1 text-muted-foreground hover:bg-muted"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      {err && <p className="text-xs text-destructive">{err}</p>}
      {!err && loading && <p className="text-xs text-muted-foreground">Memuat…</p>}
      {!loading && !err && rows.length === 0 && (
        <p className="text-xs text-muted-foreground">Belum ada catatan verifikasi.</p>
      )}

      {rows.length > 0 && (
        <ol className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="flex gap-3">
              <div className="mt-0.5">
                <ActionIcon action={r.action} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-semibold">{actionLabel(r.action)}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">oleh {r.actor_nama ?? "Sistem"}</div>
                {r.catatan && <p className="mt-1 text-xs">{r.catatan}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function actionLabel(a: string) {
  const map: Record<string, string> = {
    approve: "Disetujui",
    reject: "Ditolak",
    submit: "Diajukan",
    revise: "Diminta revisi",
    review: "Dalam review",
    cancel: "Dibatalkan",
  };
  return map[a] ?? a;
}

function ActionIcon({ action }: { action: string }) {
  const cls = "h-4 w-4";
  if (action === "approve") return <CheckCircle2 className={`${cls} text-success`} />;
  if (action === "reject" || action === "cancel")
    return <XCircle className={`${cls} text-destructive`} />;
  if (action === "revise") return <AlertCircle className={`${cls} text-amber-500`} />;
  return <Clock className={`${cls} text-muted-foreground`} />;
}
