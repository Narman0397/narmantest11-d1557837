// Admin: daftar dokumen Kedaluwarsa & Dicabut.
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listExpiredDocuments, listRevokedDocuments } from "@/features/digital-signature";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/digital-signature/status")({
  component: Page,
});

function Page() {
  const fetchExpired = useServerFn(listExpiredDocuments);
  const fetchRevoked = useServerFn(listRevokedDocuments);
  const expQ = useQuery({ queryKey: ["dsig", "expired"], queryFn: () => fetchExpired() });
  const revQ = useQuery({ queryKey: ["dsig", "revoked"], queryFn: () => fetchRevoked() });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Dokumen Kedaluwarsa <Badge variant="outline">{expQ.data?.expired.length ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ditandatangani</TableHead>
                <TableHead>Kadaluarsa</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(expQ.data?.expired ?? []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">
                    {s.verification_token.slice(0, 16)}…
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-amber-600">
                      {s.status === "expired" ? "EXPIRED" : "Akan Expired"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(s.signed_at).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    {s.expires_at ? new Date(s.expires_at).toLocaleString("id-ID") : "-"}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`/verify/${s.verification_token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline"
                    >
                      Verifikasi
                    </a>
                  </TableCell>
                </TableRow>
              ))}
              {(expQ.data?.expired.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Tidak ada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Dokumen Dicabut <Badge variant="outline">{revQ.data?.revoked.length ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Tanggal Cabut</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(revQ.data?.revoked ?? []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">
                    {s.verification_token.slice(0, 16)}…
                  </TableCell>
                  <TableCell>
                    {s.revoked_at ? new Date(s.revoked_at).toLocaleString("id-ID") : "-"}
                  </TableCell>
                  <TableCell className="max-w-md truncate">{s.revoke_reason ?? "-"}</TableCell>
                  <TableCell>
                    <a
                      href={`/verify/${s.verification_token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline"
                    >
                      Verifikasi
                    </a>
                  </TableCell>
                </TableRow>
              ))}
              {(revQ.data?.revoked.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Tidak ada.
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
