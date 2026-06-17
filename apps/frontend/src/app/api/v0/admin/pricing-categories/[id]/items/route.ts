// src/app/api/v0/admin/pricing-categories/[id]/items/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { createAdminPricingItemServer } from "@/services/pricing/pricing.admin.server";
import type { PricingItemCreateInput } from "@/services/pricing/pricing.admin.client";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = await parseJsonBody<PricingItemCreateInput>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    return NextResponse.json(await createAdminPricingItemServer(params.id, body, token), { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
