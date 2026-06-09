// apps/frontend/src/app/admin/(authed)/orders/page.tsx
// Orders list — operations console. Adds a KPI strip (revenue / outstanding / overdue /
// awaiting-dispatch / delivered), financial + delivery + overdue filters, per-row delivery &
// payment state with aging, and client-side export (CSV / XLSX / JSON / PDF) computed from the
// currently filtered + sorted rows — no extra endpoint. Built on the admin design system
// (AdminPageHeader / AdminCard / AdminTable / FilterToolbar / Pagination + Tailwind tokens).

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Truck, Download, AlertTriangle, ChevronDown, MoreVertical } from "lucide-react";
import {
  AdminPageHeader,
  AdminCard,
  FilterToolbar,
  Pagination,
} from "@/components/admin";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { DeliveryStatusBadge } from "@/components/admin/DeliveryStatusBadge";
import { listAdminOrders, type OrderAdmin, type OrderStatus, type DeliveryStatus } from "@/services/orders";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { formatPriceEur } from "@/utils/decimal";
import { exportCsv, exportJson, printNode } from "@/utils/exporters";
import { cn } from "@/utils/cn";

const PAGE_SIZE = 20;

type FinFilter = "all" | OrderStatus;
type DelFilter = "all" | DeliveryStatus;
type SortKey =
  | "order_number" | "customer_name" | "pickup_address" | "driver_name"
  | "scheduled_datetime" | "due_date" | "delivery_status" | "status"
  | "balance_due" | "gross_amount";

const DELIVERY_LABEL: Record<DeliveryStatus, string> = {
  draft: "Draft", dispatched: "Dispatched", picked_up: "Picked up", delivered: "Delivered",
};
const num = (s: string | null | undefined) => Number(s ?? "0") || 0;
const todayISO = () => new Date().toISOString().slice(0, 10);
const deDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "2-digit" }) : "—";
const deDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const daysFromToday = (iso: string | null) =>
  iso ? Math.round((new Date(iso).getTime() - Date.now()) / 86400000) : null;

