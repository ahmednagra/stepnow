// src/app/api/v0/admin/orders/[id]/slip/pdf/route.ts
// Binary BFF passthrough for the driver-slip (Fahrauftrag) PDF stream. The client

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";

function getBackendApiUrl(): string {
  const rawBase =
    process.env.BACKEND_API_URL ??
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000";
  return rawBase.endsWith("/api/v0") ? rawBase : `${rawBase.replace(/\/$/, "")}/api/v0`;
}

const BACKEND_API_URL = getBackendApiUrl();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication token is required", extra: {} } },
      { status: 401 },
    );
  }

  try {
    const upstream = await fetch(`${BACKEND_API_URL}/admin/orders/${params.id}/slip/pdf`, {
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
