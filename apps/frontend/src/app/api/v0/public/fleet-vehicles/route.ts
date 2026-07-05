// src/app/api/v0/public/fleet-vehicles/route.ts
// Public (no-auth) fleet dropdown for the worker create-order form.

import { NextResponse } from "next/server";
import { serverApiClient } from "@/lib/server-api";
import { apiErrorResponse } from "@/lib/bff-helpers";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";

export async function GET() {
  try {
    const r = await serverApiClient.get(ENDPOINTS.PUBLIC.FLEET_VEHICLES);
    if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
    return NextResponse.json(r.data);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
