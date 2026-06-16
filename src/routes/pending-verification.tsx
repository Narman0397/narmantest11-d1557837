// Halaman pending verification — ditampilkan bagi user yang sudah login tetapi
// akunnya belum diverifikasi. Warga melihat QR code; staf (asn/admin_opd/admin_desa)
// melihat pesan menunggu approval. User yang sudah verified akan diredirect ke beranda.
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Loader2, ShieldCheck, ShieldAlert, Clock, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/site/PageShell";
import { getMyVerificationState } from "@/lib/approvals.functions";
import { getMyVerificationToken } from "@/lib/verification.functions";

export const Route = createFileRoute("/pending-verification")({
  head: () => ({
    meta: [
      { title: "Menunggu Verifikasi Akun" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: () => {
    // Akan dicek lagi di komponen (butuh sesi client-side).
    return {};
  },
  component: PendingPage,
});

type State = {
  status: string;
  requested_role: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  verification_method: string | null;
  nama_lengkap: string | null;
  desa: string | null;
};

function PendingPage() {
  const { user, loading, signOut } = useAuth();
  const [state, setState] = useState<State | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      window.location.assign("/auth");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const s = (await getMyVerificationState()) as State;
        if (cancelled) return;
        setState(s);
        if (s.status === "verified") {
          window.location.assign("/");
          return;
        }
        if (s.requested_role === "warga" && s.status !== "rejected") {
          const t = await getMyVerificationToken();
          if (!cancelled && !t.used) setQrToken(t.token);
        }
      } finally {
        if (!cancelled) setLoadingState(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  const qrSrc = useMemo(() => {
    if (!qrToken) return null;
    const payload = encodeURIComponent(qrToken);
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${payload}`;
  }, [qrToken]);

  if (loading || loadingState) {
    return (
      <PageShell>
        <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" /> Memuat status verifikasi…
        </div>
      </PageShell>
    );
  }
  if (!state) return null;

  const isRejected = state.status === "rejected";
  const isWarga = state.requested_role === "warga";
  const isStaff = !isWarga;

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-12 w-12 place-items-center rounded-full ${
                isRejected ? "bg-destructive/10 text-destructive" : "bg-primary-soft text-primary"
              }`}
            >
              {isRejected ? <ShieldAlert className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {isRejected
                  ? "Permohonan Akun Ditolak"
                  : isWarga
                    ? "Verifikasi Akun Warga"
                    : "Menunggu Persetujuan"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Halo {state.nama_lengkap ?? user?.email}, status akun Anda: <b>{state.status}</b>
              </p>
            </div>
          </div>

          {isRejected ? (
            <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="font-semibold text-destructive">Alasan penolakan:</p>
              <p className="mt-1">{state.rejection_reason ?? "—"}</p>
              <p className="mt-3 text-muted-foreground">
                Silakan hubungi admin desa / OPD / super admin untuk informasi lebih lanjut.
              </p>
            </div>
          ) : isWarga ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-border bg-surface p-4 text-sm">
                <p>
                  Datang ke kantor desa <b>{state.desa ?? "—"}</b> dan tunjukkan QR di bawah ini
                  kepada Admin Desa untuk diverifikasi. Setelah diverifikasi, akun Anda otomatis
                  aktif dan dapat mengajukan permohonan layanan.
                </p>
              </div>
              {qrSrc ? (
                <div className="grid place-items-center gap-3 rounded-lg border border-border bg-white p-6">
                  <img src={qrSrc} alt="QR Verifikasi" width={280} height={280} />
                  <code className="select-all break-all rounded bg-muted px-2 py-1 text-xs">
                    {qrToken}
                  </code>
                  <p className="text-xs text-muted-foreground">
                    QR berlaku 30 hari. Jika kedaluwarsa, akan otomatis dibuat ulang saat halaman ini
                    dibuka kembali.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Memuat QR…</p>
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm">
              <p>
                Permohonan akun Anda sebagai{" "}
                <b className="capitalize">{state.requested_role?.replace("_", " ")}</b> sedang
                menunggu persetujuan{" "}
                {state.requested_role === "asn"
                  ? "Admin OPD terkait"
                  : "Super Admin / Admin Pemda"}
                . Anda akan otomatis dapat masuk ke menu sesuai role setelah disetujui.
              </p>
              <p className="mt-2 text-muted-foreground">
                Mohon menunggu — proses biasanya berlangsung dalam 1×24 jam kerja.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <RefreshCw className="h-4 w-4" /> Periksa status
            </button>
            <button
              onClick={async () => {
                await signOut();
                window.location.assign("/");
              }}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
            {isStaff && (
              <Link
                to="/"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted"
              >
                <ShieldCheck className="h-4 w-4" /> Kembali ke beranda
              </Link>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// Avoid unused-import warning for redirect.
void redirect;
void supabase;
