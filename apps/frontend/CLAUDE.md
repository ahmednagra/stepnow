# StepNow — Frontend

Next.js 14 / React 18 / TypeScript strict / Tailwind / TanStack Query v5.
Read the sibling file before touching anything.

---

## Stack

| | |
|---|---|
| Framework | Next.js 14 App Router |
| State | TanStack Query v5 |
| Language | TypeScript strict — `any` banned |
| Auth | `localStorage` token (`accessToken`) → `Authorization: Bearer` header |
| Deploy | Hostinger VPS — systemd port 3000 |

---

## ⚠️ Migration State

Two patterns coexist. **Always use TARGET. Migrate fully on contact.**

| Layer | OLD (delete on contact) | TARGET |
|---|---|---|
| Admin reads | `serverApiClient` in server component | React Query hook → client service → BFF |
| Mutations | inline fetch in component | `hooks/mutations/use{Resource}Mutations.ts` |
| URLs | inline template literals | `ENDPOINTS.*` only |
| Token | httpOnly cookie + `credentials:"same-origin"` | `localStorage` (`accessToken`), auto-attached by `nextjsApiClient` |
| BFF auth | `getAccessTokenFromCookies()` (cookie) | `extractBearerToken(request)` (header) |
| Route guard | server `getCurrentAdmin()` in layout | client `(authed)/layout.tsx` + `useCurrentAdmin` |

> **Auth migration complete.** The localStorage/bearer pattern from the API Flow + React Query guides is now live in code — httpOnly cookies (`sn_access`/`sn_refresh`), `admin-session.ts`, and all server-side authed page fetches were removed. Admin pages are client components fetching via React Query hooks.

---

## Request Flow — 7 Steps, Always All 7

```
Component
  → hooks/queries/use{Resource}.ts
    → services/{resource}/{resource}.client.ts   (nextjsApiClient → /api/v0/*)
      → app/api/v0/admin/{resource}/route.ts     (extractBearerToken + validation + NextResponse.json)
        → services/{resource}/{resource}.server.ts  (serverApiClient → FastAPI)
          → FastAPI
```

---

## Directory

```
src/
├── app/api/v0/admin/
│   ├── {resource}/route.ts          # collection: GET list, POST create
│   └── {resource}/[id]/route.ts     # detail: GET, PATCH, DELETE
├── components/admin/                # ⭐ design system — AdminCard, AdminFormField,
│   └── index.ts                     #   adminInputClass, AdminPageHeader, AdminTable,
│                                    #   KpiTile, ConfirmDialog, Pagination, pushToast
├── hooks/
│   ├── queries/                     # ALL React Query read hooks
│   │   ├── index.ts                 # barrel
│   │   ├── useOrders.ts             # ✅ reference shape
│   │   ├── useNotifications.ts      # ✅ exists
│   │   ├── useCustomers.ts          # 🔲 create
│   │   ├── useDrivers.ts            # 🔲 create
│   │   ├── useVehicles.ts           # 🔲 create
│   │   ├── useExpenses.ts           # 🔲 create
│   │   └── useBookings.ts           # 🔲 create
│   └── mutations/
│       ├── index.ts
│       └── use{Resource}Mutations.ts
├── lib/
│   ├── nextjs-api.ts                # nextjsApiClient — browser → /api/v0/*
│   ├── server-api.ts                # serverApiClient — BFF → FastAPI
│   ├── auth-storage.ts             # localStorage token get/set/clear (client)
│   ├── auth-utils.ts                # extractBearerToken (request) · getBearerTokenFromHeaders (next/headers)
│   ├── bff-helpers.ts               # errorResponse, apiErrorResponse, parseJsonBody, getParam
│   ├── revalidate.ts                # revalidateForPath — bust public ISR tags after an admin write
│   ├── api-errors.ts                # ApiError
│   └── react-query/
│       ├── config.ts                # STALE_TIMES, GC_TIMES
│       ├── query-keys.ts            # queryKeys factory — ONLY place for key strings
│       └── index.ts
├── services/
│   ├── api/endpoints.ts             # ENDPOINTS — every FastAPI URL lives here
│   ├── orders/                      # ✅ reference shape
│   ├── customers/                   # 🔲 create
│   ├── drivers/                     # 🔲 create
│   ├── vehicles/                    # 🔲 create
│   └── expenses/                    # 🔲 create
└── types/{feature}.ts
```

---

## Step 1 — Types

```typescript
// src/types/vehicles.ts
export interface VehicleAdmin { id: string; plate: string; label: string; category: string; active: boolean; created_at: string; }
export interface VehicleCreateRequest { plate: string; label: string; category: string; active?: boolean; }
export type VehicleUpdateRequest = Partial<VehicleCreateRequest>;
```

