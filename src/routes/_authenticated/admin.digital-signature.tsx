import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminGuard } from "@/components/admin/AdminGuard";

export const Route = createFileRoute("/_authenticated/admin/digital-signature")({
  head: () => ({ meta: [{ title: "Tanda Tangan Digital — Admin" }] }),
  component: () => (
    <AdminGuard>
      <Layout />
    </AdminGuard>
  ),
});

function Layout() {
  const { pathname } = useLocation();
  const tabs = [
    { to: "/admin/digital-signature", label: "Dashboard", exact: true },
    { to: "/admin/digital-signature/signatures", label: "Spesimen & Sertifikat" },
    { to: "/admin/digital-signature/documents", label: "Dokumen" },
    { to: "/admin/digital-signature/status", label: "Kedaluwarsa & Dicabut" },
    { to: "/admin/digital-signature/audit", label: "Audit Trail" },
  ];
  return (
    <AdminShell breadcrumb={[{ label: "Tanda Tangan Digital" }]}>
      <div className="mb-4 flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`px-3 py-2 text-sm border-b-2 -mb-px ${active ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </AdminShell>
  );
}
