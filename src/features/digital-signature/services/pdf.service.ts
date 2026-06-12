// PDF stamping: QR + metadata + spesimen TTD + footer pada SETIAP halaman.
// Bekerja untuk Mode A (PDF system-generated) dan Mode B (PDF upload).
export type StampPayload = {
  qrPng: Uint8Array;
  signaturePng?: Uint8Array | null;
  signerName: string;
  nip: string | null;
  position: string | null;
  documentNumber?: string | null;
  signedAt: Date;
  verifyUrl: string;
  verificationToken: string;
};

export async function stampSignature(pdfBytes: Uint8Array, p: StampPayload): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.load(pdfBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const qr = await pdf.embedPng(p.qrPng);
  const sigImg = p.signaturePng ? await pdf.embedPng(p.signaturePng) : null;

  const pages = pdf.getPages();
  const tokenShort = p.verificationToken.slice(0, 12);
  const totalPages = pages.length;

  // Footer kecil pada SETIAP halaman
  pages.forEach((page, idx) => {
    const { width } = page.getSize();
    const footerY = 18;
    const footerText = `Dokumen Elektronik · Verifikasi: ${p.verifyUrl}  |  Token: ${tokenShort}  |  Hal. ${idx + 1}/${totalPages}`;
    page.drawLine({
      start: { x: 30, y: footerY + 12 },
      end: { x: width - 30, y: footerY + 12 },
      thickness: 0.4,
      color: rgb(0.55, 0.55, 0.6),
    });
    page.drawText(footerText, { x: 30, y: footerY, size: 7, font, color: rgb(0.35, 0.35, 0.4) });
  });

  // Panel QR besar + spesimen TTD: halaman terakhir (lokasi tanda tangan resmi)
  const last = pages[pages.length - 1];
  const { width } = last.getSize();
  const panelW = 240;
  const panelH = 150;
  const x = width - panelW - 30;
  const y = 50;
  last.drawRectangle({
    x,
    y,
    width: panelW,
    height: panelH,
    borderColor: rgb(0.2, 0.2, 0.25),
    borderWidth: 0.8,
    color: rgb(0.98, 0.98, 1),
  });
  last.drawImage(qr, { x: x + 8, y: y + 18, width: 110, height: 110 });

  const tx = x + 124;
  let ty = y + panelH - 18;
  const line = (t: string, b = false, s = 9) => {
    last.drawText(t, { x: tx, y: ty, size: s, font: b ? bold : font, color: rgb(0.1, 0.1, 0.15) });
    ty -= 11;
  };
  line("DITANDATANGANI DIGITAL", true, 8);
  line(p.signerName, true, 9);
  if (p.nip) line(`NIP ${p.nip}`, false, 8);
  if (p.position) line(p.position, false, 8);
  if (p.documentNumber) line(`No: ${p.documentNumber}`, false, 8);
  line(p.signedAt.toLocaleString("id-ID"), false, 8);
  ty -= 2;
  line("Verifikasi: pindai QR / kunjungi", false, 7);
  line(p.verifyUrl.length > 32 ? p.verifyUrl.slice(0, 32) + "…" : p.verifyUrl, false, 7);

  if (sigImg) {
    last.drawImage(sigImg, { x: x + 8, y: y + panelH + 6, width: 110, height: 38 });
  }

  // QR ringkas di halaman pertama (jika dokumen multi-page)
  if (pages.length > 1) {
    const first = pages[0];
    const fw = first.getSize().width;
    const miniW = 80;
    const mx = fw - miniW - 30;
    const my = 50;
    first.drawRectangle({
      x: mx - 4,
      y: my - 4,
      width: miniW + 8,
      height: miniW + 18,
      borderColor: rgb(0.2, 0.2, 0.25),
      borderWidth: 0.6,
      color: rgb(0.98, 0.98, 1),
    });
    first.drawImage(qr, { x: mx, y: my + 10, width: miniW, height: miniW });
    first.drawText("Verifikasi QR", {
      x: mx + 8,
      y: my,
      size: 6,
      font: bold,
      color: rgb(0.2, 0.2, 0.25),
    });
  }

  return new Uint8Array(await pdf.save());
}

// PDF dasar utk system-generated (Mode A) — surat resmi sederhana, single page A4.
export async function buildBasicPdf(input: {
  opdNama: string;
  opdSingkatan: string;
  documentNumber?: string | null;
  title: string;
  bodyParagraphs: string[];
  pemohonNama?: string | null;
  pemohonNip?: string | null;
}): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 800;
  const draw = (t: string, x: number, yy: number, size = 11, b = false) =>
    page.drawText(t, { x, y: yy, size, font: b ? bold : font, color: rgb(0.1, 0.1, 0.15) });

  draw("PEMERINTAH DAERAH", 50, y, 10, true);
  y -= 14;
  draw(input.opdNama.toUpperCase(), 50, y, 14, true);
  y -= 14;
  draw(`(${input.opdSingkatan})`, 50, y, 10);
  y -= 8;
  page.drawLine({
    start: { x: 50, y: y - 4 },
    end: { x: 545, y: y - 4 },
    thickness: 1,
    color: rgb(0.1, 0.1, 0.15),
  });
  page.drawLine({
    start: { x: 50, y: y - 7 },
    end: { x: 545, y: y - 7 },
    thickness: 0.5,
    color: rgb(0.1, 0.1, 0.15),
  });
  y -= 36;

  if (input.documentNumber) {
    draw(`Nomor: ${input.documentNumber}`, 50, y);
    y -= 20;
  }
  draw(input.title, 50, y, 13, true);
  y -= 22;

  for (const para of input.bodyParagraphs) {
    const lines = wrap(para, 90);
    for (const ln of lines) {
      draw(ln, 50, y, 10);
      y -= 12;
    }
    y -= 8;
    if (y < 220) break;
  }
  if (input.pemohonNama) {
    draw(`Pemohon: ${input.pemohonNama}`, 50, y);
    y -= 12;
    if (input.pemohonNip) draw(`NIP: ${input.pemohonNip}`, 50, y);
  }
  return new Uint8Array(await pdf.save());
}

function wrap(text: string, w: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const out: string[] = [];
  let cur = "";
  for (const word of words) {
    if ((cur + " " + word).trim().length > w) {
      if (cur) out.push(cur);
      cur = word;
    } else cur = cur ? cur + " " + word : word;
  }
  if (cur) out.push(cur);
  return out;
}
