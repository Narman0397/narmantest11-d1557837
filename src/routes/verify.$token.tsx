// Public verification portal: /verify/$token
// - Memuat status (VALID / EXPIRED / REVOKED / INVALID) dari server.
// - Verifikasi ulang via UPLOAD PDF: SERVER yang menghitung SHA-256 (tidak percaya client).
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { verifyByToken, verifyUploadedPdf } from "@/features/digital-signature";
import { DocumentVerifyCard } from "@/features/digital-signature/components/DocumentVerifyCard";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/verify/$token")({
  head: ({ params }) => ({
    meta: [
      { title: `Verifikasi Dokumen ${params.token.slice(0, 8)}` },
      {
        name: "description",
        content: "Halaman verifikasi keaslian dokumen resmi (server-side hash).",
      },
    ],
  }),
  component: Page,
});

type ValidData = {
  document_title: string;
  document_type: string;
  document_number: string | null;
  signed_at: string;
  expires_at: string | null;
  signer_name: string;
  signer_nip: string | null;
  signer_position: string | null;
  document_hash: string;
  verification_token: string;
  verification_count: number;
  revoke_reason: string | null;
  revoked_at: string | null;
};
type Loaded =
  | { state: "loading" }
  | { state: "invalid"; reason: string }
  | { state: "valid" | "expired" | "revoked"; data: ValidData };

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function Page() {
  const { token } = Route.useParams();
  const verify = useServerFn(verifyByToken);
  const verifyUpload = useServerFn(verifyUploadedPdf);
  const [state, setState] = useState<Loaded>({ state: "loading" });
  const [reUpload, setReUpload] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = (await verify({ data: { token } })) as {
          valid: boolean;
          reason?: string;
          signed?: {
            document: { title: string; document_type: string };
            signed_at: string;
            expires_at: string | null;
            document_hash: string;
            verification_token: string;
            verification_count: number;
            revoke_reason: string | null;
            revoked_at: string | null;
          };
          signer?: { full_name: string; nip: string | null; position: string | null } | null;
        };
        if (!r.signed) {
          setState({ state: "invalid", reason: r.reason ?? "not_found" });
          return;
        }
        const s = r.signed;
        const data: ValidData = {
          document_title: s.document.title,
          document_type: s.document.document_type,
          document_number: null,
          signed_at: s.signed_at,
          expires_at: s.expires_at,
          signer_name: r.signer?.full_name ?? "—",
          signer_nip: r.signer?.nip ?? null,
          signer_position: r.signer?.position ?? null,
          document_hash: s.document_hash,
          verification_token: s.verification_token,
          verification_count: s.verification_count,
          revoke_reason: s.revoke_reason,
          revoked_at: s.revoked_at,
        };
        if (r.valid) setState({ state: "valid", data });
        else if (r.reason === "revoked") setState({ state: "revoked", data });
        else if (r.reason === "expired") setState({ state: "expired", data });
        else setState({ state: "invalid", reason: r.reason ?? "invalid" });
      } catch (e) {
        setState({ state: "invalid", reason: e instanceof Error ? e.message : "Gagal verifikasi" });
      }
    })();
  }, [token, verify]);

  async function reVerify() {
    if (!reUpload) return;
    if (reUpload.size === 0) {
      toast.error("File kosong");
      return;
    }
    if (reUpload.size > MAX_UPLOAD_BYTES) {
      toast.error("PDF melebihi 20MB");
      return;
    }
    if (reUpload.type && reUpload.type !== "application/pdf") {
      toast.error("File harus PDF");
      return;
    }
    setBusy(true);
    try {
      const bytes = new Uint8Array(await reUpload.arrayBuffer());
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const r = await verifyUpload({ data: { pdfBase64: btoa(bin), token } });
      if (r.match) {
        toast.success(
          `Dokumen COCOK. Ditandatangani ${new Date(r.signed_at).toLocaleString("id-ID")}`,
        );
      } else if (r.reason === "revoked") {
        toast.error("Dokumen cocok tetapi telah DICABUT.");
      } else if (r.reason === "expired") {
        toast.warning("Dokumen cocok tetapi telah KEDALUWARSA.");
      } else {
        toast.error(
          "Dokumen telah dimodifikasi atau tidak sesuai dengan dokumen asli yang diterbitkan.",
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal verifikasi unggahan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 space-y-6 py-8">
        <DocumentVerifyCard {...(state as Parameters<typeof DocumentVerifyCard>[0])} />
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Verifikasi Ulang dengan Upload PDF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setReUpload(e.target.files?.[0] ?? null)}
            />
            <Button onClick={reVerify} disabled={!reUpload || busy}>
              {busy ? "Memverifikasi…" : "Verifikasi Server-Side"}
            </Button>
            <p className="text-xs text-muted-foreground">
              PDF diunggah ke server. Server menghitung SHA-256 dan membandingkan dengan registry
              resmi (client hash tidak dipercaya).
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
