// src/app/api/v0/admin/legal-pages/route.ts
import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminGet, adminPost } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { LegalPageAdmin } from "@/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number | boolean> = {};
  const includeDeleted = sp.get("include_deleted");
  if (includeDeleted === "true") params.include_deleted = true;
  return bffHandler(() =>
    adminGet<{ items: LegalPageAdmin[] }>(ENDPOINTS.ADMIN.LEGAL_PAGES, params),
  );
}

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() => adminPost<LegalPageAdmin>(ENDPOINTS.ADMIN.LEGAL_PAGES, body));
}
