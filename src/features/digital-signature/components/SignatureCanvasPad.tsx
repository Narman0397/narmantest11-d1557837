// Komponen pad untuk membuat spesimen TTD (react-signature-canvas).
// Mengeluarkan PNG base64 (transparent) saat user klik "Simpan".
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";

export function SignatureCanvasPad({
  onSave,
}: {
  onSave: (pngBase64: string) => Promise<void> | void;
}) {
  const ref = useRef<SignatureCanvas | null>(null);
  const [saving, setSaving] = useState(false);

  function clear() {
    ref.current?.clear();
  }

  async function save() {
    if (!ref.current || ref.current.isEmpty()) return;
    setSaving(true);
    try {
      const trimmed = ref.current.getTrimmedCanvas();
      const dataUrl = trimmed.toDataURL("image/png");
      const base64 = dataUrl.split(",")[1] ?? "";
      await onSave(base64);
      ref.current.clear();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-border bg-background">
        <SignatureCanvas
          ref={(r) => {
            ref.current = r;
          }}
          penColor="#0b1220"
          canvasProps={{ width: 600, height: 200, className: "w-full h-[200px]" }}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={clear} disabled={saving}>
          Bersihkan
        </Button>
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan Spesimen"}
        </Button>
      </div>
    </div>
  );
}
