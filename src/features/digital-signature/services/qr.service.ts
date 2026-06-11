// QR generation -> PNG bytes (Uint8Array). Isomorphic via `qrcode`.
export async function generateQrPng(payload: string, width = 220): Promise<Uint8Array> {
  const QRCode = (await import("qrcode")).default;
  const dataUrl = await QRCode.toDataURL(payload, { margin: 1, width });
  const base64 = dataUrl.split(",")[1] ?? "";
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
