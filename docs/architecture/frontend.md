# StepNow — Frontend Architecture

> **Audience.** Engineers writing or reviewing code in the StepNow frontend repository.
> **Scope.** The Next.js + Tailwind frontend only. Backend conventions live in `docs/architecture/backend.md`.
> **Status.** Target architecture for the rebuild. As code lands, this document is updated. Code wins over document.
> **Lineage.** This architecture inherits its disciplines from the Echooo frontend structure document. Where StepNow deviates, the deviation is intentional and explained.

---

## 1. What This Frontend Is

StepNow's frontend is a **mostly server-rendered bilingual marketing site** with two small interactive surfaces: a public booking flow and an admin panel. The product is:

- **Public-facing** — 9 marketing pages × 2 languages = 18 SEO-optimized pages, content pulled from FastAPI at render time
- **Booking flow** — a multi-step form at `/buchen` (DE) and `/en/book` (EN), client-rendered, posts to FastAPI
- **Contact form** — embedded on contact page, posts to FastAPI
- **Admin panel** — a single-user CMS at `/admin` for Naeem to edit *every* piece of content on the site

### 1.1 Content Authority Model

The backend's content authority model (see `docs/architecture/backend.md` §1.1) applies here directly:

- **All content comes from the DB** — UI strings, business content, legal page bodies
- **The frontend never embeds translatable strings in code.** No `<button>Submit</button>` — only `<button>{t("common.submit")}</button>`, where `t()` resolves against DB-sourced strings
- **Legal pages render from DB rows, not MDX files**
- **Naeem can edit any text on the site via admin** — protected by backend safeguards (audit log, soft delete, required-field validation, versioning for legal pages, preview-before-publish)

### 1.2 Non-Negotiable Invariants

- No mixed-language pages. A user on `/preise` sees German exclusively. A user on `/en/pricing` sees English exclusively.
- Public reads happen server-side in React Server Components — never client-side. SEO depends on it.
- The browser never receives admin tokens, API keys, or backend internal URLs.
- Critical UI strings (the ones that, if missing, break rendering) are seeded with fallbacks in code as a last-resort safety net (§9.4).

---

## 2. Tech Stack

| Layer | Choice | Same as Echooo? |
|---|---|---|
| Framework | Next.js 14+ App Router | ✓ |
| Language | TypeScript (strict mode) | ✓ |
| Styling | Tailwind CSS + `clsx` + `tailwind-merge` | ✓ |
| Server state (admin) | TanStack React Query v5 | ✓ |
| Server state (public) | Native Next.js `fetch` with `revalidate` | New — public is SSR, not RQ |
| UI state | Zustand | ✓ |
| Forms | React Hook Form + Zod | ✓ |
| Validation | Zod | ✓ |
| Routing | Next.js App Router with route groups | ✓ |
| i18n | Custom (route-prefix + DB-sourced strings) — no `next-intl` | New |
| Markdown rendering | `react-markdown` + `remark-gfm` for service descriptions, FAQ answers, legal page bodies | New |
| Maps | Leaflet + OpenStreetMap tiles | New (DSGVO) |
| Date/time | `date-fns` with German locale | New |
| Icons | Lucide React | ✓ likely |
| Analytics | Plausible (DSGVO-friendly, no cookies) | New |
| Fonts | Self-hosted via `next/font` — never Google Fonts CDN | New (DSGVO) |
| HTTP client | Native `fetch` (no Axios) | ✓ likely |
| Animations | Framer Motion (sparingly) | Optional |

---

## 3. Deployment Topology (Frontend Perspective)

Same single-VPS topology as the backend doc:

```
Browser
   ↓ HTTPS
nginx (TLS, gzip, reverse proxy)
   ├── /api/v0/*   →  FastAPI    (localhost:8000)
   ├── /admin/*    →  Next.js    (localhost:3000)
   └── /*          →  Next.js    (localhost:3000)
                          ↓
                   Next.js server-side fetches
                          ↓
                   http://localhost:8000/api/v0/...
                   (internal hostname, no public exposure)
```

**Key implications:**

- Public pages do their data fetching in React Server Components, calling FastAPI directly via internal hostname
- The browser never sees the FastAPI URL; all requests it makes go to the same origin (`step-now.de/api/v0/...`)
- CORS isn't an issue for browser fetches because they're same-origin
- Admin pages fetch client-side via React Query because admin is small and CRUD-heavy

---

## 4. Request and Render Flow

Different surfaces, different flows. **Do not mix them.**

### 4.1 Public marketing page (server-rendered)

```
Browser requests step-now.de/preise
   ↓
nginx → Next.js server
   ↓
Next.js: app/(public)/preise/page.tsx (React Server Component)
   ↓
RSC calls:
   - getUiStrings("de")           — bulk strings for layout
   - getPricing("de")              — page-specific content
   - getSiteSettings("de")         — header/footer settings
   ↓
Each call hits http://localhost:8000/api/v0/public/* with cached fetch
   ↓
FastAPI returns localized JSON
   ↓
RSC renders to HTML
   ↓
HTML + serialized data → browser
```

No client-side fetching. No React Query. Just SSR with `fetch` and Next.js's built-in cache.

### 4.2 Booking form submission

```
User fills booking form (client component) at /buchen
   ↓
React Hook Form validates against Zod schema
   ↓
On submit: POST to /api/v0/public/bookings (same-origin via nginx)
   ↓
nginx → FastAPI
   ↓
FastAPI responds with booking reference + status
   ↓
Client shows confirmation screen
```

No BFF middleware. No Next.js API route. The browser POSTs directly to FastAPI's public endpoint.

### 4.3 Admin action

