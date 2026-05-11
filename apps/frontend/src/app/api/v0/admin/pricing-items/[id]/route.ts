// src/app/api/v0/admin/pricing-items/[id]/route.ts
import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminPatch, adminDelete } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { PricingItemAdmin } from "@/types";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() =>
    adminPatch<PricingItemAdmin>(ENDPOINTS.ADMIN.PRICING_ITEM(params.id), body),
  );
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(async () => {
    await adminDelete(ENDPOINTS.ADMIN.PRICING_ITEM(params.id));
    return undefined as unknown as void;
  }, 204);
}
