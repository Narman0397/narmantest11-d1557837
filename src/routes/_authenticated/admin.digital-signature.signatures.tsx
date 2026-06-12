import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  uploadSignatureSpecimen,
  listMySignatures,
  revokeSignature,
  listCertificates,
  issueCertificate,
  revokeCertificate,
} from "@/features/digital-signature";
import { SignatureCanvasPad } from "@/features/digital-signature/components/SignatureCanvasPad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/digital-signature/signatures")({
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const upload = useServerFn(uploadSignatureSpecimen);
  const list = useServerFn(listMySignatures);
  const revoke = useServerFn(revokeSignature);
  const sigsQ = useQuery({ queryKey: ["dsig", "my-sigs"], queryFn: () => list() });

  const uploadM = useMutation({
    mutationFn: (pngBase64: string) => upload({ data: { pngBase64 } }),
    onSuccess: () => {
      toast.success("Spesimen disimpan");
      qc.invalidateQueries({ queryKey: ["dsig", "my-sigs"] });
    },
    onError: (e) => toast.error(e.message),
  });
  const revokeM = useMutation({
    mutationFn: (id: string) => revoke({ data: { id } }),
    onSuccess: () => {
      toast.success("Spesimen dinonaktifkan");
      qc.invalidateQueries({ queryKey: ["dsig", "my-sigs"] });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buat Spesimen Tanda Tangan</CardTitle>
        </CardHeader>
        <CardContent>
          <SignatureCanvasPad
            onSave={async (b64) => {
              await uploadM.mutateAsync(b64);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spesimen Saya</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sigsQ.data?.signatures ?? []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.signature_path}</TableCell>
                  <TableCell>
                    {s.is_active ? <Badge>Aktif</Badge> : <Badge variant="outline">Nonaktif</Badge>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(s.created_at).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    {s.is_active && (
                      <Button size="sm" variant="outline" onClick={() => revokeM.mutate(s.id)}>
                        Nonaktifkan
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(sigsQ.data?.signatures.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Belum ada spesimen.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CertificatePanel />
    </div>
  );
}

function CertificatePanel() {
  const qc = useQueryClient();
  const list = useServerFn(listCertificates);
  const issue = useServerFn(issueCertificate);
  const revoke = useServerFn(revokeCertificate);
  const certsQ = useQuery({ queryKey: ["dsig", "certs"], queryFn: () => list() });
  const [form, setForm] = useState({
    user_id: "",
    full_name: "",
    nip: "",
    position: "",
    expired_at: "",
  });

  const issueM = useMutation({
    mutationFn: () =>
      issue({
        data: {
          user_id: form.user_id,
          full_name: form.full_name,
          nip: form.nip || null,
          position: form.position || null,
          expired_at: form.expired_at ? new Date(form.expired_at).toISOString() : null,
        },
      }),
    onSuccess: () => {
      toast.success("Sertifikat diterbitkan");
      qc.invalidateQueries({ queryKey: ["dsig", "certs"] });
      setForm({ user_id: "", full_name: "", nip: "", position: "", expired_at: "" });
    },
    onError: (e) => toast.error(e.message),
  });
  const revokeM = useMutation({
    mutationFn: (id: string) => revoke({ data: { id } }),
    onSuccess: () => {
      toast.success("Sertifikat dicabut");
      qc.invalidateQueries({ queryKey: ["dsig", "certs"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sertifikat Internal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label>User ID</Label>
            <Input
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
              placeholder="UUID user"
            />
          </div>
          <div>
            <Label>Nama Lengkap</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <Label>NIP</Label>
            <Input value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} />
          </div>
          <div>
            <Label>Jabatan</Label>
            <Input
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </div>
          <div>
            <Label>Berlaku Sampai</Label>
            <Input
              type="date"
              value={form.expired_at}
              onChange={(e) => setForm({ ...form, expired_at: e.target.value })}
            />
          </div>
        </div>
        <Button
          onClick={() => issueM.mutate()}
          disabled={!form.user_id || !form.full_name || issueM.isPending}
        >
          Terbitkan
        </Button>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>NIP</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(certsQ.data?.certificates ?? []).map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.full_name}</TableCell>
                <TableCell>{c.nip ?? "-"}</TableCell>
                <TableCell>{c.position ?? "-"}</TableCell>
                <TableCell>
                  {c.is_active ? <Badge>Aktif</Badge> : <Badge variant="outline">Nonaktif</Badge>}
                </TableCell>
                <TableCell>
                  {c.is_active && (
                    <Button size="sm" variant="outline" onClick={() => revokeM.mutate(c.id)}>
                      Cabut
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
