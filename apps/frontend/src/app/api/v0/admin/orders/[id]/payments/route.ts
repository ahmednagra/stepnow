// src/app/api/v0/admin/orders/[id]/payments/route.ts
// BFF handler for an order's payments ledger. Forwards to FastAPI
// /admin/orders/{id}/payments with bearer auth.

import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminGet, adminPost } from "@/lib/admin-bff";
import type { PaymentAdmin } from "@/services/orders";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(() => adminGet<PaymentAdmin[]>(`/admin/orders/${params.id}/payments`));
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(
    () => adminPost<PaymentAdmin>(`/admin/orders/${params.id}/payments`, body),
    201,
  );
}
