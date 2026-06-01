// src/app/api/v0/admin/customers/route.ts
// BFF handler for customers list + create. Forwards to FastAPI /admin/customers
// with bearer auth. Also serves the repeat-customer search (?q=...&size=8).

import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminGet, adminPost } from "@/lib/admin-bff";
import type { Paginated } from "@/types";
import type { CustomerAdmin } from "@/services/customers";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number | boolean> = {};
  const page = sp.get("page");
  const size = sp.get("size");
  const q = sp.get("q");
  const includeDeleted = sp.get("include_deleted");
  if (page) params.page = Number(page);
  if (size) params.size = Number(size);
  if (q) params.q = q;
  if (includeDeleted === "true") params.include_deleted = true;
  return bffHandler(() => adminGet<Paginated<CustomerAdmin>>("/admin/customers", params));
}

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() => adminPost<CustomerAdmin>("/admin/customers", body), 201);
}
