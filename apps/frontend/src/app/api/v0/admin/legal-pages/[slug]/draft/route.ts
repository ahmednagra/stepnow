// src/app/api/v0/admin/legal-pages/[slug]/draft/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { saveAdminLegalPageDraftServer } from "@/services/legalPages/legalPages.admin.server";
import type { LegalPageDraftInput } from "@/services/legalPages/legalPages.admin.client";

export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = await parseJsonBody<LegalPageDraftInput>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    return NextResponse.json(await saveAdminLegalPageDraftServer(params.slug, body, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
