// src/app/api/v0/admin/contact-messages/route.ts
import type { NextRequest } from "next/server";
import { bffHandler } from "@/lib/bff-helpers";
import { adminGet } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, ContactMessageAdmin } from "@/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number | boolean> = {};
  const page = sp.get("page");
  const size = sp.get("size");
  const isHandled = sp.get("is_handled");
  const cat = sp.get("subject_category");
  const q = sp.get("q");
  const fromDate = sp.get("from_date");
  const toDate = sp.get("to_date");
  const includeDeleted = sp.get("include_deleted");
  if (page) params.page = Number(page);
  if (size) params.size = Number(size);
  if (isHandled === "true" || isHandled === "false") params.is_handled = isHandled === "true";
  if (cat) params.subject_category = cat;
  if (q) params.q = q;
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;
  if (includeDeleted === "true") params.include_deleted = true;
  return bffHandler(() =>
    adminGet<Paginated<ContactMessageAdmin>>(ENDPOINTS.ADMIN.CONTACT_MESSAGES, params),
  );
}