```
Naeem clicks "Speichern" on a service edit form at /admin/services/[id]
   ↓
React Hook Form validates locally
   ↓
useMutation (React Query) → PATCH /api/v0/admin/services/[id]
   ↓
Browser sends with Authorization: Bearer <jwt>
   ↓
nginx → FastAPI (validates JWT, runs ContentService.update with audit)
   ↓
React Query invalidates the services query key
   ↓
UI re-fetches and re-renders
```

React Query handles caching, optimistic updates, and invalidation for admin only.

---

## 5. Repository Layout

The frontend lives at `apps/frontend/` in the StepNow monorepo. All paths below are relative to that directory.

```
apps/frontend/
├── src/
│   │
│   ├── app/                                    Next.js App Router
│   │   │
│   │   ├── (public)/                           Route group — German public site (root)
│   │   │   ├── layout.tsx                      DE public layout (header, footer, providers)
│   │   │   ├── page.tsx                        / (homepage)
│   │   │   ├── dienstleistungen/
│   │   │   │   ├── page.tsx                    /dienstleistungen
│   │   │   │   └── [slug]/page.tsx             /dienstleistungen/{slug}
│   │   │   ├── preise/page.tsx
│   │   │   ├── ueber-uns/page.tsx
│   │   │   ├── kontakt/page.tsx
│   │   │   ├── buchen/page.tsx                 Multi-step booking form
│   │   │   ├── impressum/page.tsx              DB-rendered legal page
│   │   │   ├── datenschutz/page.tsx            DB-rendered legal page
│   │   │   └── agb/page.tsx                    DB-rendered legal page
│   │   │
│   │   ├── en/                                 English mirror — same group
│   │   │   ├── layout.tsx                      EN public layout
│   │   │   ├── page.tsx                        /en
│   │   │   ├── services/
│   │   │   │   ├── page.tsx                    /en/services
│   │   │   │   └── [slug]/page.tsx             /en/services/{slug}
│   │   │   ├── pricing/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── book/page.tsx
│   │   │   ├── legal-notice/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   └── terms/page.tsx
│   │   │
│   │   ├── admin/                              Admin panel (German UI — Naeem's language)
│   │   │   ├── layout.tsx                      Admin shell — sidebar, auth guard
│   │   │   ├── page.tsx                        Dashboard
│   │   │   ├── login/page.tsx                  Outside the auth guard
│   │   │   ├── ui-strings/                     Admin editing of UI strings
│   │   │   │   └── page.tsx                    List + inline edit
│   │   │   ├── services/
│   │   │   │   ├── page.tsx                    List
│   │   │   │   ├── new/page.tsx                Create
│   │   │   │   └── [id]/page.tsx               Edit
│   │   │   ├── pricing/
│   │   │   ├── vehicles/
│   │   │   ├── faqs/
│   │   │   ├── testimonials/
│   │   │   ├── legal-pages/                    Edit with versioning + preview
│   │   │   │   ├── page.tsx                    List (Impressum, Datenschutz, AGB)
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx                Edit current draft
│   │   │   │       ├── preview/page.tsx        Preview the draft
│   │   │   │       └── versions/page.tsx       Version history + rollback
│   │   │   ├── bookings/                       Read-only with status updates
│   │   │   ├── contact-messages/               Read-only list
│   │   │   ├── audit-log/                      Recent changes
│   │   │   ├── trash/                          Soft-deleted items + restore
│   │   │   └── settings/page.tsx               Site settings (singleton)
│   │   │
│   │   ├── layout.tsx                          Root layout — fonts, html lang
│   │   ├── providers.tsx                       Client-side providers (RQ for admin)
│   │   ├── error.tsx                           Global error boundary
│   │   ├── not-found.tsx                       404 page
│   │   ├── robots.ts                           Generated /robots.txt
│   │   ├── sitemap.ts                          Generated /sitemap.xml (DE + EN)
│   │   └── globals.css                         Tailwind base + design tokens
│   │
│   ├── components/                             3-Tier Component Architecture
│   │   │
│   │   ├── ui/                                 Tier 1 — Primitives (zero business logic)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── RadioGroup.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Accordion.tsx
│   │   │   ├── Progress.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   └── Alert.tsx
│   │   │
│   │   ├── shared/                             Tier 2 — Composites (cross-feature)
│   │   │   ├── Header.tsx                      Public header (locale-aware)
│   │   │   ├── Footer.tsx                      Public footer (locale-aware)
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   ├── TrustStrip.tsx
│   │   │   ├── PhoneCTA.tsx
│   │   │   ├── FinalCTABand.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Markdown.tsx                    Renders markdown with safe sanitization
│   │   │   ├── LeafletMap.tsx                  OSM map wrapper (client component)
│   │   │   └── LegalWarningBanner.tsx          For admin legal-page edits
│   │   │
│   │   └── features/                           Tier 3 — Feature UI
│   │       ├── home/
│   │       │   ├── Hero.tsx
│   │       │   ├── ServiceTiles.tsx
│   │       │   ├── HowItWorks.tsx
│   │       │   ├── WhyStepNow.tsx
│   │       │   ├── TestimonialsSection.tsx
│   │       │   └── FaqTeaser.tsx
│   │       ├── services/
│   │       │   ├── ServiceCard.tsx
│   │       │   ├── ServiceListItem.tsx
│   │       │   └── ServiceDetailHeader.tsx
│   │       ├── pricing/
│   │       │   └── PricingTable.tsx
│   │       ├── booking/
│   │       │   ├── BookingWizard.tsx           Container (client)
│   │       │   ├── steps/
│   │       │   │   ├── ServiceSelection.tsx
│   │       │   │   ├── TripDetails.tsx
│   │       │   │   ├── SpecialRequirements.tsx
│   │       │   │   └── ContactInfo.tsx
│   │       │   ├── BookingConfirmation.tsx
│   │       │   └── BookingFormEmbedded.tsx     Simpler single-screen version
│   │       ├── contact/
│   │       │   └── ContactForm.tsx
│   │       ├── legal/
│   │       │   └── LegalPageRenderer.tsx       Renders DB-sourced legal page bodies
│   │       └── admin/
│   │           ├── AdminSidebar.tsx
│   │           ├── AdminTopbar.tsx
│   │           ├── BilingualField.tsx          DE + EN text inputs side by side
│   │           ├── BilingualTextarea.tsx
│   │           ├── BilingualMarkdownField.tsx
│   │           ├── RequiredFieldError.tsx      Renders RequiredFieldError from API
│   │           ├── AuditLogEntry.tsx
│   │           ├── ServiceForm.tsx
│   │           ├── UiStringRow.tsx             Inline-edit row for ui_strings list
│   │           ├── VehicleForm.tsx
│   │           ├── PricingItemForm.tsx
│   │           ├── FaqForm.tsx
│   │           ├── TestimonialForm.tsx
│   │           ├── LegalPageEditor.tsx
│   │           ├── LegalPageVersionList.tsx
│   │           ├── LegalPagePreview.tsx
│   │           ├── BookingDetailDrawer.tsx
│   │           ├── BookingStatusSelector.tsx
│   │           └── SettingsForm.tsx
│   │
│   ├── hooks/                                  Custom hooks
│   │   ├── queries/                            React Query hooks (admin only)
│   │   │   ├── useAdminUiStrings.ts
│   │   │   ├── useAdminServices.ts
│   │   │   ├── useAdminPricing.ts
│   │   │   ├── useAdminVehicles.ts
│   │   │   ├── useAdminFaqs.ts
│   │   │   ├── useAdminTestimonials.ts
│   │   │   ├── useAdminLegalPages.ts
│   │   │   ├── useAdminBookings.ts
│   │   │   ├── useAdminContactMessages.ts
│   │   │   ├── useAdminSettings.ts
│   │   │   ├── useAdminAuditLog.ts
│   │   │   ├── useAdminTrash.ts
│   │   │   ├── useAdminAuth.ts
│   │   │   └── index.ts                        Barrel
│   │   ├── useBookingWizard.ts                 Multi-step state wrapper
│   │   ├── useLocale.ts                        Read current locale from pathname
│   │   ├── useUiStrings.ts                     Access UI strings in client components
│   │   ├── useMediaQuery.ts
│   │   └── useDebounce.ts
│   │
│   ├── services/                               Service Layer (API call wrappers)
│   │   ├── api/
│   │   │   ├── client.ts                       Single fetch wrapper with error handling
│   │   │   └── endpoints.ts                    ENDPOINTS constant
│   │   ├── public/
│   │   │   ├── uiStrings.ts                    getUiStrings(locale)
│   │   │   ├── services.ts                     getServices, getServiceBySlug
│   │   │   ├── pricing.ts
│   │   │   ├── vehicles.ts
│   │   │   ├── faqs.ts
│   │   │   ├── testimonials.ts
│   │   │   ├── legalPages.ts                   getLegalPage(slug, locale)
│   │   │   ├── bookings.ts                     submitBooking
│   │   │   ├── contact.ts                      submitContactMessage
│   │   │   └── settings.ts                     getSiteSettings
│   │   ├── admin/
│   │   │   ├── uiStrings.ts
│   │   │   ├── services.ts
│   │   │   ├── pricing.ts
│   │   │   ├── vehicles.ts
│   │   │   ├── faqs.ts
│   │   │   ├── testimonials.ts
│   │   │   ├── legalPages.ts                   CRUD + publish + rollback
│   │   │   ├── bookings.ts                     List + status update
│   │   │   ├── contactMessages.ts
│   │   │   ├── settings.ts
│   │   │   ├── auditLog.ts
│   │   │   └── trash.ts                        Restore endpoints
│   │   └── auth/
│   │       └── auth.ts                         login, logout, refresh
│   │
│   ├── stores/                                 Zustand stores (UI state only)
│   │   ├── useBookingWizardStore.ts            Multi-step form state across steps
│   │   ├── useAuthStore.ts                     Admin tokens (sessionStorage adapter)
│   │   └── useUiStore.ts                       Global UI flags (mobile menu open, etc.)
│   │
│   ├── types/                                  TypeScript contracts
│   │   ├── api.ts                              ApiError, Pagination, common shapes
│   │   ├── uiString.ts                         UiString, UiStringsMap
│   │   ├── service.ts                          Service (public + admin variants)
│   │   ├── pricing.ts
│   │   ├── vehicle.ts
│   │   ├── faq.ts
│   │   ├── testimonial.ts
│   │   ├── legalPage.ts                        LegalPage, LegalPageVersion
│   │   ├── booking.ts                          BookingCreate, BookingResponse, BookingStatus
│   │   ├── contact.ts
│   │   ├── settings.ts
│   │   ├── auditLog.ts
│   │   ├── i18n.ts                             Locale type, LocaleStrings
│   │   └── index.ts                            Barrel
│   │
│   ├── schemas/                                Zod schemas (form validation)
│   │   ├── booking.schema.ts
│   │   ├── contact.schema.ts
│   │   ├── auth.schema.ts
│   │   └── admin/
│   │       ├── uiString.schema.ts
│   │       ├── service.schema.ts
│   │       ├── pricing.schema.ts
│   │       ├── vehicle.schema.ts
│   │       ├── faq.schema.ts
│   │       ├── testimonial.schema.ts
│   │       ├── legalPage.schema.ts
│   │       └── settings.schema.ts
│   │
│   ├── lib/
│   │   ├── react-query/
│   │   │   ├── query-client.ts                 QueryClient setup
│   │   │   ├── query-keys.ts                   Centralized key factory (admin only)
│   │   │   └── stale-times.ts                  STALE_TIMES constants
│   │   ├── i18n/
│   │   │   ├── config.ts                       Locale type, defaultLocale
│   │   │   ├── routes.ts                       ROUTE_MAP (DE↔EN slug pairs)
│   │   │   ├── t.ts                            Translation helper (DB-backed)
│   │   │   ├── fallbacks.ts                    Critical-string fallback map
│   │   │   ├── server-strings.ts               Server-side string fetch + cache
│   │   │   └── UiStringsProvider.tsx           Client provider for nested strings
│   │   ├── api-client.ts                       fetch wrapper with auth injection
│   │   ├── auth-storage.ts                     sessionStorage helpers for admin JWT
│   │   ├── seo.ts                              generateMetadata helpers
│   │   ├── markdown.ts                         react-markdown setup with sanitizer
│   │   └── fonts.ts                            next/font configuration
│   │
│   ├── utils/                                  Pure utility functions
│   │   ├── cn.ts                               clsx + tailwind-merge
│   │   ├── formatters.ts                       Date, currency, phone, postcode
│   │   ├── locale.ts                           getLocaleFromPath, switchLocaleInPath
│   │   ├── validators.ts                       isValidPostcode, isValidPhone (DE)
│   │   └── sanitizers.ts                       Markdown sanitization
│   │
│   ├── config/                                 Static configuration
│   │   ├── site.ts                             Hardcoded site metadata (env-level)
│   │   └── nav.ts                              Navigation tree structure (keys only)
│   │
│   ├── constants/                              Domain constants
│   │   ├── routes.ts                           Route path constants
│   │   ├── critical-ui-strings.ts              Keys that must never be missing
│   │   └── booking.ts                          Booking step constants
│   │
│   └── middleware.ts                           Locale detection + redirect
│
├── public/                                     Static assets
│   ├── icons/
│   ├── images/
│   │   ├── og-default.jpg                      Default Open Graph image
│   │   └── hero/                               Hero photos
│   └── fonts/                                  Self-hosted font files
│
├── .env.local                                  Local environment (gitignored)
├── .env.example                                Committed template
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
└── package.json
```

