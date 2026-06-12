// Worker-compatible Excel writer thin wrapper around SheetJS (xlsx).
// Replaces exceljs which depends on Node.js streams not available in
// Cloudflare Workers / TanStack Start SSR runtime.
import * as XLSX from "xlsx";

export type SheetColumn<T extends string = string> = {
  header: string;
  key: T;
  width?: number;
};

export type SheetSpec<T extends string = string> = {
  name: string;
  columns: SheetColumn<T>[];
  rows: Array<Record<T, unknown>>;
  freezeHeader?: boolean;
};

export function buildXlsxBuffer(sheets: SheetSpec[]): Uint8Array {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const headerRow = s.columns.map((c) => c.header);
    const dataRows = s.rows.map((r) =>
      s.columns.map((c) => {
        const v = (r as Record<string, unknown>)[c.key];
        return v == null ? "" : v;
      }),
    );
    const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
    // Column widths
    ws["!cols"] = s.columns.map((c) => ({ wch: c.width ?? 16 }));
    // Freeze header
    if (s.freezeHeader !== false) {
      ws["!freeze"] = { xSplit: 0, ySplit: 1 } as unknown as Record<string, number>;
      // SheetJS uses !views for freeze; set as fallback
      (ws as unknown as { "!views"?: unknown[] })["!views"] = [{ state: "frozen", ySplit: 1 }];
    }
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Uint8Array(out);
}
