// src/app/api/v0/public/ui-strings/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiErrorResponse, getParam, validateEnum } from "@/lib/bff-helpers";
import { getUiStringsServer } from "@/services/uiStrings";
import type { Locale } from "@/types";

const LOCALES: readonly Locale[] = ["de", "en"];

export async function GET(request: NextRequest) {
  const locale = validateEnum<Locale>(getParam(request, "locale"), LOCALES, "de") ?? "de";
  const namespace = getParam(request, "namespace") ?? undefined;
  try {
    return NextResponse.json(await getUiStringsServer(locale, namespace));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
