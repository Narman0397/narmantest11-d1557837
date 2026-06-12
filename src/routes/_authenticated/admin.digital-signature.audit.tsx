import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listDocumentAudit } from "@/features/digital-signature";
import { DocumentAuditTable } from "@/features/digital-signature/components/DocumentAuditTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/digital-signature/audit")({
  component: Page,
});

function Page() {
  const fetchAudit = useServerFn(listDocumentAudit);
  const q = useQuery({ queryKey: ["dsig", "audit"], queryFn: () => fetchAudit({ data: {} }) });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail Dokumen</CardTitle>
      </CardHeader>
      <CardContent>
        <DocumentAuditTable rows={q.data?.audit ?? []} />
      </CardContent>
    </Card>
  );
}
