// src/utils/json-ld.tsx
// Renders a JSON-LD <script> tag. The data includes admin-editable text (business name, FAQs,
// service copy), so the JSON is made HTML-safe before it goes into dangerouslySetInnerHTML: a raw
// "</script>" in any string would otherwise end the tag and let the rest run as markup.

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

const UNSAFE_IN_SCRIPT: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

/** JSON.stringify, with the characters that can break out of a <script> escaped as \\u sequences. */
function toSafeJsonLd(data: JsonLdProps["data"]): string {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (ch) => UNSAFE_IN_SCRIPT[ch] ?? ch);
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: toSafeJsonLd(data) }}
    />
  );
}
