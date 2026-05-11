// src/app/api/v0/admin/services/[id]/restore/route.ts
import type { NextRequest } from "next/server";
import { bffHandler } from "@/lib/bff-helpers";
import { adminPost } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { ServiceAdmin } from "@/types";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(() => adminPost<ServiceAdmin>(ENDPOINTS.ADMIN.SERVICE_RESTORE(params.id)));
}
