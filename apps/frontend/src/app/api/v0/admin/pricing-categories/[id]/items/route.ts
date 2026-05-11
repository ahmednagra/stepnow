// src/app/api/v0/admin/pricing-categories/[id]/items/route.ts
import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminPost } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { PricingItemAdmin } from "@/types";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() =>
    adminPost<PricingItemAdmin>(ENDPOINTS.ADMIN.PRICING_CATEGORY_ITEMS(params.id), body),
  );
}
