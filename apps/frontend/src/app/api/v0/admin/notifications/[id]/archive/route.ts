// src/app/api/v0/admin/notifications/[id]/archive/route.ts
// BFF handler to archive one notification. Forwards to FastAPI POST /admin/notifications/{id}/archive.

import type { NextRequest } from "next/server";
import { bffHandler } from "@/lib/bff-helpers";
import { adminPost } from "@/lib/admin-bff";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(async () => {
    await adminPost<void>(`/admin/notifications/${params.id}/archive`);
    return undefined as unknown as void;
  }, 204);
}
