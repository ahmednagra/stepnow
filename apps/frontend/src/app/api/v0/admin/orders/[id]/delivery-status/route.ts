// src/app/api/v0/admin/orders/[id]/delivery-status/route.ts
// BFF handler to advance the manual delivery lifecycle (draft → dispatched → picked_up → delivered).
// Forwards to FastAPI POST /admin/orders/{id}/delivery-status with bearer auth.

import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminPost } from "@/lib/admin-bff";
import type { CourierOrder } from "@/services/courier";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() =>
    adminPost<CourierOrder>(`/admin/orders/${params.id}/delivery-status`, body),
  );
}
