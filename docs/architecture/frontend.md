# StepNow — Frontend Architecture

> **Audience.** Engineers writing or reviewing code in the StepNow frontend repository.
> **Scope.** The Next.js + Tailwind frontend only. Backend conventions live in `docs/architecture/backend.md`.
> **Status.** Target architecture for the rebuild. Backend is complete (51 endpoints validated). Frontend Phase 2 in progress.
> **Pattern.** BFF (Backend-For-Frontend) via Next.js Route Handlers, per the API Flow Structure Guide.

---

## 1. What This Frontend Is

StepNow's frontend is a **bilingual marketing site** with two small interactive surfaces: a public booking flow and an admin panel. The product is:

- **Public-facing** — 9 marketing pages × 2 languages = 18 SEO-optimized pages
- **Booking flow** — multi-step form at `/buchen` (DE) and `/en/book` (EN), client-rendered, posts through the BFF to FastAPI
- **Contact form** — embedded on contact page, posts through the BFF
- **Admin panel** — single-user CMS at `/admin` for Naeem to edit *every* piece of content

### 1.1 Content Authority Model

All content comes from the DB. The frontend never embeds translatable strings in code — only `<button>{t("common.submit")}</button>`, where `t()` resolves against DB-sourced strings. Legal pages render from DB rows with the backend's draft → preview → publish → rollback workflow. Naeem edits every piece of content via admin, protected by the seven backend safeguards.

### 1.2 Non-Negotiable Invariants

- No mixed-language pages. `/preise` is German exclusively; `/en/pricing` is English exclusively.
- Public reads happen server-side in RSCs — never client-side. SEO depends on it.
- The browser never touches the FastAPI URL directly. Every API call goes through the Next.js BFF layer.
- The browser never holds raw access tokens in JavaScript. JWTs live in httpOnly cookies set by the BFF.
- Critical UI strings have hardcoded fallbacks in code as a last-resort safety net (§10.4).
- Field names match the backend exactly — snake_case throughout (matches Pydantic, no transformation layer).

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ App Router |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + `clsx` + `tailwind-merge` |
| Server state (admin) | TanStack React Query v5 |
| Server state (public) | Native Next.js `fetch` with `revalidate` |
| UI state | Zustand |
| Forms | React Hook Form + Zod |
| Routing | Next.js App Router with route groups |
| i18n | Custom (route-prefix + DB-sourced strings) |
| Markdown | `react-markdown` + `remark-gfm` |
| Maps | Leaflet + OpenStreetMap (DSGVO) |
| Date/time | `date-fns` with German locale |
| Icons | Lucide React |
| Analytics | Plausible (DSGVO, no cookies) |
| Fonts | Self-hosted via `next/font` |
| HTTP | Native `fetch` (no Axios) |

---

## 3. Deployment Topology

```
Browser
   ↓ HTTPS
nginx (TLS, gzip, reverse proxy)
   └── /*          →  Next.js (localhost:3000)
                          │
                          │ (BFF Route Handlers)
                          ↓
                  Next.js server-side fetch
                          ↓
                  http://localhost:8000/api/v0/*   ← FastAPI (private, never exposed)
```

**Key points:**

- The browser only talks to Next.js (same-origin)
- The browser never sees the FastAPI URL
- All `/api/v0/*` requests hit Next.js BFF Route Handlers, which proxy to FastAPI
- Auth tokens are set as httpOnly cookies by the BFF — JS cannot read them

---

## 4. Backend API Contract Reference

51 endpoints across 14 functional areas. Single source of truth: `http://localhost:8000/api/v0/docs` (OpenAPI) during development. When OpenAPI and this doc disagree, OpenAPI wins.

### 4.1 Endpoint inventory

| Group | Count | Path |
|---|---:|---|
| Public reads | 10 | `/api/v0/public/*` (GET) |
| Public forms | 2 | `/api/v0/public/{bookings,contact}` (POST) |
| Auth | 4 | `/api/v0/auth/*` |
| Admin: settings | 2 | `/api/v0/admin/settings` |
| Admin: UI strings | 6 | `/api/v0/admin/ui-strings` |
| Admin: services | 6 | `/api/v0/admin/services` |
| Admin: vehicles | 6 | `/api/v0/admin/vehicles` |
| Admin: FAQs | 6 | `/api/v0/admin/faqs` |
| Admin: testimonials | 6 | `/api/v0/admin/testimonials` |
| Admin: pricing | 11 | `/api/v0/admin/{services/{id}/pricing-categories, ...}` |
| Admin: legal pages | 8 | `/api/v0/admin/legal-pages/*` |
| Admin: bookings | 4 | `/api/v0/admin/bookings` |
| Admin: contact messages | 4 | `/api/v0/admin/contact-messages` |
| Admin: audit log | 2 | `/api/v0/admin/audit-log` |

