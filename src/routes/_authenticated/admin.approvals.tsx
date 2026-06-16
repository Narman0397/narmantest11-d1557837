// Halaman Persetujuan Akun (super_admin, admin_pemda, admin_opd, admin_desa).
// Menggantikan flow lama verifikasi staff yang langsung insert role saat signup.
import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, ShieldCheck, X, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useAuth } from "@/lib/auth-context";
import {
  listPendingApprovals,
  approveUserAccount,
  rejectUserAccount,
} from "@/lib/approvals.functions";

export const Route = createFileRoute("/_authenticated/admin/approvals")({
  head: () => ({
    meta: [{ title: "Persetujuan Akun — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <AdminGuard>
      <ApprovalsPage />
    </AdminGuard>
  ),
});

type Row = Awaited<ReturnType<typeof listPendingApprovals>>["rows"][number];
type Scope = "all" | "admin_opd" | "admin_desa" | "asn" | "warga";

const SCOPE_LABEL: Record<Scope, string> = {
  all: "Semua",
  admin_opd: "Admin OPD",
  admin_desa: "Admin Desa",
  asn: "ASN",
  warga: "Warga",
};

function ApprovalsPage() {
  const { isSuperAdmin, isAdminPemda, isAdminOpd, isAdminDesa } = useAuth();
  const tabs = useMemo(() => {
    const list: Scope[] = ["all"];
    if (isSuperAdmin || isAdminPemda) list.push("admin_opd", "admin_desa", "asn", "warga");
    else {
      if (isAdminOpd) list.push("asn");
      if (isAdminDesa) list.push("warga");
    }
    return list;
  }, [isSuperAdmin, isAdminPemda, isAdminOpd, isAdminDesa]);

  const [scope, setScope] = useState<Scope>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listPendingApprovals({ data: { scope } });
      setRows(r.rows as Row[]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      (r.nama_lengkap ?? "").toLowerCase().includes(s) ||
      (r.email ?? "").toLowerCase().includes(s) ||
      (r.nik ?? "").includes(s) ||
      (r.nip ?? "").includes(s)
    );
  });

  async function approve(r: Row) {
    const role = r.requested_role as "warga" | "asn" | "admin_opd" | "admin_desa";
    if (!confirm(`Setujui ${r.nama_lengkap ?? r.email} sebagai ${role}?`)) return;
    setBusyId(r.id);
    try {
      await approveUserAccount({
        data: { user_id: r.id, role, method: "manual" },
      });
      toast.success("Akun disetujui");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }
  async function reject(r: Row) {
    const reason = prompt("Alasan penolakan (min. 5 karakter):");
    if (!reason || reason.trim().length < 5) return;
    setBusyId(r.id);
    try {
      await rejectUserAccount({ data: { user_id: r.id, reason: reason.trim() } });
      toast.success("Akun ditolak");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell breadcrumb={[{ label: "Persetujuan Akun" }]}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Persetujuan Akun</h1>
          <p className="text-sm text-muted-foreground">
            Setujui pendaftaran akun. Role baru hanya aktif setelah persetujuan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama / email / NIK / NIP"
              className="h-9 w-72 rounded-md border border-border bg-card pl-8 pr-3 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setScope(t)}
            className={`h-8 rounded-full px-3 text-xs font-semibold ${
              scope === t
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground"
            }`}
          >
            {SCOPE_LABEL[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid h-40 place-items-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          Tidak ada akun yang menunggu persetujuan.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Nama</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">NIK / NIP</th>
                <th className="px-3 py-2 text-left">OPD / Desa</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Tgl Daftar</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-3 py-2 font-medium">{r.nama_lengkap ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.email}</td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                      {r.requested_role ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.nik && <div>NIK: {r.nik}</div>}
                    {r.nip && <div>NIP: {r.nip}</div>}
                    {r.asn_type && <div className="text-muted-foreground">{r.asn_type}</div>}
                    {r.jabatan_nama && (
                      <div className="text-muted-foreground">{r.jabatan_nama}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.opd_nama ?? r.desa ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span
                      className={`rounded px-2 py-0.5 font-semibold ${
                        r.verification_status === "rejected"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {r.verification_status}
                    </span>
                    {r.rejection_reason && (
                      <div className="mt-1 text-destructive">{r.rejection_reason}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        disabled={busyId === r.id}
                        onClick={() => approve(r)}
                        className="inline-flex h-8 items-center gap-1 rounded-md bg-emerald-600 px-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Setujui
                      </button>
                      <button
                        disabled={busyId === r.id}
                        onClick={() => reject(r)}
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-destructive/40 px-2 text-xs font-semibold text-destructive disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" /> Tolak
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
