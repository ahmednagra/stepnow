// src/app/api/v0/public/faqs/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiErrorResponse, getParam, validateEnum } from "@/lib/bff-helpers";
import { listFaqsServer } from "@/services/faqs";
import type { Locale } from "@/types";

const LOCALES: readonly Locale[] = ["de", "en"];

export async function GET(request: NextRequest) {
  const locale = validateEnum<Locale>(getParam(request, "locale"), LOCALES, "de") ?? "de";
  const category = getParam(request, "category") ?? undefined;
  try {
    return NextResponse.json(await listFaqsServer(locale, category));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
