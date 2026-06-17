// src/app/(public)/agb/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUiStringsServer } from "@/services/uiStrings";
import { getLegalPageServer } from "@/services/legalPages";
import { ApiError } from "@/lib/api-errors";
import { createT } from "@/lib/i18n/t";
import { buildMetadata, metaDescription } from "@/lib/seo";
import { LegalPageRenderer } from "@/components/features/legal";

const SLUG = "agb";
const PATH = "/agb";
const ALT_PATH = "/en/terms";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await getLegalPageServer(SLUG, "de");
    return buildMetadata({
      title: page.title,
      description: metaDescription(page.body),
      path: PATH,
      alternatePath: ALT_PATH,
      locale: "de",
    });
  } catch {
    return { title: "AGB" };
  }
}

export default async function AgbDe() {
  let stringsRes;
  let page;
  try {
    [stringsRes, page] = await Promise.all([
      getUiStringsServer("de"),
      getLegalPageServer(SLUG, "de"),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const t = createT(stringsRes.strings, "de");
  return <LegalPageRenderer t={t} page={page} locale="de" path={PATH} />;
}
