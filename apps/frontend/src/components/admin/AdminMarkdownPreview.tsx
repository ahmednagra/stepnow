// apps/frontend/src/components/admin/AdminMarkdownPreview.tsx
// Phase 3d polish — preview pane used in admin editors so Naeem can see how
// markdown will render before saving. Restrained typography (slate, not the
// public-site palette).

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/utils/cn";

interface AdminMarkdownPreviewProps {
  source: string;
  className?: string;
}

export function AdminMarkdownPreview({ source, className }: AdminMarkdownPreviewProps) {
  if (!source.trim()) {
    return (
      <div
        className={cn(
          "border border-dashed border-slate-300 bg-slate-50 p-4 text-[12.5px] italic text-slate-400",
          className,
        )}
      >
        Nichts zu zeigen — die Vorschau erscheint, sobald Sie Inhalt eingeben.
      </div>
    );
  }
  return (
    <div
      className={cn(
        "border border-slate-200 bg-white p-5 text-[13.5px] leading-relaxed text-slate-800",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-5 text-[18px] font-semibold tracking-tight text-slate-900">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-5 text-[16px] font-semibold tracking-tight text-slate-900">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-[14px] font-semibold tracking-tight text-slate-900">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-600"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          hr: () => <hr className="my-4 border-slate-200" />,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
