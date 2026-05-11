// src/app/api/v0/admin/pricing-categories/[id]/route.ts
import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminGet, adminPatch, adminDelete } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { PricingCategoryAdmin } from "@/types";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(() =>
    adminGet<PricingCategoryAdmin>(ENDPOINTS.ADMIN.PRICING_CATEGORY(params.id)),
  );
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() =>
    adminPatch<PricingCategoryAdmin>(ENDPOINTS.ADMIN.PRICING_CATEGORY(params.id), body),
  );
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(async () => {
    await adminDelete(ENDPOINTS.ADMIN.PRICING_CATEGORY(params.id));
    return undefined as unknown as void;
  }, 204);
}
