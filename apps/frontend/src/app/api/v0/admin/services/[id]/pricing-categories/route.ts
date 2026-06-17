// src/app/api/v0/admin/services/[id]/pricing-categories/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { listServicePricingCategoriesServer } from "@/services/services/services.admin.server";
import { createAdminPricingCategoryServer } from "@/services/pricing/pricing.admin.server";
import type { PricingCategoryCreateInput } from "@/services/pricing/pricing.admin.client";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  try {
    return NextResponse.json(await listServicePricingCategoriesServer(params.id, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = await parseJsonBody<PricingCategoryCreateInput>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    return NextResponse.json(await createAdminPricingCategoryServer(params.id, body, token), { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
