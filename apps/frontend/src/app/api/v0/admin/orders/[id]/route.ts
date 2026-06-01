// src/app/api/v0/admin/orders/[id]/route.ts
// BFF handler for a single order. Forwards to FastAPI /admin/orders/{id} with bearer auth.

import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminGet, adminPatch, adminDelete } from "@/lib/admin-bff";
import type { OrderDetail } from "@/services/orders";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(() => adminGet<OrderDetail>(`/admin/orders/${params.id}`));
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() => adminPatch<OrderDetail>(`/admin/orders/${params.id}`, body));
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(async () => {
    await adminDelete(`/admin/orders/${params.id}`);
    return undefined as unknown as void;
  }, 204);
}
