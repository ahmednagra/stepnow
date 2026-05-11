// src/app/api/v0/public/services/route.ts
import type { NextRequest } from "next/server";
import { bffHandler, getParam, validateEnum } from "@/lib/bff-helpers";
import { listServicesServer } from "@/services/services";
import type { Locale } from "@/types";

const LOCALES: readonly Locale[] = ["de", "en"];

export async function GET(request: NextRequest) {
  return bffHandler(async () => {
    const locale = validateEnum<Locale>(getParam(request, "locale"), LOCALES, "de") ?? "de";
    return listServicesServer(locale);
  });
}
