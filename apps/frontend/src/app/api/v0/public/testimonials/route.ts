// src/app/api/v0/public/testimonials/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiErrorResponse, getParam, validateEnum } from "@/lib/bff-helpers";
import { listTestimonialsServer } from "@/services/testimonials";
import type { Locale } from "@/types";

const LOCALES: readonly Locale[] = ["de", "en"];

export async function GET(request: NextRequest) {
  const locale = validateEnum<Locale>(getParam(request, "locale"), LOCALES, "de") ?? "de";
  try {
    return NextResponse.json(await listTestimonialsServer(locale));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