**Total: 51 endpoints.** The frontend BFF mirrors this 1:1 under `apps/frontend/src/app/api/v0/*`.

### 4.2 Authentication

JWT bearer tokens issued by FastAPI. The frontend BFF stores them in **httpOnly cookies**:

- `sn_access` — short-lived access token (~30 min)
- `sn_refresh` — long-lived refresh token

Browser JS never reads these. The BFF reads them from incoming requests via `cookies()` and forwards them as `Authorization: Bearer <token>` headers to FastAPI.

```
POST /api/v0/auth/login
  Body:     { email, password }
  Response: { ok: true, expires_in }
  Sets cookies: sn_access (HttpOnly, Secure, SameSite=Lax), sn_refresh (HttpOnly, Secure, SameSite=Lax)

POST /api/v0/auth/refresh
  Reads sn_refresh cookie, sets fresh sn_access and sn_refresh cookies
  Response: { ok: true, expires_in }

POST /api/v0/auth/logout
  Reads sn_refresh cookie, calls FastAPI to invalidate, clears both cookies
  Response: 204

GET /api/v0/auth/me
  Reads sn_access cookie, proxies to FastAPI /auth/me
  Response: { id, email, full_name, ... }
```

### 4.3 Error response shape

All BFF endpoints normalize to this shape:

```json
{
  "error": {
    "code": "REQUIRED_FIELD",
    "message": "Geschäftsname ist gesetzliche Pflicht (§ 5 TMG)",
    "extra": { "field": "business_name" }
  }
}
```

The BFF passes FastAPI's error body through verbatim. If FastAPI is unreachable, the BFF returns:

```json
{ "error": { "code": "BACKEND_UNREACHABLE", "message": "Service temporarily unavailable" } }
```

with status 502.

### 4.4 Pagination, soft delete, locale flattening

Same patterns as backend (see backend.md §1). BFF passes `?page`, `?size`, `?include_deleted`, `?locale` query params through verbatim.

---

## 5. Request and Render Flow (BFF)

**Three contexts, three flows. Do not mix them.**

### 5.1 Public marketing page (server-rendered)

```
Browser → nginx → Next.js → RSC for app/(public)/preise/page.tsx
                                ↓
                  Service: getServicesServer("de"), getPricingServer(...)
                                ↓ (server → server, internal)
                  serverApiClient.get → FastAPI /api/v0/public/...
                                ↓
                  HTML rendered with cached fetch
                                ↓
                  HTML + serialized data → browser
```

RSCs call **server services** directly (`getServicesServer`), not BFF routes. Why? RSCs already run server-side, so going through a BFF route would just add a redundant hop. The server services use `serverApiClient` to talk to FastAPI internally.

### 5.2 Booking/contact form submission (browser → BFF → FastAPI)

```
User submits form → React Hook Form validates with Zod
                                ↓
                  Client service submitBooking(data)
                                ↓
                  nextjsApiClient.post → /api/v0/public/bookings (BFF)
                                ↓
                  Route Handler at app/api/v0/public/bookings/route.ts
                                ↓
                  Server service submitBookingServer(data)
                                ↓
                  serverApiClient.post → FastAPI /api/v0/public/bookings
                                ↓
                  Response bubbles back up
                                ↓
                  Browser shows confirmation with reference number
```

### 5.3 Admin action (browser → BFF → FastAPI)

```
Naeem clicks "Speichern" → React Hook Form validates
                                ↓
                  useMutation (React Query) → updateService(id, data)
                                ↓
                  Client service nextjsApiClient.patch → /api/v0/admin/services/[id]
                                ↓
                  Route Handler reads sn_access cookie, forwards as Bearer to FastAPI
                                ↓
                  Server service updateServiceServer(id, data, authToken)
                                ↓
                  serverApiClient.patch → FastAPI with Authorization header
                                ↓
                  Response → React Query invalidates query key → UI re-renders
```

---

## 6. Repository Layout

