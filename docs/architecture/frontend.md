# StepNow — Frontend Architecture

> **Audience.** Engineers writing or reviewing code in the StepNow frontend repository.
> **Scope.** The Next.js + Tailwind frontend only. Backend conventions live in `docs/architecture/backend.md`.
> **Status.** Target architecture for the rebuild. Backend is complete (51 endpoints validated end-to-end, 100+ assertion tests passing). This document reflects the actual API contract that the frontend will integrate against.
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
- **Legal pages render from DB rows, not MDX files** — backend supports a full draft → preview → publish → rollback workflow with versioning
- **Naeem can edit every piece of content via admin** — protected by the seven backend safeguards (audit log, soft delete, required-field validation, versioning for legal pages, preview-before-publish, daily backups, warning banner on legal page edits)

### 1.2 Non-Negotiable Invariants

- No mixed-language pages. A user on `/preise` sees German exclusively. A user on `/en/pricing` sees English exclusively.
- Public reads happen server-side in React Server Components — never client-side. SEO depends on it.
- The browser never receives admin tokens, API keys, or backend internal URLs.
- Critical UI strings (the ones that, if missing, break rendering) are seeded with fallbacks in code as a last-resort safety net (§9.4).
- **Field names match the backend exactly.** The backend returns snake_case (`pickup_address`, `service_id`, `quoted_price_eur`) per Python/Pydantic convention. The frontend uses snake_case throughout its types and Zod schemas — no transformation layer.

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

## 4. Backend API Contract Reference

This section is the **single source of truth** for what endpoints exist, what they accept, and what they return. It mirrors the validated `apps/backend/` build (51 endpoints across 14 functional areas). When the backend OpenAPI at `/api/v0/docs` and this section disagree, the OpenAPI wins and this doc gets updated in the same commit.

### 4.1 Endpoint inventory

| Group | Endpoints | Path prefix |
|---|---:|---|
| Public reads | 10 | `/api/v0/public/*` (GET) |
| Public forms | 2 | `/api/v0/public/{bookings,contact}` (POST) |
| Auth | 4 | `/api/v0/auth/*` |
| Admin: settings (singleton) | 2 | `/api/v0/admin/settings` |
| Admin: UI strings | 6 | `/api/v0/admin/ui-strings` |
| Admin: services | 6 | `/api/v0/admin/services` |
| Admin: vehicles | 6 | `/api/v0/admin/vehicles` |
| Admin: FAQs | 6 | `/api/v0/admin/faqs` |
| Admin: testimonials | 6 | `/api/v0/admin/testimonials` |
| Admin: pricing (nested) | 11 | `/api/v0/admin/{services/{id}/pricing-categories, pricing-categories/{id}, pricing-categories/{id}/items, pricing-items/{id}}` |
| Admin: legal pages (workflow) | 8 | `/api/v0/admin/legal-pages/*` |
| Admin: bookings | 4 | `/api/v0/admin/bookings` |
| Admin: contact messages | 4 | `/api/v0/admin/contact-messages` |
| Admin: audit log | 2 | `/api/v0/admin/audit-log` |

**Total: 51 endpoints.** Browse the live OpenAPI doc at `http://localhost:8000/api/v0/docs` during development for full schemas.

### 4.2 Authentication

JWT bearer tokens. Login returns an access token (short-lived, ~30 min) and a refresh token (long-lived). The refresh token is stored hashed (SHA-256) in the database.

```
POST /api/v0/auth/login
  Request:  { email: string, password: string }
  Response: {
    access_token: string,
    refresh_token: string,
    token_type: "bearer",
    expires_in: number  // seconds until access_token expiry
  }

POST /api/v0/auth/refresh
  Request:  { refresh_token: string }
  Response: same shape as login

POST /api/v0/auth/logout
  Request:  { refresh_token: string }
  Response: 204 No Content

GET /api/v0/auth/me
  Headers:  Authorization: Bearer <access_token>
  Response: { id, email, name, created_at, ... }
```

All admin endpoints require `Authorization: Bearer <access_token>`. Token storage: **sessionStorage** (cleared on tab close, less XSS exposure than localStorage). Never localStorage.

### 4.3 Error response shape

All endpoints return errors in this shape:

```json
{
  "error": {
    "code": "REQUIRED_FIELD",
    "message": "Geschäftsname ist gesetzliche Pflicht (§ 5 TMG)",
    "extra": { "field": "business_name" }
  }
}
```

Common codes:
- `400` `REQUIRED_FIELD` — legally-required field cannot be cleared. **The message is already in German and must be shown verbatim** — the frontend does not retranslate.
- `400` `DOMAIN_ERROR` — general business-rule violation
- `401` `UNAUTHORIZED` — missing or invalid token
- `403` `FORBIDDEN` — locked resource (e.g. attempting to edit a `is_locked: true` UI string)
- `404` `NOT_FOUND` — resource missing or soft-deleted (use `?include_deleted=true` to view trash)
- `409` `CONFLICT` — uniqueness violation (e.g. duplicate UI string `key`, duplicate service `slug_de`)
- `422` — Pydantic validation failure (schema-level, not business-rule); FastAPI default shape with `detail` array
- `429` `RATE_LIMIT` — too many requests (booking form: 5/min, contact form: 5/min, login: 10/min)

### 4.4 Pagination

