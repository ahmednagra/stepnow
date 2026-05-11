// src/app/api/v0/public/services/[slug]/route.ts
import type { NextRequest } from "next/server";
import { bffHandler, errorResponse, getParam, validateEnum } from "@/lib/bff-helpers";
import { getServiceBySlugServer } from "@/services/services";
import type { Locale } from "@/types";

const LOCALES: readonly Locale[] = ["de", "en"];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!slug) return errorResponse("BAD_REQUEST", "slug is required", 400);
  return bffHandler(async () => {
    const locale = validateEnum<Locale>(getParam(request, "locale"), LOCALES, "de") ?? "de";
    return getServiceBySlugServer(slug, locale);
  });
}
