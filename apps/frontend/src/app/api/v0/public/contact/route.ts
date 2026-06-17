// src/app/api/v0/public/contact/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiErrorResponse, errorResponse, parseJsonBody } from "@/lib/bff-helpers";
import { submitContactServer } from "@/services/contact";
import type { ContactCreate } from "@/types";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<ContactCreate>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Invalid JSON body", 400);

  const required: (keyof ContactCreate)[] = [
    "name",
    "email",
    "subject_category",
    "message",
    "language",
    "consent_dsgvo",
  ];
  for (const key of required) {
    if (body[key] === undefined || body[key] === null || body[key] === "") {
      return errorResponse("REQUIRED_FIELD", `Field '${key}' is required`, 400, { field: key });
    }
  }

  try {
    return NextResponse.json(await submitContactServer(body), { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
