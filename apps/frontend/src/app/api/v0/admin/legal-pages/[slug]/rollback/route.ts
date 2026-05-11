// src/app/api/v0/admin/legal-pages/[slug]/rollback/route.ts
import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminPost } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { LegalPageAdmin } from "@/types";

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() =>
    adminPost<LegalPageAdmin>(ENDPOINTS.ADMIN.LEGAL_PAGE_ROLLBACK(params.slug), body),
  );
}
