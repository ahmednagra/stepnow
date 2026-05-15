// apps/frontend/src/components/admin/preview/PreviewModal.tsx
// Modal preview: loads the live public URL inside an iframe with device toggles.

"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Monitor, Smartphone, Tablet, X } from "lucide-react";
import { cn } from "@/utils/cn";

type Device = "desktop" | "tablet" | "mobile";
const WIDTHS: Record<Device, number> = { desktop: 1280, tablet: 820, mobile: 390 };

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  subtitle?: string;
}

export function PreviewModal({ open, onClose, url, title, subtitle }: PreviewModalProps) {
  const [device, setDevice] = useState<Device>("desktop");

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-sm">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3">
        <div className="min-w-0 flex items-center gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A8865A]">Live preview</p>
          <span aria-hidden="true" className="h-4 w-px bg-slate-200" />
          <div className="min-w-0">
            <h2 className="font-serif text-[16px] font-medium leading-tight text-slate-900 truncate">{title ?? "Public site preview"}</h2>
            {subtitle && <p className="text-[11.5px] text-slate-500 truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-slate-200">
            {[
              { v: "desktop" as const, Icon: Monitor, label: "Desktop" },
              { v: "tablet" as const, Icon: Tablet, label: "Tablet" },
              { v: "mobile" as const, Icon: Smartphone, label: "Mobile" },
            ].map(({ v, Icon, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => setDevice(v)}
                aria-label={label}
                title={label}
                className={cn(
                  "flex h-8 w-9 items-center justify-center transition-colors",
                  device === v ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              </button>
            ))}
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 items-center gap-1.5 border border-slate-300 bg-white px-2.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            Open
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="grid h-8 w-8 place-items-center bg-slate-900 text-white transition-colors hover:bg-slate-800"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-auto flex items-start justify-center p-6">
        <div
          className="bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.40)] transition-[width] duration-300"
          style={{ width: WIDTHS[device], maxWidth: "100%" }}
        >
          <iframe
            src={url}
            title={title ?? "Preview"}
            className="block h-[calc(100vh-130px)] w-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </div>
      </div>
    </div>
  );
}
