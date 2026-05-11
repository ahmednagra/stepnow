// src/app/api/v0/admin/faqs/route.ts
import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminGet, adminPost } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, FaqAdmin } from "@/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number | boolean> = {};
  const page = sp.get("page");
  const size = sp.get("size");
  const q = sp.get("q");
  const ns = sp.get("namespace");
  const includeDeleted = sp.get("include_deleted");
  if (page) params.page = Number(page);
  if (size) params.size = Number(size);
  if (q) params.q = q;
  if (ns) params.namespace = ns;
  if (includeDeleted === "true") params.include_deleted = true;
  return bffHandler(() => adminGet<Paginated<FaqAdmin>>(ENDPOINTS.ADMIN.FAQS, params));
}

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() => adminPost<FaqAdmin>(ENDPOINTS.ADMIN.FAQS, body));
}