```
apps/frontend/
├── src/
│   ├── app/
│   │   │
│   │   ├── api/v0/                          BFF Route Handlers
│   │   │   ├── public/
│   │   │   │   ├── ui-strings/route.ts
│   │   │   │   ├── settings/route.ts
│   │   │   │   ├── services/route.ts
│   │   │   │   ├── services/[slug]/route.ts
│   │   │   │   ├── services/[slug]/pricing/route.ts
│   │   │   │   ├── vehicles/route.ts
│   │   │   │   ├── faqs/route.ts
│   │   │   │   ├── testimonials/route.ts
│   │   │   │   ├── legal-pages/[slug]/route.ts
│   │   │   │   ├── bookings/route.ts
│   │   │   │   └── contact/route.ts
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── refresh/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   └── me/route.ts
│   │   │   └── admin/                       (Phase 5)
│   │   │
│   │   ├── (public)/                        DE pages (root)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                     /
│   │   │   ├── dienstleistungen/...
│   │   │   ├── preise/page.tsx
│   │   │   ├── ueber-uns/page.tsx
│   │   │   ├── kontakt/page.tsx
│   │   │   ├── buchen/page.tsx
│   │   │   ├── impressum/page.tsx
│   │   │   ├── datenschutz/page.tsx
│   │   │   └── agb/page.tsx
│   │   │
│   │   ├── en/                              EN mirror
│   │   │   └── (same structure with English slugs)
│   │   │
│   │   ├── admin/                           Phase 5
│   │   │
│   │   ├── layout.tsx                       Root layout
│   │   ├── providers.tsx                    React Query + UI providers
│   │   ├── globals.css                      Tailwind base + tokens
│   │   ├── error.tsx                        Global error boundary
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                              Tier 1 — primitives
│   │   ├── shared/                          Tier 2 — composites
│   │   └── features/                        Tier 3 — feature UI
│   │
│   ├── services/                            Per-feature service modules
│   │   ├── api/
│   │   │   └── endpoints.ts                 ENDPOINTS constant
│   │   ├── uiStrings/
│   │   │   ├── uiStrings.client.ts          Called from browser
│   │   │   ├── uiStrings.server.ts          Called from RSC/BFF
│   │   │   └── index.ts
│   │   ├── settings/
│   │   ├── services/                        (Resource: "services")
│   │   ├── pricing/
│   │   ├── vehicles/
│   │   ├── faqs/
│   │   ├── testimonials/
│   │   ├── legalPages/
│   │   ├── bookings/
│   │   ├── contact/
│   │   └── auth/
│   │
│   ├── lib/
│   │   ├── server-api.ts                    serverApiClient (Next.js → FastAPI)
│   │   ├── nextjs-api.ts                    nextjsApiClient (browser → BFF)
│   │   ├── auth-utils.ts                    Cookie helpers + bearer extraction
│   │   ├── api-errors.ts                    ApiError class
│   │   ├── fonts.ts                          next/font setup
│   │   ├── react-query/
│   │   │   ├── query-client.ts
│   │   │   ├── query-keys.ts
│   │   │   └── stale-times.ts
│   │   └── i18n/
│   │       ├── config.ts
│   │       ├── routes.ts
│   │       ├── t.ts
│   │       ├── server-strings.ts
│   │       └── UiStringsProvider.tsx
│   │
│   ├── hooks/
│   │   ├── useUiStrings.ts
│   │   ├── queries/                         Phase 5
│   │   ├── useLocale.ts
│   │   ├── useMediaQuery.ts
│   │   └── useDebounce.ts
│   │
│   ├── stores/
│   │   ├── useBookingWizardStore.ts
│   │   └── useUiStore.ts
│   │
│   ├── types/                               Snake_case mirroring backend
│   │   └── (one per resource)
│   │
│   ├── schemas/                             Zod schemas
│   │   └── (one per form)
│   │
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── formatters.ts
│   │   ├── locale.ts
│   │   ├── validators.ts
│   │   └── sanitizers.ts
│   │
│   ├── config/
│   │   ├── site.ts
│   │   └── nav.ts
│   │
│   ├── constants/
│   │   ├── routes.ts
│   │   ├── critical-ui-strings.ts
│   │   ├── booking.ts
│   │   └── contact.ts
│   │
│   └── middleware.ts                        Locale detection
│
├── public/                                  Static assets
├── .env.local                               Gitignored
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
└── package.json
```

