// Dashboard Pimpinan Daerah — read-only ringkasan kabupaten + panel khusus Bupati.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExecutiveGuard } from "@/components/admin/ExecutiveGuard";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { getExecutiveSummary } from "@/lib/executive.functions";
import { opdSkorKomposit, type SkorRow } from "@/lib/kinerja.functions";
import {
  Trophy,
  AlertTriangle,
  Building2,
  Users,
  FileText,
  Package,
  MessageSquare,
  BarChart3,
  FileSignature,
  Inbox,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/executive")({
  head: () => ({
    meta: [{ title: "Dashboard Pimpinan Daerah" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <ExecutiveGuard mode="executive">
      <Page />
    </ExecutiveGuard>
  ),
});

type Kab = {
  permohonan_total: number;
  permohonan_bulan: number;
  permohonan_selesai: number;
  permohonan_overdue: number;
  laporan_total: number;
  laporan_open: number;
  aset_total: number;
  aset_rusak: number;
  ikm_responses_30d: number;
  opd_count: number;
  asn_count: number;
};

type BupatiQueue = { signPending: number; disposisiAktif: number; approvalPending: number };

function Page() {
  const { isBupati } = useAuth();
  const [kab, setKab] = useState<Kab | null>(null);
  const [skor, setSkor] = useState<SkorRow[]>([]);
  const [bupatiQueue, setBupatiQueue] = useState<BupatiQueue | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const sum = (await getExecutiveSummary()) as { kabupaten: Kab };
        setKab(sum.kabupaten);
        const k = await opdSkorKomposit();
        setSkor((k as { rows: SkorRow[] }).rows ?? []);
      } catch (e) {
        setErr((e as Error).message);
      }
    })();
  }, []);

  // Bupati-only: muat antrean persetujuan/disposisi/tanda tangan (best-effort, fallback 0).
  useEffect(() => {
    if (!isBupati) return;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb: any = supabase;
      const [sign, disp, appr] = await Promise.all([
        sb
          .from("signed_documents")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        sb
          .from("submission_dispositions")
          .select("id", { count: "exact", head: true })
          .is("acted_at", null),
        sb.from("permohonan").select("id", { count: "exact", head: true }).eq("status", "diproses"),
      ]);
      setBupatiQueue({
        signPending: sign.count ?? 0,
        disposisiAktif: disp.count ?? 0,
        approvalPending: appr.count ?? 0,
      });
    })().catch(() => setBupatiQueue({ signPending: 0, disposisiAktif: 0, approvalPending: 0 }));
  }, [isBupati]);

  const top3 = [...skor]
    .filter((r) => r.skor != null)
    .sort((a, b) => (b.skor ?? 0) - (a.skor ?? 0))
    .slice(0, 3);
  const needAttention = [...skor].filter((r) => (r.sla_pct ?? 100) < 70).slice(0, 3);

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Pimpinan Daerah
          </div>
          <h1 className="font-display text-3xl font-bold">Dashboard Eksekutif Kabupaten</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan kinerja seluruh OPD — tampilan baca saja.
          </p>
        </header>

        {err && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {err}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat icon={Building2} label="OPD" value={kab?.opd_count ?? 0} />
          <Stat icon={Users} label="ASN" value={kab?.asn_count ?? 0} />
          <Stat icon={FileText} label="Permohonan Bulan Ini" value={kab?.permohonan_bulan ?? 0} />
          <Stat
            icon={AlertTriangle}
            label="Permohonan Overdue"
            value={kab?.permohonan_overdue ?? 0}
            tone="destructive"
          />
          <Stat icon={MessageSquare} label="Pengaduan Aktif" value={kab?.laporan_open ?? 0} />
          <Stat icon={Package} label="Total Aset" value={kab?.aset_total ?? 0} />
          <Stat
            icon={AlertTriangle}
            label="Aset Rusak"
            value={kab?.aset_rusak ?? 0}
            tone="destructive"
          />
          <Stat
            icon={BarChart3}
            label="Responden IKM (30 hari)"
            value={kab?.ikm_responses_30d ?? 0}
          />
        </section>

        {isBupati && (
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Antrean Bupati</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                to="/admin/digital-signature"
                className="rounded-xl border border-border bg-card p-4 shadow-soft hover:bg-primary-soft hover:text-primary"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Tanda Tangan Pending
                  </span>
                  <FileSignature className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2 font-display text-2xl font-bold">
                  {(bupatiQueue?.signPending ?? 0).toLocaleString("id-ID")}
                </div>
              </Link>
              <Link
                to="/admin/layanan"
                className="rounded-xl border border-border bg-card p-4 shadow-soft hover:bg-primary-soft hover:text-primary"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Disposisi Aktif
                  </span>
                  <Inbox className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2 font-display text-2xl font-bold">
                  {(bupatiQueue?.disposisiAktif ?? 0).toLocaleString("id-ID")}
                </div>
              </Link>
              <Link
                to="/admin/submission-review"
                className="rounded-xl border border-border bg-card p-4 shadow-soft hover:bg-primary-soft hover:text-primary"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Persetujuan Dokumen
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2 font-display text-2xl font-bold">
                  {(bupatiQueue?.approvalPending ?? 0).toLocaleString("id-ID")}
                </div>
              </Link>
            </div>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <Card title="Top 3 OPD" icon={Trophy} accent="success">
            {top3.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum cukup data.</p>
            )}
            {top3.map((r, i) => (
              <Row
                key={r.opd_id}
                title={`${i + 1}. ${r.opd_nama}`}
                sub={`SLA ${r.sla_pct?.toFixed(0) ?? "—"}% · Rating ${r.rating_avg?.toFixed(1) ?? "—"}`}
                value={r.skor?.toFixed(0) ?? "—"}
                tone="success"
              />
            ))}
          </Card>
          <Card title="Perlu Perhatian" icon={AlertTriangle} accent="destructive">
            {needAttention.length === 0 && (
              <p className="text-sm text-muted-foreground">Semua OPD baik.</p>
            )}
            {needAttention.map((r) => (
              <Row
                key={r.opd_id}
                title={r.opd_nama}
                sub={`SLA ${r.sla_pct?.toFixed(0) ?? "—"}% · Backlog ${(r.total ?? 0) - (r.selesai ?? 0)}`}
                value={r.skor?.toFixed(0) ?? "—"}
                tone="destructive"
              />
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "default" | "destructive";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon
          className={`h-4 w-4 ${tone === "destructive" ? "text-destructive" : "text-primary"}`}
        />
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value.toLocaleString("id-ID")}</div>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "success" | "destructive";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${accent === "success" ? "text-success" : "text-destructive"}`} />
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({
  title,
  sub,
  value,
  tone,
}: {
  title: string;
  sub: string;
  value: string;
  tone: "success" | "destructive";
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md px-3 py-2 ${tone === "success" ? "bg-surface" : "bg-destructive/10"}`}
    >
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <div
        className={`text-lg font-bold ${tone === "success" ? "text-success" : "text-destructive"}`}
      >
        {value}
      </div>
    </div>
  );
}
