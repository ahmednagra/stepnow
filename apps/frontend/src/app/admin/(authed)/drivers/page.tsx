// app/admin/(authed)/drivers/page.tsx
// Drivers — fleet compliance console. KPI strip (active / compliant / checks-due / expired /
// P-Schein expiring), status + compliance worklist filters, sortable + drag-resizable columns,
// licence + P-Schein expiry flagging, one-click §21 StVG "record check", and client-side export
// (CSV/XLSX/JSON/PDF incl. a Behörde audit report). Mirrors the Orders/Customers console.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Download, AlertTriangle, ChevronDown, Clock, CheckCheck, MoreVertical } from "lucide-react";
import { AdminPageHeader, AdminCard, FilterToolbar } from "@/components/admin";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { useDrivers } from "@/hooks/queries/useDrivers";
import { useRecordLicenseCheck } from "@/hooks/mutations/useDriverMutations";
import { exportCsv, exportJson, printNode } from "@/utils/exporters";
import {
  type DriverAdmin, type ComplianceStatus,
} from "@/services/drivers";
import { cn } from "@/utils/cn";

const PAGE_SIZE = 20;

type StatusFilter = "all" | "active" | "inactive";
type CompFilter = "due" | "expired" | "pschein" | null;
type SortKey = "full_name" | "vehicle_label" | "license_expiry" | "pschein_expiry" | "next_license_check_due" | "compliance_status";

const todayISO = () => new Date().toISOString().slice(0, 10);
const initials = (d: DriverAdmin) => d.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
const deDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const daysFromToday = (iso: string | null) =>
  iso ? Math.round((new Date(iso).getTime() - Date.now()) / 86400000) : null;
const relLabel = (iso: string | null) => {
  const d = daysFromToday(iso);
  if (d == null) return "";
  return d < 0 ? `${-d}d ago` : d === 0 ? "today" : `in ${d}d`;
};
const expTone = (iso: string | null, soon: number) => {
  const d = daysFromToday(iso);
  if (d == null) return "ok";
  if (d < 0) return "over";
  if (d <= soon) return "soon";
  return "ok";
};

const COMP_TONE: Record<ComplianceStatus, { wrap: string; label: string }> = {
  ok:      { wrap: "bg-emerald-50 text-emerald-700", label: "Compliant" },
  due:     { wrap: "bg-amber-50 text-amber-700", label: "Check due" },
  expired: { wrap: "bg-rose-600 text-white", label: "Check overdue" },
  blocked: { wrap: "bg-slate-800 text-white", label: "Licence expired" },
  unknown: { wrap: "bg-slate-100 text-slate-500", label: "No record" },
};
const COMP_RANK: Record<ComplianceStatus, number> = { blocked: 0, expired: 1, due: 2, unknown: 3, ok: 4 };

