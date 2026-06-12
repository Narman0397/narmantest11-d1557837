import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Save, Trash2, Search, RefreshCw } from "lucide-react";
import type { Target } from "./types";
import {
  ROLES,
  ROLE_LABEL,
  ASN_TYPES,
  ASN_TYPE_LABEL,
  POSITIONS,
  POSITION_LABEL,
} from "@/features/rbac/constants";
import { listOpdsForTarget, searchProfilesForTarget } from "@/lib/forms-options.functions";
import { syncAssignmentsForForm } from "@/lib/assignments.functions";

type Opd = { id: string; nama: string; singkatan: string | null };
type ProfileHit = {
  id: string;
  nama_lengkap: string;
  nip: string | null;
  opd: { nama: string | null; singkatan: string | null } | null;
};

const TYPE_LABEL: Record<Target["target_type"], string> = {
  opd: "OPD",
  role: "Role",
  asn_type: "Jenis ASN",
  position: "Jabatan Sistem",
  individu: "Individu (ASN)",
  unit_kerja: "Unit Kerja",
};

const TYPE_OPTIONS: Target["target_type"][] = ["role", "opd", "asn_type", "position", "individu"];
// unit_kerja masih dipertahankan di select hanya untuk menampilkan baris lama;
// belum bisa diresolusi karena profiles tidak memiliki kolom unit_kerja_id.

