// app/admin/(authed)/customers/page.tsx
// Customers list — operations CRM. KPI strip (total / lifetime billed / receivables /
// overdue accounts / B2B split), segment filters, sortable + drag-resizable columns,
// per-customer value + receivable + recency, and client-side export (CSV/XLSX/JSON/PDF).
// when the backend supplies them; the page degrades gracefully until then.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Download, AlertTriangle, ChevronDown, Clock, MoreVertical } from "lucide-react";
import { AdminPageHeader, AdminCard, FilterToolbar } from "@/components/admin";
import { useAdminToast } from "@/hooks/useAdminToast";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { formatPriceEur } from "@/utils/decimal";
import { exportCsv, exportJson, printNode } from "@/utils/exporters";
import { type CustomerAdmin } from "@/services/customers";
import { cn } from "@/utils/cn";

const PAGE_SIZE = 20;

// Optional aggregate fields the backend may add (LEFT JOIN orders … GROUP BY). Until then
// they're undefined and the UI shows "—". Kept loose so the page compiles without schema change.
type CustomerRow = CustomerAdmin & {
  orders_count?: number | null;
  total_billed?: string | number | null;
  balance_due?: string | number | null;
  overdue_balance?: string | number | null;
  last_order_at?: string | null;
};

type SegFilter = "all" | "business" | "private";
type DueFilter = "outstanding" | "dormant" | null;
type SortKey = "name" | "company_name" | "ort" | "orders_count" | "total_billed" | "balance_due" | "last_order_at" | "type";

const num = (s: string | number | null | undefined) => Number(s ?? 0) || 0;
const todayISO = () => new Date().toISOString().slice(0, 10);
const initials = (c: CustomerRow) => `${c.first_name?.[0] ?? ""}${c.last_name?.[0] ?? ""}`.toUpperCase();
const daysFromToday = (iso: string | null | undefined) =>
  iso ? Math.round((Date.now() - new Date(iso).getTime()) / 86400000) : null;

function lastOrderLabel(iso: string | null | undefined): { main: string; rel: string; dormant: boolean } {
  if (!iso) return { main: "Never", rel: "no orders", dormant: true };
  const d = new Date(iso);
  const dd = daysFromToday(iso) ?? 0;
  const main = d.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "2-digit" });
  const rel = dd <= 0 ? "today" : dd === 1 ? "yesterday" : `${dd}d ago`;
  return { main, rel, dormant: dd > 90 };
}

const chipCls = (active: boolean) =>
  cn(
    "h-8 px-3 text-[11.5px] font-semibold border transition-colors inline-flex items-center gap-1.5",
    active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-300 hover:border-slate-400",
  );

