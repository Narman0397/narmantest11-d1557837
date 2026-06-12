// Pratinjau langsung form di builder: render field menggunakan FieldRenderer
// dengan state lokal, evaluasi visible_if, dan validasi per-field on-the-fly.
import { useMemo, useState } from "react";
import {
  isFieldVisible,
  type FormField,
  type FormSchemaSnapshot,
} from "@/features/forms/schema/types";
import { buildSubmissionValidator } from "@/features/forms/schema/validator";
import { FieldRenderer } from "@/features/forms/renderer/FieldRenderer";
import { Eye, RefreshCw } from "lucide-react";

export function FormLivePreview({ fields, judul }: { fields: FormField[]; judul: string }) {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAllErrors, setShowAllErrors] = useState(false);

  const snapshot: FormSchemaSnapshot = useMemo(
    () => ({ version: 1, fields: fields.filter((f) => f.kode && f.label) }),
    [fields],
  );

  const errors = useMemo(() => {
    if (snapshot.fields.length === 0) return {} as Record<string, string>;
    const validator = buildSubmissionValidator(snapshot);
    const res = validator.safeParse(data);
    if (res.success) return {} as Record<string, string>;
    const errs: Record<string, string> = {};
    for (const issue of res.error.issues) {
      const kode = String(issue.path[0] ?? "");
      if (kode && !errs[kode]) errs[kode] = issue.message;
    }
    return errs;
  }, [data, snapshot]);

  if (snapshot.fields.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Belum ada field untuk di-pratinjau. Tambahkan field pada tab "Field".
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          Pratinjau interaktif — bukan submission asli. Isian tidak disimpan.
        </div>
        <button
          type="button"
          onClick={() => {
            setData({});
            setTouched({});
            setShowAllErrors(false);
          }}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
        >
          <RefreshCw className="h-3 w-3" /> Reset
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-semibold">{judul || "(Tanpa Judul)"}</h3>
        <div className="mt-4 space-y-4">
          {snapshot.fields.map((f) => {
            if (!isFieldVisible(f, data)) return null;
            const showErr = showAllErrors || touched[f.kode];
            return (
              <FieldRenderer
                key={f.kode}
                field={f}
                value={data[f.kode]}
                onChange={(v) => {
                  setData((d) => ({ ...d, [f.kode]: v }));
                  setTouched((t) => ({ ...t, [f.kode]: true }));
                }}
                readOnly={false}
                submissionId={null}
                files={[]}
                onFilesChanged={() => undefined}
                error={showErr ? (errors[f.kode] ?? null) : null}
              />
            );
          })}
        </div>
        <div className="mt-5 flex items-center gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setShowAllErrors(true)}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            Coba Submit
          </button>
          <span className="text-xs text-muted-foreground">
            {Object.keys(errors).length === 0
              ? "Semua field valid ✓"
              : `${Object.keys(errors).length} field belum valid`}
          </span>
        </div>
      </div>
    </div>
  );
}
