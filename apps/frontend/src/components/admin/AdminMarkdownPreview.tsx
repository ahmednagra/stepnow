// src/components/admin/AdminMarkdownPreview.tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/utils/cn";

interface AdminMarkdownPreviewProps {
  source: string;
  className?: string;
}

/**
 * Markdown preview pane for admin editors. Plain Inter typography (no serif),
 * dense vertical rhythm, slate palette to match the rest of the admin UI.
 *
 * Raw HTML is disabled by default in react-markdown, so this is safe to
 * render with un-trusted input from the editor field.
 */
export function AdminMarkdownPreview({ source, className }: AdminMarkdownPreviewProps) {
  if (!source.trim()) {
    return (
      <div className={cn("text-[12px] italic text-slate-400", className)}>
        Nothing to preview yet — start typing in the editor.
      </div>
    );
  }
  return (
    <div
      className={cn(
        "text-[13px] leading-relaxed text-slate-800",
        "[&_h1]:text-base [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2",
        "[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5",
        "[&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1",
        "[&_p]:my-2",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-1",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:space-y-1",
        "[&_a]:text-slate-900 [&_a]:underline [&_a]:underline-offset-2",
        "[&_strong]:font-semibold [&_strong]:text-slate-900",
        "[&_em]:italic",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:text-slate-600",
        "[&_code]:font-mono [&_code]:text-[11px] [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-px",
        "[&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-2 [&_pre]:overflow-x-auto [&_pre]:my-2",
        "[&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0",
        "[&_hr]:border-slate-200 [&_hr]:my-3",
        "[&_table]:border-collapse [&_table]:my-2",
        "[&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left",
        "[&_td]:border [&_td]:border-slate-300 [&_td]:px-2 [&_td]:py-1",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
