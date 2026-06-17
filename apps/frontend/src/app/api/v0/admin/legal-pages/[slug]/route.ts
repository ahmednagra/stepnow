// src/app/api/v0/admin/legal-pages/[slug]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { getAdminLegalPageServer } from "@/services/legalPages/legalPages.admin.server";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  try {
    return NextResponse.json(await getAdminLegalPageServer(params.slug, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
