"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/utils/cn";

interface MarkdownProps {
  source: string;
  className?: string;
}

export function Markdown({ source, className }: MarkdownProps) {
  return (
    <div className={cn("prose-base text-[16px] leading-[1.75] text-ink/90", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-10 mb-4 font-serif text-3xl tracking-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-10 mb-4 font-serif text-2xl tracking-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-8 mb-3 text-[18px] font-semibold tracking-tight text-ink">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-5 leading-[1.75]">{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-gold-deep underline decoration-gold/40 underline-offset-2 transition-colors hover:text-ink"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="my-5 space-y-2 pl-5">{children}</ul>,
          ol: ({ children }) => (
            <ol className="my-5 list-decimal space-y-2 pl-5 marker:text-gold-deep">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed before:mr-2 before:text-gold before:content-['—']">
              {children}
            </li>
          ),
          strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          hr: () => <hr className="my-10 border-line" />,
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-2 border-gold pl-5 font-serif text-xl italic">
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
