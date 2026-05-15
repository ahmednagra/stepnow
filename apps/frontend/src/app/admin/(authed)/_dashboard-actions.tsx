// apps/frontend/src/app/admin/(authed)/_dashboard-actions.tsx
// Client-only header actions for the dashboard.

"use client";

import { useRouter } from "next/navigation";
import { Calendar, Download, RefreshCcw } from "lucide-react";

export function DashboardActions() {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => router.refresh()}
        className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <RefreshCcw className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
        Refresh
      </button>
      <button
        type="button"
        disabled
        className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-400 cursor-not-allowed"
      >
        <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
        Last 30 days
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex h-9 items-center gap-1.5 bg-slate-900 px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-slate-800"
      >
        <Download className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
        Export
      </button>
    </div>
  );
}
