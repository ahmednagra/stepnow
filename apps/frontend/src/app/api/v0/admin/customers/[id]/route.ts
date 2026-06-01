// src/app/api/v0/admin/customers/[id]/route.ts
// BFF handler for a single customer. Forwards to FastAPI /admin/customers/{id}.

import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminGet, adminPatch, adminDelete } from "@/lib/admin-bff";
import type { CustomerAdmin } from "@/services/customers";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(() => adminGet<CustomerAdmin>(`/admin/customers/${params.id}`));
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() => adminPatch<CustomerAdmin>(`/admin/customers/${params.id}`, body));
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  return bffHandler(async () => {
    await adminDelete(`/admin/customers/${params.id}`);
    return undefined as unknown as void;
  }, 204);
}
