// src/app/api/v0/admin/drivers/[id]/route.ts
// BFF handler for a single driver. Forwards to FastAPI /admin/drivers/{id}.

import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminGet, adminPatch, adminDelete } from "@/lib/admin-bff";
import type { DriverAdmin } from "@/services/drivers";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(() => adminGet<DriverAdmin>(`/admin/drivers/${params.id}`));
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() => adminPatch<DriverAdmin>(`/admin/drivers/${params.id}`, body));
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(async () => {
    await adminDelete(`/admin/drivers/${params.id}`);
    return undefined as unknown as void;
  }, 204);
}
