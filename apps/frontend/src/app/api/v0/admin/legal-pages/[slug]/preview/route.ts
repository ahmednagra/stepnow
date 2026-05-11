// src/app/api/v0/admin/legal-pages/[slug]/preview/route.ts
import type { NextRequest } from "next/server";
import { bffHandler } from "@/lib/bff-helpers";
import { adminGet } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  return bffHandler(() => adminGet(ENDPOINTS.ADMIN.LEGAL_PAGE_PREVIEW(params.slug)));
}
