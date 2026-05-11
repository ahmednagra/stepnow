// src/app/api/v0/admin/legal-pages/[slug]/route.ts
import type { NextRequest } from "next/server";
import { bffHandler } from "@/lib/bff-helpers";
import { adminGet } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { LegalPageAdmin } from "@/types";

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  return bffHandler(() =>
    adminGet<LegalPageAdmin>(ENDPOINTS.ADMIN.LEGAL_PAGE(params.slug)),
  );
}
