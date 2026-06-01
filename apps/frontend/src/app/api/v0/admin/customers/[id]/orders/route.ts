// src/app/api/v0/admin/customers/[id]/orders/route.ts
// BFF handler for a customer's order history (used by the customer detail page).
// Forwards to FastAPI /admin/customers/{id}/orders.

import type { NextRequest } from "next/server";
import { bffHandler } from "@/lib/bff-helpers";
import { adminGet } from "@/lib/admin-bff";
import type { CourierOrder } from "@/services/courier";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(() => adminGet<CourierOrder[]>(`/admin/customers/${params.id}/orders`));
}
