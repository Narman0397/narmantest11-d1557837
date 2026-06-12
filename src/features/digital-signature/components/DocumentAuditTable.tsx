// Tabel audit trail dokumen.
import type { DocumentAuditRow } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function DocumentAuditTable({ rows }: { rows: DocumentAuditRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Waktu</TableHead>
          <TableHead>Aksi</TableHead>
          <TableHead>Aktor</TableHead>
          <TableHead>Dokumen</TableHead>
          <TableHead>Metadata</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono text-xs">
              {new Date(r.created_at).toLocaleString("id-ID")}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{r.action}</Badge>
            </TableCell>
            <TableCell className="font-mono text-xs">{r.actor ?? "public"}</TableCell>
            <TableCell className="font-mono text-xs">{r.document_id.slice(0, 8)}…</TableCell>
            <TableCell className="font-mono text-xs max-w-[260px] truncate">
              {JSON.stringify(r.metadata)}
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              Belum ada audit.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
