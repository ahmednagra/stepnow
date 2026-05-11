// src/app/api/v0/admin/pricing-categories/[id]/restore/route.ts
import type { NextRequest } from "next/server";
import { bffHandler } from "@/lib/bff-helpers";
import { adminPost } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { PricingCategoryAdmin } from "@/types";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(() =>
    adminPost<PricingCategoryAdmin>(ENDPOINTS.ADMIN.PRICING_CATEGORY_RESTORE(params.id)),
  );
}
