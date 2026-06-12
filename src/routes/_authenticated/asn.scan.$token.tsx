import { createFileRoute, redirect } from "@tanstack/react-router";

// Deep link saat QR kantor di-scan kamera native: arahkan ke /asn/absensi dengan token tersimpan di sessionStorage.
export const Route = createFileRoute("/_authenticated/asn/scan/$token")({
  beforeLoad: ({ params }) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("kantor_qr_token", params.token);
    }
    throw redirect({ to: "/asn/absensi" });
  },
});