---

## Step 2 — Endpoints

```typescript
// src/services/api/endpoints.ts — add missing entries
ADMIN: {
  VEHICLES:       "/admin/vehicles",
  VEHICLE_BY_ID:  (id: string) => `/admin/vehicles/${id}`,
  CUSTOMERS:      "/admin/customers",
  CUSTOMER_BY_ID: (id: string) => `/admin/customers/${id}`,
  DRIVERS:        "/admin/drivers",
  DRIVER_BY_ID:   (id: string) => `/admin/drivers/${id}`,
  EXPENSES:       "/admin/expenses",
  EXPENSE_BY_ID:  (id: string) => `/admin/expenses/${id}`,
  BOOKINGS:       "/admin/bookings",
  BOOKING_BY_ID:  (id: string) => `/admin/bookings/${id}`,
}
```

---

## Step 3 — Admin Server Service (`{resource}.admin.server.ts`)

`"server-only"`. Wraps `serverApiClient` + `ENDPOINTS.*` + `authToken`. Local `unwrap` throws `ApiError` on failure; **every mutation calls `revalidateForPath(...)`** to bust the public ISR tags (replaces the old `admin-bff` invalidation). Do NOT add this file to a barrel `index.ts` (it's server-only).

```typescript
// src/services/vehicles/vehicles.admin.server.ts
import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, VehicleAdmin } from "@/types";
import type { VehicleCreateInput, VehicleUpdateInput } from "./vehicles.admin.client";

function unwrap<T>(r: ApiResponse<T>): T {
  if (r.error || r.data === undefined) throw new ApiError(r.error?.code ?? "EMPTY_RESPONSE", r.error?.message ?? "Request failed", r.status, r.error?.extra);
  return r.data;
}

export async function listAdminVehiclesServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string) {
  return unwrap(await serverApiClient.get<Paginated<VehicleAdmin>>(ENDPOINTS.ADMIN.VEHICLES, { params }, authToken));
}
export async function createAdminVehicleServer(data: VehicleCreateInput, authToken: string) {
  const v = unwrap(await serverApiClient.post<VehicleAdmin>(ENDPOINTS.ADMIN.VEHICLES, data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.VEHICLES);
  return v;
}
// getAdminVehicleServer / updateAdminVehicleServer / deleteAdminVehicleServer / restoreAdminVehicleServer — same shape
```

---

## Step 4 — Route (API Flow guide pattern — no `bffHandler`)

`extractBearerToken` → 401 guard → call the server service → `NextResponse.json` → `catch → apiErrorResponse`. POST create returns 201; DELETE returns 204.

```typescript
// src/app/api/v0/admin/vehicles/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { listAdminVehiclesServer, createAdminVehicleServer } from "@/services/vehicles/vehicles.admin.server";
import type { VehicleCreateInput } from "@/services/vehicles/vehicles.admin.client";

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number | boolean> = {};
  if (sp.get("page")) params.page = Number(sp.get("page"));
  if (sp.get("q")) params.q = sp.get("q")!;
  try {
    return NextResponse.json(await listAdminVehiclesServer(params, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
export async function POST(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = await parseJsonBody<VehicleCreateInput>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    return NextResponse.json(await createAdminVehicleServer(body, token), { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
```

Public (no-auth) routes use the same `try/NextResponse.json/catch apiErrorResponse` shape without the token guard.

---

## Step 5 — Client Service

Browser-only. `nextjsApiClient` reads `localStorage.getItem("accessToken")` and attaches `Authorization: Bearer <token>` on every request — so client services stay compact and token-free. A missing token surfaces as a 401 from the BFF route's `extractBearerToken` guard.

```typescript
// src/services/vehicles/vehicles.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated } from "@/types";
import type { VehicleAdmin, VehicleCreateRequest, VehicleUpdateRequest } from "@/types/vehicles";

const B = `/api/v0${ENDPOINTS.ADMIN.VEHICLES}`;
const byId = (id: string) => `/api/v0${ENDPOINTS.ADMIN.VEHICLE_BY_ID(id)}`;

export const listVehicles = (params?: Record<string, unknown>) => nextjsApiClient.get<Paginated<VehicleAdmin>>(B, { params });
export const getVehicle   = (id: string)                       => nextjsApiClient.get<VehicleAdmin>(byId(id));
export const createVehicle = (data: VehicleCreateRequest)      => nextjsApiClient.post<VehicleAdmin>(B, data);
export const updateVehicle = (id: string, data: VehicleUpdateRequest) => nextjsApiClient.patch<VehicleAdmin>(byId(id), data);
export const deleteVehicle = (id: string)                      => nextjsApiClient.delete<void>(byId(id));
```

> `nextjsApiClient` attaches the bearer header from `localStorage` in one place ([nextjs-api.ts](src/lib/nextjs-api.ts)). Raw `fetch` calls (e.g. multipart uploads) must add `Authorization: Bearer` manually via `getAccessToken()`.

---

## Step 6 — Service Index

```typescript
// src/services/vehicles/index.ts
export * from "./vehicles.client";
export * from "./vehicles.server";
```

---

## Step 7 — queryKeys + Read Hook + Mutation Hook

```typescript
// src/lib/react-query/query-keys.ts — add per resource
vehicles:  { all: ["vehicles"]  as const, lists: () => [...queryKeys.vehicles.all,  "list"] as const, list: (p?: Record<string, unknown>) => p ? [...queryKeys.vehicles.lists(),  p] as const : queryKeys.vehicles.lists(),  detail: (id: string) => [...queryKeys.vehicles.all,  "detail", id] as const },
customers: { all: ["customers"] as const, lists: () => [...queryKeys.customers.all, "list"] as const, list: (p?: Record<string, unknown>) => p ? [...queryKeys.customers.lists(), p] as const : queryKeys.customers.lists(), detail: (id: string) => [...queryKeys.customers.all, "detail", id] as const },
drivers:   { all: ["drivers"]   as const, lists: () => [...queryKeys.drivers.all,   "list"] as const, list: (p?: Record<string, unknown>) => p ? [...queryKeys.drivers.lists(),   p] as const : queryKeys.drivers.lists(),   detail: (id: string) => [...queryKeys.drivers.all,   "detail", id] as const },
expenses:  { all: ["expenses"]  as const, lists: () => [...queryKeys.expenses.all,  "list"] as const, list: (p?: Record<string, unknown>) => p ? [...queryKeys.expenses.lists(),  p] as const : queryKeys.expenses.lists(),  detail: (id: string) => [...queryKeys.expenses.all,  "detail", id] as const },
bookings:  { all: ["bookings"]  as const, lists: () => [...queryKeys.bookings.all,  "list"] as const, list: (p?: Record<string, unknown>) => p ? [...queryKeys.bookings.lists(),  p] as const : queryKeys.bookings.lists(),  detail: (id: string) => [...queryKeys.bookings.all,  "detail", id] as const },
```

Every `queryFn` logs `🔄` before the fetch and `✅` (with the count) after — matches the React Query guide. Add a specialized hook per common filter (e.g. `useActiveVehicles`) rather than filtering in the component.

```typescript
// src/hooks/queries/useVehicles.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import { listVehicles, getVehicle } from "@/services/vehicles/vehicles.client";
import type { Paginated } from "@/types";
import type { VehicleAdmin } from "@/types/vehicles";

/** Paginated, filterable vehicles list. */
export function useVehicles(params: { q?: string; page?: number; size?: number } = {}, opts: { enabled?: boolean } = {}) {
  return useQuery<Paginated<VehicleAdmin>>({
    queryKey: queryKeys.vehicles.list(params),
    queryFn: async () => {
      console.log(`🔄 useVehicles: Fetching vehicles`);
      const res = await listVehicles(params);
      console.log(`✅ useVehicles: Fetched ${res.items.length} vehicles`);
      return res;
    },
    enabled: opts.enabled ?? true,
    staleTime: STALE_TIMES.STATIC, gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false, refetchOnMount: false,
  });
}
/** Single vehicle by id. */
export function useVehicle(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery<VehicleAdmin>({
    queryKey: queryKeys.vehicles.detail(id),
    queryFn: async () => {
      console.log(`🔄 useVehicle: Fetching ${id}`);
      const res = await getVehicle(id);
      console.log(`✅ useVehicle: Fetched ${id}`);
      return res;
    },
    enabled: (opts.enabled ?? true) && Boolean(id),
    staleTime: STALE_TIMES.STATIC, gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
  });
}
```

```typescript
// src/hooks/mutations/useVehicleMutations.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import { createVehicle, updateVehicle, deleteVehicle } from "@/services/vehicles/vehicles.client";
import { pushToast } from "@/components/admin";
import type { VehicleCreateRequest, VehicleUpdateRequest } from "@/types/vehicles";

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: VehicleCreateRequest) => createVehicle(d), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.vehicles.lists() }), onError: (e) => pushToast("error", "Failed", e instanceof Error ? e.message : "") });
}
export function useUpdateVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: VehicleUpdateRequest) => updateVehicle(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.vehicles.detail(id) }); qc.invalidateQueries({ queryKey: queryKeys.vehicles.lists() }); }, onError: (e) => pushToast("error", "Failed", e instanceof Error ? e.message : "") });
}
export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => deleteVehicle(id), onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.vehicles.lists() }), onError: (e) => pushToast("error", "Failed", e instanceof Error ? e.message : "") });
}
```

Add to barrels:
```typescript
// hooks/queries/index.ts
export { useVehicles, useVehicle } from "./useVehicles";
// hooks/mutations/index.ts
export { useCreateVehicle, useUpdateVehicle, useDeleteVehicle } from "./useVehicleMutations";
```

---

## Forms — zod + react-hook-form

Admin write forms are **not** React Query — they use react-hook-form with a zod resolver.

- **Schema:** `src/schemas/admin-{feature}.schema.ts` — zod object + `export type {Feature}Input = z.infer<typeof schema>`. Single source of truth for field validation.
- **Form:** colocated `app/admin/(authed)/{feature}/[id]/_form.tsx` (`"use client"`):
  ```typescript
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } =
    useForm<AdminVehicleInput>({ resolver: zodResolver(adminVehicleSchema), defaultValues });
  ```
- **Three mappers** keep form shape ↔ API shape separate:
  `emptyDefaults()` → create defaults · `from{Feature}(row)` → API→form · `toPayload(values)` → form→API request.
- Submit calls the resource mutation/client service; surface failures with `useAdminToast` + a local `serverError` state.

Deps: `react-hook-form`, `@hookform/resolvers/zod`, `zod`. Never hand-roll validation or `useState`-per-field.

---

## Freshness Tiers

| Resource | Tier | `refetchOnWindowFocus` |
|---|---|---|
| `vehicles`, `services`, `pricing` | `STALE_TIMES.STATIC` + `refetchOnMount: false` | `false` |
| `customers`, `drivers` | `STALE_TIMES.STANDARD` | `false` |
| `orders`, `bookings`, `expenses` | `STALE_TIMES.DYNAMIC` | `true` |
| `notifications` | `STALE_TIMES.DYNAMIC` + `refetchInterval: 60_000` | `true` |

---

## Auth — How It Works

```
login → store access_token in localStorage("accessToken")
browser → nextjsApiClient reads localStorage → sends Authorization: Bearer {token} → /api/v0/*
BFF route → extractBearerToken(request) → reads Authorization header
BFF route → serverApiClient(token) → FastAPI Authorization: Bearer {token}
```

Client services: token-free — `nextjsApiClient` attaches the bearer header from `localStorage` automatically.
BFF routes: `const token = extractBearerToken(request); if (!token) return 401;`
Browser-only guard: `if (typeof window === "undefined") throw ...` before any direct `localStorage` access.
Route protection: client-side (localStorage isn't server-readable, so server layout guards no longer see the token).

---

## Migrate Old-Pattern Pages

Admin pages can't read the localStorage token server-side, so they fetch client-side. Keep a thin **server shell** for `metadata`, render a **client island** that uses the hook:

```typescript
// page.tsx — server shell (metadata only)
import type { Metadata } from "next";
import { VehicleEditClient } from "./_client";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vehicle · StepNow Admin" };
export default function VehicleEditPage({ params }: { params: { id: string } }) {
  return <VehicleEditClient id={params.id} />;
}

// _client.tsx — client island fetches via React Query
"use client";
export function VehicleEditClient({ id }: { id: string }) {
  const { data: v, isLoading, isError } = useVehicle(id);
  if (isLoading) return <div className="p-6 text-[13px] text-slate-500">Loading…</div>;
  if (isError || !v) notFound();
  return <VehicleForm mode="edit" initial={v} />;
}
```

Exception: `[lang]/` public pages keep server component + `revalidate` (no auth needed).

---

## 8-Step Checklist (new feature)

```
1. src/types/{feature}.ts
2. src/services/api/endpoints.ts          ← add ADMIN.FEATURE + FEATURE_BY_ID
3. src/services/{feature}/{feature}.server.ts
4. src/app/api/v0/admin/{feature}/route.ts + [id]/route.ts
5. src/services/{feature}/{feature}.client.ts
6. src/services/{feature}/index.ts
7. query-keys.ts + hooks/queries/use{Feature}.ts + queries/index.ts
8. hooks/mutations/use{Feature}Mutations.ts + mutations/index.ts
```

---

## Forbidden

- Reading the token anywhere but `localStorage.getItem("accessToken")` in a client service
- Touching `localStorage` during SSR — guard `typeof window === "undefined"` first
- Raw `fetch` or `useEffect`+`useState` for data fetching
- Inline URL strings
- Hard-coded query key arrays
- `serverApiClient` in client components
- Calling FastAPI from the browser (always via `/api/v0/*` BFF)
- Page-local UI equivalents of `AdminCard`/`AdminFormField`/`KpiTile`
- More than one base hook per resource

---

## Before Commit

```bash
npm run build && npm run lint && npx tsc --noEmit
```
