// Sprint G — Admin: Konfigurasi & Histori Nomor Surat
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Hash, Save, RefreshCw, Search } from "lucide-react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  listIssuedNomor,
  listSequenceConfig,
  updateOpdFormat,
  previewNomorFormat,
} from "@/lib/nomor-surat.functions";

export const Route = createFileRoute("/_authenticated/admin/nomor-surat")({
  head: () => ({
    meta: [{ title: "Nomor Surat — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminShell breadcrumb={[{ label: "Data Governance" }, { label: "Nomor Surat" }]}>
        <Page />
      </AdminShell>
    </AdminGuard>
  ),
});

type OpdRow = {
  id: string;
  nama: string;
  singkatan: string;
  nomor_surat_format: string | null;
  nomor_surat_kode: string | null;
  last_number: number;
};

type IssuedRow = {
  id: string;
  nomor: string;
  tahun: number;
  opd_id: string;
  permohonan_id: string | null;
  issued_at: string;
  issued_by: string | null;
};

function Page() {
  const [tab, setTab] = useState<"konfig" | "histori">("konfig");
  const [opds, setOpds] = useState<OpdRow[]>([]);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [busy, setBusy] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssuedRow[]>([]);
  const [q, setQ] = useState("");
  const [loadingHistori, setLoadingHistori] = useState(false);

  async function loadConfig() {
    try {
      const r = await listSequenceConfig();
      setOpds(r.rows as OpdRow[]);
      setTahun(r.tahun);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function loadHistori() {
    setLoadingHistori(true);
    try {
      const r = await listIssuedNomor({ data: { q: q || undefined, limit: 100 } });
      setIssued(r.rows as IssuedRow[]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingHistori(false);
    }
  }
  useEffect(() => {
    loadConfig();
  }, []);
  useEffect(() => {
    if (tab === "histori") loadHistori();
  }, [tab]);

  async function onSave(row: OpdRow) {
    setBusy(row.id);
    try {
      await updateOpdFormat({
        data: {
          opd_id: row.id,
          format: row.nomor_surat_format || "{kode}/{seq}/{singkatan}/{tahun}",
          kode: row.nomor_surat_kode || "470",
        },
      });
      toast.success(`Format ${row.singkatan} disimpan`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function onPreview(row: OpdRow) {
    try {
      const r = await previewNomorFormat({
        data: {
          opd_id: row.id,
          format: row.nomor_surat_format || undefined,
        },
      });
      toast.info(`Preview: ${r.preview}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <header className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" /> Nomor Surat
          </h1>
          <p className="text-sm text-muted-foreground">
            Konfigurasi format penomoran per-OPD dan histori nomor yang telah diterbitkan.
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-card p-1 text-sm">
          {(["konfig", "histori"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded px-3 py-1 ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {t === "konfig" ? "Konfigurasi" : "Histori"}
            </button>
          ))}
        </div>
      </header>

      {tab === "konfig" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">OPD</th>
                <th className="px-3 py-2">Kode</th>
                <th className="px-3 py-2">Format</th>
                <th className="px-3 py-2 text-right">Seq {tahun}</th>
                <th className="px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {opds.map((row, i) => (
                <tr key={row.id}>
                  <td className="px-3 py-2">
                    <div className="font-medium">{row.singkatan}</div>
                    <div className="text-xs text-muted-foreground">{row.nama}</div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.nomor_surat_kode ?? ""}
                      onChange={(e) => {
                        const next = [...opds];
                        next[i] = { ...row, nomor_surat_kode: e.target.value };
                        setOpds(next);
                      }}
                      className="h-8 w-20 rounded border border-border bg-background px-2 text-xs"
                      placeholder="470"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.nomor_surat_format ?? ""}
                      onChange={(e) => {
                        const next = [...opds];
                        next[i] = { ...row, nomor_surat_format: e.target.value };
                        setOpds(next);
                      }}
                      className="h-8 w-full min-w-[260px] rounded border border-border bg-background px-2 font-mono text-xs"
                      placeholder="{kode}/{seq}/{singkatan}/{tahun}"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{row.last_number}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => onPreview(row)}
                        className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => onSave(row)}
                        disabled={busy === row.id}
                        className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" /> Simpan
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {opds.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    Memuat…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="border-t border-border p-3 text-xs text-muted-foreground">
            Placeholder yang didukung: <code>{"{kode}"}</code>, <code>{"{seq}"}</code>,{" "}
            <code>{"{singkatan}"}</code>, <code>{"{tahun}"}</code>
          </div>
        </div>
      )}

      {tab === "histori" && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadHistori()}
                placeholder="Cari nomor surat…"
                className="h-9 w-72 rounded-md border border-border bg-background pl-7 pr-3 text-sm"
              />
            </div>
            <button
              onClick={loadHistori}
              className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-xs hover:bg-muted"
            >
              <RefreshCw className={`h-3 w-3 ${loadingHistori ? "animate-spin" : ""}`} /> Cari
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Nomor</th>
                  <th className="px-3 py-2">Tahun</th>
                  <th className="px-3 py-2">Permohonan</th>
                  <th className="px-3 py-2">Diterbitkan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingHistori && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                      Memuat…
                    </td>
                  </tr>
                )}
                {!loadingHistori && issued.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                      Tidak ada hasil.
                    </td>
                  </tr>
                )}
                {issued.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 font-mono text-xs">{r.nomor}</td>
                    <td className="px-3 py-2 text-xs">{r.tahun}</td>
                    <td className="px-3 py-2 text-xs font-mono">
                      {r.permohonan_id?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {new Date(r.issued_at).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
