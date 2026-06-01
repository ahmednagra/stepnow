// src/app/api/v0/admin/bookings/[id]/convert-to-order/route.ts
// BFF handler to convert a booking into an order.
// Forwards to FastAPI POST /admin/bookings/{id}/convert-to-order with bearer auth.

import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminPost } from "@/lib/admin-bff";
import type { OrderDetail } from "@/services/orders";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(
    () => adminPost<OrderDetail>(`/admin/bookings/${params.id}/convert-to-order`, body),
    201,
  );
}
