// apps/frontend/src/components/admin/preview/PreviewButton.tsx
// Drop-in button that opens PreviewModal — used in list rows and edit headers.

"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { PreviewModal } from "./PreviewModal";
import { cn } from "@/utils/cn";

type Variant = "row" | "header" | "icon";

interface Props {
  url: string;
  title?: string;
  subtitle?: string;
  label?: string;
  variant?: Variant;
  className?: string;
}

export function PreviewButton({ url, title, subtitle, label = "Preview", variant = "row", className }: Props) {
  const [open, setOpen] = useState(false);

  if (variant === "icon") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Preview on public site"
          title="Preview"
          className={cn(
            "grid h-7 w-7 place-items-center border border-slate-200 bg-white text-slate-500 transition-colors hover:border-[#A8865A] hover:text-[#86683F]",
            className,
          )}
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <PreviewModal open={open} onClose={() => setOpen(false)} url={url} title={title} subtitle={subtitle} />
      </>
    );
  }

  const cls = variant === "header"
    ? "flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
    : "inline-flex items-center gap-1 text-[12px] font-medium text-slate-600 transition-colors hover:text-[#86683F]";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(cls, className)}>
        <Eye className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
        {label}
      </button>
      <PreviewModal open={open} onClose={() => setOpen(false)} url={url} title={title} subtitle={subtitle} />
    </>
  );
}
