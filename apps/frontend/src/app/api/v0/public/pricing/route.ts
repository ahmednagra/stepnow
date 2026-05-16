// apps/frontend/src/app/api/v0/public/pricing/route.ts
// BFF handler for batch pricing. Forwards to FastAPI /public/pricing.

import type { NextRequest } from "next/server";
import { bffHandler, getParam, validateEnum } from "@/lib/bff-helpers";
import { listAllPricingServer } from "@/services/pricing";
import type { Locale } from "@/types";

const LOCALES: readonly Locale[] = ["de", "en"];

export async function GET(request: NextRequest) {
return bffHandler(async () => {
const locale = validateEnum<Locale>(getParam(request, "locale"), LOCALES, "de") ?? "de";
return listAllPricingServer(locale);
});
}
