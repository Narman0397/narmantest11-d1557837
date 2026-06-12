// Tampilan VALID / EXPIRED / REVOKED / INVALID untuk halaman verifikasi publik.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ValidData = {
  document_title: string;
  document_type: string;
  document_number: string | null;
  signed_at: string;
  expires_at?: string | null;
  signer_name: string;
  signer_nip: string | null;
  signer_position: string | null;
  document_hash: string;
  verification_token: string;
  verification_count: number;
  revoke_reason?: string | null;
  revoked_at?: string | null;
};

type Props =
  | { state: "loading" }
  | { state: "invalid"; reason: string }
  | { state: "revoked"; data: ValidData }
  | { state: "expired"; data: ValidData }
  | { state: "valid"; data: ValidData };

export function DocumentVerifyCard(props: Props) {
  const badge =
    props.state === "valid" ? (
      <Badge className="bg-emerald-600">VALID</Badge>
    ) : props.state === "expired" ? (
      <Badge className="bg-amber-600">KEDALUWARSA</Badge>
    ) : props.state === "revoked" ? (
      <Badge variant="destructive">DICABUT</Badge>
    ) : props.state === "invalid" ? (
      <Badge variant="destructive">TIDAK VALID</Badge>
    ) : null;

  const data =
    props.state === "valid" || props.state === "expired" || props.state === "revoked"
      ? props.data
      : null;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Verifikasi Dokumen Resmi</span>
          {badge}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {props.state === "loading" && <p>Memuat…</p>}
        {props.state === "invalid" && (
          <p className="text-destructive">
            {props.reason === "not_found" && "Token tidak ditemukan."}
            {props.reason === "hash_mismatch" &&
              "Dokumen telah dimodifikasi atau tidak sesuai dengan dokumen asli yang diterbitkan."}
            {props.reason !== "not_found" &&
              props.reason !== "hash_mismatch" &&
              `Tidak valid: ${props.reason}`}
          </p>
        )}
        {props.state === "revoked" && data && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <p className="font-medium text-destructive">
              Penandatanganan dokumen ini telah DICABUT.
            </p>
            {data.revoke_reason && (
              <p className="mt-1">
                <span className="text-muted-foreground">Alasan:</span> {data.revoke_reason}
              </p>
            )}
            {data.revoked_at && (
              <p>
                <span className="text-muted-foreground">Tanggal pencabutan:</span>{" "}
                {new Date(data.revoked_at).toLocaleString("id-ID")}
              </p>
            )}
          </div>
        )}
        {props.state === "expired" && data && (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Dokumen ini telah KEDALUWARSA.
            </p>
            {data.expires_at && (
              <p>
                <span className="text-muted-foreground">Kadaluarsa pada:</span>{" "}
                {new Date(data.expires_at).toLocaleString("id-ID")}
              </p>
            )}
          </div>
        )}
        {data && (
          <dl className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Judul</dt>
            <dd className="font-medium">{data.document_title}</dd>
            <dt className="text-muted-foreground">Jenis Dokumen</dt>
            <dd>{data.document_type}</dd>
            <dt className="text-muted-foreground">Nomor Dokumen</dt>
            <dd>{data.document_number ?? "-"}</dd>
            <dt className="text-muted-foreground">Ditandatangani</dt>
            <dd>{new Date(data.signed_at).toLocaleString("id-ID")}</dd>
            {data.expires_at && (
              <>
                <dt className="text-muted-foreground">Kadaluarsa</dt>
                <dd>{new Date(data.expires_at).toLocaleString("id-ID")}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Penandatangan</dt>
            <dd>{data.signer_name}</dd>
            <dt className="text-muted-foreground">NIP</dt>
            <dd>{data.signer_nip ?? "-"}</dd>
            <dt className="text-muted-foreground">Jabatan</dt>
            <dd>{data.signer_position ?? "-"}</dd>
            <dt className="text-muted-foreground">Verifikasi ke-</dt>
            <dd>{data.verification_count}</dd>
            <dt className="text-muted-foreground">SHA-256</dt>
            <dd className="break-all font-mono text-xs">{data.document_hash}</dd>
            <dt className="text-muted-foreground">Token</dt>
            <dd className="break-all font-mono text-xs">{data.verification_token}</dd>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
