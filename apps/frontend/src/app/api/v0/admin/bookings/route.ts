// src/app/api/v0/admin/bookings/route.ts
import type { NextRequest } from "next/server";
import { bffHandler } from "@/lib/bff-helpers";
import { adminGet } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, BookingAdmin } from "@/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number> = {};
  const page = sp.get("page");
  const size = sp.get("size");
  const status = sp.get("status");
  if (page) params.page = Number(page);
  if (size) params.size = Number(size);
  if (status) params.status = status;
  return bffHandler(() =>
    adminGet<Paginated<BookingAdmin>>(ENDPOINTS.ADMIN.BOOKINGS, params),
  );
}
