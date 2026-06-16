// Mengarahkan user yang sudah login ke /pending-verification bila akunnya
// belum diverifikasi. Aktif hanya di browser. Halaman /auth, /pending-verification,
// dan rute publik yang tidak butuh akun TETAP boleh diakses.
import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

const PUBLIC_PATHS = new Set<string>([
  "/auth",
  "/pending-verification",
  "/reset-password",
]);

function isAllowedWhileUnverified(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Halaman publik lain (beranda, layanan, data terbuka, dll) tetap boleh dibuka.
  // Hanya rute area aplikasi (/admin/*, /asn/*, /permohonan/*, /pengisian/*, /akun, /tugas/*)
  // yang dikunci.
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/asn/") ||
    pathname.startsWith("/permohonan/") ||
    pathname.startsWith("/permohonan") ||
    pathname.startsWith("/pengisian") ||
    pathname.startsWith("/tugas") ||
    pathname === "/akun"
  ) {
    return false;
  }
  return true;
}

export function VerificationGate() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user || !profile) return;
    const status = profile.verification_status;
    if (status && status !== "verified") {
      if (!isAllowedWhileUnverified(location.pathname)) {
        navigate({ to: "/pending-verification" });
      }
    }
  }, [user, profile, loading, location.pathname, navigate]);

  return null;
}
