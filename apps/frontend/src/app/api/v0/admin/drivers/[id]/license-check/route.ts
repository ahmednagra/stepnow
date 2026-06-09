// src/app/api/v0/admin/drivers/[id]/license-check/route.ts
// BFF handler for recording a §21 StVG licence check. Forwards to FastAPI.

import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminPost } from "@/lib/admin-bff";
import type { DriverAdmin } from "@/services/drivers";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = (await parseJsonBody<Record<string, unknown>>(request)) ?? {};
  return bffHandler(() => adminPost<DriverAdmin>(`/admin/drivers/${params.id}/license-check`, body));
}
