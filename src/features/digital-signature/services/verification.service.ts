// Token verifikasi (32 byte hex, crypto-random).
export function generateVerificationToken(byteLen = 32): string {
  const b = new Uint8Array(byteLen);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

export function verifyUrlFor(origin: string, token: string): string {
  const o = origin.replace(/\/+$/, "");
  return `${o}/verify/${token}`;
}
