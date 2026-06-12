// ASN route: dokumen saya — upload & tandatangani.
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listMyDocuments,
  uploadManualDocument,
  signDocument,
  listSignedDocuments,
  getSignedDocumentUrl,
} from "@/features/digital-signature";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/asn/dokumen")({
  head: () => ({ meta: [{ title: "Dokumen Saya — ASN" }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const fetchDocs = useServerFn(listMyDocuments);
  const fetchSigned = useServerFn(listSignedDocuments);
  const upload = useServerFn(uploadManualDocument);
  const sign = useServerFn(signDocument);
  const urlFn = useServerFn(getSignedDocumentUrl);

  const docsQ = useQuery({ queryKey: ["dsig", "my-docs"], queryFn: () => fetchDocs() });
  const signedQ = useQuery({ queryKey: ["dsig", "signed"], queryFn: () => fetchSigned() });
  const signedMap = new Map((signedQ.data?.signed ?? []).map((s) => [s.document_id, s]));

  const [up, setUp] = useState({ title: "", document_type: "umum", file: null as File | null });
  const uploadM = useMutation({
    mutationFn: async () => {
      if (!up.file) throw new Error("Pilih file PDF");
      const bytes = new Uint8Array(await up.file.arrayBuffer());
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return upload({
        data: { title: up.title, document_type: up.document_type, pdfBase64: btoa(bin) },
      });
    },
    onSuccess: () => {
      toast.success("Dokumen diunggah");
      setUp({ title: "", document_type: "umum", file: null });
      qc.invalidateQueries({ queryKey: ["dsig", "my-docs"] });
    },
    onError: (e) => toast.error(e.message),
  });
  const signM = useMutation({
    mutationFn: (id: string) => sign({ data: { document_id: id } }),
    onSuccess: (r) => {
      toast.success("Ditandatangani");
      window.open(`/verify/${r.signed.verification_token}`, "_blank");
      qc.invalidateQueries({ queryKey: ["dsig"] });
    },
    onError: (e) => toast.error(e.message),
  });
  const urlM = useMutation({
    mutationFn: (id: string) => urlFn({ data: { signed_document_id: id } }),
    onSuccess: (r) => {
      if (r.url) window.open(r.url, "_blank");
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 space-y-6 py-6">
        <h1 className="text-2xl font-bold">Dokumen Saya</h1>

        <Card>
          <CardHeader>
            <CardTitle>Upload PDF untuk Ditandatangani</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <Label>Judul</Label>
                <Input value={up.title} onChange={(e) => setUp({ ...up, title: e.target.value })} />
              </div>
              <div>
                <Label>Jenis</Label>
                <Input
                  value={up.document_type}
                  onChange={(e) => setUp({ ...up, document_type: e.target.value })}
                />
              </div>
              <div>
                <Label>File PDF</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setUp({ ...up, file: e.target.files?.[0] ?? null })}
                />
              </div>
            </div>
            <Button
              onClick={() => uploadM.mutate()}
              disabled={!up.file || !up.title || uploadM.isPending}
            >
              Upload
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dokumen</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(docsQ.data?.documents ?? []).map((d) => {
                  const s = signedMap.get(d.id);
                  return (
                    <TableRow key={d.id}>
                      <TableCell>{d.title}</TableCell>
                      <TableCell>
                        {s ? (
                          <Badge variant={s.status === "signed" ? "default" : "destructive"}>
                            {s.status}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Belum</Badge>
                        )}
                      </TableCell>
                      <TableCell className="space-x-2">
                        {!s && (
                          <Button size="sm" onClick={() => signM.mutate(d.id)}>
                            Tandatangani
                          </Button>
                        )}
                        {s && s.status === "signed" && (
                          <Button size="sm" variant="outline" onClick={() => urlM.mutate(s.id)}>
                            Buka PDF
                          </Button>
                        )}
                        {s && (
                          <a
                            href={`/verify/${s.verification_token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary underline"
                          >
                            Verifikasi
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(docsQ.data?.documents.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Belum ada dokumen.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