---

## 6. The Component Tier Discipline

Same 3-tier architecture as Echooo. The tiers prevent the "import shared component into primitive" mess that templates fall into.

**Tier 1 — `components/ui/` (Primitives)**

- Zero business logic, zero feature awareness
- Take props, render markup, that's it
- Can be styled but not feature-coupled

A `<Button>` doesn't know what a service is. A `<Modal>` doesn't know what a booking is.

**Tier 2 — `components/shared/` (Composites)**

- Combine primitives
- Cross-feature reuse (used by 2+ feature areas)
- Can use Zustand for UI state
- Cannot import from `features/`

Examples: `Header`, `Footer`, `LanguageSwitcher`, `Markdown`, `LeafletMap`.

**Tier 3 — `components/features/` (Feature UI)**

- Specific to one domain area
- Can use React Query hooks (admin features)
- Can import from `ui/` and `shared/`
- **Cannot import from sibling feature folders**

Examples: `Hero`, `BookingWizard`, `LegalPageEditor`, `AdminServiceForm`.

**Promotion rule:** if a Tier 3 component is needed by another feature, it's promoted to Tier 2. If a Tier 2 component is needed in many primitive contexts, the primitive part splits to Tier 1.

---

## 7. Data Fetching Strategy

Three contexts, three approaches. **Do not mix them.**