const chipCls = (active: boolean) =>
  cn("h-8 px-3 text-[11.5px] font-semibold border transition-colors inline-flex items-center gap-1.5",
    active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-300 hover:border-slate-400");

export default function DriversPage() {
  const pushToast = useAdminToast((s) => s.push);
  const recordCheck = useRecordLicenseCheck();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading: loading } = useDrivers({ q: debouncedQ || undefined, page, size: PAGE_SIZE });
  const drivers = data?.items ?? null;
  const pages = data?.pagination.pages ?? 1;
  const total = data?.pagination.total ?? 0;

  const [statusF, setStatusF] = useState<StatusFilter>("all");
  const [compF, setCompF] = useState<CompFilter>(null);
  const [sortKey, setSortKey] = useState<SortKey>("next_license_check_due");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [compact, setCompact] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

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
    const onUp = () => { resizing.current = null; window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
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

  const kpis = useMemo(() => {
    const list = drivers ?? [];
    let active = 0, ok = 0, due = 0, exp = 0, ps = 0;
    for (const d of list) {
      if (d.active) active++;
      const s = d.compliance_status;
      if (s === "ok") ok++;
      if (s === "due") due++;
      if (s === "expired" || s === "blocked") exp++;
      const pd = daysFromToday(d.pschein_expiry);
      if (d.pschein_number && pd != null && pd >= 0 && pd <= 60) ps++;
    }
    return { active, ok, due, exp, ps };
  }, [drivers]);

  const view = useMemo(() => {
    let list = drivers ?? [];
    if (statusF === "active") list = list.filter((d) => d.active);
    if (statusF === "inactive") list = list.filter((d) => !d.active);
    if (compF === "due") list = list.filter((d) => d.compliance_status === "due");
    if (compF === "expired") list = list.filter((d) => d.compliance_status === "expired" || d.compliance_status === "blocked");
    if (compF === "pschein") list = list.filter((d) => !!d.pschein_number);
    return [...list].sort((a, b) => {
      let x: number | string, y: number | string;
      if (sortKey === "full_name") { x = a.full_name.toLowerCase(); y = b.full_name.toLowerCase(); }
      else if (sortKey === "compliance_status") { x = COMP_RANK[a.compliance_status]; y = COMP_RANK[b.compliance_status]; }
      else if (sortKey === "license_expiry" || sortKey === "pschein_expiry" || sortKey === "next_license_check_due") {
        x = a[sortKey] ? new Date(a[sortKey] as string).getTime() : Infinity;
        y = b[sortKey] ? new Date(b[sortKey] as string).getTime() : Infinity;
      } else { x = (`${a[sortKey] ?? ""}`).toLowerCase(); y = (`${b[sortKey] ?? ""}`).toLowerCase(); }
      return (x < y ? -1 : x > y ? 1 : 0) * sortDir;
    });
  }, [drivers, statusF, compF, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(k); setSortDir(1); }
  };
  const arrow = (k: SortKey) => (sortKey === k ? (sortDir === 1 ? " ▲" : " ▼") : "");

  async function doRecordCheck(id: string, name: string) {
    setCheckingId(id);
    setOpenMenuId(null);
    try {
      const updated = await recordCheck.mutateAsync({ id });
      pushToast("success", "Licence check recorded", `${name} · next due ${deDate(updated.next_license_check_due)}`);
    } catch (err) {
      pushToast("error", "Could not record check", err instanceof ApiError ? err.message : "Network error");
    } finally { setCheckingId(null); }
  }

  const exportRows = useCallback(() => view.map((d) => ({
    full_name: d.full_name,
    phone: d.phone ?? "",
    email: d.email ?? "",
    vehicle: d.vehicle_label ?? "",
    license_number: d.license_number ?? "",
    license_classes: (d.license_classes ?? []).join("/"),
    license_expiry: d.license_expiry ?? "",
    restrictions: d.license_restrictions ?? "",
    pschein_number: d.pschein_number ?? "",
    pschein_expiry: d.pschein_expiry ?? "",
    last_check: d.last_license_check_at ?? "",
    next_check_due: d.next_license_check_due ?? "",
    compliance: COMP_TONE[d.compliance_status].label,
    active: d.active ? "Yes" : "No",
  })), [view]);

  const doCsv = () => { exportCsv(exportRows(), `stepnow-drivers-${todayISO()}.csv`); pushToast("success", `Exported ${view.length} rows to CSV`); setExportOpen(false); };
  const doJson = () => { exportJson(exportRows(), `stepnow-drivers-${todayISO()}.json`); pushToast("success", `Exported ${view.length} rows to JSON`); setExportOpen(false); };
  const doXlsx = async () => {
    try {
      const XLSX = await import("xlsx");
      const rows = exportRows();
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = Object.keys(rows[0] ?? { a: 1 }).map(() => ({ wch: 16 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Drivers");
      XLSX.writeFile(wb, `stepnow-drivers-${todayISO()}.xlsx`);
      pushToast("success", `Exported ${view.length} rows to XLSX`);
    } catch { pushToast("error", "XLSX export failed", "The spreadsheet library could not be loaded."); }
    setExportOpen(false);
  };
  const doPrint = () => { printNode(document.getElementById("drivers-printable"), `StepNow Driver Compliance ${todayISO()}`); setExportOpen(false); };

  const kpiCard = (lab: string, val: string, hint: string, tone?: "warn" | "bad" | "good") => (
    <div className="border-r border-slate-200 px-4 py-3 last:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">{lab}</p>
      <p className={cn("mt-1 font-mono text-[20px] font-semibold tabular-nums",
        tone === "bad" && "text-rose-700", tone === "warn" && "text-amber-700", tone === "good" && "text-emerald-700")}>{val}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>
    </div>
  );

  const COLS: { key: SortKey; label: string; align: "left" | "right"; hide?: boolean }[] = [
    { key: "full_name", label: "Driver", align: "left" },
    { key: "vehicle_label", label: "Vehicle", align: "left", hide: true },
    { key: "license_expiry", label: "Licence exp.", align: "left" },
    { key: "pschein_expiry", label: "P-Schein exp.", align: "left", hide: true },
    { key: "next_license_check_due", label: "Next check", align: "left" },
    { key: "compliance_status", label: "Compliance", align: "left" },
  ];

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations"
        title="Drivers"
        description="Couriers & ride drivers — with licence, P-Schein and §21 StVG check status. The Fahrauftrag is dispatched to active, compliant drivers."
        actions={
          <Link href="/admin/drivers/new" className="flex h-9 items-center gap-1.5 bg-slate-900 px-3.5 text-[12.5px] font-medium text-white hover:bg-slate-800">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> New driver
          </Link>
        }
      />

      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 border border-slate-200 bg-white md:grid-cols-5">
          {kpiCard("Active drivers", String(kpis.active), `of ${total} total`)}
          {kpiCard("Compliant", String(kpis.ok), "checks current", "good")}
          {kpiCard("Checks due 30d", String(kpis.due), "§21 StVG re-check", "warn")}
          {kpiCard("Expired / blocked", String(kpis.exp), kpis.exp > 0 ? "do not dispatch" : "all clear", "bad")}
          {kpiCard("P-Schein expiring", String(kpis.ps), "rides · 60d", "warn")}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <FilterToolbar searchValue={q} onSearchChange={(v: string) => setQ(v)} searchPlaceholder="Search name, email, phone, licence no…" />
          </div>
          <div className="relative" ref={exportRef}>
            <button type="button" onClick={() => setExportOpen((v) => !v)}
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> Export <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-11 z-40 min-w-[220px] border border-slate-200 bg-white shadow-lg">
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Export current view ({view.length})</p>
                <button type="button" onClick={doCsv} className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3 py-2.5 text-left text-[13px] text-slate-700 hover:bg-slate-50"><span className="w-9 bg-green-600 py-0.5 text-center text-[9px] font-bold text-white">CSV</span> Comma-separated</button>
                <button type="button" onClick={doXlsx} className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3 py-2.5 text-left text-[13px] text-slate-700 hover:bg-slate-50"><span className="w-9 bg-green-800 py-0.5 text-center text-[9px] font-bold text-white">XLSX</span> Compliance workbook</button>
                <button type="button" onClick={doJson} className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3 py-2.5 text-left text-[13px] text-slate-700 hover:bg-slate-50"><span className="w-9 bg-slate-700 py-0.5 text-center text-[9px] font-bold text-white">JSON</span> Raw data</button>
                <button type="button" onClick={doPrint} className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3 py-2.5 text-left text-[13px] text-slate-700 hover:bg-slate-50"><span className="w-9 bg-red-600 py-0.5 text-center text-[9px] font-bold text-white">PDF</span> Audit report (Behörde)</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            {(["all", "active", "inactive"] as StatusFilter[]).map((s) => (
              <button key={s} type="button" className={chipCls(statusF === s)} onClick={() => setStatusF(s)}>
                {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-slate-300">|</span>
          <button type="button"
            className={cn("h-8 px-3 text-[11.5px] font-semibold border inline-flex items-center gap-1.5 transition-colors",
              compF === "due" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-amber-700 border-amber-200 hover:border-amber-300")}
            onClick={() => setCompF((c) => (c === "due" ? null : "due"))}>
            <Clock className="h-3 w-3" /> Checks due
          </button>
          <button type="button"
            className={cn("h-8 px-3 text-[11.5px] font-semibold border inline-flex items-center gap-1.5 transition-colors",
              compF === "expired" ? "bg-rose-600 text-white border-rose-600" : "bg-white text-rose-700 border-rose-200 hover:border-rose-300")}
            onClick={() => setCompF((c) => (c === "expired" ? null : "expired"))}>
            <AlertTriangle className="h-3 w-3" /> Expired / blocked
          </button>
          <button type="button"
            className={cn("h-8 px-3 text-[11.5px] font-semibold border inline-flex items-center gap-1.5 transition-colors",
              compF === "pschein" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-300 hover:border-slate-400")}
            onClick={() => setCompF((c) => (c === "pschein" ? null : "pschein"))}>
            P-Schein only
          </button>
          <div className="ml-auto flex border border-slate-300">
            <button type="button" onClick={() => setCompact(false)} className={cn("px-2.5 py-1 text-[11px] font-semibold", !compact ? "bg-slate-900 text-white" : "bg-white text-slate-600")}>Comfortable</button>
            <button type="button" onClick={() => setCompact(true)} className={cn("px-2.5 py-1 text-[11px] font-semibold", compact ? "bg-slate-900 text-white" : "bg-white text-slate-600")}>Compact</button>
          </div>
        </div>

        <div id="drivers-printable">
          <AdminCard flush title={`${view.length} of ${total} ${total === 1 ? "driver" : "drivers"}`}>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-[0.08em] text-slate-500">
                  {COLS.map((c) => (
                    <th key={c.key} style={colW[c.key] ? { width: colW[c.key], minWidth: colW[c.key] } : undefined}
                      className={cn("group relative cursor-pointer select-none px-3.5 py-2.5 font-semibold hover:text-slate-700",
                        c.align === "right" ? "text-right" : "text-left", c.hide && "hidden lg:table-cell")}
                      onClick={() => toggleSort(c.key)}>
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
                  <tr><td colSpan={7} className="px-3.5 py-10 text-center text-slate-400">Loading…</td></tr>
                ) : view.length === 0 ? (
                  <tr><td colSpan={7} className="px-3.5 py-10 text-center text-slate-400">No drivers match these filters.</td></tr>
                ) : (
                  view.map((d) => {
                    const s = d.compliance_status;
                    const rowFlag = s === "expired" || s === "blocked" ? "shadow-rose-500" : s === "due" ? "shadow-amber-500" : "";
                    const rowBg = s === "expired" || s === "blocked" ? "bg-rose-50/40 hover:bg-rose-50" : "";
                    const pad = compact ? "py-1.5" : "py-3";
                    const licTone = expTone(d.license_expiry, 30);
                    const psTone = expTone(d.pschein_expiry, 60);
                    const chkTone = expTone(d.next_license_check_due, 30);
                    const toneCls = (t: string) => t === "over" ? "font-semibold text-rose-700" : t === "soon" ? "font-semibold text-amber-700" : "text-slate-700";
                    return (
                      <tr key={d.id} className={cn("border-b border-slate-100 align-middle hover:bg-slate-50", rowBg)}>
                        <td className={cn("px-3.5", pad, rowFlag && "shadow-[inset_3px_0_0_var(--tw-shadow-color)]", rowFlag)}>
                          <span className="flex items-center gap-2.5">
                            <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-slate-900 text-[10px] font-bold uppercase text-white">{initials(d)}</span>
                            <span className="min-w-0">
                              <span className="flex items-center gap-1.5">
                                <Link href={`/admin/drivers/${d.id}`} className="text-[13px] font-semibold text-slate-900 hover:underline">{d.full_name}</Link>
                                {!d.active && <span className="bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">Inactive</span>}
                              </span>
                              {!compact && (
                                <span className="block text-[11px] text-slate-500">
                                  {(d.license_classes ?? []).join(" · ") || d.email || "—"}
                                  {d.license_restrictions && <span className="ml-1 text-amber-700">⚠ {d.license_restrictions}</span>}
                                </span>
                              )}
                            </span>
                          </span>
                        </td>
                        <td className={cn("hidden px-3.5 lg:table-cell", pad)}>
                          <span className="text-[12.5px] text-slate-700">{d.vehicle_label ?? "—"}</span>
                        </td>
                        <td className={cn("px-3.5", pad)}>
                          {d.license_expiry ? (
                            <span className={cn("text-[12.5px]", toneCls(licTone))}>{deDate(d.license_expiry)}{!compact && <span className="block text-[10px] font-normal text-slate-400">{relLabel(d.license_expiry)}</span>}</span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className={cn("hidden px-3.5 lg:table-cell", pad)}>
                          {d.pschein_expiry ? (
                            <span className={cn("text-[12.5px]", toneCls(psTone))}>{deDate(d.pschein_expiry)}{!compact && <span className="block text-[10px] font-normal text-slate-400">{relLabel(d.pschein_expiry)}</span>}</span>
                          ) : <span className="text-[12px] text-slate-300">— courier</span>}
                        </td>
                        <td className={cn("px-3.5", pad)}>
                          {d.next_license_check_due ? (
                            <span className={cn("text-[12.5px]", toneCls(chkTone))}>{deDate(d.next_license_check_due)}{!compact && <span className="block text-[10px] font-normal text-slate-400">last {deDate(d.last_license_check_at)}</span>}</span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className={cn("px-3.5", pad)}>
                          <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em]", COMP_TONE[s].wrap)}>
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden /> {COMP_TONE[s].label}
                          </span>
                        </td>
                        <td className={cn("relative px-3.5 text-right", pad)} data-row-menu>
                          <button type="button" aria-label="Row actions"
                            className="inline-grid h-7 w-7 place-items-center border border-transparent text-slate-400 hover:border-slate-200 hover:bg-white hover:text-slate-700"
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId((id) => (id === d.id ? null : d.id)); }}>
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openMenuId === d.id && (
                            <div className="absolute right-2 top-9 z-30 min-w-[210px] border border-slate-200 bg-white text-left shadow-lg">
                              <button type="button" disabled={checkingId === d.id}
                                onClick={() => doRecordCheck(d.id, d.full_name)}
                                className="flex w-full items-center gap-2.5 border-b border-slate-100 px-3.5 py-2.5 text-[12.5px] font-semibold text-emerald-700 hover:bg-slate-50 disabled:opacity-50">
                                <CheckCheck className="h-3.5 w-3.5" strokeWidth={2} /> Record licence check (today)
                              </button>
                              <Link href={`/admin/drivers/${d.id}`} className="flex w-full items-center gap-2.5 border-b border-slate-100 px-3.5 py-2.5 text-[12.5px] text-slate-700 hover:bg-slate-50">Open driver record</Link>
                              <Link href={`/admin/drivers/${d.id}`} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-slate-700 hover:bg-slate-50">Job history ({d.orders_count})</Link>
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
            <p className="text-[12px] text-slate-500">Page <span className="font-medium tabular-nums text-slate-700">{page}</span> of <span className="font-medium tabular-nums text-slate-700">{pages}</span> · <span className="tabular-nums">{total}</span> drivers</p>
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