type PayKind = "paid" | "partial" | "unpaid" | "overdue";
function payState(o: OrderAdmin): { kind: PayKind; balance: number; overdueDays: number } {
  const balance = num(o.balance_due);
  if (balance <= 0.005) return { kind: "paid", balance: 0, overdueDays: 0 };
  if (o.is_overdue) {
    const d = daysFromToday(o.due_date);
    return { kind: "overdue", balance, overdueDays: d == null ? 0 : Math.max(0, -d) };
  }
  return { kind: num(o.amount_paid) > 0 ? "partial" : "unpaid", balance, overdueDays: 0 };
}
const PAY_TONE: Record<PayKind, { wrap: string; dot: string; label: string }> = {
  paid:     { wrap: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500", label: "Paid" },
  partial:  { wrap: "bg-amber-50 text-amber-800 border-amber-200",       dot: "bg-amber-500",   label: "Partial" },
  unpaid:   { wrap: "bg-rose-50 text-rose-800 border-rose-200",          dot: "bg-rose-500",    label: "Unpaid" },
  overdue:  { wrap: "bg-rose-600 text-white border-rose-700",            dot: "bg-white",       label: "Overdue" },
};

function PaymentBadge({ o }: { o: OrderAdmin }) {
  const p = payState(o);
  const t = PAY_TONE[p.kind];
  return (
    <div>
      <span className={cn("inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]", t.wrap)}>
        <span aria-hidden className={cn("inline-block h-1.5 w-1.5 rounded-full", t.dot)} />
        {t.label}
      </span>
      {p.balance > 0 && (
        <span className={cn("mt-1 block font-mono text-[10.5px]", p.kind === "overdue" ? "font-semibold text-rose-700" : "text-slate-500")}>
          {formatPriceEur(p.balance.toFixed(2))} due{p.overdueDays > 0 ? ` · ${p.overdueDays}d overdue` : ""}
        </span>
      )}
    </div>
  );
}

const chipCls = (active: boolean) =>
  cn(
    "h-8 px-3 text-[11.5px] font-semibold border transition-colors inline-flex items-center gap-1.5",
    active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-300 hover:border-slate-400",
  );

export default function OrdersPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [orders, setOrders] = useState<OrderAdmin[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // client-side view controls
  const [fin, setFin] = useState<FinFilter>("all");
  const [del, setDel] = useState<DelFilter>("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [compact, setCompact] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // column resize — pixel widths keyed by column id; resets on reload (no persistence)
  const [colW, setColW] = useState<Record<string, number>>({});
  const resizing = useRef<{ key: string; startX: number; startW: number } | null>(null);

  const onResizeStart = useCallback((e: React.PointerEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
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

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      // Financial status is filtered server-side (the endpoint supports it); delivery / overdue
      // are refined client-side on the returned page.
      const res = await listAdminOrders({
        page, size: PAGE_SIZE, q: q || undefined,
        status: fin === "all" ? undefined : fin,
      });
      setOrders(res.items);
      setPages(res.pagination.pages);
      setTotal(res.pagination.total);
    } catch (err) {
      pushToast("error", "Could not load orders", err instanceof ApiError ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [page, q, fin, pushToast]);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => { setPage(1); }, [q, fin]);

  // close export menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (exportRef.current && !exportRef.current.contains(t)) setExportOpen(false);
      if (!(t instanceof Element) || !t.closest("[data-row-menu]")) setOpenMenuId(null);
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  // KPIs over the loaded page (the visible set the operator is working)
  const kpis = useMemo(() => {
    const list = orders ?? [];
    let revenue = 0, outstanding = 0, overdue = 0, overdueCount = 0;
    let awaitingDispatch = 0, delivered = 0;
    for (const o of list) {
      revenue += num(o.gross_amount);
      const bal = num(o.balance_due);
      outstanding += bal;
      if (o.is_overdue && bal > 0) { overdue += bal; overdueCount++; }
      if (o.delivery_status === "draft") awaitingDispatch++;
      if (o.delivery_status === "delivered") delivered++;
    }
    return { revenue, outstanding, overdue, overdueCount, awaitingDispatch, delivered };
  }, [orders]);

  // client-side filter + sort
  const view = useMemo(() => {
    let list = orders ?? [];
    if (del !== "all") list = list.filter((o) => o.delivery_status === del);
    if (overdueOnly) list = list.filter((o) => o.is_overdue && num(o.balance_due) > 0);
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let x: number | string, y: number | string;
        if (sortKey === "gross_amount" || sortKey === "balance_due") { x = num(a[sortKey]); y = num(b[sortKey]); }
        else if (sortKey === "scheduled_datetime" || sortKey === "due_date") {
          x = a[sortKey] ? new Date(a[sortKey] as string).getTime() : 0;
          y = b[sortKey] ? new Date(b[sortKey] as string).getTime() : 0;
        } else { x = (a[sortKey] ?? "").toString().toLowerCase(); y = (b[sortKey] ?? "").toString().toLowerCase(); }
        return (x < y ? -1 : x > y ? 1 : 0) * sortDir;
      });
    }
    return list;
  }, [orders, del, overdueOnly, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(k); setSortDir(1); }
  };
  const arrow = (k: SortKey) => (sortKey === k ? (sortDir === 1 ? " ▲" : " ▼") : "");

  // ── exports built from the current `view` (filtered + sorted), no endpoint ──
  const exportRows = useCallback(() => view.map((o) => {
    const p = payState(o);
    return {
      order_number: o.order_number,
      invoice_number: o.invoice_number ?? "",
      customer: o.customer_name,
      email: o.customer_email,
      b2b: o.is_business ? "Yes" : "No",
      pickup: o.pickup_address,
      destination: o.destination_address,
      driver: o.driver_name ?? "Unassigned",
      scheduled: o.scheduled_datetime ?? "",
      due_date: o.due_date ?? "",
      delivery: DELIVERY_LABEL[o.delivery_status],
      status: o.status,
      payment: PAY_TONE[p.kind].label,
      balance: num(o.balance_due).toFixed(2),
      vat_pct: Math.round(num(o.vat_rate) * 100),
      net: num(o.net_amount).toFixed(2),
      gross: num(o.gross_amount).toFixed(2),
    };
  }), [view]);

  const doCsv = () => {
    exportCsv(exportRows(), `stepnow-orders-${todayISO()}.csv`);
    pushToast("success", `Exported ${view.length} rows to CSV`);
    setExportOpen(false);
  };
  const doJson = () => {
    exportJson(exportRows(), `stepnow-orders-${todayISO()}.json`);
    pushToast("success", `Exported ${view.length} rows to JSON`);
    setExportOpen(false);
  };
  const doXlsx = async () => {
    try {
      const XLSX = await import("xlsx");
      const rows = exportRows();
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = Object.keys(rows[0] ?? { a: 1 }).map(() => ({ wch: 16 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      XLSX.writeFile(wb, `stepnow-orders-${todayISO()}.xlsx`);
      pushToast("success", `Exported ${view.length} rows to XLSX`);
    } catch {
      pushToast("error", "XLSX export failed", "The spreadsheet library could not be loaded.");
    }
    setExportOpen(false);
  };
  const doPrint = () => {
    printNode(document.getElementById("orders-printable"), `StepNow Orders ${todayISO()}`);
    setExportOpen(false);
  };

  const kpiCard = (lab: string, val: string, hint: string, tone?: "warn" | "bad" | "good") => (
    <div className="border-r border-slate-200 px-4 py-3 last:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">{lab}</p>
      <p className={cn("mt-1 font-mono text-[20px] font-semibold tabular-nums",
        tone === "bad" && "text-rose-700", tone === "warn" && "text-amber-700", tone === "good" && "text-emerald-700")}>{val}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>
    </div>
  );

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations"
        title="Orders"
        description="Confirmed jobs from bookings, plus manually created parcel orders."
        actions={
          <Link href="/admin/orders/new" className="flex h-9 items-center gap-1.5 bg-slate-900 px-3.5 text-[12.5px] font-medium text-white hover:bg-slate-800">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> New order
          </Link>
        }
      />

      <div className="space-y-4 p-6">
        {/* KPI strip */}
        <div className="grid grid-cols-2 border border-slate-200 bg-white md:grid-cols-5">
          {kpiCard("Revenue (page)", formatPriceEur(kpis.revenue.toFixed(2)), "gross, loaded rows")}
          {kpiCard("Outstanding", formatPriceEur(kpis.outstanding.toFixed(2)), "unpaid balance", "warn")}
          {kpiCard("Overdue", formatPriceEur(kpis.overdue.toFixed(2)), `${kpis.overdueCount} past due`, "bad")}
          {kpiCard("Awaiting dispatch", String(kpis.awaitingDispatch), "still in draft")}
          {kpiCard("Delivered", String(kpis.delivered), "completed runs", "good")}
        </div>

        {/* Search + export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <FilterToolbar
              searchValue={q}
              onSearchChange={(v: string) => { setPage(1); setQ(v); }}
              searchPlaceholder="Search order-no, customer, email…"
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

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            {(["all", "open", "completed", "cancelled"] as FinFilter[]).map((f) => (
              <button key={f} type="button" className={chipCls(fin === f)} onClick={() => setFin(f)}>
                {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex gap-1.5">
            {(["all", "draft", "dispatched", "picked_up", "delivered"] as DelFilter[]).map((d) => (
              <button key={d} type="button" className={chipCls(del === d)} onClick={() => setDel(d)}>
                {d === "all" ? "Any stage" : DELIVERY_LABEL[d as DeliveryStatus]}
              </button>
            ))}
          </div>
          <span className="text-slate-300">|</span>
          <button type="button"
            className={cn("h-8 px-3 text-[11.5px] font-semibold border inline-flex items-center gap-1.5 transition-colors",
              overdueOnly ? "bg-rose-600 text-white border-rose-600" : "bg-white text-rose-700 border-rose-200 hover:border-rose-300")}
            onClick={() => setOverdueOnly((v) => !v)}>
            <AlertTriangle className="h-3 w-3" /> Overdue only
          </button>
          <div className="ml-auto flex border border-slate-300">
            <button type="button" onClick={() => setCompact(false)} className={cn("px-2.5 py-1 text-[11px] font-semibold", !compact ? "bg-slate-900 text-white" : "bg-white text-slate-600")}>Comfortable</button>
            <button type="button" onClick={() => setCompact(true)} className={cn("px-2.5 py-1 text-[11px] font-semibold", compact ? "bg-slate-900 text-white" : "bg-white text-slate-600")}>Compact</button>
          </div>
        </div>

        <div id="orders-printable">
          <AdminCard flush title={`${view.length} of ${total} ${total === 1 ? "order" : "orders"}`}>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-[0.08em] text-slate-500">
                  {([
                    { key: "order_number", label: "Order / Invoice", sortable: true, align: "left" },
                    { key: "customer_name", label: "Customer", sortable: true, align: "left" },
                    { key: "pickup_address", label: "Route", sortable: true, align: "left", hide: true },
                    { key: "driver_name", label: "Driver", sortable: true, align: "left", hide: true },
                    { key: "scheduled_datetime", label: "Scheduled", sortable: true, align: "left" },
                    { key: "due_date", label: "Due", sortable: true, align: "left" },
                    { key: "delivery_status", label: "Delivery", sortable: true, align: "left" },
                    { key: "status", label: "Status", sortable: true, align: "left" },
                    { key: "balance_due", label: "Payment", sortable: true, align: "left" },
                    { key: "gross_amount", label: "Gross", sortable: true, align: "right" },
                  ] as { key: SortKey; label: string; sortable: boolean; align: "left" | "right"; hide?: boolean }[]).map((c) => (
                    <th
                      key={c.key}
                      style={colW[c.key] ? { width: colW[c.key], minWidth: colW[c.key] } : undefined}
                      className={cn(
                        "group relative select-none px-3.5 py-2.5 font-semibold",
                        c.align === "right" ? "text-right" : "text-left",
                        c.sortable && "cursor-pointer hover:text-slate-700",
                        c.hide && "hidden lg:table-cell",
                      )}
                      onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                    >
                      {c.label}{c.sortable ? arrow(c.key) : ""}
                      <span
                        onPointerDown={(e) => onResizeStart(e, c.key)}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize touch-none bg-transparent hover:bg-slate-300"
                        aria-hidden
                      />
                    </th>
                  ))}
                  <th className="px-3.5 py-2.5 text-right font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="px-3.5 py-10 text-center text-slate-400">Loading…</td></tr>
                ) : view.length === 0 ? (
                  <tr><td colSpan={11} className="px-3.5 py-10 text-center text-slate-400">No orders match these filters.</td></tr>
                ) : (
                  view.map((o) => {
                    const overdue = o.is_overdue && num(o.balance_due) > 0;
                    const dueDays = daysFromToday(o.due_date);
                    const pad = compact ? "py-1.5" : "py-3";
                    return (
                      <tr key={o.id} className={cn("border-b border-slate-100 align-middle hover:bg-slate-50", overdue && "bg-rose-50/40 hover:bg-rose-50")}>
                        <td className={cn("px-3.5", pad, overdue && "shadow-[inset_3px_0_0_var(--tw-shadow-color)] shadow-rose-500")}>
                          <Link href={`/admin/orders/${o.id}`} className="font-mono text-[12px] font-medium text-slate-900 hover:underline">{o.order_number}</Link>
                          {o.invoice_number && <span className="block font-mono text-[10px] text-slate-400">{o.invoice_number}</span>}
                        </td>
                        <td className={cn("px-3.5", pad)}>
                          <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-900">
                            {o.customer_name}
                            {o.is_business && <span className="bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-indigo-700">B2B</span>}
                          </span>
                          {!compact && <span className="block text-[11px] text-slate-500">{o.customer_email}</span>}
                        </td>
                        <td className={cn("hidden px-3.5 lg:table-cell", pad)}>
                          <span className="line-clamp-1 max-w-[220px] text-[12px] text-slate-600">{o.pickup_address} <span className="text-slate-400">→</span> {o.destination_address}</span>
                        </td>
                        <td className={cn("hidden px-3.5 lg:table-cell", pad)}>
                          {o.driver_name ? (
                            <span className="flex items-center gap-2 text-[12px] text-slate-700">
                              <span className="grid h-5 w-5 place-items-center bg-slate-900 text-[9px] font-bold uppercase text-white">{o.driver_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</span>
                              {o.driver_name}
                            </span>
                          ) : <span className="text-[12px] italic text-slate-400">Unassigned</span>}
                        </td>
                        <td className={cn("px-3.5 text-[12px] text-slate-700", pad)}>{deDateTime(o.scheduled_datetime)}</td>
                        <td className={cn("px-3.5 text-[12px]", pad)}>
                          <span className="text-slate-700">{deDate(o.due_date)}</span>
                          {dueDays != null && !compact && (
                            <span className={cn("block text-[10px]", overdue ? "font-semibold text-rose-600" : "text-slate-400")}>
                              {dueDays < 0 ? `${-dueDays}d ago` : dueDays === 0 ? "today" : `in ${dueDays}d`}
                            </span>
                          )}
                        </td>
                        <td className={cn("px-3.5", pad)}><DeliveryStatusBadge status={o.delivery_status} /></td>
                        <td className={cn("px-3.5", pad)}><OrderStatusBadge status={o.status} /></td>
                        <td className={cn("px-3.5", pad)}><PaymentBadge o={o} /></td>
                        <td className={cn("px-3.5 text-right", pad)}>
                          <span className="font-mono text-[13px] font-semibold tabular-nums text-slate-900">{formatPriceEur(o.gross_amount)}</span>
                          {!compact && <span className="block text-[10px] text-slate-400">VAT {Math.round(num(o.vat_rate) * 100)}%</span>}
                        </td>
                        <td className={cn("relative px-3.5 text-right", pad)} data-row-menu>
                          <button
                            type="button"
                            aria-label="Row actions"
                            className="inline-grid h-7 w-7 place-items-center border border-transparent text-slate-400 hover:border-slate-200 hover:bg-white hover:text-slate-700"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId((id) => (id === o.id ? null : o.id)); }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openMenuId === o.id && (
                            <div className="absolute right-2 top-9 z-30 min-w-[200px] border border-slate-200 bg-white text-left shadow-lg">
                              <Link href={`/admin/orders/${o.id}/invoice`} className="flex w-full items-center gap-2.5 border-b border-slate-100 px-3.5 py-2.5 text-[12.5px] text-slate-700 hover:bg-slate-50">
                                <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> Download invoice PDF
                              </Link>
                              <Link href={`/admin/orders/${o.id}`} className="flex w-full items-center gap-2.5 border-b border-slate-100 px-3.5 py-2.5 text-[12.5px] text-slate-700 hover:bg-slate-50">
                                <Truck className="h-3.5 w-3.5" strokeWidth={1.5} /> Send to driver
                              </Link>
                              <Link href={`/admin/orders/${o.id}`} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-slate-700 hover:bg-slate-50">
                                Mark delivered
                              </Link>
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

        {pages > 1 && <Pagination page={page} totalPages={pages} totalItems={total} onPageChange={setPage} />}
      </div>
    </>
  );
}
