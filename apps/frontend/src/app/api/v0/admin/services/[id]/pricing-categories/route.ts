// src/app/api/v0/admin/services/[id]/pricing-categories/route.ts
import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminGet, adminPost } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { PricingCategoryAdmin } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  return bffHandler(() =>
    adminGet<PricingCategoryAdmin[]>(ENDPOINTS.ADMIN.SERVICE_PRICING_CATEGORIES(params.id)),
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() =>
    adminPost<PricingCategoryAdmin>(
      ENDPOINTS.ADMIN.SERVICE_PRICING_CATEGORIES(params.id),
      body,
    ),
  );
}
