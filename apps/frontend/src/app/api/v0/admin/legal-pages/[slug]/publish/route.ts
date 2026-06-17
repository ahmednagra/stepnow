// src/app/api/v0/admin/legal-pages/[slug]/publish/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { publishAdminLegalPageServer } from "@/services/legalPages/legalPages.admin.server";
import type { LegalPagePublishInput } from "@/services/legalPages/legalPages.admin.client";

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = (await parseJsonBody<LegalPagePublishInput>(request)) ?? {};
  try {
    return NextResponse.json(await publishAdminLegalPageServer(params.slug, body, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