All paginated endpoints accept `?page=N&size=M` and return:

```json
{
  "items": [...],
  "pagination": { "page": 1, "size": 20, "total": 142, "pages": 8 }
}
```

`size` has a hard ceiling of 100 (server-enforced). Default `size` varies by endpoint: 20 for content tables, 50 for UI strings.

### 4.5 Soft delete + restore pattern

Every content resource supports soft delete:

- `DELETE /api/v0/admin/{resource}/{id}` → sets `is_deleted=true`, returns 204
- `POST /api/v0/admin/{resource}/{id}/restore` → reverses
- `GET /api/v0/admin/{resource}?include_deleted=true` → shows trash
- Default lists exclude soft-deleted rows

The frontend's `/admin/trash` page calls each resource list with `include_deleted=true` and filters client-side for `is_deleted: true`.

### 4.6 Locale parameter on public reads

Every public read endpoint accepts `?locale=de` or `?locale=en`. Default is `de`. The response is **locale-flattened** — no `_de`/`_en` field mixing. For a service, that means the client receives:

```json
{
  "id": "...", "slug": "flughafentransfer", "title": "Flughafentransfer",
  "short_description": "...", "long_description": "..."
}
```

…not the raw bilingual columns. Admin endpoints return both columns; that's where Naeem edits.

### 4.7 Public endpoint reference

```
GET /api/v0/public/health
GET /api/v0/public/settings?locale=de             — locale-flattened site settings (header/footer)
GET /api/v0/public/ui-strings?locale=de&namespace=nav   — bulk key→value map; namespace optional
GET /api/v0/public/services?locale=de             — list active services
GET /api/v0/public/services/{slug}?locale=de      — service detail by localized slug
GET /api/v0/public/services/{slug}/pricing?locale=de   — pricing tree (categories + items) for a service
GET /api/v0/public/vehicles?locale=de             — active fleet
GET /api/v0/public/faqs?locale=de&category=booking — FAQs, optional category filter
GET /api/v0/public/testimonials?locale=de         — active testimonials
GET /api/v0/public/legal-pages/{slug}?locale=de   — rendered legal page (placeholders resolved)

POST /api/v0/public/bookings                       — submit booking (rate-limited 5/min)
POST /api/v0/public/contact                        — submit contact message (rate-limited 5/min)
```

All GET endpoints set `Cache-Control: public, max-age=300` (legal pages: 600).

### 4.8 Admin endpoint reference

The pattern is identical per resource. For services as an example:

```
GET    /api/v0/admin/services                    — list (paginated, q, include_inactive, include_deleted)
GET    /api/v0/admin/services/{id}               — get one (even if soft-deleted)
POST   /api/v0/admin/services                    — create
PATCH  /api/v0/admin/services/{id}               — partial update (omit fields to leave unchanged)
DELETE /api/v0/admin/services/{id}               — soft delete
POST   /api/v0/admin/services/{id}/restore       — restore from trash
```

The same 6-endpoint shape applies to: `ui-strings`, `vehicles`, `faqs`, `testimonials`. Settings is special (singleton, no list/create/delete — just GET + PATCH).

### 4.9 Pricing — nested resource

Pricing categories are bound to a service; items are bound to a category. Endpoint shapes:

```
GET    /api/v0/admin/services/{service_id}/pricing-categories       — categories for a service
POST   /api/v0/admin/services/{service_id}/pricing-categories       — create category in this service
GET    /api/v0/admin/pricing-categories/{cat_id}                    — read category (includes nested items)
PATCH  /api/v0/admin/pricing-categories/{cat_id}                    — update category
DELETE /api/v0/admin/pricing-categories/{cat_id}                    — soft delete
POST   /api/v0/admin/pricing-categories/{cat_id}/restore            — restore

GET    /api/v0/admin/pricing-categories/{cat_id}/items              — items in this category
POST   /api/v0/admin/pricing-categories/{cat_id}/items              — create item
GET    /api/v0/admin/pricing-items/{item_id}                        — read item
PATCH  /api/v0/admin/pricing-items/{item_id}                        — update item
DELETE /api/v0/admin/pricing-items/{item_id}                        — soft delete
POST   /api/v0/admin/pricing-items/{item_id}/restore                — restore
```

`price_eur` is a string-formatted decimal with 2 places (e.g. `"49.50"`). Backend validates `≥ 0`, `≤ 99999999`, exactly 2 decimal places.

### 4.10 Legal pages — workflow endpoints

The legal-page edit cycle: load draft → save draft → preview → publish. Each publish writes a new row to `legal_page_versions`. Rollback creates a new version copying a chosen historical version's body.

```
GET    /api/v0/admin/legal-pages                                    — list (impressum, datenschutz, agb)
GET    /api/v0/admin/legal-pages/{slug}                             — current state (published + draft)
POST   /api/v0/admin/legal-pages/{slug}/draft                       — save/update the draft
POST   /api/v0/admin/legal-pages/{slug}/publish                     — promote draft to published
POST   /api/v0/admin/legal-pages/{slug}/rollback                    — create new version from past one
GET    /api/v0/admin/legal-pages/{slug}/versions                    — version history
GET    /api/v0/admin/legal-pages/{slug}/preview                     — render the draft with placeholders resolved
POST   /api/v0/admin/legal-pages                                    — create new legal page slug
```

