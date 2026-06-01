// src/app/api/v0/admin/drivers/[id]/orders/route.ts
// BFF handler for a driver's job history (used by the driver detail page).
// Forwards to FastAPI /admin/drivers/{id}/orders.

import type { NextRequest } from "next/server";
import { bffHandler } from "@/lib/bff-helpers";
import { adminGet } from "@/lib/admin-bff";
import type { CourierOrder } from "@/services/courier";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(() => adminGet<CourierOrder[]>(`/admin/drivers/${params.id}/orders`));
}