### 7.1 Public pages — Server-side fetch in RSC

```typescript
// app/(public)/preise/page.tsx
import { getPricing, getUiStrings } from "@/services/public";
import { PricingTable } from "@/components/features/pricing/PricingTable";

export const revalidate = 300;  // ISR — refresh every 5 minutes

export default async function PricingPage() {
  const [pricing, strings] = await Promise.all([
    getPricing("de"),
    getUiStrings("de"),
  ]);
  return <PricingTable data={pricing} t={(k) => strings[k] ?? k} />;
}
```

**Rules:**
- Always `export const revalidate = N` (ISR) or omit for static
- Public service calls imported from `services/public/*`
- Each service function uses `fetch(INTERNAL_API_URL, { next: { revalidate: N } })` — Next.js fetch cache
- No React Query for public reads. Ever.

### 7.2 Booking/contact forms — Client-side mutation

```typescript
// components/features/booking/BookingWizard.tsx
"use client";
import { submitBooking } from "@/services/public/bookings";

const onSubmit = async (data: BookingFormData) => {
  setSubmitting(true);
  try {
    const result = await submitBooking(data);
    router.push(`/buchen/bestaetigung?ref=${result.reference}`);
  } catch (err) {
    setError(err.message);
  } finally {
    setSubmitting(false);
  }
};
```

**Rules:**
- Plain `useState` for submitting/error states
- No React Query (single-shot mutation, no caching needed)
- Service file uses native `fetch` to `/api/v0/public/bookings` (same-origin)

### 7.3 Admin panel — React Query

```typescript
// app/admin/services/page.tsx
"use client";
import { useAdminServices, useDeleteService } from "@/hooks/queries";

export default function AdminServicesPage() {
  const { data, isLoading } = useAdminServices();
  const deleteService = useDeleteService();
  // ... render table
}
```

**Rules:**
- All admin reads through React Query hooks
- All admin mutations via `useMutation`, with invalidation
- Query keys in `lib/react-query/query-keys.ts` — never inline strings
- Stale times from `lib/react-query/stale-times.ts`

