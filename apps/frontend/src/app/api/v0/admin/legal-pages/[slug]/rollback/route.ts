// src/app/api/v0/admin/legal-pages/[slug]/rollback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { rollbackAdminLegalPageServer } from "@/services/legalPages/legalPages.admin.server";
import type { LegalPageRollbackInput } from "@/services/legalPages/legalPages.admin.client";

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = await parseJsonBody<LegalPageRollbackInput>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    return NextResponse.json(await rollbackAdminLegalPageServer(params.slug, body, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
