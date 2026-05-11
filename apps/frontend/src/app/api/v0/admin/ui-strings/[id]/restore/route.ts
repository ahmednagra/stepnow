// src/app/api/v0/admin/ui-strings/[id]/restore/route.ts
import type { NextRequest } from "next/server";
import { bffHandler } from "@/lib/bff-helpers";
import { adminPost } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { UiStringAdmin } from "@/types";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(() => adminPost<UiStringAdmin>(ENDPOINTS.ADMIN.UI_STRING_RESTORE(params.id)));
}
