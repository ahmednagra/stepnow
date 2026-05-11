// src/app/api/v0/admin/faqs/[id]/restore/route.ts
import type { NextRequest } from "next/server";
import { bffHandler } from "@/lib/bff-helpers";
import { adminPost } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { FaqAdmin } from "@/types";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(() => adminPost<FaqAdmin>(ENDPOINTS.ADMIN.FAQ_RESTORE(params.id)));
}
