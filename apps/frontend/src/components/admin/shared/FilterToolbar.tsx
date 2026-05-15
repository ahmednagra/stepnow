// apps/frontend/src/components/admin/shared/FilterToolbar.tsx
// Reusable toolbar: debounced search + slot for filters + export menu.

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Search, Download, FileText, FileSpreadsheet, Printer } from "lucide-react";
import { cn } from "@/utils/cn";

interface FilterToolbarProps {
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  exports?: {
    onCsv?: () => void;
    onJson?: () => void;
    onPrint?: () => void;
  };
  className?: string;
}

export function FilterToolbar({
  searchValue = "", onSearchChange, searchPlaceholder = "Search…", filters, exports, className,
}: FilterToolbarProps) {
  const [local, setLocal] = useState(searchValue);
  const [open, setOpen] = useState(false);

  useEffect(() => { setLocal(searchValue); }, [searchValue]);
  useEffect(() => {
    if (!onSearchChange) return;
    const t = setTimeout(() => { if (local !== searchValue) onSearchChange(local); }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {onSearchChange && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            placeholder={searchPlaceholder}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            className="h-8 w-64 border border-slate-300 bg-white pl-7 pr-2 text-[12.5px] text-slate-700 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      )}
      {filters}
      {exports && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 items-center gap-1.5 border border-slate-300 bg-white px-2.5 text-[12px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            Export
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
              <div role="menu" className="absolute right-0 z-20 mt-1 w-44 border border-slate-200 bg-white shadow-[0_4px_12px_-2px_rgba(15,23,42,0.10)]">
                {exports.onCsv && (
                  <button
                    type="button"
                    onClick={() => { exports.onCsv?.(); setOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-slate-700 hover:bg-slate-50"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
                    Export CSV
                  </button>
                )}
                {exports.onJson && (
                  <button
                    type="button"
                    onClick={() => { exports.onJson?.(); setOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-slate-700 hover:bg-slate-50"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
                    Export JSON
                  </button>
                )}
                {exports.onPrint && (
                  <button
                    type="button"
                    onClick={() => { exports.onPrint?.(); setOpen(false); }}
                    className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-[12px] text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
                    Print
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
