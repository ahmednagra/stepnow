// apps/frontend/src/utils/exporters.ts
// Client-side export helpers — keep tiny so they tree-shake well.

function download(filename: string, mime: string, content: string | Blob) {
  const blob = typeof content === "string" ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportCsv<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  columns?: Array<{ key: keyof T & string; label?: string }>,
) {
  if (rows.length === 0) {
    download(filename, "text/csv;charset=utf-8", "");
    return;
  }
  type Col = { key: keyof T & string; label?: string };
const cols: Col[] =
  columns ?? Object.keys(rows[0]).map((k): Col => ({ key: k as keyof T & string }));
  const header = cols.map((c) => csvEscape(c.label ?? c.key)).join(",");
  const body = rows.map((r) => cols.map((c) => csvEscape(r[c.key])).join(",")).join("\n");
  download(filename, "text/csv;charset=utf-8", "\ufeff" + header + "\n" + body);
}

function xmlEscape(v: unknown): string {
  if (v == null) return "";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function cell(v: unknown): string {
  const numeric = typeof v === "number" && Number.isFinite(v);
  return `<Cell><Data ss:Type="${numeric ? "Number" : "String"}">${xmlEscape(v)}</Data></Cell>`;
}

export function exportExcel<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  sheetName = "Sheet1",
  columns?: Array<{ key: keyof T & string; label?: string }>,
) {
  type Col = { key: keyof T & string; label?: string };
  const cols: Col[] =
    columns ?? Object.keys(rows[0] ?? {}).map((k): Col => ({ key: k as keyof T & string }));
  const head = `<Row>${cols.map((c) => cell(c.label ?? c.key)).join("")}</Row>`;
  const body = rows.map((r) => `<Row>${cols.map((c) => cell(r[c.key])).join("")}</Row>`).join("");
  const widths = cols.map(() => '<Column ss:Width="120"/>').join("");
  download(
    filename,
    "application/vnd.ms-excel;charset=utf-8",
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
      `<Worksheet ss:Name="${xmlEscape(sheetName)}"><Table>${widths}${head}${body}</Table></Worksheet></Workbook>`,
  );
}

export function exportJson(data: unknown, filename: string) {
  download(filename, "application/json", JSON.stringify(data, null, 2));
}

export function printNode(node: HTMLElement | null, title = "StepNow Admin") {
  if (!node) return;
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  const styles = Array.from(document.querySelectorAll("style,link[rel='stylesheet']"))
    .map((n) => n.outerHTML)
    .join("\n");
  w.document.write(`<!doctype html><html><head><title>${title}</title>${styles}
    <style>@page{margin:14mm}body{background:#fff;font-family:Inter,system-ui,sans-serif;color:#0F1115}
    .no-print{display:none!important}</style>
    </head><body>${node.outerHTML}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 250);
}
