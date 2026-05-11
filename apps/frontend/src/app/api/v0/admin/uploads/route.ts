// src/app/api/v0/admin/uploads/route.ts
// Multipart BFF passthrough. Unlike JSON admin routes which use adminPost,
// this forwards the raw multipart body to the backend with the admin Bearer
// token attached. Body streaming is preserved by Next.js's NextRequest.
import { NextResponse, type NextRequest } from "next/server";
import { requireAdminToken } from "@/lib/admin-bff";
import { ApiError } from "@/lib/api-errors";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || "http://localhost:8000/api/v0";

export async function POST(request: NextRequest) {
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

  // Re-read the form data on this side, then rebuild the multipart body for
  // the upstream request. We can't directly pipe NextRequest body through
  // because Next requires us to consume it as FormData first.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "Expected multipart/form-data",
          extra: {},
        },
      },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${BACKEND_API_URL}/admin/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "BACKEND_UNREACHABLE",
          message: "Could not reach backend",
          extra: {},
        },
      },
      { status: 502 },
    );
  }
}