**Placeholders in legal page bodies** use single-brace syntax `{site_settings.business_name}`, validated against the backend's `LEGAL_PAGE_ALLOWED_PLACEHOLDERS` whitelist. Mustache-style `{{...}}` is not supported. The backend resolves placeholders server-side at GET/preview time, so the frontend always receives a fully-rendered body.

### 4.11 Booking lifecycle

The status enum on `booking_requests`:

```
new → contacted → quoted → confirmed → completed
                    ↓
                cancelled (terminal, can transition from any state)
```

Status transitions auto-stamp timestamps:
- Setting `status="quoted"` auto-sets `quoted_at` (if not already set)
- Setting `status="completed"` auto-sets `completed_at` (if not already set)

Booking references are formatted as `SN-YYYYMMDD-XXXXXX` where XXXXXX is a 6-char random alphanumeric (e.g. `SN-20260511-AB3F93`).

```
GET    /api/v0/admin/bookings?status=new&q=Max               — list with filters
GET    /api/v0/admin/bookings/{id}                           — get one
PATCH  /api/v0/admin/bookings/{id}                           — update status, internal notes, quoted_price_eur
DELETE /api/v0/admin/bookings/{id}                           — soft delete
```

### 4.12 Contact messages

```
GET    /api/v0/admin/contact-messages?category=booking&is_handled=false
GET    /api/v0/admin/contact-messages/{id}
PATCH  /api/v0/admin/contact-messages/{id}                   — toggle is_handled, internal notes
DELETE /api/v0/admin/contact-messages/{id}                   — soft delete
```

Setting `is_handled=true` auto-stamps `handled_at`. Setting `is_handled=false` clears `handled_at`.

### 4.13 Audit log

Append-only. The backend exposes read-only views:

```
GET /api/v0/admin/audit-log?table_name=services&action=update&actor_email=...&from_date=...&to_date=...
GET /api/v0/admin/audit-log/{entry_id}
```

`size` capped at 100 per page. Every mutation across the system writes an entry; this is the "what changed, when, by whom" view for Naeem.

---

## 5. Request and Render Flow

Different surfaces, different flows. **Do not mix them.**

### 5.1 Public marketing page (server-rendered)

```
Browser requests step-now.de/preise
   ↓
nginx → Next.js server
   ↓
Next.js: app/(public)/preise/page.tsx (React Server Component)
   ↓
RSC calls in parallel:
   - getUiStrings("de")                 — bulk strings for layout
   - getServices("de")                  — list of services
   - getPricingForService("flughafentransfer", "de")  — repeated for each service
   - getSiteSettings("de")              — header/footer settings (often via layout)
   ↓
Each call hits http://localhost:8000/api/v0/public/* with cached fetch
   ↓
FastAPI returns locale-flattened JSON
   ↓
RSC renders to HTML
   ↓
HTML + serialized data → browser
```

No client-side fetching. No React Query. Just SSR with `fetch` and Next.js's built-in cache.

### 5.2 Booking form submission

```
User fills booking form (client component) at /buchen
   ↓
React Hook Form validates against Zod schema (matches backend Pydantic shape)
   ↓
On submit: POST to /api/v0/public/bookings (same-origin via nginx)
   ↓
nginx → FastAPI (rate-limited 5/min)
   ↓
FastAPI inserts row, dispatches owner + customer emails via BackgroundTasks
   ↓
FastAPI responds with { reference: "SN-20260511-AB3F93", status: "new" }
   ↓
Client shows confirmation screen with the reference number
```

No BFF middleware. No Next.js API route. The browser POSTs directly to FastAPI's public endpoint.

### 5.3 Admin action

```
Naeem clicks "Speichern" on a service edit form at /admin/services/[id]
   ↓
React Hook Form validates locally
   ↓
useMutation (React Query) → PATCH /api/v0/admin/services/[id]
   ↓
Browser sends with Authorization: Bearer <jwt> from sessionStorage
   ↓
nginx → FastAPI (validates JWT, runs ContentService.update_service with audit)
   ↓
React Query invalidates the services query key
   ↓
UI re-fetches and re-renders
```

React Query handles caching, optimistic updates, and invalidation for admin only.

---

