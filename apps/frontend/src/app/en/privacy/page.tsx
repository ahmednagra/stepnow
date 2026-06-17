// src/app/en/privacy/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUiStringsServer } from "@/services/uiStrings";
import { getLegalPageServer } from "@/services/legalPages";
import { ApiError } from "@/lib/api-errors";
import { createT } from "@/lib/i18n/t";
import { buildMetadata, metaDescription } from "@/lib/seo";
import { LegalPageRenderer } from "@/components/features/legal";

const SLUG = "datenschutz";
const PATH = "/en/privacy";
const ALT_PATH = "/datenschutz";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await getLegalPageServer(SLUG, "en");
    return buildMetadata({
      title: page.title,
      description: metaDescription(page.body),
      path: PATH,
      alternatePath: ALT_PATH,
      locale: "en",
    });
  } catch {
    return { title: "Privacy Policy" };
  }
}

export default async function PrivacyEn() {
  let stringsRes;
  let page;
  try {
    [stringsRes, page] = await Promise.all([
      getUiStringsServer("en"),
      getLegalPageServer(SLUG, "en"),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const t = createT(stringsRes.strings, "en");
  return <LegalPageRenderer t={t} page={page} locale="en" path={PATH} />;
}
