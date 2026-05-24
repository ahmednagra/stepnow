// apps/frontend/src/components/shared/Markdown.tsx
// Server-rendered markdown. No "use client" — html is produced on the server.

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/utils/cn";

interface MarkdownProps {
  source: string;
  className?: string;
}

export function Markdown({ source, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose-base text-[16px] leading-[1.75] text-[var(--color-text-secondary)]",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-10 font-serif text-3xl tracking-tight text-[var(--color-text-primary)]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-4 font-serif text-2xl tracking-tight text-[var(--color-text-primary)]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-8 text-[18px] font-semibold tracking-tight text-[var(--color-text-primary)]">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-5 leading-[1.75]">{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-[var(--color-accent-primary)] underline decoration-[color:rgba(85,133,24,0.35)] underline-offset-2 transition-colors hover:text-[var(--color-text-primary)]"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="my-5 space-y-2 pl-5">{children}</ul>,
          ol: ({ children }) => (
            <ol className="my-5 list-decimal space-y-2 pl-5 marker:text-[var(--color-accent-primary)]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed before:mr-2 before:text-[var(--color-accent-primary)] before:content-['—']">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[var(--color-text-primary)]">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          hr: () => <hr className="my-10 border-[color:var(--color-border-soft)]" />,
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-2 border-[var(--color-accent-primary)] pl-5 font-serif text-xl italic text-[var(--color-text-primary)]">
              {children}
            </blockquote>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