## 6. Repository Layout

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
│   │   │   │   ├── page.tsx                    Categories grouped by service
│   │   │   │   ├── categories/[id]/page.tsx    Edit category + manage items
│   │   │   │   └── items/[id]/page.tsx         Edit single item
│   │   │   ├── vehicles/
│   │   │   ├── faqs/
│   │   │   ├── testimonials/
│   │   │   ├── legal-pages/                    Edit with versioning + preview
│   │   │   │   ├── page.tsx                    List (Impressum, Datenschutz, AGB)
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx                Edit current draft
│   │   │   │       ├── preview/page.tsx        Preview the draft
│   │   │   │       └── versions/page.tsx       Version history + rollback
│   │   │   ├── bookings/                       Read + status updates
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── contact-messages/               Read + mark-handled
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
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
│   │   │   ├── Alert.tsx
│   │   │   ├── Table.tsx                       Admin table primitive
│   │   │   └── TableSkeleton.tsx
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
│   │       │   └── PricingTable.tsx            Renders nested categories + items per service
│   │       ├── booking/
│   │       │   ├── BookingWizard.tsx           Container (client)
│   │       │   ├── steps/
│   │       │   │   ├── ServiceSelection.tsx
│   │       │   │   ├── TripDetails.tsx
│   │       │   │   ├── SpecialRequirements.tsx
│   │       │   │   └── ContactInfo.tsx
│   │       │   ├── BookingConfirmation.tsx
│   │       │   └── BookingFormEmbedded.tsx     Simpler single-screen version for homepage
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
│   │           ├── RequiredFieldErrorInline.tsx — Renders backend's 400 REQUIRED_FIELD inline
│   │           ├── AuditLogEntry.tsx
│   │           ├── ServiceForm.tsx
│   │           ├── UiStringRow.tsx             Inline-edit row for ui_strings list
│   │           ├── VehicleForm.tsx
│   │           ├── PricingCategoryForm.tsx
│   │           ├── PricingItemForm.tsx
│   │           ├── FaqForm.tsx
│   │           ├── TestimonialForm.tsx
│   │           ├── LegalPageEditor.tsx
│   │           ├── LegalPageVersionList.tsx
│   │           ├── LegalPagePreview.tsx
│   │           ├── BookingDetailDrawer.tsx
│   │           ├── BookingStatusSelector.tsx   Six-state lifecycle dropdown
│   │           ├── ContactMessageDetail.tsx
│   │           └── SettingsForm.tsx
│   │
│   ├── hooks/                                  Custom hooks
│   │   ├── queries/                            React Query hooks (admin only)
│   │   │   ├── useAdminUiStrings.ts
│   │   │   ├── useAdminServices.ts
│   │   │   ├── useAdminPricing.ts              Categories + items combined
│   │   │   ├── useAdminVehicles.ts
│   │   │   ├── useAdminFaqs.ts
│   │   │   ├── useAdminTestimonials.ts
│   │   │   ├── useAdminLegalPages.ts           Includes draft/publish/rollback mutations
│   │   │   ├── useAdminBookings.ts
│   │   │   ├── useAdminContactMessages.ts
│   │   │   ├── useAdminSettings.ts
│   │   │   ├── useAdminAuditLog.ts
│   │   │   ├── useAdminTrash.ts                Wraps each resource list with include_deleted=true
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
│   │   │   └── endpoints.ts                    ENDPOINTS constant (matches §4 inventory)
│   │   ├── public/
│   │   │   ├── uiStrings.ts                    getUiStrings(locale, namespace?)
│   │   │   ├── services.ts                     getServices, getServiceBySlug
│   │   │   ├── pricing.ts                      getPricingForService(slug, locale)
│   │   │   ├── vehicles.ts
│   │   │   ├── faqs.ts
│   │   │   ├── testimonials.ts
│   │   │   ├── legalPages.ts                   getLegalPage(slug, locale)
│   │   │   ├── bookings.ts                     submitBooking
│   │   │   ├── contact.ts                      submitContactMessage
│   │   │   └── settings.ts                     getSiteSettings(locale)
│   │   ├── admin/
│   │   │   ├── uiStrings.ts
│   │   │   ├── services.ts
│   │   │   ├── pricing.ts                      Categories + items together
│   │   │   ├── vehicles.ts
│   │   │   ├── faqs.ts
│   │   │   ├── testimonials.ts
│   │   │   ├── legalPages.ts                   CRUD + draft + publish + rollback + versions
│   │   │   ├── bookings.ts                     List + status update + soft delete
│   │   │   ├── contactMessages.ts
│   │   │   ├── settings.ts                     get + patch (singleton)
│   │   │   ├── auditLog.ts
│   │   │   └── trash.ts                        Restore endpoints for every resource
│   │   └── auth/
│   │       └── auth.ts                         login, logout, refresh, me
│   │
│   ├── stores/                                 Zustand stores (UI state only)
│   │   ├── useBookingWizardStore.ts            Multi-step form state across steps
│   │   ├── useAuthStore.ts                     Admin tokens (sessionStorage adapter)
│   │   └── useUiStore.ts                       Global UI flags (mobile menu open, etc.)
│   │
│   ├── types/                                  TypeScript contracts — snake_case mirroring backend
│   │   ├── api.ts                              ApiError, Pagination, common shapes
│   │   ├── uiString.ts                         UiString (admin), UiStringsMap (public)
│   │   ├── service.ts                          ServicePublic, ServiceAdmin
│   │   ├── pricing.ts                          PricingCategory*, PricingItem*
│   │   ├── vehicle.ts                          VehiclePublic, VehicleAdmin
│   │   ├── faq.ts
│   │   ├── testimonial.ts
│   │   ├── legalPage.ts                        LegalPage, LegalPageVersion
│   │   ├── booking.ts                          BookingCreate, BookingSubmitted, BookingAdmin, BookingStatus
│   │   ├── contact.ts                          ContactCreate, ContactSubmitted, ContactAdmin
│   │   ├── settings.ts                         SettingsPublic, SettingsAdmin
│   │   ├── auditLog.ts
│   │   ├── i18n.ts                             Locale type, LocaleStrings
│   │   └── index.ts                            Barrel
│   │
│   ├── schemas/                                Zod schemas (form validation) — snake_case
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
│   │   │   ├── config.ts                       Locale type, defaultLocale = "de"
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
│   │   ├── booking.ts                          BOOKING_STATUSES, step constants
│   │   └── contact.ts                          CONTACT_CATEGORIES
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