---

## 7. The Component Tier Discipline

3-tier architecture:

**Tier 1 — `components/ui/`** — Primitives. Zero business logic. `<Button>` doesn't know what a service is.

**Tier 2 — `components/shared/`** — Composites. Cross-feature reuse. Can use Zustand. Cannot import from `features/`. Examples: `Header`, `Footer`, `LanguageSwitcher`, `Markdown`.

**Tier 3 — `components/features/`** — Feature-specific. Can use React Query. Can import from `ui/` and `shared/`. Cannot import from sibling features.

Direction is one-way: `ui` → `shared` → `features`. Promotion: Tier 3 → Tier 2 if shared by two features; Tier 2 → Tier 1 if needed in primitive contexts.

---

## 8. Data Fetching Strategy

### 8.1 Public pages — RSCs call server services directly

```typescript
// app/(public)/preise/page.tsx
import { getServicesServer, getPricingServer } from "@/services/services";
import { getUiStringsServer } from "@/services/uiStrings";

export const revalidate = 300;

export default async function PricingPage() {
  const [services, strings] = await Promise.all([
    getServicesServer("de"),
    getUiStringsServer("de"),
  ]);
  // ... render
}
```

Server services bypass the BFF and hit FastAPI directly via `serverApiClient`. There's no value in going `RSC → BFF → FastAPI` when the RSC is already server-side.

### 8.2 Client-side forms — Client services call the BFF

```typescript
// components/features/booking/BookingWizard.tsx
"use client";
import { submitBooking } from "@/services/bookings";

const onSubmit = async (data) => {
  try {
    const result = await submitBooking(data);   // → /api/v0/public/bookings (BFF)
    router.push(`/buchen/bestaetigung?ref=${result.reference}`);
  } catch (err) {
    setError(err.message);
  }
};
```

Client services use `nextjsApiClient` which calls our own BFF routes. Same-origin, no CORS concerns.

### 8.3 Admin panel — React Query through client services

```typescript
// hooks/queries/useAdminServices.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { listAdminServices } from "@/services/services";

export function useAdminServices(params) {
  return useQuery({
    queryKey: queryKeys.adminServices.list(params),
    queryFn: () => listAdminServices(params),   // → /api/v0/admin/services (BFF, with cookies)
  });
}
```

Browser sends cookies automatically; BFF extracts the bearer token from `sn_access` cookie and forwards to FastAPI.

---

## 9. Service Layer

Every resource follows the same shape:

```
src/services/<resource>/
├── <resource>.client.ts      Browser-callable (uses nextjsApiClient)
├── <resource>.server.ts      RSC/BFF-callable (uses serverApiClient)
└── index.ts                   Barrel
```

### 9.1 serverApiClient (`lib/server-api.ts`)

Talks directly to FastAPI from the Next.js server. Used by RSCs and by BFF route handlers.

```typescript
const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8000/api/v0";

export const serverApiClient = {
  get: <T>(path, opts?, token?) => request<T>("GET", path, undefined, opts, token),
  post: <T>(path, body?, opts?, token?) => request<T>("POST", path, body, opts, token),
  patch: <T>(path, body?, opts?, token?) => request<T>("PATCH", path, body, opts, token),
  delete: <T>(path, opts?, token?) => request<T>("DELETE", path, undefined, opts, token),
};
```

`request()` returns `{ data?, error? }`. On non-2xx it parses the backend's error envelope. On network failure it returns `{ error: { code: "BACKEND_UNREACHABLE", ... } }`.

### 9.2 nextjsApiClient (`lib/nextjs-api.ts`)

Talks to our own BFF routes from the browser. Always same-origin (`/api/v0/...`). Cookies travel automatically.

```typescript
export const nextjsApiClient = {
  get: <T>(path, opts?) => request<T>("GET", path, undefined, opts),
  post: <T>(path, body?, opts?) => request<T>("POST", path, body, opts),
  patch: <T>(path, body?, opts?) => request<T>("PATCH", path, body, opts),
  delete: <T>(path, opts?) => request<T>("DELETE", path, undefined, opts),
};
```

### 9.3 BFF Route Handler pattern

Every route follows the same shape:

```typescript
// app/api/v0/public/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { listServicesServer } from "@/services/services";

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") || "de";
  const result = await listServicesServer(locale as "de" | "en");
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
  }
  return NextResponse.json(result.data);
}
```

