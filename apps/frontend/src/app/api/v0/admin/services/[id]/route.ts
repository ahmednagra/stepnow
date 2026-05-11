// src/app/api/v0/admin/services/[id]/route.ts
import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminGet, adminPatch, adminDelete } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { ServiceAdmin } from "@/types";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(() => adminGet<ServiceAdmin>(ENDPOINTS.ADMIN.SERVICE_BY_ID(params.id)));
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() => adminPatch<ServiceAdmin>(ENDPOINTS.ADMIN.SERVICE_BY_ID(params.id), body));
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(async () => {
    await adminDelete(ENDPOINTS.ADMIN.SERVICE_BY_ID(params.id));
    return undefined as unknown as void;
  }, 204);
}