---

## 8. Service Layer (No BFF)

**StepNow has no Next.js API middleware layer.** Browser calls go directly to FastAPI through nginx.

**The service layer is a thin fetch wrapper:**

```typescript
// services/api/client.ts
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || "http://localhost:8000";
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v0";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { isServer?: boolean }
): Promise<T> {
  const baseUrl = init?.isServer ? `${INTERNAL_API_URL}/api/v0` : PUBLIC_API_URL;
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new ApiError(
      error.error?.code || "UNKNOWN",
      error.error?.message || res.statusText,
      res.status,
      error.error?.extra,
    );
  }

  return res.json();
}
```

**The same service function works for SSR and CSR**, switched by `isServer`:

```typescript
// services/public/services.ts
export async function getServices(locale: Locale, isServer = true): Promise<ServicePublic[]> {
  return apiFetch<ServicePublic[]>(`/public/services?locale=${locale}`, {
    isServer,
    next: { revalidate: 300 },
  } as RequestInit);
}
```

**Admin calls** use a wrapper that injects the JWT:

```typescript
// services/api/client.ts
export async function adminApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken();  // from sessionStorage
  return apiFetch<T>(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
```

No `.client.ts` / `.server.ts` split per feature. No BFF routes. No proxy logic.

---

## 9. Internationalization

The biggest deviation from Echooo's frontend: **UI strings live in the database, not in JSON files.** This is a direct consequence of the backend's all-DB content authority model.

### 9.1 URL strategy

- German (default, primary): `step-now.de/`
- English: `step-now.de/en/`
- Slug pairs stored in DB on `services` table — URLs are properly localized per service

### 9.2 The `middleware.ts`

```typescript
// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isEnglishPath = path === "/en" || path.startsWith("/en/");
  const cookie = request.cookies.get("stepnow_locale")?.value;

  // Cookie respected absolutely
  if (cookie === "en" && !isEnglishPath) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${path}`;
    return NextResponse.redirect(url);
  }
  if (cookie === "de" && isEnglishPath) {
    const url = request.nextUrl.clone();
    url.pathname = path === "/en" ? "/" : path.replace(/^\/en/, "");
    return NextResponse.redirect(url);
  }

  // First visit: detect language
  if (!cookie) {
    const acceptLang = (request.headers.get("accept-language") || "").toLowerCase();
    const prefersGerman = acceptLang.startsWith("de");
    if (!prefersGerman && !isEnglishPath) {
      const url = request.nextUrl.clone();
      url.pathname = `/en${path}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api).*)"],
};
```

### 9.3 The DB-backed `t()` helper

UI strings are fetched from the backend's bulk endpoint at layout time, cached, and provided to all components.

**Server-side flow (layout loads strings, passes to RSCs):**

```typescript
// app/(public)/layout.tsx
import { getUiStrings } from "@/services/public/uiStrings";
import { UiStringsProvider } from "@/lib/i18n/UiStringsProvider";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const strings = await getUiStrings("de");
  return (
    <UiStringsProvider strings={strings} locale="de">
      {children}
    </UiStringsProvider>
  );
}
```

`getUiStrings("de")` calls `GET /api/v0/public/ui-strings?locale=de`. The backend returns:

```json
{
  "common.book_now": "Jetzt buchen",
  "common.call_us": "Anrufen",
  "booking.step_service": "Service wählen",
  "errors.required": "Dieses Feld ist erforderlich",
  ...
}
```

The fetch uses `next: { revalidate: 300 }` — Next.js caches the response for 5 minutes. When Naeem updates a string in admin, the cache invalidates within 5 minutes.

**Translation helper:**

```typescript
// src/lib/i18n/t.ts
import { CRITICAL_FALLBACKS } from "@/constants/critical-ui-strings";

export type UiStringsMap = Record<string, string>;

export function createT(strings: UiStringsMap, locale: "de" | "en") {
  return function t(key: string, vars?: Record<string, string | number>): string {
    let value = strings[key];

    // Critical-string fallback safety net (§9.4)
    if (!value && CRITICAL_FALLBACKS[key]) {
      value = CRITICAL_FALLBACKS[key][locale];
    }

    // Last resort: return the key itself so missing strings are visible during dev
    if (!value) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n] Missing UI string: ${key}`);
      }
      return key;
    }

    // Variable interpolation: t("greeting", { name: "Naeem" }) → "Hallo, Naeem!"
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }

    return value;
  };
}
```

**Using `t()` in Server Components:**

```typescript
// app/(public)/page.tsx
import { getUiStrings } from "@/services/public/uiStrings";
import { createT } from "@/lib/i18n/t";

export default async function HomePage() {
  const strings = await getUiStrings("de");
  const t = createT(strings, "de");

  return (
    <main>
      <h1>{t("home.hero.headline")}</h1>
      <p>{t("home.hero.subhead")}</p>
      <Button>{t("common.book_now")}</Button>
    </main>
  );
}
```

**Using `t()` in Client Components:**

```typescript
// components/shared/PhoneCTA.tsx
"use client";
import { useUiStrings } from "@/hooks/useUiStrings";

