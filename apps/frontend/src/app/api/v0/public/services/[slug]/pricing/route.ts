// src/app/api/v0/public/services/[slug]/pricing/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiErrorResponse, errorResponse, getParam, validateEnum } from "@/lib/bff-helpers";
import { getPricingForServiceServer } from "@/services/pricing";
import type { Locale } from "@/types";

const LOCALES: readonly Locale[] = ["de", "en"];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!slug) return errorResponse("BAD_REQUEST", "slug is required", 400);
  const locale = validateEnum<Locale>(getParam(request, "locale"), LOCALES, "de") ?? "de";
  try {
    return NextResponse.json(await getPricingForServiceServer(slug, locale));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