Admin routes additionally extract auth from cookies:

```typescript
// app/api/v0/admin/services/route.ts
import { getAccessTokenFromCookies } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const token = await getAccessTokenFromCookies();
  if (!token) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" }}, { status: 401 });
  const result = await listAdminServicesServer({ ... }, token);
  // ...
}
```

### 9.4 RequiredFieldError handling

The backend returns localized German messages for `REQUIRED_FIELD` errors. The frontend displays them verbatim — no retranslation. See §13.

---

## 10. Internationalization

### 10.1 URL strategy

- German (default): `step-now.de/`
- English: `step-now.de/en/`
- Per-service slug pairs stored in DB (`services.slug_de`, `services.slug_en`)

### 10.2 Middleware

`src/middleware.ts` detects locale from cookie or `Accept-Language`, redirects accordingly. Cookie `stepnow_locale` persists user choice.

### 10.3 DB-backed `t()` helper

UI strings fetched from `/api/v0/public/ui-strings?locale=de` at layout time, cached 5 minutes via Next.js fetch cache, provided to all components via React context.

```typescript
const { strings } = await getUiStringsServer("de");
const t = createT(strings, "de");
return <h1>{t("home.hero.headline")}</h1>;
```

### 10.4 Critical-string fallback safety net

Some strings, if missing, break critical flows (language switcher labels, error messages, 404). These get hardcoded fallbacks in `constants/critical-ui-strings.ts`. Backend marks the same keys with `is_locked = true` for defense in depth.

### 10.5 Bilingual admin forms

German-only admin UI, but edit forms show `_de` and `_en` fields side by side.

---

## 11. Forms and Validation

React Hook Form + Zod, **snake_case throughout** matching backend Pydantic.

```typescript
export const bookingSchema = z.object({
  service_id: z.string().uuid().optional(),
  pickup_address: z.string().min(3, "errors.required"),
  // ... full schema
  consent_dsgvo: z.literal(true, {
    errorMap: () => ({ message: "errors.consent_required" }),
  }),
  website: z.string().max(0).optional(),  // honeypot
});
```

Error messages are i18n keys, resolved at render time. The backend re-validates everything; client validation is for UX only.

---

## 12. SEO

Next.js Metadata API per page. Helpers in `lib/seo.ts`. Per-page DE/EN alternates with `hreflang`. `LocalBusiness` JSON-LD on home + contact, `Service` on each service page, `BreadcrumbList` everywhere, `FAQPage` where applicable.

---

## 13. What Is Forbidden

- **Direct browser → FastAPI calls.** All browser requests go through `/api/v0/*` BFF routes.
- **Reading auth tokens in JS.** They live in httpOnly cookies. JS cannot and should not access them.
- **Raw `fetch()` in components.** Always go through a service module.
- **Hardcoded API paths in components.** Use `ENDPOINTS` from `services/api/endpoints.ts`.
- **Hardcoded user-facing strings.** Every visible string goes through `t()`.
- **JSON files for translations.** UI strings come from the DB via `/public/ui-strings`.
- **Cross-feature imports between Tier 3 components.** `features/booking/` cannot import from `features/admin/`.
- **Importing from `features/` into `shared/` or `ui/`.** Direction is one-way.
- **Mixed-language content in a single page render.**
- **camelCase field names in types/schemas.** Use snake_case to match backend Pydantic.
- **Translating `REQUIRED_FIELD` error messages.** Display the backend's `message` verbatim.
- **Mustache `{{ }}` placeholder syntax in legal pages.** Backend uses single-brace `{site_settings.field}`.
- **Hardcoded booking statuses.** Use the `BOOKING_STATUSES` constant.
- **Google Fonts CDN, Google Analytics, Google Maps, Google reCAPTCHA.** DSGVO violations.
- **`localStorage` / `sessionStorage` for auth tokens.** httpOnly cookies only.
- **`use client` at the top of every file.** Default to server components.

---

## 14. Living Document

Updated when a new top-level directory is introduced, a convention changes, or a forbidden practice is added. Code is the source of truth; this is the map.

**Cross-references:**

- Backend: `docs/architecture/backend.md`
- Page-level specs: `docs/website-outline.md`
- Visual direction: `docs/design-direction.md`
- API Flow Guide (origin of the BFF pattern): the uploaded `API_Flow_Structure_Guide_for_NextJS___FastAPI.docx`
