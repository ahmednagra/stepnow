// src/app/api/v0/admin/orders/[id]/parcel/route.ts
// BFF handler to update an order's parcel/courier fields.
// Forwards to FastAPI PATCH /admin/orders/{id}/parcel with bearer auth.

import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminPatch } from "@/lib/admin-bff";
import type { CourierOrder } from "@/services/courier";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() => adminPatch<CourierOrder>(`/admin/orders/${params.id}/parcel`, body));
}
