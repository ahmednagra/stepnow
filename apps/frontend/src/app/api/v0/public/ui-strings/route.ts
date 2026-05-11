// src/app/api/v0/public/ui-strings/route.ts
import type { NextRequest } from "next/server";
import { bffHandler, getParam, validateEnum } from "@/lib/bff-helpers";
import { getUiStringsServer } from "@/services/uiStrings";
import type { Locale } from "@/types";

const LOCALES: readonly Locale[] = ["de", "en"];

export async function GET(request: NextRequest) {
  return bffHandler(async () => {
    const locale = validateEnum<Locale>(getParam(request, "locale"), LOCALES, "de") ?? "de";
    const namespace = getParam(request, "namespace") ?? undefined;
    return getUiStringsServer(locale, namespace);
  });
}
