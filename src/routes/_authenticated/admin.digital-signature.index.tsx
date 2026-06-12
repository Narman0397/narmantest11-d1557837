import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listSignedDocuments, listDocuments } from "@/features/digital-signature";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/digital-signature/")({
  component: DashboardPage,
});

function DashboardPage() {
  const fetchSigned = useServerFn(listSignedDocuments);
  const fetchDocs = useServerFn(listDocuments);
  const signedQ = useQuery({ queryKey: ["dsig", "signed"], queryFn: () => fetchSigned() });
  const docsQ = useQuery({ queryKey: ["dsig", "docs"], queryFn: () => fetchDocs() });

  const totalSigned = signedQ.data?.signed.filter((r) => r.status === "signed").length ?? 0;
  const totalRevoked = signedQ.data?.signed.filter((r) => r.status === "revoked").length ?? 0;
  const totalDocs = docsQ.data?.documents.length ?? 0;
  const totalVerif =
    signedQ.data?.signed.reduce((acc, r) => acc + (r.verification_count ?? 0), 0) ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <StatCard label="Dokumen Terdaftar" value={totalDocs} />
      <StatCard label="Ditandatangani" value={totalSigned} />
      <StatCard label="Dicabut" value={totalRevoked} />
      <StatCard label="Total Verifikasi" value={totalVerif} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
