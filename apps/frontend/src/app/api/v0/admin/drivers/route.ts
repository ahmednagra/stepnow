// src/app/api/v0/admin/drivers/route.ts
// BFF handler for drivers list + create. Forwards to FastAPI /admin/drivers.

import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminGet, adminPost } from "@/lib/admin-bff";
import type { Paginated } from "@/types";
import type { DriverAdmin } from "@/services/drivers";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number | boolean> = {};
  const page = sp.get("page");
  const size = sp.get("size");
  const q = sp.get("q");
  const activeOnly = sp.get("active_only");
  const includeDeleted = sp.get("include_deleted");
  if (page) params.page = Number(page);
  if (size) params.size = Number(size);
  if (q) params.q = q;
  if (activeOnly === "true") params.active_only = true;
  if (includeDeleted === "true") params.include_deleted = true;
  return bffHandler(() => adminGet<Paginated<DriverAdmin>>("/admin/drivers", params));
}

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() => adminPost<DriverAdmin>("/admin/drivers", body), 201);
}
