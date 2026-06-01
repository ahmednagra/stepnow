// src/app/api/v0/admin/orders/route.ts
// BFF handler for the orders list. Forwards to FastAPI /admin/orders with bearer auth.

import type { NextRequest } from "next/server";
import { bffHandler } from "@/lib/bff-helpers";
import { adminGet } from "@/lib/admin-bff";
import type { Paginated } from "@/types";
import type { OrderAdmin } from "@/services/orders";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number | boolean> = {};
  const page = sp.get("page");
  const size = sp.get("size");
  const status = sp.get("status");
  const q = sp.get("q");
  const includeDeleted = sp.get("include_deleted");
  if (page) params.page = Number(page);
  if (size) params.size = Number(size);
  if (status) params.status = status;
  if (q) params.q = q;
  if (includeDeleted === "true") params.include_deleted = true;
  return bffHandler(() => adminGet<Paginated<OrderAdmin>>("/admin/orders", params));
}
