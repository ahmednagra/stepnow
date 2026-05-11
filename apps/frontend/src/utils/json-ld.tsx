// src/utils/json-ld.tsx
// Renders a JSON-LD <script> tag. Uses dangerouslySetInnerHTML which is the
// standard Next.js pattern for structured data — the content is our own
// serialized object, not user input, so there's no XSS risk.

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
