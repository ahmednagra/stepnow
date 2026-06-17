// src/app/api/v0/admin/testimonials/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import {
  listAdminTestimonialsServer,
  createAdminTestimonialServer,
} from "@/services/testimonials/testimonials.admin.server";
import type { TestimonialCreateInput } from "@/services/testimonials/testimonials.admin.client";

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number | boolean> = {};
  if (sp.get("page")) params.page = Number(sp.get("page"));
  if (sp.get("size")) params.size = Number(sp.get("size"));
  if (sp.get("q")) params.q = sp.get("q")!;
  if (sp.get("namespace")) params.namespace = sp.get("namespace")!;
  if (sp.get("include_deleted") === "true") params.include_deleted = true;
  try {
    return NextResponse.json(await listAdminTestimonialsServer(params, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = await parseJsonBody<TestimonialCreateInput>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    return NextResponse.json(await createAdminTestimonialServer(body, token), { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
