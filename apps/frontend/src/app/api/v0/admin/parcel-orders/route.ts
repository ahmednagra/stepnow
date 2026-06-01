// src/app/api/v0/admin/parcel-orders/route.ts
// BFF handler for the courier (parcel) orders list + manual create.
// Forwards to FastAPI /admin/parcel-orders with bearer auth.

import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminGet, adminPost } from "@/lib/admin-bff";
import type { Paginated } from "@/types";
import type { CourierOrder } from "@/services/courier";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number | boolean> = {};
  const page = sp.get("page");
  const size = sp.get("size");
  const deliveryStatus = sp.get("delivery_status");
  const q = sp.get("q");
  const includeDeleted = sp.get("include_deleted");
  if (page) params.page = Number(page);
  if (size) params.size = Number(size);
  if (deliveryStatus) params.delivery_status = deliveryStatus;
  if (q) params.q = q;
  if (includeDeleted === "true") params.include_deleted = true;
  return bffHandler(() => adminGet<Paginated<CourierOrder>>("/admin/parcel-orders", params));
}

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() => adminPost<CourierOrder>("/admin/parcel-orders", body), 201);
}
