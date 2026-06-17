// apps/frontend/src/lib/revalidate.ts
// Server-only. Maps an admin write path to the public ISR cache tags it should bust.
// Extracted from the former admin-bff helper so per-resource server services can
// invalidate the public site after a mutation.

import "server-only";
import { revalidateTag } from "next/cache";

const TAG_MAP: { match: RegExp; tags: string[] }[] = [
  { match: /\/admin\/services/, tags: ["services", "services:de", "services:en"] },
  { match: /\/admin\/vehicles/, tags: ["vehicles", "vehicles:de", "vehicles:en"] },
  { match: /\/admin\/faqs/, tags: ["faqs", "faqs:de", "faqs:en"] },
  { match: /\/admin\/testimonials/, tags: ["testimonials", "testimonials:de", "testimonials:en"] },
  { match: /\/admin\/pricing/, tags: ["pricing", "pricing:de", "pricing:en", "services:de", "services:en"] },
  { match: /\/admin\/ui-strings/, tags: ["ui-strings", "ui-strings:de", "ui-strings:en"] },
  { match: /\/admin\/settings/, tags: ["settings", "settings:de", "settings:en"] },
  { match: /\/admin\/legal-pages/, tags: ["legal-pages", "legal-pages:de", "legal-pages:en"] },
];

/** Revalidate the public cache tags mapped to this admin write path. No-op if unmapped. */
export function revalidateForPath(path: string): void {
  for (const { match, tags } of TAG_MAP) {
    if (match.test(path)) {
      for (const tag of tags) revalidateTag(tag);
      return;
    }
  }
}