## 7. The Component Tier Discipline

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

## 8. Data Fetching Strategy

Three contexts, three approaches. **Do not mix them.**

### 8.1 Public pages — Server-side fetch in RSC

```typescript
// app/(public)/preise/page.tsx
import { getServices, getPricingForService, getUiStrings } from "@/services/public";
import { PricingTable } from "@/components/features/pricing/PricingTable";
import { createT } from "@/lib/i18n/t";

export const revalidate = 300;  // ISR — refresh every 5 minutes

export default async function PricingPage() {
  const [services, strings] = await Promise.all([
    getServices("de"),
    getUiStrings("de"),
  ]);
  const t = createT(strings, "de");

  // Pricing is per-service; fetch in parallel
  const pricingPerService = await Promise.all(
    services.map(async (s) => ({
      service: s,
      categories: await getPricingForService(s.slug, "de"),
    }))
  );

  return (
    <>
      <h1>{t("pricing.heading")}</h1>
      {pricingPerService.map(({ service, categories }) => (
        <PricingTable
          key={service.id}
          service={service}
          categories={categories}
          t={t}
        />
      ))}
    </>
  );
}
```

**Rules:**
- Always `export const revalidate = N` (ISR) or omit for static
- Public service calls imported from `services/public/*`
- Each service function uses `fetch(INTERNAL_API_URL, { next: { revalidate: N } })` — Next.js fetch cache
- No React Query for public reads. Ever.

### 8.2 Booking/contact forms — Client-side mutation

```typescript
// components/features/booking/BookingWizard.tsx
"use client";
import { submitBooking } from "@/services/public/bookings";

const onSubmit = async (data: BookingCreate) => {
  setSubmitting(true);
  try {
    const result = await submitBooking(data);
    // result.reference is "SN-YYYYMMDD-XXXXXX"
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

### 8.3 Admin panel — React Query

```typescript
// app/admin/services/page.tsx
"use client";
import { useAdminServices, useDeleteService } from "@/hooks/queries";

