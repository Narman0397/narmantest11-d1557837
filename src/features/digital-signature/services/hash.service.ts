// SHA-256 isomorphic (WebCrypto).
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const buf = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h), (x) => x.toString(16).padStart(2, "0")).join("");
}

export async function sha256OfFile(file: Blob): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  return sha256Hex(buf);
}
