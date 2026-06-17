// src/app/api/v0/admin/pricing-categories/[id]/restore/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { restoreAdminPricingCategoryServer } from "@/services/pricing/pricing.admin.server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  try {
    return NextResponse.json(await restoreAdminPricingCategoryServer(params.id, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
