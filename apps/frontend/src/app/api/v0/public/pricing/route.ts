// apps/frontend/src/app/api/v0/public/pricing/route.ts
// BFF handler for batch pricing. Forwards to FastAPI /public/pricing.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiErrorResponse, getParam, validateEnum } from "@/lib/bff-helpers";
import { listAllPricingServer } from "@/services/pricing";
import type { Locale } from "@/types";

const LOCALES: readonly Locale[] = ["de", "en"];

export async function GET(request: NextRequest) {
const locale = validateEnum<Locale>(getParam(request, "locale"), LOCALES, "de") ?? "de";
try {
return NextResponse.json(await listAllPricingServer(locale));
} catch (err) {
return apiErrorResponse(err);
}
}
