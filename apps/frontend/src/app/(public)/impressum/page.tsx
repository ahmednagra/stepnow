// src/app/(public)/impressum/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUiStringsServer } from "@/services/uiStrings";
import { getLegalPageServer } from "@/services/legalPages";
import { ApiError } from "@/lib/api-errors";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { LegalPageRenderer } from "@/components/features/legal";

const SLUG = "impressum";
const PATH = "/impressum";
const ALT_PATH = "/en/legal-notice";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await getLegalPageServer(SLUG, "de");
    return buildMetadata({
      title: page.title,
      description: page.title,
      path: PATH,
      alternatePath: ALT_PATH,
      locale: "de",
      noindex: false,
    });
  } catch {
    return { title: "Impressum" };
  }
}

export default async function ImpressumDe() {
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
