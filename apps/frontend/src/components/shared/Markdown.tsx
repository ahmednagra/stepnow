// src/components/shared/Markdown.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/utils/cn";

interface MarkdownProps {
  source: string;
  className?: string;
}

/**
 * Renders DB-sourced markdown (legal pages, service long descriptions, FAQ
 * answers). Restrains to a known set of safe element types; raw HTML is
 * disabled by default in react-markdown so this is safe.
 */
export function Markdown({ source, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose-base space-y-4 text-[15px] leading-relaxed text-ink",
        "[&_h1]:font-serif [&_h1]:text-section [&_h1]:tracking-tight [&_h1]:mt-8 [&_h1]:mb-4",
        "[&_h2]:font-serif [&_h2]:text-sub [&_h2]:tracking-tight [&_h2]:mt-8 [&_h2]:mb-3",
        "[&_h3]:font-serif [&_h3]:text-xl [&_h3]:mt-6 [&_h3]:mb-2",
        "[&_p]:leading-relaxed",
        "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1",
        "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1",
        "[&_a]:text-gold-dark [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-gold",
        "[&_strong]:font-semibold",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-mute",
        "[&_code]:font-mono [&_code]:text-sm [&_code]:bg-line/30 [&_code]:px-1",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
