// src/app/api/v0/admin/orders/[id]/invoice/route.ts
// BFF handler to create an invoice from an order. Forwards to FastAPI
// POST /admin/orders/{id}/invoice with bearer auth.
// NOTE: the invoice *PDF* stream lives at /admin/orders/{id}/invoice/pdf and is
// fetched directly (authenticated FileResponse), not through this JSON handler.

import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminPost } from "@/lib/admin-bff";
import type { InvoiceAdmin } from "@/services/orders";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = (await parseJsonBody<Record<string, unknown>>(request)) ?? {};
  return bffHandler(() => adminPost<InvoiceAdmin>(`/admin/orders/${params.id}/invoice`, body), 201);
}
