// src/app/api/admin/orders/[id]/invoice/pdf/route.ts
// Binary BFF passthrough for the invoice PDF stream. The client (downloadInvoicePdf)
// fetches /api/admin/orders/{id}/invoice/pdf directly, so this handler lives under
// /api/admin (NOT /api/v0). It attaches the admin Bearer token and streams the raw
// PDF bytes back. Modeled on src/app/api/v0/admin/uploads/route.ts.
//
// NOTE: this path base (/api/admin) is intentionally matched to the client's existing
// fetch URL. Everything else in the app uses /api/v0 via nextjsApiClient; if you ever
// normalize these helpers, move this handler under /api/v0 and update the client.

import { NextResponse, type NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin-bff";
import { ApiError } from "@/lib/api-errors";

function getBackendApiUrl(): string {
  const rawBase =
    process.env.BACKEND_API_URL ??
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000";
  return rawBase.endsWith("/api/v0") ? rawBase : `${rawBase.replace(/\/$/, "")}/api/v0`;
}

const BACKEND_API_URL = getBackendApiUrl();

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  let token: string;
  try {
    token = await requireAdminToken();
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message, extra: err.extra ?? {} } },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated", extra: {} } },
      { status: 401 },
    );
  }

  try {
    const upstream = await fetch(`${BACKEND_API_URL}/admin/orders/${params.id}/invoice/pdf`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return new NextResponse(text || null, {
        status: upstream.status,
        headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
      });
    }

    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/pdf",
        ...(upstream.headers.get("Content-Disposition")
          ? { "Content-Disposition": upstream.headers.get("Content-Disposition") as string }
          : {}),
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "BACKEND_UNREACHABLE", message: "Could not reach backend", extra: {} } },
      { status: 502 },
    );
  }
}
