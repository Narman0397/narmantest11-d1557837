import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listDocuments,
  listSignedDocuments,
  signDocument,
  revokeSignedDocument,
  getSignedDocumentUrl,
  uploadManualDocument,
} from "@/features/digital-signature";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const Route = createFileRoute("/_authenticated/admin/digital-signature/documents")({
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const fetchDocs = useServerFn(listDocuments);
  const fetchSigned = useServerFn(listSignedDocuments);
  const sign = useServerFn(signDocument);
  const revoke = useServerFn(revokeSignedDocument);
  const url = useServerFn(getSignedDocumentUrl);
  const upload = useServerFn(uploadManualDocument);

  const docsQ = useQuery({ queryKey: ["dsig", "docs"], queryFn: () => fetchDocs() });
  const signedQ = useQuery({ queryKey: ["dsig", "signed"], queryFn: () => fetchSigned() });

  const signedMap = new Map((signedQ.data?.signed ?? []).map((s) => [s.document_id, s]));

  const signM = useMutation({
    mutationFn: (v: { document_id: string; document_number?: string }) => sign({ data: v }),
    onSuccess: (r) => {
      toast.success(`Ditandatangani: ${r.verify_url}`);
      qc.invalidateQueries({ queryKey: ["dsig"] });
    },
    onError: (e) => toast.error(e.message),
  });
  const revokeM = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      revoke({ data: { id, reason } }),
    onSuccess: () => {
      toast.success("Penandatanganan dicabut");
      qc.invalidateQueries({ queryKey: ["dsig"] });
    },
    onError: (e) => toast.error(e.message),
  });
  const urlM = useMutation({
    mutationFn: (id: string) => url({ data: { signed_document_id: id } }),
    onSuccess: (r) => {
      if (r.url) window.open(r.url, "_blank");
    },
  });

  const [up, setUp] = useState({ title: "", document_type: "umum", file: null as File | null });
  const uploadM = useMutation({
    mutationFn: async () => {
      if (!up.file) throw new Error("Pilih file PDF");
      const bytes = new Uint8Array(await up.file.arrayBuffer());
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const base64 = btoa(bin);
      return upload({
        data: { title: up.title, document_type: up.document_type, pdfBase64: base64 },
      });
    },
    onSuccess: () => {
      toast.success("Dokumen diunggah");
      setUp({ title: "", document_type: "umum", file: null });
      qc.invalidateQueries({ queryKey: ["dsig", "docs"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Dokumen PDF (Mode B)</CardTitle>
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
          <CardTitle>Daftar Dokumen</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead>Status TTD</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(docsQ.data?.documents ?? []).map((d) => {
                const s = signedMap.get(d.id);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell>{d.document_type}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {d.generated_by_system ? "Sistem (A)" : "Upload (B)"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s ? (
                        <Badge variant={s.status === "signed" ? "default" : "destructive"}>
                          {s.status}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="space-x-2">
                      {!s && (
                        <Button size="sm" onClick={() => signM.mutate({ document_id: d.id })}>
                          Tandatangani
                        </Button>
                      )}
                      {s && s.status === "signed" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => urlM.mutate(s.id)}>
                            Buka PDF
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const reason =
                                window
                                  .prompt("Alasan pencabutan (minimal 10 karakter):", "")
                                  ?.trim() ?? "";
                              if (reason.length < 10) {
                                toast.error("Alasan minimal 10 karakter");
                                return;
                              }
                              revokeM.mutate({ id: s.id, reason });
                            }}
                          >
                            Cabut
                          </Button>
                          <a
                            href={`/verify/${s.verification_token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary underline"
                          >
                            Verifikasi
                          </a>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(docsQ.data?.documents.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Belum ada dokumen.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