export function PhoneCTA() {
  const t = useUiStrings();
  return <a href="tel:+49...">{t("common.call_us")}</a>;
}
```

`useUiStrings()` reads from the `UiStringsProvider` set up in the layout.

### 9.4 Critical-string fallback safety net

Some UI strings, if missing, prevent the site from rendering or break critical flows (the language switcher labels themselves, error messages on the booking form, the 404 page text). These get hardcoded fallbacks in code:

```typescript
// src/constants/critical-ui-strings.ts
export const CRITICAL_FALLBACKS = {
  "language.switch.de": { de: "Deutsch", en: "German" },
  "language.switch.en": { de: "Englisch", en: "English" },
  "errors.generic": { de: "Ein Fehler ist aufgetreten.", en: "An error occurred." },
  "common.loading": { de: "Lädt…", en: "Loading…" },
  "404.heading": { de: "Seite nicht gefunden", en: "Page not found" },
  "404.cta": { de: "Zur Startseite", en: "Back to homepage" },
} as const;
```

This is the **last resort** — backend `is_locked` flag prevents most issues at the source, but if a critical string somehow ends up empty in DB, the site still renders sensibly.

The backend also marks these keys with `is_locked = true` in the `ui_strings` table so they're read-only in the admin form.

### 9.5 The route map

```typescript
// src/lib/i18n/routes.ts
export const ROUTE_MAP: Record<string, string> = {
  "/": "/en",
  "/dienstleistungen": "/en/services",
  "/preise": "/en/pricing",
  "/ueber-uns": "/en/about",
  "/kontakt": "/en/contact",
  "/buchen": "/en/book",
  "/impressum": "/en/legal-notice",
  "/datenschutz": "/en/privacy",
  "/agb": "/en/terms",
};

export const REVERSE_ROUTE_MAP = Object.fromEntries(
  Object.entries(ROUTE_MAP).map(([de, en]) => [en, de])
);

export function getAlternateUrl(
  currentPath: string,
  dynamicSlugMap?: Record<string, string>,
): string {
  if (ROUTE_MAP[currentPath]) return ROUTE_MAP[currentPath];
  if (REVERSE_ROUTE_MAP[currentPath]) return REVERSE_ROUTE_MAP[currentPath];
  if (dynamicSlugMap?.[currentPath]) return dynamicSlugMap[currentPath];
  return currentPath.startsWith("/en")
    ? currentPath.replace(/^\/en/, "") || "/"
    : `/en${currentPath}`;
}
```

For service detail pages, the `dynamicSlugMap` is passed from the page (which knows its `slug_de` ↔ `slug_en` pair from the DB record).

### 9.6 Bilingual admin forms

Admin UI is German-only (Naeem's language). But edit forms for any translatable content show `_de` and `_en` fields side by side:

```tsx
<BilingualField label="Titel" name="title" required />
// Renders:
// ┌─ Titel (Deutsch) ─────────┐  ┌─ Title (English) ────────┐
// │ Flughafentransfer          │  │ Airport Transfer          │
// └────────────────────────────┘  └───────────────────────────┘
```

The form schema validates both fields. Both are saved in a single API request.

---

## 10. Legal Page Rendering

Legal pages are DB-sourced. They are NOT MDX files.

```typescript
// app/(public)/impressum/page.tsx
import { getLegalPage } from "@/services/public/legalPages";
import { LegalPageRenderer } from "@/components/features/legal/LegalPageRenderer";

export const revalidate = 600;

export default async function ImpressumPage() {
  const page = await getLegalPage("impressum", "de");
  return <LegalPageRenderer page={page} />;
}
```

The backend resolves Mustache placeholders (`{{ site_settings.phone }}`) **before** returning the response, so the frontend receives a fully-interpolated markdown body. The component just renders it via the shared `<Markdown>` component:

```typescript
// components/features/legal/LegalPageRenderer.tsx
import { Markdown } from "@/components/shared/Markdown";

export function LegalPageRenderer({ page }: { page: LegalPagePublic }) {
  return (
    <article className="prose mx-auto max-w-3xl py-16">
      <h1>{page.title}</h1>
      <p className="text-sm text-muted">Stand: {page.published_at_formatted}</p>
      <Markdown source={page.body} />
    </article>
  );
}
```

**The English version (`/en/legal-notice`)** shows a banner reminding users that the German version is legally binding. The banner text comes from the `ui_strings` table:

```tsx
{locale === "en" && (
  <Alert tone="info" className="mb-8">
    {t("legal.translation_disclaimer")}
  </Alert>
)}
```

### 10.1 Admin editing of legal pages

The admin route `/admin/legal-pages/[slug]` loads the **draft** (creating one from the published version if no draft exists), shows the bilingual markdown editor, and offers two actions:

- **Vorschau** — opens `/admin/legal-pages/[slug]/preview` which renders the draft using the real public template
- **Veröffentlichen** — calls `POST /api/v0/admin/legal-pages/[slug]/publish`, which promotes the draft to published

A **non-blocking warning banner** at the top of the editor:

```tsx
<LegalWarningBanner>
  ⚠️ Rechtliche Inhalte — Änderungen an dieser Seite können rechtliche Folgen haben.
  Im Zweifel vorher mit Rechtsberatung Rücksprache halten.
  Eine Sicherungskopie wird automatisch erstellt.
