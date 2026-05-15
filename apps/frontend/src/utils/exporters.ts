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
  const cols = columns ?? Object.keys(rows[0]).map((k) => ({ key: k as keyof T & string }));
  const header = cols.map((c) => csvEscape(c.label ?? c.key)).join(",");
  const body = rows.map((r) => cols.map((c) => csvEscape(r[c.key])).join(",")).join("\n");
  download(filename, "text/csv;charset=utf-8", "\ufeff" + header + "\n" + body);
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