export function FormTargetsTab({
  formId,
  formStatus,
  targets,
  setTargets,
  busy,
  onSave,
}: {
  formId: string;
  formStatus: string;
  targets: Target[];
  setTargets: (t: Target[]) => void;
  busy: boolean;
  onSave: () => void;
}) {
  const [opds, setOpds] = useState<Opd[]>([]);
  const [syncing, setSyncing] = useState(false);
  // map user_id → display label, untuk render row individu yang sudah tersimpan.
  const [userLabels, setUserLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const r = (await listOpdsForTarget()) as unknown as { rows: Opd[] };
        setOpds(r.rows);
      } catch {
        /* silent */
      }
    })();
  }, []);

  // Ambil label user untuk target_type=individu yang belum dikenal.
  useEffect(() => {
    const ids = targets
      .filter((t) => t.target_type === "individu" && /^[0-9a-f-]{36}$/i.test(t.target_value))
      .map((t) => t.target_value)
      .filter((id) => !userLabels[id]);
    if (ids.length === 0) return;
    (async () => {
      try {
        // Search per id via search (gunakan id sebagai q — NIP/nama tidak cocok, jadi tampilkan ringkas)
        // Sebagai workaround sederhana: tandai "(user)" agar tidak kosong.
        setUserLabels((prev) => {
          const next = { ...prev };
          for (const id of ids) next[id] = `User ${id.slice(0, 8)}…`;
          return next;
        });
      } catch {
        /* silent */
      }
    })();
  }, [targets, userLabels]);

  function updateRow(i: number, patch: Partial<Target>) {
    const arr = [...targets];
    arr[i] = { ...arr[i], ...patch } as Target;
    setTargets(arr);
  }

  function changeType(i: number, newType: Target["target_type"]) {
    // Reset value setiap kali tipe berubah untuk menghindari nilai yang tidak valid.
    const defaultValue =
      newType === "role"
        ? ROLES.asn
        : newType === "asn_type"
          ? ASN_TYPES.pns
          : newType === "position"
            ? POSITIONS.staff
            : "";
    updateRow(i, { target_type: newType, target_value: defaultValue });
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">
        Tentukan siapa yang harus mengisi form ini. Jika kosong, default = semua user di OPD pemilik
        form.
      </p>

      {targets.map((t, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-start">
          <select
            value={t.target_type}
            onChange={(e) => changeType(i, e.target.value as Target["target_type"])}
            className="col-span-4 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            {TYPE_OPTIONS.map((tp) => (
              <option key={tp} value={tp}>
                {TYPE_LABEL[tp]}
              </option>
            ))}
            {t.target_type === "unit_kerja" && (
              <option value="unit_kerja">{TYPE_LABEL.unit_kerja} (legacy)</option>
            )}
          </select>

          <div className="col-span-7">
            {t.target_type === "opd" && (
              <select
                value={t.target_value}
                onChange={(e) => updateRow(i, { target_value: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                <option value="">-- pilih OPD --</option>
                {opds.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.singkatan ? `${o.singkatan} — ` : ""}
                    {o.nama}
                  </option>
                ))}
              </select>
            )}

            {t.target_type === "role" && (
              <select
                value={t.target_value}
                onChange={(e) => updateRow(i, { target_value: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                {Object.values(ROLES).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r as keyof typeof ROLE_LABEL]}
                  </option>
                ))}
              </select>
            )}

            {t.target_type === "asn_type" && (
              <select
                value={t.target_value}
                onChange={(e) => updateRow(i, { target_value: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                {Object.values(ASN_TYPES).map((v) => (
                  <option key={v} value={v}>
                    {ASN_TYPE_LABEL[v as keyof typeof ASN_TYPE_LABEL]}
                  </option>
                ))}
              </select>
            )}

            {t.target_type === "position" && (
              <select
                value={t.target_value}
                onChange={(e) => updateRow(i, { target_value: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              >
                {Object.values(POSITIONS).map((v) => (
                  <option key={v} value={v}>
                    {POSITION_LABEL[v as keyof typeof POSITION_LABEL]}
                  </option>
                ))}
              </select>
            )}

            {t.target_type === "individu" && (
              <UserPicker
                value={t.target_value}
                label={userLabels[t.target_value]}
                onPick={(u) => {
                  setUserLabels((prev) => ({
                    ...prev,
                    [u.id]: `${u.nama_lengkap}${u.nip ? ` (${u.nip})` : ""}${u.opd?.singkatan ? ` — ${u.opd.singkatan}` : ""}`,
                  }));
                  updateRow(i, { target_value: u.id });
                }}
              />
            )}
          </div>

          <button
            onClick={() => setTargets(targets.filter((_, k) => k !== i))}
            className="col-span-1 inline-flex h-9 items-center justify-center rounded-md border border-border text-destructive"
            title="Hapus baris"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          onClick={() => setTargets([...targets, { target_type: "role", target_value: ROLES.asn }])}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm"
        >
          <Plus className="h-4 w-4" /> Tambah Target
        </button>
        <button
          onClick={onSave}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Save className="h-4 w-4" /> Simpan Target
        </button>
        {formStatus === "published" && (
          <button
            onClick={async () => {
              if (
                !confirm(
                  "Sinkronkan assignment? Sistem akan membuat assignment baru bagi user yang masuk target tetapi belum punya assignment.",
                )
              )
                return;
              setSyncing(true);
              try {
                const r = (await syncAssignmentsForForm({
                  data: { form_id: formId },
                })) as unknown as { added: number };
                alert(
                  r.added > 0
                    ? `${r.added} assignment baru dibuat.`
                    : "Tidak ada user baru yang perlu di-assign.",
                );
              } catch (e) {
                alert(e instanceof Error ? e.message : "Gagal sinkronisasi");
              } finally {
                setSyncing(false);
              }
            }}
            disabled={busy || syncing}
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm"
            title="Buat assignment baru untuk user yang masuk target tetapi belum punya assignment"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} /> Sinkronkan
            Assignment
          </button>
        )}
      </div>
      {formStatus === "published" && (
        <p className="text-[11px] text-muted-foreground">
          Form sudah dipublish. Perubahan target akan memengaruhi user yang menerima assignment baru
          saat tombol <strong>Sinkronkan Assignment</strong> ditekan. Assignment lama tidak dihapus.
        </p>
      )}
    </div>
  );
}

function UserPicker({
  value,
  label,
  onPick,
}: {
  value: string;
  label?: string;
  onPick: (u: ProfileHit) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hits, setHits] = useState<ProfileHit[]>([]);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const display = useMemo(
    () => label ?? (value ? `User ${value.slice(0, 8)}…` : ""),
    [label, value],
  );

  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(async () => {
      setBusy(true);
      try {
        const r = (await searchProfilesForTarget({ data: { q: q.trim() } })) as unknown as {
          rows: ProfileHit[];
        };
        setHits(r.rows);
      } catch {
        setHits([]);
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, [q, open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-left text-sm"
      >
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <span className={display ? "" : "text-muted-foreground"}>
          {display || "Cari ASN (nama / NIP)…"}
        </span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-elevated">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ketik nama atau NIP…"
            className="w-full border-b border-border bg-background px-2 py-1.5 text-sm outline-none"
          />
          <div className="max-h-56 overflow-y-auto">
            {busy && <div className="px-3 py-2 text-xs text-muted-foreground">Mencari…</div>}
            {!busy && q.trim().length < 2 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Ketik minimal 2 karakter
              </div>
            )}
            {!busy && q.trim().length >= 2 && hits.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">Tidak ada hasil</div>
            )}
            {hits.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onPick(u);
                  setOpen(false);
                  setQ("");
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <div className="font-medium">{u.nama_lengkap}</div>
                <div className="text-xs text-muted-foreground">
                  {u.nip ?? "—"} {u.opd?.singkatan ? `• ${u.opd.singkatan}` : ""}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