</LegalWarningBanner>
```

A separate page `/admin/legal-pages/[slug]/versions` shows version history with a "Wiederherstellen" button on each past version.

---

## 11. Admin Panel Surfaces

The admin gives Naeem access to every editable content type. **Each section gets the same shape:** list view (with search/filter), create form, edit form. The German UI uses standard CRUD vocabulary.

| Admin section | Path | What Naeem manages |
|---|---|---|
| Dashboard | `/admin` | New bookings, recent contact messages, audit log summary |
| UI-Texte | `/admin/ui-strings` | All translatable UI strings (button labels, errors, hero copy) |
| Dienstleistungen | `/admin/services` | Service titles, descriptions, slugs, hero images |
| Preise | `/admin/pricing` | Pricing categories and items per service |
| Fahrzeuge | `/admin/vehicles` | Fleet vehicles |
| FAQ | `/admin/faqs` | Q&A entries |
| Kundenstimmen | `/admin/testimonials` | Customer testimonials |
| Rechtliche Seiten | `/admin/legal-pages` | Impressum, Datenschutz, AGB (versioned) |
| Buchungen | `/admin/bookings` | Booking requests (read + status updates) |
| Kontaktnachrichten | `/admin/contact-messages` | Contact form submissions (read + mark-handled) |
| Stammdaten | `/admin/settings` | Business name, address, phone, concession, hours, social |
| Verlauf | `/admin/audit-log` | What changed, when, by whom |
| Papierkorb | `/admin/trash` | Soft-deleted items, with "Wiederherstellen" |

**Patterns shared across all admin sections:**

- List views use a standard `<AdminTable>` component with sort + filter + pagination
- Edit forms use React Hook Form + Zod with the admin-specific schemas
- All forms surface `RequiredFieldError` from the API inline next to the offending field
- Soft delete is the only delete action; hard delete is not exposed in UI
- Every save triggers an audit log entry server-side

---

## 12. Forms and Validation

All forms use **React Hook Form + Zod**.

```typescript
// src/schemas/booking.schema.ts
import { z } from "zod";

export const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  pickupAddress: z.string().min(3, "errors.required"),
  pickupPostcode: z.string().regex(/^\d{5}$/, "errors.invalid_postcode"),
  destinationAddress: z.string().min(3),
  requestedDate: z.string().refine(d => new Date(d) > new Date(), "errors.date_in_past"),
  requestedTime: z.string().regex(/^\d{2}:\d{2}$/),
  passengerCount: z.number().int().min(1).max(8),
  customerName: z.string().min(2),
  customerPhone: z.string().regex(/^[\d\s+\-()]{6,}$/, "errors.invalid_phone"),
  customerEmail: z.string().email("errors.invalid_email"),
  privacyConsent: z.literal(true, { errorMap: () => ({ message: "errors.consent_required" }) }),
  website: z.string().max(0).optional(),  // honeypot
});

export type BookingFormData = z.infer<typeof bookingSchema>;
```

**Rules:**
- Error messages are i18n keys, resolved at render time by the form component
- The honeypot field is enforced at schema level
- Schemas are imported by both the form (RHF resolver) and could be used server-side if desired

---

## 13. Multi-Step Booking Form Pattern

The booking form is the most complex interactive surface. State across steps lives in Zustand:

```typescript
// src/stores/useBookingWizardStore.ts
import { create } from "zustand";

type Step = "service" | "trip" | "requirements" | "contact";

interface BookingWizardState {
  step: Step;
  data: Partial<BookingFormData>;
  setStep: (s: Step) => void;
  setField: <K extends keyof BookingFormData>(key: K, value: BookingFormData[K]) => void;
  reset: () => void;
}

export const useBookingWizardStore = create<BookingWizardState>((set) => ({
  step: "service",
  data: {},
  setStep: (step) => set({ step }),
  setField: (key, value) => set((s) => ({ data: { ...s.data, [key]: value } })),
  reset: () => set({ step: "service", data: {} }),
}));
```

**Why Zustand, not RHF for cross-step state:**

- RHF holds form state per `<form>` boundary; we have 4 separate step forms
- Zustand persists across step transitions — back button preserves field values
- Each step component uses RHF locally for that step's fields, then writes valid values to the Zustand store on step submit

**Submission:**

- Final step gathers all data from store + its own contact fields
- Validates the FULL schema before submit
- POSTs to FastAPI
- On success: reset store, navigate to confirmation page with reference number

---

## 14. SEO

Next.js Metadata API generates per-page metadata. Helpers in `lib/seo.ts`:

```typescript
// src/lib/seo.ts
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";