export default function CustomersPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading: loading } = useCustomers({ q: debouncedQ || undefined, page, size: PAGE_SIZE });
  const customers = (data?.items ?? null) as CustomerRow[] | null;
  const pages = data?.pagination.pages ?? 1;
  const total = data?.pagination.total ?? 0;

  const [seg, setSeg] = useState<SegFilter>("all");
  const [due, setDue] = useState<DueFilter>(null);
  const [sortKey, setSortKey] = useState<SortKey>("total_billed");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [compact, setCompact] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // column resize (resets on reload)
  const [colW, setColW] = useState<Record<string, number>>({});
  const resizing = useRef<{ key: string; startX: number; startW: number } | null>(null);
  const onResizeStart = useCallback((e: React.PointerEvent, key: string) => {
    e.preventDefault(); e.stopPropagation();
    const th = (e.currentTarget as HTMLElement).closest("th") as HTMLElement | null;
    resizing.current = { key, startX: e.clientX, startW: th?.offsetWidth ?? 120 };
    const onMove = (ev: PointerEvent) => {
      if (!resizing.current) return;
      const next = Math.max(64, resizing.current.startW + (ev.clientX - resizing.current.startX));
      setColW((w) => ({ ...w, [resizing.current!.key]: next }));
    };
    const onUp = () => {
      resizing.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  // Debounce the search input, then reset to the first page on a new query.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (exportRef.current && !exportRef.current.contains(t)) setExportOpen(false);
      if (!(t instanceof Element) || !t.closest("[data-row-menu]")) setOpenMenuId(null);
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  // KPIs over loaded page
  const kpis = useMemo(() => {
    const list = customers ?? [];
    let ltv = 0, ar = 0, od = 0, odCount = 0, biz = 0, withBal = 0;
    for (const c of list) {
      ltv += num(c.total_billed);
      const bal = num(c.balance_due);
      ar += bal;
      if (bal > 0.005) withBal++;
      if (num(c.overdue_balance) > 0.005) { od += num(c.overdue_balance); odCount++; }
      if (c.is_business) biz++;
    }
    return { ltv, ar, od, odCount, biz, priv: list.length - biz, withBal };
  }, [customers]);

  const view = useMemo(() => {
    let list = customers ?? [];
    if (seg === "business") list = list.filter((c) => c.is_business);
    if (seg === "private") list = list.filter((c) => !c.is_business);
    if (due === "outstanding") list = list.filter((c) => num(c.balance_due) > 0.005);
    if (due === "dormant") list = list.filter((c) => lastOrderLabel(c.last_order_at).dormant);
    return [...list].sort((a, b) => {
      let x: number | string, y: number | string;
      if (sortKey === "name") { x = `${a.last_name}${a.first_name}`.toLowerCase(); y = `${b.last_name}${b.first_name}`.toLowerCase(); }
      else if (sortKey === "type") { x = a.is_business ? 1 : 0; y = b.is_business ? 1 : 0; }
      else if (sortKey === "last_order_at") { x = a.last_order_at ? new Date(a.last_order_at).getTime() : 0; y = b.last_order_at ? new Date(b.last_order_at).getTime() : 0; }
      else if (sortKey === "orders_count" || sortKey === "total_billed" || sortKey === "balance_due") { x = num(a[sortKey]); y = num(b[sortKey]); }
      else { x = (`${a[sortKey] ?? ""}`).toLowerCase(); y = (`${b[sortKey] ?? ""}`).toLowerCase(); }
      return (x < y ? -1 : x > y ? 1 : 0) * sortDir;
    });
  }, [customers, seg, due, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(k); setSortDir(1); }
  };
  const arrow = (k: SortKey) => (sortKey === k ? (sortDir === 1 ? " ▲" : " ▼") : "");

  const exportRows = useCallback(() => view.map((c) => ({
    first_name: c.first_name,
    last_name: c.last_name,
    company: c.company_name ?? "",
    vat_id: c.company_vatid ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    plz: c.plz ?? "",
    city: c.ort ?? "",
    orders: c.orders_count ?? "",
    lifetime: num(c.total_billed).toFixed(2),
    balance: num(c.balance_due).toFixed(2),
    overdue: num(c.overdue_balance).toFixed(2),
    last_order: c.last_order_at ?? "",
    type: c.is_business ? "Business" : "Private",
  })), [view]);

  const doCsv = () => { exportCsv(exportRows(), `stepnow-customers-${todayISO()}.csv`); pushToast("success", `Exported ${view.length} rows to CSV`); setExportOpen(false); };
  const doJson = () => { exportJson(exportRows(), `stepnow-customers-${todayISO()}.json`); pushToast("success", `Exported ${view.length} rows to JSON`); setExportOpen(false); };
  const doXlsx = async () => {
    try {
      const XLSX = await import("xlsx");
      const rows = exportRows();
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = Object.keys(rows[0] ?? { a: 1 }).map(() => ({ wch: 16 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customers");
      XLSX.writeFile(wb, `stepnow-customers-${todayISO()}.xlsx`);
      pushToast("success", `Exported ${view.length} rows to XLSX`);
    } catch {
      pushToast("error", "XLSX export failed", "The spreadsheet library could not be loaded.");
    }
    setExportOpen(false);
  };
  const doPrint = () => { printNode(document.getElementById("customers-printable"), `StepNow Customers ${todayISO()}`); setExportOpen(false); };

  const kpiCard = (lab: string, val: string, hint: string, tone?: "warn" | "bad" | "good") => (
    <div className="border-r border-slate-200 px-4 py-3 last:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">{lab}</p>
      <p className={cn("mt-1 font-mono text-[20px] font-semibold tabular-nums",
        tone === "bad" && "text-rose-700", tone === "warn" && "text-amber-700", tone === "good" && "text-emerald-700")}>{val}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>
    </div>
  );

  const COLS: { key: SortKey; label: string; align: "left" | "right"; hide?: boolean }[] = [
    { key: "name", label: "Customer", align: "left" },
    { key: "company_name", label: "Company", align: "left", hide: true },
    { key: "ort", label: "City", align: "left", hide: true },
    { key: "orders_count", label: "Orders", align: "right" },
    { key: "total_billed", label: "Lifetime", align: "right" },
    { key: "balance_due", label: "Receivable", align: "left" },
    { key: "last_order_at", label: "Last order", align: "left" },
    { key: "type", label: "Type", align: "left" },
  ];

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations"
        title="Customers"
        description="Senders / billers for repeat courier jobs — with lifetime value, receivables and recency at a glance."
        actions={
          <Link href="/admin/customers/new" className="flex h-9 items-center gap-1.5 bg-slate-900 px-3.5 text-[12.5px] font-medium text-white hover:bg-slate-800">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> New customer
          </Link>
        }
      />

      <div className="space-y-4 p-6">
        {/* KPI strip */}
        <div className="grid grid-cols-2 border border-slate-200 bg-white md:grid-cols-5">
          {kpiCard("Total customers", String(total), `${(customers ?? []).length} loaded`)}
          {kpiCard("Lifetime billed", formatPriceEur(kpis.ltv.toFixed(2)), "gross, loaded rows", "good")}
          {kpiCard("Receivables", formatPriceEur(kpis.ar.toFixed(2)), `${kpis.withBal} with balance`, "warn")}
          {kpiCard("Overdue accounts", formatPriceEur(kpis.od.toFixed(2)), `${kpis.odCount} need chasing`, "bad")}
          {kpiCard("Business / Private", `${kpis.biz} / ${kpis.priv}`, "B2B share")}
        </div>

        {/* Search + export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <FilterToolbar
              searchValue={q}
              onSearchChange={(v: string) => setQ(v)}
              searchPlaceholder="Search name, company, email, phone, VAT-ID…"
            />
          </div>
          <div className="relative" ref={exportRef}>
            <button type="button" onClick={() => setExportOpen((v) => !v)}
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> Export <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-11 z-40 min-w-[210px] border border-slate-200 bg-white shadow-lg">
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Export current view ({view.length})</p>
                <button type="button" onClick={doCsv} className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3 py-2.5 text-left text-[13px] text-slate-700 hover:bg-slate-50"><span className="w-9 bg-green-600 py-0.5 text-center text-[9px] font-bold text-white">CSV</span> Comma-separated</button>
                <button type="button" onClick={doXlsx} className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3 py-2.5 text-left text-[13px] text-slate-700 hover:bg-slate-50"><span className="w-9 bg-green-800 py-0.5 text-center text-[9px] font-bold text-white">XLSX</span> Excel workbook</button>
                <button type="button" onClick={doJson} className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3 py-2.5 text-left text-[13px] text-slate-700 hover:bg-slate-50"><span className="w-9 bg-slate-700 py-0.5 text-center text-[9px] font-bold text-white">JSON</span> Raw data</button>
                <button type="button" onClick={doPrint} className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3 py-2.5 text-left text-[13px] text-slate-700 hover:bg-slate-50"><span className="w-9 bg-red-600 py-0.5 text-center text-[9px] font-bold text-white">PDF</span> Print / save as PDF</button>
              </div>
            )}
          </div>
        </div>

        {/* Segment chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            {(["all", "business", "private"] as SegFilter[]).map((s) => (
              <button key={s} type="button" className={chipCls(seg === s)} onClick={() => setSeg(s)}>
                {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-slate-300">|</span>
          <button type="button"
            className={cn("h-8 px-3 text-[11.5px] font-semibold border inline-flex items-center gap-1.5 transition-colors",
              due === "outstanding" ? "bg-rose-600 text-white border-rose-600" : "bg-white text-rose-700 border-rose-200 hover:border-rose-300")}
            onClick={() => setDue((d) => (d === "outstanding" ? null : "outstanding"))}>
            <AlertTriangle className="h-3 w-3" /> Has outstanding
          </button>
          <button type="button"
            className={cn("h-8 px-3 text-[11.5px] font-semibold border inline-flex items-center gap-1.5 transition-colors",
              due === "dormant" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-300 hover:border-slate-400")}
            onClick={() => setDue((d) => (d === "dormant" ? null : "dormant"))}>
            <Clock className="h-3 w-3" /> Dormant 90d+
          </button>
          <div className="ml-auto flex border border-slate-300">
            <button type="button" onClick={() => setCompact(false)} className={cn("px-2.5 py-1 text-[11px] font-semibold", !compact ? "bg-slate-900 text-white" : "bg-white text-slate-600")}>Comfortable</button>
            <button type="button" onClick={() => setCompact(true)} className={cn("px-2.5 py-1 text-[11px] font-semibold", compact ? "bg-slate-900 text-white" : "bg-white text-slate-600")}>Compact</button>
          </div>
        </div>

        <div id="customers-printable">
          <AdminCard flush title={`${view.length} of ${total} ${total === 1 ? "customer" : "customers"}`}>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-[0.08em] text-slate-500">
                  {COLS.map((c) => (
                    <th
                      key={c.key}
                      style={colW[c.key] ? { width: colW[c.key], minWidth: colW[c.key] } : undefined}
                      className={cn(
                        "group relative cursor-pointer select-none px-3.5 py-2.5 font-semibold hover:text-slate-700",
                        c.align === "right" ? "text-right" : "text-left",
                        c.hide && "hidden lg:table-cell",
                      )}
                      onClick={() => toggleSort(c.key)}
                    >
                      {c.label}{arrow(c.key)}
                      <span onPointerDown={(e) => onResizeStart(e, c.key)} onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize touch-none bg-transparent hover:bg-slate-300" aria-hidden />
                    </th>
                  ))}
                  <th className="px-3.5 py-2.5 text-right font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-3.5 py-10 text-center text-slate-400">Loading…</td></tr>
                ) : view.length === 0 ? (
                  <tr><td colSpan={9} className="px-3.5 py-10 text-center text-slate-400">No customers match these filters.</td></tr>
                ) : (
                  view.map((c) => {
                    const bal = num(c.balance_due);
                    const overdueBal = num(c.overdue_balance);
                    const overdue = overdueBal > 0.005;
                    const hasAggregates = c.total_billed != null || c.orders_count != null || c.last_order_at !== undefined;
                    const last = lastOrderLabel(c.last_order_at);
                    const pad = compact ? "py-1.5" : "py-3";
                    return (
                      <tr key={c.id} className={cn("border-b border-slate-100 align-middle hover:bg-slate-50", overdue && "bg-rose-50/40 hover:bg-rose-50")}>
                        <td className={cn("px-3.5", pad, overdue && "shadow-[inset_3px_0_0_var(--tw-shadow-color)] shadow-rose-500")}>
                          <span className="flex items-center gap-2.5">
                            <span className={cn("grid h-7 w-7 flex-none place-items-center rounded-full text-[10px] font-bold uppercase text-white", c.is_business ? "bg-[#A8865A]" : "bg-slate-900")}>{initials(c)}</span>
                            <span className="min-w-0">
                              <span className="flex items-center gap-1.5">
                                <Link href={`/admin/customers/${c.id}`} className="text-[13px] font-semibold text-slate-900 hover:underline">{c.first_name} {c.last_name}</Link>
                                {c.is_business && <span className="bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-indigo-700">B2B</span>}
                              </span>
                              {!compact && c.email && <span className="block truncate text-[11px] text-slate-500">{c.email}</span>}
                            </span>
                          </span>
                        </td>
                        <td className={cn("hidden px-3.5 lg:table-cell", pad)}>
                          <span className="text-[12.5px] text-slate-700">{c.company_name ?? "—"}</span>
                          {!compact && c.company_vatid && <span className="block font-mono text-[10px] text-slate-400">{c.company_vatid}</span>}
                        </td>
                        <td className={cn("hidden px-3.5 text-[12.5px] text-slate-600 lg:table-cell", pad)}>{[c.plz, c.ort].filter(Boolean).join(" ") || "—"}</td>
                        <td className={cn("px-3.5 text-right", pad)}>
                          {c.orders_count != null ? <span className="font-mono text-[13px] tabular-nums text-slate-700">{c.orders_count}</span> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className={cn("px-3.5 text-right", pad)}>
                          {hasAggregates ? <span className="font-mono text-[13px] font-semibold tabular-nums text-slate-900">{formatPriceEur(num(c.total_billed).toFixed(2))}</span> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className={cn("px-3.5", pad)}>
                          {bal <= 0.005 ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <span className={cn("font-mono text-[12.5px] font-semibold", overdue ? "text-rose-700" : "text-amber-700")}>
                              {formatPriceEur(bal.toFixed(2))}
                              {!compact && <span className="block text-[10px] font-normal">{overdue ? `${formatPriceEur(overdueBal.toFixed(2))} overdue` : "due"}</span>}
                            </span>
                          )}
                        </td>
                        <td className={cn("px-3.5", pad)}>
                          {c.last_order_at === undefined ? (
                            <span className="text-slate-300">—</span>
                          ) : (
                            <span className={cn("text-[12.5px]", last.dormant ? "text-slate-400" : "text-slate-700")}>
                              {last.main}{!compact && <span className="block text-[10.5px] text-slate-400">{last.rel}</span>}
                            </span>
                          )}
                        </td>
                        <td className={cn("px-3.5", pad)}>
                          <span className={cn("inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]", c.is_business ? "bg-[#F5F2EC] text-[#86683F]" : "bg-slate-100 text-slate-500")}>
                            {c.is_business ? "Business" : "Private"}
                          </span>
                        </td>
                        <td className={cn("relative px-3.5 text-right", pad)} data-row-menu>
                          <button type="button" aria-label="Row actions"
                            className="inline-grid h-7 w-7 place-items-center border border-transparent text-slate-400 hover:border-slate-200 hover:bg-white hover:text-slate-700"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId((id) => (id === c.id ? null : c.id)); }}>
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openMenuId === c.id && (
                            <div className="absolute right-2 top-9 z-30 min-w-[190px] border border-slate-200 bg-white text-left shadow-lg">
                              <Link href={`/admin/customers/${c.id}`} className="flex w-full items-center gap-2.5 border-b border-slate-100 px-3.5 py-2.5 text-[12.5px] text-slate-700 hover:bg-slate-50">Open customer</Link>
                              <Link href={`/admin/orders/new?customer=${c.id}`} className="flex w-full items-center gap-2.5 border-b border-slate-100 px-3.5 py-2.5 text-[12.5px] text-slate-700 hover:bg-slate-50">New order for customer</Link>
                              <Link href={`/admin/customers/${c.id}`} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-slate-700 hover:bg-slate-50">View order history</Link>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </AdminCard>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 py-3">
            <p className="text-[12px] text-slate-500">Page <span className="font-medium tabular-nums text-slate-700">{page}</span> of <span className="font-medium tabular-nums text-slate-700">{pages}</span> · <span className="tabular-nums">{total}</span> customers</p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => page > 1 && setPage(page - 1)} disabled={page <= 1}
                className={cn("inline-flex h-8 items-center border border-slate-300 bg-white px-3 text-[12px] font-medium text-slate-700", page > 1 ? "hover:bg-slate-100" : "cursor-not-allowed opacity-40")}>Prev</button>
              <button type="button" onClick={() => page < pages && setPage(page + 1)} disabled={page >= pages}
                className={cn("inline-flex h-8 items-center border border-slate-300 bg-white px-3 text-[12px] font-medium text-slate-700", page < pages ? "hover:bg-slate-100" : "cursor-not-allowed opacity-40")}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
