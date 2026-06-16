// CRUD Master Jabatan (super_admin / admin_pemda)
import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminGuard } from "@/components/admin/AdminGuard";
import {
  listMasterJabatan,
  upsertMasterJabatan,
  deleteMasterJabatan,
} from "@/lib/master-jabatan.functions";

export const Route = createFileRoute("/_authenticated/admin/master-jabatan")({
  head: () => ({
    meta: [{ title: "Master Jabatan — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

type Row = {
  id: string;
  kode: string;
  nama: string;
  kategori: string | null;
  urutan: number;
  aktif: boolean;
};

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Row> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listMasterJabatan();
      setRows((r.rows as Row[]) ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!editing) return;
    try {
      await upsertMasterJabatan({
        data: {
          id: editing.id,
          kode: (editing.kode ?? "").toUpperCase(),
          nama: editing.nama ?? "",
          kategori: editing.kategori ?? null,
          urutan: editing.urutan ?? 0,
          aktif: editing.aktif ?? true,
        },
      });
      toast.success("Disimpan");
      setEditing(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function remove(id: string) {
    if (!confirm("Hapus jabatan ini?")) return;
    try {
      await deleteMasterJabatan({ data: { id } });
      toast.success("Dihapus");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <AdminShell breadcrumb={[{ label: "Master Jabatan" }]}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Master Jabatan</h1>
          <p className="text-sm text-muted-foreground">
            Daftar jabatan ASN yang dapat dipilih saat registrasi & approval.
          </p>
        </div>
        <button
          onClick={() => setEditing({ kode: "", nama: "", urutan: rows.length * 10 + 10, aktif: true })}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-gradient-primary px-3 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Tambah Jabatan
        </button>
      </div>

      {loading ? (
        <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Kode</th>
                <th className="px-3 py-2 text-left">Nama</th>
                <th className="px-3 py-2 text-left">Kategori</th>
                <th className="px-3 py-2 text-left">Urutan</th>
                <th className="px-3 py-2 text-left">Aktif</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs">{r.kode}</td>
                  <td className="px-3 py-2 font-medium">{r.nama}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.kategori ?? "—"}</td>
                  <td className="px-3 py-2">{r.urutan}</td>
                  <td className="px-3 py-2">{r.aktif ? "Ya" : "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(r)} className="rounded p-1 hover:bg-muted">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        className="rounded p-1 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="mb-3 font-display text-lg font-bold">
              {editing.id ? "Ubah" : "Tambah"} Jabatan
            </h2>
            <div className="grid gap-3 text-sm">
              <label className="grid gap-1">
                <span>Kode (huruf besar / angka / _)</span>
                <input
                  className="h-9 rounded-md border border-border bg-surface px-3"
                  value={editing.kode ?? ""}
                  onChange={(e) => setEditing({ ...editing, kode: e.target.value.toUpperCase() })}
                />
              </label>
              <label className="grid gap-1">
                <span>Nama</span>
                <input
                  className="h-9 rounded-md border border-border bg-surface px-3"
                  value={editing.nama ?? ""}
                  onChange={(e) => setEditing({ ...editing, nama: e.target.value })}
                />
              </label>
              <label className="grid gap-1">
                <span>Kategori</span>
                <input
                  className="h-9 rounded-md border border-border bg-surface px-3"
                  value={editing.kategori ?? ""}
                  onChange={(e) => setEditing({ ...editing, kategori: e.target.value })}
                />
              </label>
              <label className="grid gap-1">
                <span>Urutan</span>
                <input
                  type="number"
                  className="h-9 rounded-md border border-border bg-surface px-3"
                  value={editing.urutan ?? 0}
                  onChange={(e) => setEditing({ ...editing, urutan: Number(e.target.value) })}
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.aktif ?? true}
                  onChange={(e) => setEditing({ ...editing, aktif: e.target.checked })}
                />
                Aktif
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="h-9 rounded-md border border-border px-3 text-sm"
              >
                Batal
              </button>
              <button
                onClick={save}
                className="h-9 rounded-md bg-gradient-primary px-3 text-sm font-semibold text-primary-foreground"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
