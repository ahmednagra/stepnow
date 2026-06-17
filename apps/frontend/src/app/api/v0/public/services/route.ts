// src/app/api/v0/public/services/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiErrorResponse, getParam, validateEnum } from "@/lib/bff-helpers";
import { listServicesServer } from "@/services/services";
import type { Locale } from "@/types";

const LOCALES: readonly Locale[] = ["de", "en"];

export async function GET(request: NextRequest) {
  const locale = validateEnum<Locale>(getParam(request, "locale"), LOCALES, "de") ?? "de";
  try {
    return NextResponse.json(await listServicesServer(locale));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