export default function AdminServicesPage() {
  const { data, isLoading } = useAdminServices({ page: 1, size: 20 });
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

## 9. Service Layer (No BFF)

**StepNow has no Next.js API middleware layer.** Browser calls go directly to FastAPI through nginx.

**The service layer is a thin fetch wrapper:**

```typescript
// services/api/client.ts
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || "http://localhost:8000";
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v0";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

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
    const body = await res.json().catch(() => null);
    throw new ApiError(
      body?.error?.code ?? "UNKNOWN",
      body?.error?.message ?? res.statusText,
      res.status,
      body?.error?.extra,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
```

**The same service function works for SSR and CSR**, switched by `isServer`:

```typescript
// services/public/services.ts
import type { ServicePublic } from "@/types/service";
import type { Locale } from "@/lib/i18n/config";

export async function getServices(
  locale: Locale,
  isServer = true,
): Promise<ServicePublic[]> {
  return apiFetch<ServicePublic[]>(`/public/services?locale=${locale}`, {
    isServer,
    next: { revalidate: 300 },
  } as RequestInit);
}

export async function getServiceBySlug(
  slug: string,
  locale: Locale,
  isServer = true,
): Promise<ServicePublic> {
  return apiFetch<ServicePublic>(
    `/public/services/${slug}?locale=${locale}`,
    { isServer, next: { revalidate: 300 } } as RequestInit,
  );
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

### 9.1 RequiredFieldError handling

The backend returns `{ error: { code: "REQUIRED_FIELD", message: "<localized DE message>", extra: { field: "business_name" } } }` for any attempt to clear a legally-required field on `site_settings` (per `§ 5 TMG`). The frontend must:

- **Display the `message` verbatim** — it is already in German and is the legally appropriate phrasing. Do not translate or rewrite it.
- **Highlight the field** identified by `extra.field` in the form
- **Not block the rest of the form** — only the one offending field shows the error

```typescript
// In an admin form's onError handler
try {
  await updateSettings(data);
} catch (err) {
  if (err instanceof ApiError && err.code === "REQUIRED_FIELD") {
    form.setError(err.extra?.field as keyof FormData, {
      type: "required-by-law",
      message: err.message,  // verbatim
    });
    return;
  }
  throw err;
}
```

---

## 10. Internationalization

The biggest deviation from Echooo's frontend: **UI strings live in the database, not in JSON files.** This is a direct consequence of the backend's all-DB content authority model. The frontend talks to `/api/v0/public/ui-strings` for these strings.

### 10.1 URL strategy

- German (default, primary): `step-now.de/`
- English: `step-now.de/en/`
- Slug pairs stored in DB on `services` table — URLs are properly localized per service

### 10.2 The `middleware.ts`

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

### 10.3 The DB-backed `t()` helper

UI strings are fetched from `GET /api/v0/public/ui-strings?locale=de` at layout time, cached, and provided to all components.

**The endpoint returns:**

```json
{
  "locale": "de",
  "strings": {
    "common.book_now": "Jetzt buchen",
    "common.call_us": "Anrufen",
    "booking.step_service": "Service wählen",
    "errors.required": "Dieses Feld ist erforderlich"
  }
}
```

**Server-side flow (layout loads strings, passes to RSCs):**

```typescript
// app/(public)/layout.tsx
import { getUiStrings } from "@/services/public/uiStrings";
import { UiStringsProvider } from "@/lib/i18n/UiStringsProvider";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { strings } = await getUiStrings("de");
  return (
    <UiStringsProvider strings={strings} locale="de">
      {children}
    </UiStringsProvider>
  );
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

    // Critical-string fallback safety net (§10.4)
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

### 10.4 Critical-string fallback safety net

Some UI strings, if missing, prevent the site from rendering or break critical flows (language switcher labels, error messages on the booking form, 404 page text). These get hardcoded fallbacks in code:

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

This is the **last resort** — backend `is_locked` flag prevents most issues at the source, but if a critical string somehow ends up empty in DB, the site still renders sensibly. The backend marks these keys with `is_locked = true` in the `ui_strings` table so they're read-only in the admin form (unless explicitly unlocked first).

### 10.5 The route map

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

### 10.6 Bilingual admin forms

Admin UI is German-only (Naeem's language). But edit forms for any translatable content show `_de` and `_en` fields side by side:

```tsx
<BilingualField label="Titel" name_de="title_de" name_en="title_en" required />
// Renders:
// ┌─ Titel (Deutsch) ─────────┐  ┌─ Title (English) ────────┐
// │ Flughafentransfer          │  │ Airport Transfer          │
// └────────────────────────────┘  └───────────────────────────┘
```

The form schema validates both fields. Both are saved in a single API request to the admin endpoint.

---

## 11. Legal Page Rendering

Legal pages are DB-sourced. They are NOT MDX files.

```typescript
// app/(public)/impressum/page.tsx
import { getLegalPage } from "@/services/public/legalPages";
import { LegalPageRenderer } from "@/components/features/legal/LegalPageRenderer";

export const revalidate = 600;

export default async function ImpressumPage() {
  const page = await getLegalPage("impressum", "de");
  return <LegalPageRenderer page={page} locale="de" />;
}
```

The backend resolves placeholder syntax `{site_settings.business_name}` server-side, so the frontend receives a fully-interpolated markdown body. **Placeholders use single-brace syntax, not Mustache `{{ }}`**, and are validated against a whitelist (`LEGAL_PAGE_ALLOWED_PLACEHOLDERS`) on the backend.

The component just renders the resolved body via the shared `<Markdown>` component:

```typescript
// components/features/legal/LegalPageRenderer.tsx
import { Markdown } from "@/components/shared/Markdown";
import { Alert } from "@/components/ui/Alert";
import type { LegalPagePublic } from "@/types/legalPage";

interface Props {
  page: LegalPagePublic;
  locale: "de" | "en";
}

export function LegalPageRenderer({ page, locale }: Props) {
  return (
    <article className="prose mx-auto max-w-3xl py-16">
      {locale === "en" && (
        <Alert tone="info" className="mb-8">
          This is a translation for convenience. The German version is legally binding.
        </Alert>
      )}
      <h1>{page.title}</h1>
      {page.published_at && (
        <p className="text-sm text-muted">
          Stand: {new Date(page.published_at).toLocaleDateString("de-DE")}
        </p>
      )}
      <Markdown source={page.body} />
    </article>
  );
}
```

### 11.1 Admin editing of legal pages

The admin route `/admin/legal-pages/[slug]` loads the **draft** (creating one from the published version if no draft exists), shows the bilingual markdown editor, and offers two actions:

- **Vorschau** — opens `/admin/legal-pages/[slug]/preview` which renders the draft using the real public template (calls `GET /admin/legal-pages/{slug}/preview`)
- **Veröffentlichen** — calls `POST /api/v0/admin/legal-pages/{slug}/publish`, which promotes the draft to published and creates a new version row

A **non-blocking warning banner** at the top of the editor:

```tsx
<LegalWarningBanner>
  ⚠️ Rechtliche Inhalte — Änderungen an dieser Seite können rechtliche Folgen haben.
  Im Zweifel vorher mit Rechtsberatung Rücksprache halten.
  Eine Sicherungskopie wird automatisch erstellt.
</LegalWarningBanner>
```

A separate page `/admin/legal-pages/[slug]/versions` lists prior versions with a "Wiederherstellen" button. Clicking it calls `POST /admin/legal-pages/{slug}/rollback` which creates a NEW version copying the chosen historical one (the historical row is never mutated — append-only).

---

## 12. Admin Panel Surfaces

The admin gives Naeem access to every editable content type. **Each section gets the same shape:** list view (with search/filter), create form, edit form. The German UI uses standard CRUD vocabulary.

| Admin section | Path | Backend endpoints | What Naeem manages |
|---|---|---|---|
| Dashboard | `/admin` | (multiple read-only) | New bookings, recent contact messages, audit log summary |
| Stammdaten | `/admin/settings` | 2 endpoints (GET, PATCH) | Business name, address, phone, concession, hours, social |
| UI-Texte | `/admin/ui-strings` | 6 endpoints | All translatable UI strings, by namespace, with `is_locked` protection |
| Dienstleistungen | `/admin/services` | 6 endpoints | Service titles, descriptions, slugs (both languages), hero images |
| Preise | `/admin/pricing` | 11 endpoints (nested) | Categories per service, items per category, decimal prices |
| Fahrzeuge | `/admin/vehicles` | 6 endpoints | Fleet vehicles with PostgreSQL `ARRAY` features |
| FAQ | `/admin/faqs` | 6 endpoints | Q&A entries, grouped by category |
| Kundenstimmen | `/admin/testimonials` | 6 endpoints | Customer testimonials (initials only, per DSGVO) |
| Rechtliche Seiten | `/admin/legal-pages` | 8 endpoints | Impressum, Datenschutz, AGB — draft/preview/publish/rollback workflow |
| Buchungen | `/admin/bookings` | 4 endpoints | Booking requests — status updates with auto-stamping |
| Kontaktnachrichten | `/admin/contact-messages` | 4 endpoints | Contact form submissions, mark-handled with auto-stamping |
| Verlauf | `/admin/audit-log` | 2 endpoints (read-only) | Every mutation, filterable by table, action, actor |
| Papierkorb | `/admin/trash` | Cross-resource | Soft-deleted items from every resource, with "Wiederherstellen" |

**Patterns shared across all admin sections:**

- List views use a standard `<AdminTable>` component with sort + filter + pagination
- Edit forms use React Hook Form + Zod with the admin-specific schemas
- All forms surface `REQUIRED_FIELD` errors from the API inline next to the offending field (the message is in German and shown verbatim)
- Soft delete is the only delete action; hard delete is not exposed in UI
- Every save triggers an audit log entry server-side
- Booking + contact message edits never delete the row — they update status flags

---

## 13. Forms and Validation

All forms use **React Hook Form + Zod** with **snake_case field names matching the backend**.

```typescript
// src/schemas/booking.schema.ts
import { z } from "zod";

export const bookingSchema = z.object({
  // Optional — booking can be made without selecting a specific service
  service_id: z.string().uuid().optional(),

  pickup_address: z.string().min(3, "errors.required"),
  pickup_postcode: z.string().regex(/^\d{5}$/, "errors.invalid_postcode").optional(),
  pickup_city: z.string().optional(),

  destination_address: z.string().min(3, "errors.required"),
  destination_postcode: z.string().regex(/^\d{5}$/, "errors.invalid_postcode").optional(),
  destination_city: z.string().optional(),

  requested_datetime: z.string().refine(
    (d) => new Date(d) > new Date(),
    "errors.date_in_past",
  ),

  passenger_count: z.number().int().min(1).max(8),
  luggage_count: z.number().int().min(0).max(20),

  special_requirements: z.string().max(1000).optional(),

  customer_name: z.string().min(2, "errors.required").max(200),
  customer_phone: z.string().regex(/^[\d\s+\-()]{6,}$/, "errors.invalid_phone"),
  customer_email: z.string().email("errors.invalid_email"),

  is_business: z.boolean().default(false),
  company_name: z.string().max(200).optional(),
  company_vatid: z.string().max(50).optional(),

  language: z.enum(["de", "en"]),

  consent_dsgvo: z.literal(true, {
    errorMap: () => ({ message: "errors.consent_required" }),
  }),

  // Honeypot — must be empty
  website: z.string().max(0).optional(),
});

export type BookingCreate = z.infer<typeof bookingSchema>;
```

**Rules:**
- Error messages are i18n keys, resolved at render time by the form component
- The honeypot field is enforced at schema level
- Field names match backend Pydantic schemas exactly (snake_case)
- Schemas can be imported by both the form (RHF resolver) and tests
- The backend re-validates everything; client validation is for UX, not security

### 13.1 Booking response shape

```typescript
// types/booking.ts
export interface BookingSubmitted {
  reference: string;           // "SN-20260511-AB3F93"
  status: "new";               // always "new" on submission
  message: string;             // localized confirmation message
}
```

### 13.2 Contact form schema

```typescript
// src/schemas/contact.schema.ts
import { z } from "zod";

const CONTACT_CATEGORIES = [
  "general", "booking", "complaint", "business", "other",
] as const;

export const contactSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  subject_category: z.enum(CONTACT_CATEGORIES),
  message: z.string().min(10).max(5000),
  language: z.enum(["de", "en"]),
  consent_dsgvo: z.literal(true),
  website: z.string().max(0).optional(),  // honeypot
});

export type ContactCreate = z.infer<typeof contactSchema>;
```

---

## 14. Multi-Step Booking Form Pattern

The booking form is the most complex interactive surface. State across steps lives in Zustand:

```typescript
// src/stores/useBookingWizardStore.ts
import { create } from "zustand";
import type { BookingCreate } from "@/schemas/booking.schema";

type Step = "service" | "trip" | "requirements" | "contact";

interface BookingWizardState {
  step: Step;
  data: Partial<BookingCreate>;
  setStep: (s: Step) => void;
  setField: <K extends keyof BookingCreate>(key: K, value: BookingCreate[K]) => void;
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
- POSTs to `/api/v0/public/bookings`
- On success: reset store, navigate to confirmation page with reference number

---

## 15. SEO

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

- Page titles and descriptions: from the DB (`services.meta_title_de`, etc.) — falls back to `site_settings.default_meta_title_de` if not set
- OG images: per-service `og_image_url` or default from settings

**Structured data:**

- `LocalBusiness` JSON-LD on homepage and contact page — built from `/public/settings`
- `Service` JSON-LD on each service detail page
- `BreadcrumbList` on every non-homepage page
- `FAQPage` on pages with FAQ accordions

**Sitemap and robots:** `app/sitemap.ts` and `app/robots.ts` generate `/sitemap.xml` and `/robots.txt`. The sitemap reads from `/public/services` to include current slugs in both languages.

---

## 16. Performance Budgets

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

## 17. Accessibility

- All interactive elements keyboard-navigable
- Visible focus rings (Tailwind `focus-visible:` utilities)
- Form fields have `<label>` associations, never placeholder-as-label
- Color contrast WCAG AA minimum
- Skip-to-content link in header
- `<html lang>` set per locale in layout
- ARIA labels on icon-only buttons
- Form errors announced via `aria-live="polite"`

---

## 18. Adding a New Public Page

1. **Add the route** — `app/(public)/{de-slug}/page.tsx` and `app/en/{en-slug}/page.tsx`
2. **Update i18n route map** — add the pair to `lib/i18n/routes.ts`
3. **Update nav config** — `config/nav.ts` if the page is in main navigation
4. **Update sitemap** — `app/sitemap.ts` includes new routes
5. **Add UI string keys via admin** — Naeem creates the strings in `/admin/ui-strings` (or you seed them via migration)
6. **Build the page** — RSC, fetches via `services/public/*`, renders feature components
7. **Generate metadata** — use `buildMetadata` from `lib/seo.ts`
8. **Add structured data** if applicable

---

## 19. Adding a New Admin Resource

1. **Backend first** — model, schema, service, controller, routes in FastAPI; run migration. (For Phase 1, this is done — all 14 admin sections exist.)
2. **Frontend types** — `types/{resource}.ts` mirroring backend Pydantic schemas (snake_case)
3. **Service** — `services/admin/{resource}.ts` with CRUD functions
4. **React Query hooks** — `hooks/queries/useAdmin{Resource}.ts`
5. **Query keys** — add to `lib/react-query/query-keys.ts`
6. **Form schema** — `schemas/admin/{resource}.schema.ts`
7. **Feature components** — `components/features/admin/{Resource}Form.tsx`, list view
8. **Routes** — `app/admin/{resource}/page.tsx`, `[id]/page.tsx`
9. **Sidebar nav** — `components/features/admin/AdminSidebar.tsx`

---

## 20. What Is Forbidden

These rules are non-negotiable.

- **React Query for public read content.** Public pages are SSR. RQ is admin-only.
- **Hardcoded user-facing strings in components.** Every visible string goes through `t()` against DB-sourced UI strings.
- **JSON files for translations.** UI strings come from `/public/ui-strings` API, not local JSON.
- **Cross-feature imports between Tier 3 components.** `features/booking/` cannot import from `features/admin/`.
- **Importing from `features/` into `shared/` or `ui/`.** Direction is one-way: ui → shared → features.
- **Hardcoded API URLs.** Use `services/api/endpoints.ts` and the client wrapper.
- **`fetch()` in components.** Always go through the service layer.
- **Inline query keys.** Use `lib/react-query/query-keys.ts`.
- **Inline Tailwind class strings >200 chars.** Extract to `cn()` calls or component composition.
- **Mixed-language content in a single page render.** Each render is one locale.
- **Rendering legal page bodies without the shared `<Markdown>` component.** Sanitization is centralized.
- **camelCase field names in types/schemas talking to the backend.** Use snake_case to match backend Pydantic.
- **Translating `REQUIRED_FIELD` error messages.** Display the backend's `message` verbatim — it's already in legally appropriate German.
- **Mustache `{{ }}` placeholder syntax in legal pages.** The backend uses single-brace `{site_settings.field}`, whitelisted.
- **Hardcoded booking lifecycle states.** Use the constant `BOOKING_STATUSES = ["new", "contacted", "quoted", "confirmed", "completed", "cancelled"]`.
- **Wrong booking reference format.** The backend generates `SN-YYYYMMDD-XXXXXX`. Do not parse the date out; treat it as opaque.
- **Google Fonts CDN, Google Analytics, Google Maps, Google reCAPTCHA.** DSGVO violations. Use self-hosted fonts, Plausible, OpenStreetMap, hCaptcha.
- **`localStorage` for admin JWT.** Use `sessionStorage` (cleared on tab close, less XSS exposure).
- **Client-side environment variables for secrets.** Only `NEXT_PUBLIC_*` vars reach the browser.
- **`use client` at the top of every file.** Default to server components.
- **Importing the entire Lucide icon library.** Import specific icons.
- **Skipping the `Locale` type in service signatures.** Every public service function takes locale.
- **Editing legal pages without the draft → preview → publish workflow.** Bypassing this defeats the safeguard.

---

## 21. What Echooo Has That StepNow Does NOT

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

## 22. Living Document

This file is updated whenever a new top-level directory is introduced, a convention changes, or a forbidden practice is added.

The code is the source of truth. This document is the map.

**Cross-references:**

- Backend disciplines: `docs/architecture/backend.md`
- Page-level content specifications: `docs/website-outline.md`
- Visual design direction: `docs/design-direction.md`
- Live-site triage checklist: `docs/triage-checklist.md`
- Legal page drafts: `docs/legal/`
- Echooo frontend structure (source of disciplines this document inherits): when patterns are ambiguous, check Echooo's version first.
