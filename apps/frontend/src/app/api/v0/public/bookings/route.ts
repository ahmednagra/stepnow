// src/app/api/v0/public/bookings/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiErrorResponse, errorResponse, parseJsonBody } from "@/lib/bff-helpers";
import { submitBookingServer } from "@/services/bookings";
import type { BookingCreate } from "@/types";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<BookingCreate>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Invalid JSON body", 400);

  // Minimal BFF-level validation. Full validation is on the FastAPI side.
  const required: (keyof BookingCreate)[] = [
    "pickup_address",
    "destination_address",
    "requested_datetime",
    "customer_name",
    "customer_phone",
    "customer_email",
    "language",
    "consent_dsgvo",
  ];
  for (const key of required) {
    if (body[key] === undefined || body[key] === null || body[key] === "") {
      return errorResponse("REQUIRED_FIELD", `Field '${key}' is required`, 400, { field: key });
    }
  }

  try {
    return NextResponse.json(await submitBookingServer(body), { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