export function buildMetadata(opts: {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  alternates?: { de: string; en: string };
  ogImage?: string;
}): Metadata {
  const url = `https://step-now.de${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: url,
      languages: opts.alternates ? {
        de: `https://step-now.de${opts.alternates.de}`,
        en: `https://step-now.de${opts.alternates.en}`,
        "x-default": `https://step-now.de${opts.alternates.de}`,
      } : undefined,
    },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      locale: opts.locale === "de" ? "de_DE" : "en_US",
      type: "website",
      images: [{ url: opts.ogImage || "/images/og-default.jpg", width: 1200, height: 630 }],
    },
  };
}
```

**Metadata sources:**

- Page titles and descriptions: from the DB (`services.meta_title_de`, `meta_description_de`, etc.) — falls back to `site_settings.default_meta_title_de` if not set
- OG images: per-service `og_image_url` or default from settings

**Structured data:**

- `LocalBusiness` JSON-LD on homepage and contact page — built from `site_settings`
- `Service` JSON-LD on each service detail page
- `BreadcrumbList` on every non-homepage page
- `FAQPage` on pages with FAQ accordions

**Sitemap and robots:** `app/sitemap.ts` and `app/robots.ts` generate `/sitemap.xml` and `/robots.txt`. The sitemap reads from the DB (services table) to include current slugs in both languages.

---

## 15. Performance Budgets

| Metric | Public pages | Admin |
|---|---|---|
| Lighthouse Performance | ≥ 90 | ≥ 80 |
| Lighthouse SEO | ≥ 95 | N/A |
| Lighthouse Accessibility | ≥ 90 | ≥ 85 |
| LCP | < 2.0s | < 3.0s |
| INP | < 200ms | < 300ms |
| CLS | < 0.05 | < 0.10 |

**How to hit these:**

- Self-hosted fonts via `next/font`
- Images via `next/image` with proper `sizes`
- Server Components by default; client only where interactivity needs it
- UI strings cached aggressively (5 min revalidation)
- No client-side analytics on public pages except Plausible
- Tailwind purging via JIT (default)
- Lazy-load Leaflet map only when scrolled into view

---

## 16. Accessibility

- All interactive elements keyboard-navigable
- Visible focus rings (Tailwind `focus-visible:` utilities)
- Form fields have `<label>` associations, never placeholder-as-label
- Color contrast WCAG AA minimum
- Skip-to-content link in header
- `<html lang>` set per locale in layout
- ARIA labels on icon-only buttons
- Form errors announced via `aria-live="polite"`

---

## 17. Adding a New Public Page

1. **Add the route** — `app/(public)/{de-slug}/page.tsx` and `app/en/{en-slug}/page.tsx`
2. **Update i18n route map** — add the pair to `lib/i18n/routes.ts`
3. **Update nav config** — `config/nav.ts` if the page is in main navigation
4. **Update sitemap** — `app/sitemap.ts` includes new routes
5. **Add UI string keys via admin** — Naeem creates the strings in `/admin/ui-strings` (or you seed them via migration)
6. **Build the page** — RSC, fetches via `services/public/*`, renders feature components
7. **Generate metadata** — use `buildMetadata` from `lib/seo.ts`
8. **Add structured data** if applicable

---

## 18. Adding a New Admin Resource

1. **Backend first** — model, schema, service, controller, routes in FastAPI; run migration
2. **Frontend types** — `types/{resource}.ts` mirroring FastAPI's Pydantic schemas
3. **Service** — `services/admin/{resource}.ts` with CRUD functions
4. **React Query hooks** — `hooks/queries/useAdmin{Resource}.ts`
5. **Query keys** — add to `lib/react-query/query-keys.ts`
6. **Form schema** — `schemas/admin/{resource}.schema.ts`
7. **Feature components** — `components/features/admin/{Resource}Form.tsx`, list view
8. **Routes** — `app/admin/{resource}/page.tsx`, `[id]/page.tsx`
9. **Sidebar nav** — `components/features/admin/AdminSidebar.tsx`

---

## 19. What Is Forbidden

These rules are non-negotiable.

- **React Query for public read content.** Public pages are SSR. RQ is admin-only.
- **Hardcoded user-facing strings in components.** Every visible string goes through `t()` against DB-sourced UI strings.
- **JSON files for translations.** UI strings come from `ui_strings` API endpoint, not from local JSON.
- **Cross-feature imports between Tier 3 components.** `features/booking/` cannot import from `features/admin/`.
- **Importing from `features/` into `shared/` or `ui/`.** Direction is one-way: ui → shared → features.
- **Hardcoded API URLs.** Use `services/api/endpoints.ts` and the client wrapper.
- **`fetch()` in components.** Always go through the service layer.
- **Inline query keys.** Use `lib/react-query/query-keys.ts`.
- **Inline Tailwind class strings >200 chars.** Extract to `cn()` calls or component composition.
- **Mixed-language content in a single page render.** Each render is one locale.
- **Rendering legal page bodies without the shared `<Markdown>` component.** Sanitization is centralized.
- **Google Fonts CDN, Google Analytics, Google Maps, Google reCAPTCHA.** DSGVO violations. Use self-hosted fonts, Plausible, OpenStreetMap, hCaptcha.
- **`localStorage` for admin JWT.** Use `sessionStorage` (cleared on tab close, less XSS exposure).
- **Client-side environment variables for secrets.** Only `NEXT_PUBLIC_*` vars reach the browser.
- **`use client` at the top of every file.** Default to server components.
- **Importing the entire Lucide icon library.** Import specific icons.
- **Skipping the `Locale` type in service signatures.** Every public service function takes locale.
- **Editing legal pages without the draft → preview → publish workflow.** Bypassing this defeats the safeguard.

---

## 20. What Echooo Has That StepNow Does NOT

| Echooo concept | Why omitted from StepNow |
|---|---|
| `app/api/v0/[feature]/route.ts` BFF middleware | Same-origin nginx routing; no BFF value |
| `.client.ts` / `.server.ts` per-feature split | One service file works for both via `isServer` flag |
| `(dashboard)` route group with full SaaS shell | Admin is a small section under `/admin` |
| `(public)/share/[shortCode]/` public mirror views | StepNow has no shareable public-mirror surface |
| `useColumnDragResize`, drag-resize column chrome | Admin tables are basic |
| `column-registry.ts`, `column-definitions.ts` | No need; static columns |
| SSE streaming infrastructure | No long-running operations |
| Heavy stale-time tuning across many features | Admin is small; default stale times cover 95% |
| Complex Zustand store ecosystem | One booking-wizard + one auth + one UI store |
| TableSkeleton mirrored in two locations | One canonical TableSkeleton in `ui/` |
| `usePermission`-style role checks | Single admin user, no roles |
| `next-intl` / `i18next` | Custom route-prefix + DB-sourced strings is enough |
| Storybook | Component count too small |
| JSON translation files | All UI strings live in DB |

Adding any of these later is acceptable when a real need emerges. Adding them speculatively is overengineering.

---

## 21. Living Document

This file is updated whenever a new top-level directory is introduced, a convention changes, or a forbidden practice is added.

The code is the source of truth. This document is the map.

**Cross-references:**

- Backend disciplines: `docs/architecture/backend.md`
- Page-level content specifications: `docs/website-outline.md`
- Visual design direction: `docs/design-direction.md`
- Live-site triage checklist: `docs/triage-checklist.md`
- Legal page drafts: `docs/legal/`
- Echooo frontend structure (source of disciplines this document inherits): when patterns are ambiguous, check Echooo's version first.
