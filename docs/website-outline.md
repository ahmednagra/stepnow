# StepNow Rides & Movers — Detailed Website Outline

**Version:** 1.2 (May 2026)
**Purpose:** Page-by-page specification for the rebuild
**Tech stack:** Next.js 14+ (App Router) + FastAPI + Postgres, bilingual (DE at root, EN at /en/), database-driven content with admin panel

**Changelog**
- **v1.2 (May 2026)** — Aligned with the completed backend build (51 endpoints, validated end-to-end). Section 0.2 rewritten — legal pages and UI strings are DB-driven, not MDX/JSON. Section 0.3 replaced with a pointer to the real schema. Section 0.4 rewritten — admin panel is built, not Phase 2. Booking endpoint paths, status enum, and reference format corrected throughout. Section 10 phases re-anchored against backend reality.
- **v1.1 (May 2026)** — URL structure updated — German at root (`step-now.de/`), English at `/en/` (no `/de/` prefix)

---

## 0. Foundational architecture

### 0.1 Language strategy

- **URL structure:**
  - German (default, primary): `step-now.de/` — no language prefix in URL
  - English: `step-now.de/en/` — `/en/` prefix on all paths
  - Examples:
    - DE homepage: `step-now.de/`
    - EN homepage: `step-now.de/en/`
    - DE service: `step-now.de/dienstleistungen/flughafentransfer`
    - EN service: `step-now.de/en/services/airport-transfer`
    - DE pricing: `step-now.de/preise`
    - EN pricing: `step-now.de/en/pricing`
- **Why German at root:**
  - SEO: Google's German index expects the primary German domain content at the root
  - User expectation: a German visitor typing `step-now.de` should see German immediately, no redirect flicker
  - Backlinks: future links pointing to `step-now.de/` resolve directly to German content
- **First-visit detection:**
  - Middleware checks `Accept-Language` HTTP header on first visit
  - If primary language is German (de, de-DE, de-AT, de-CH) → serve root (German)
  - Otherwise → 302 redirect to `/en/`
  - This runs ONCE — once cookie `stepnow_locale` is set, middleware respects it
- **Manual switching:**
  - Language switcher in header/footer always visible
  - Clicking sets cookie `stepnow_locale` (1-year expiry, SameSite=Lax, secure)
  - Switcher maps current path to the other language's equivalent path (uses route mapping table)
- **`hreflang` tags:** Every page emits both alternates plus `x-default`:
  ```html
  <link rel="alternate" hreflang="de" href="https://step-now.de/preise" />
  <link rel="alternate" hreflang="en" href="https://step-now.de/en/pricing" />
  <link rel="alternate" hreflang="x-default" href="https://step-now.de/preise" />
  ```
- **Canonical URLs:** Every page has a self-referencing `<link rel="canonical">` to avoid duplicate-content issues
- **Translation completeness:** Every user-facing string in both languages. No mixed-language pages. If a translation is missing, fall back to German with a console warning (development) — never show `[translation_key]` to users
- **Legal binding:** German version is legally authoritative for Impressum / Datenschutz / AGB. English versions display a banner: "This is a translation for convenience. The German version is legally binding."

### 0.1.1 Next.js i18n implementation

The Next.js App Router doesn't ship with built-in i18n for the root-vs-prefixed pattern, so we implement it via:

**Folder structure (app router):**
```
app/
├─ (public)/                       # German route group, served at root
│  ├─ layout.tsx                   # German root layout
│  ├─ page.tsx                     # German homepage (/)
│  ├─ dienstleistungen/
│  │  ├─ page.tsx                  # /dienstleistungen
│  │  └─ [slug]/page.tsx           # /dienstleistungen/{slug}
│  ├─ preise/page.tsx              # /preise
│  ├─ ueber-uns/page.tsx           # /ueber-uns
│  ├─ kontakt/page.tsx             # /kontakt
│  ├─ buchen/page.tsx              # /buchen
│  ├─ impressum/page.tsx           # /impressum
│  ├─ datenschutz/page.tsx         # /datenschutz
│  └─ agb/page.tsx                 # /agb
│
└─ en/
   ├─ layout.tsx                   # English layout
   ├─ page.tsx                     # /en
   ├─ services/
   │  ├─ page.tsx                  # /en/services
   │  └─ [slug]/page.tsx           # /en/services/{slug}
   ├─ pricing/page.tsx             # /en/pricing
   ├─ about/page.tsx               # /en/about
   ├─ contact/page.tsx             # /en/contact
   ├─ book/page.tsx                # /en/book
   ├─ legal-notice/page.tsx        # /en/legal-notice
   ├─ privacy/page.tsx             # /en/privacy
   └─ terms/page.tsx               # /en/terms
```

**Middleware (`middleware.ts`):**
```typescript
// Pseudocode
export function middleware(request) {
  const cookie = request.cookies.get('stepnow_locale')
  const path = request.nextUrl.pathname
  const isEnglishPath = path.startsWith('/en')

  // Respect cookie if set
  if (cookie?.value === 'en' && !isEnglishPath) {
    return NextResponse.redirect(new URL('/en' + path, request.url))
  }
  if (cookie?.value === 'de' && isEnglishPath) {
    return NextResponse.redirect(new URL(path.replace(/^\/en/, '') || '/', request.url))
  }

  // First visit, no cookie — detect language
  if (!cookie) {
    const acceptLang = request.headers.get('accept-language') || ''
    const prefersGerman = acceptLang.startsWith('de')
    if (!prefersGerman && !isEnglishPath) {
      return NextResponse.redirect(new URL('/en' + path, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|sitemap.xml|robots.txt).*)']
}
```

**UI string resolution:**

UI strings are NOT stored in JSON files. They are fetched at render time from `GET /api/v0/public/ui-strings?locale=de` and provided to all components via a React context. See `docs/architecture/frontend.md` §10.3 for the full mechanism.

**Route mapping** (for the language switcher to map equivalent paths):
```typescript
const ROUTE_MAP = {
  '/': '/en',
  '/dienstleistungen': '/en/services',
  '/dienstleistungen/flughafentransfer': '/en/services/airport-transfer',
  '/dienstleistungen/krankenhausfahrten': '/en/services/hospital-transport',
  '/dienstleistungen/schuelerbefoerderung': '/en/services/school-transport',
  '/dienstleistungen/shuttle-service': '/en/services/shuttle-service',
  '/preise': '/en/pricing',
  '/ueber-uns': '/en/about',
  '/kontakt': '/en/contact',
  '/buchen': '/en/book',
  '/impressum': '/en/legal-notice',
  '/datenschutz': '/en/privacy',
  '/agb': '/en/terms',
}
// Plus reverse map for EN → DE
```

For service detail pages, the slug pair is read from the `services` row (`slug_de`, `slug_en`) and passed dynamically to the language switcher.

### 0.2 Static vs. dynamic content split (revised)

This table reflects the actual backend build. Everything textual is in the database — including UI labels and legal pages — and Naeem can edit it all via the admin panel, protected by backend safeguards.

| Content type | Storage | Editable by |
|---|---|---|
| Page structure & section order | Code (Next.js components) | Developer |
| Visual design tokens (colors, fonts, spacing) | Code (Tailwind config) | Developer |
| Site-wide UI strings (button labels, errors, nav, hero copy) | Database (`ui_strings` table) | Naeem (admin panel, with `is_locked` protection on critical strings) |
| Services list & descriptions | Database (`services` table) | Naeem (admin panel) |
| Pricing categories & line items | Database (`pricing_categories`, `pricing_items` tables) | Naeem (admin panel) |
| Fleet vehicles | Database (`vehicles` table) | Naeem (admin panel) |
| FAQ entries | Database (`faqs` table) | Naeem (admin panel) |
| Testimonials | Database (`testimonials` table) | Naeem (admin panel — initials-only per DSGVO) |
| Site settings (phone, hours, address, concession, etc.) | Database (`site_settings` singleton row) | Naeem (admin panel — with `RequiredFieldError` protection on legally-required fields per § 5 TMG) |
| Legal pages (Impressum, Datenschutz, AGB) | Database (`legal_pages` + `legal_page_versions` tables) | Naeem (admin panel — with draft → preview → publish → rollback workflow, every change versioned and audited) |
| Booking submissions | Database (`booking_requests` table) | Naeem (read + status update + soft delete) |
| Contact submissions | Database (`contact_messages` table) | Naeem (read + mark-handled + soft delete) |
| Audit log of all changes | Database (`audit_log` table, append-only) | Naeem (read-only via `/admin/audit-log`) |

**Why legal pages moved from "code-only" to "DB with workflow":**

The original v1.0 plan kept legal pages as MDX files for safety. During the backend build, that approach was replaced with a versioned DB workflow because (a) Naeem needs to update the concession number, address, phone, and operating hours over time without a developer in the loop, and (b) legal-binding text changes (e.g. new privacy clauses after a third-party integration) shouldn't require a deploy. The safety concerns are addressed by:

1. **Draft → preview → publish** — no edit goes live until explicitly published.
2. **Append-only versioning** — every published version is stored forever; rollback is a single click.
3. **Placeholder whitelist** — only `{site_settings.<field>}` placeholders from a fixed list are accepted, preventing arbitrary template injection.
4. **Non-blocking warning banner** in the editor reminding Naeem that legal changes have consequences.
5. **Audit log** captures every draft save, publish, and rollback with timestamp and actor.
6. **Daily DB backups** make recovery from any catastrophe possible within 24 hours.

### 0.3 Database schema overview

The full schema is documented in the backend Alembic migration at `apps/backend/alembic/versions/05789571f56d_0001_initial_schema.py` and in the SQLAlchemy models at `apps/backend/app/Models/`. Sixteen tables total:

| Table | Purpose |
|---|---|
| `admin_users` | Admin authentication (currently single user — Naeem) |
| `refresh_tokens` | JWT refresh token hashes |
| `audit_log` | Append-only record of every mutation across the system |
| `site_settings` | Singleton row at `id=1` with business name, address, phone, hours, concession, social links |
| `ui_strings` | Per-key bilingual strings with namespace + `is_locked` protection |
| `services` | The four service types (Flughafentransfer, etc.) with bilingual slugs and SEO fields |
| `pricing_categories` | Pricing groups bound to a service |
| `pricing_items` | Individual line items (from → to + price) under a category |
| `vehicles` | Fleet vehicles with PostgreSQL `ARRAY` features in both languages |
| `faqs` | Q&A entries grouped by category |
| `testimonials` | Customer testimonials (initials-only authorship per DSGVO) |
| `legal_pages` | Current published version + draft for each legal slug |
| `legal_page_versions` | Append-only history of every published version |
| `booking_requests` | Public bookings with status lifecycle and reference numbers `SN-YYYYMMDD-XXXXXX` |
| `contact_messages` | Public contact form submissions with is_handled flag |
| `email_logs` | Sent-email audit trail (provider response, recipient, timestamp) |

**Cross-cutting columns** present on most tables: `created_at`, `updated_at` (TimestampMixin), `is_deleted`, `deleted_at`, `deleted_by` (SoftDeleteMixin).

For the precise column list per table, run `alembic upgrade head` against a local Postgres and inspect with `\d table_name`, or read the model files directly.

### 0.4 Admin panel — built and operational

The admin panel is built. It lives at `/admin` in the Next.js app and consumes 33 dedicated admin endpoints from the FastAPI backend.

**Admin sections** (German-only UI — Naeem's language):

| Section | Path | Purpose |
|---|---|---|
| Dashboard | `/admin` | Snapshot — new bookings, recent contact messages, recent audit entries |
| Stammdaten | `/admin/settings` | Business name, address, phone, email, opening hours, concession, social links, tax/VAT IDs |
| UI-Texte | `/admin/ui-strings` | Every translatable UI string. Filter by namespace. `is_locked` strings are read-only until explicitly unlocked. |
| Dienstleistungen | `/admin/services` | Service titles, descriptions, slugs (both languages), hero images, SEO meta |
| Preise | `/admin/pricing` | Pricing categories per service + items per category. Decimal prices with 2-place precision. |
| Fahrzeuge | `/admin/vehicles` | Fleet vehicles with capacity numbers and feature arrays |
| FAQ | `/admin/faqs` | Q&A entries grouped by category |
| Kundenstimmen | `/admin/testimonials` | Testimonials with rating, role, date (initials-only per DSGVO) |
| Rechtliche Seiten | `/admin/legal-pages` | Impressum, Datenschutz, AGB — draft → preview → publish workflow with full version history and one-click rollback |
| Buchungen | `/admin/bookings` | Booking requests with six-state lifecycle (new → contacted → quoted → confirmed → completed / cancelled), auto-stamped timestamps |
| Kontaktnachrichten | `/admin/contact-messages` | Contact submissions with mark-handled and internal notes |
| Verlauf | `/admin/audit-log` | Read-only timeline of every change: who edited what, when, before/after diff |
| Papierkorb | `/admin/trash` | Soft-deleted items from every resource, one-click restore |

**Auth:** JWT bearer tokens with refresh. Login at `/admin/login`. Access tokens stored in `sessionStorage` (cleared on tab close). All admin routes gated server-side at the FastAPI level — frontend route guards are UX only.

**Architectural safeguards** baked into the backend that the admin UI relies on:
- Audit log on every mutation
- Soft delete only (no hard delete in UI)
- `RequiredFieldError` returns a 400 with localized DE message for any attempt to clear a legally-required field on `site_settings`
- Legal pages cannot be edited directly — only via the draft → publish workflow
- `is_locked` UI strings cannot be modified or deleted until explicitly unlocked
- Pricing items inherit soft-delete state from their category for the public read

### 0.5 SEO baseline (applies to every page)

- `<title>` and `<meta description>` per page, per language
- Open Graph tags (og:title, og:description, og:image)
- Structured data:
  - `LocalBusiness` schema on homepage and contact page (built from `/api/v0/public/settings`)
  - `Service` schema on each service detail page
  - `BreadcrumbList` schema everywhere
  - `FAQPage` schema on pages with FAQ
- Sitemap: `/sitemap.xml` (auto-generated, lists both DE and EN URLs from `/api/v0/public/services`)
- Robots: `/robots.txt` (allow all, point to sitemap)

---

## 1. Homepage — `/` (DE) and `/en/` (EN)

### Purpose
First impression. 5 seconds to communicate: legitimate, premium, reliable, easy to book.

### Sections (top to bottom)

#### 1.1 Header (global — on every page)

Content: **Static structure, dynamic site settings from `/api/v0/public/settings`**

- Logo (left)
- Navigation (center on desktop, hamburger on mobile):
  - Startseite / Home
  - Dienstleistungen / Services (dropdown on hover → 4 service items)
  - Preise / Pricing
  - Über uns / About
  - Kontakt / Contact
- Language switcher (right): DE | EN, current language bold
- Phone CTA (right, prominent): `{site_settings.phone}` — clickable `tel:` link
- "Jetzt buchen" / "Book now" button (rightmost, gold accent)

Sticky on scroll, with subtle shadow once scrolled.

#### 1.2 Hero

Content: **Static (UI strings from `ui_strings` table)**

- Background: deep black (#0A0A0A) with optional subtle atmospheric image (Stuttgart skyline at twilight, or autobahn at night — stock, dark overlay)
- Pre-heading (small, uppercase, gold, letter-spaced): `IHRE TAXI-ALTERNATIVE / YOUR TAXI ALTERNATIVE`
- Main heading (large serif, 64-80px desktop):
  - DE: "Sicher, pünktlich, zum Festpreis."
  - EN: "Safe, on time, fixed price."
- Subheadline (sans, 20px):
  - DE: "Vorbestellte Fahrten in der Region Stuttgart. Konzessioniert nach § 49 PBefG."
  - EN: "Pre-booked transfers in the Stuttgart region. Licensed under § 49 PBefG."
- Two CTAs side-by-side:
  - Primary (gold): "Jetzt buchen" / "Book now" → `/buchen` or `/en/book`
  - Secondary (outline): `{site_settings.phone}` — `tel:` link
- Below CTAs, small trust strip: `Konzessioniert · Festpreis-Garantie · 24/7 buchbar`

**Reference:** Aesop product page hero (typography-driven), Blacklane homepage hero (composition only — not the photography)

#### 1.3 Trust strip (icons + short labels, single row)

Content: **Static (UI strings)**

Four items, evenly spaced:

| Icon | DE label | EN label |
|---|---|---|
| Shield-check | Konzessioniert nach PBefG | Licensed under PBefG |
| Euro-tag | Festpreis vor Fahrtbeginn | Fixed price before departure |
| User-check | Geprüfte, erfahrene Fahrer | Verified, experienced drivers |
| Clock | 24/7 vorbestellbar | 24/7 pre-bookable |

Light background (#F8F6F1), small icons in gold, restrained typography.

**Reference:** Stripe homepage trust strips, Carey homepage credentials section

#### 1.4 Services section

Content: **Database — `GET /api/v0/public/services?locale=de`**

Heading: "Unsere Leistungen" / "Our Services"
Subheading: "Vier spezialisierte Transportdienstleistungen — alle vorbestellt, alle zum Festpreis."

Grid of 4 service cards (2x2 desktop, 1x4 mobile). Each card:
- Icon (from `services.icon`, Lucide name)
- Title (`title` — flattened from `title_de`/`title_en` based on locale)
- Short description (`short_description`)
- "Mehr erfahren →" / "Learn more →" link to `/dienstleistungen/{slug}` (DE) or `/en/services/{slug}` (EN)

Services to display (where `active=true` AND `is_deleted=false`, ordered by `sort_order`):
1. Flughafentransfer / Airport Transfer
2. Krankenhausfahrten / Hospital Transport
3. Schülerbeförderung / School Transport
4. Shuttle Service

**Reference:** MyDriver service grid, Carey service categories

#### 1.5 How it works (3-step process)

Content: **Static (UI strings)**

Heading: "So einfach geht's" / "How it works"

Three steps in a horizontal row:

| Step | DE | EN |
|---|---|---|
| 1 | Anfrage senden | Send your request |
| 2 | Festpreis-Bestätigung erhalten | Receive a fixed-price quote |
| 3 | Entspannt ankommen | Arrive relaxed |

Each step: number (large gold serif), short title (serif), 1-sentence description (sans).

#### 1.6 Why StepNow (differentiators)

Content: **Static (UI strings)**

Heading: "Warum StepNow?" / "Why StepNow?"

Two-column layout. Left: a short paragraph of value proposition. Right: bulleted list of 4-5 key differentiators (all DE/EN translated):

- Festpreis statt Taxameter — der Preis steht vor der Fahrt fest
- Vorbestellt statt Glücksspiel — Ihr Fahrer wartet bereits auf Sie
- Konzessioniert und versichert — volle Personenbeförderungs-Haftpflicht
- Persönlicher Service — direkter Kontakt, kein anonymes Callcenter
- Regional verwurzelt — wir kennen die Strecken zwischen Esslingen, Stuttgart und Umgebung

**Reference:** Blacklane "Why Blacklane" section, Hermès tools-for-life sections

#### 1.7 Fleet preview (optional — only if real photos exist)

Content: **Database — `GET /api/v0/public/vehicles?locale=de`**

Heading: "Unsere Fahrzeuge" / "Our Fleet"

Horizontal scrollable row (or 3-up grid on desktop) of vehicle cards. Each card:
- Image (`image_url`) — fallback to placeholder if missing
- Name (`name` — flattened from `name_de`/`name_en`)
- Passenger capacity icon + count
- Luggage capacity icon + count
- 2-3 feature pills (`features` — flattened from `features_de`/`features_en`)

If the vehicles list is empty or has no images, hide this section entirely.

#### 1.8 Booking form (embedded preview)

Content: **Static structure, dynamic service options from `/api/v0/public/services`**

Heading: "Festpreis-Angebot anfordern" / "Request a fixed-price quote"

Simplified version of the full booking form — single screen:
- Service dropdown (options from `/public/services`)
- Pickup location (text input with PLZ field)
- Date + time pickers
- Passenger count
- Name, phone, email
- Privacy checkbox (`consent_dsgvo`) linking to `/datenschutz`
- Submit: "Angebot anfordern" / "Request quote"

Submit options (UX choice — pick one):
- POSTs directly to `/api/v0/public/bookings`, shows success message inline with reference number
- OR redirects to `/buchen` with pre-filled fields (cleaner UX)

#### 1.9 Testimonials (only if real ones exist)

Content: **Database — `GET /api/v0/public/testimonials?locale=de`** (active=true)

Heading: "Was unsere Kunden sagen" / "What our customers say"

Carousel or 3-up grid. Each testimonial:
- Star rating (1-5, optional)
- Quote (`quote`)
- Author name + role (initials only per DSGVO; `author_role` optional)
- Date (optional)

If the testimonials list is empty, **hide the entire section**. Do not show placeholder testimonials.

#### 1.10 FAQ teaser (top 4-5 questions)

Content: **Database — `GET /api/v0/public/faqs?locale=de&category=general`** (top 5 by `sort_order`)

Heading: "Häufige Fragen" / "Frequently Asked Questions"

Accordion: question + collapsible answer. Below the list, link: "Alle Fragen ansehen →" / "View all FAQs →" → `/faq` page (or just lives on homepage if list is small).

#### 1.11 Final CTA section

Content: **Static structure, concession number from `/api/v0/public/settings`**

Full-width dark background section with:
- Heading: "Bereit für Ihre Fahrt?" / "Ready for your ride?"
- Subheading: "Buchen Sie jetzt oder rufen Sie an — wir melden uns innerhalb von 30 Minuten."
- Two CTAs: primary "Jetzt buchen", secondary phone number
- Concession reference text below: "StepNow Rides & Movers · Konzessioniert nach § 49 PBefG · {concession_number}"

#### 1.12 Footer (global — on every page)

Content: **Mostly static, settings from `/api/v0/public/settings`**

Four columns on desktop, stacked on mobile:

**Column 1 — Brand**
- Logo
- Tagline (1 line)
- Social icons (only if real accounts exist — pull from `site_settings.social_*`)

**Column 2 — Schnellzugriff / Quick Links**
- Startseite / Home
- Über uns / About
- Preise / Pricing
- Kontakt / Contact

**Column 3 — Dienstleistungen / Services**
- Flughafentransfer / Airport Transfer
- Krankenhausfahrten / Hospital Transport
- Schülerbeförderung / School Transport
- Shuttle Service

**Column 4 — Kontakt / Contact**
- Address (from `site_settings`)
- Phone (clickable)
- Email (clickable)
- Opening hours (`opening_hours`, locale-flattened)

**Footer bottom strip:**
- Copyright: © 2026 StepNow Rides & Movers
- Legal links: Impressum · Datenschutz · AGB
- Language switcher (duplicate of header)

### SEO

- DE title: "StepNow Rides — Ihre TAXI-Alternative in Stuttgart, Esslingen und Region"
- DE description: "Konzessionierte Mietwagen mit Fahrer in der Region Stuttgart. Vorbestellte Fahrten zum Festpreis. Flughafentransfer, Krankenhausfahrten, Schülerbeförderung und Shuttle Service."
- EN title: "StepNow Rides — Your premium taxi alternative in Stuttgart, Germany"
- EN description: "Licensed pre-booked transfers in the Stuttgart region. Fixed-price airport transfers, hospital transport, school rides, and shuttle services."

---

## 2. Services list page — `/dienstleistungen` (DE) and `/en/services` (EN)

### Purpose
Overview of all four services. Mostly a routing page to detail pages.

### Sections

#### 2.1 Page header

Content: **Static (UI strings)**

- Page title (serif, large): "Unsere Leistungen" / "Our Services"
- Subheading (sans, intro paragraph): "Vier spezialisierte Transportdienstleistungen für Privat- und Geschäftskunden im Raum Stuttgart."

#### 2.2 Service cards (large)

Content: **Database — `GET /api/v0/public/services?locale=de`** (all active)

Each service rendered as a full-width row (alternating left/right layout):
- Left/right (alternating): `hero_image_url`
- Other side: `title` (serif), first paragraph of `long_description` (markdown rendered), CTA: "Mehr zu diesem Service →"

If `hero_image_url` is missing, use a typographic block instead (large service name on dark background with subtle pattern).

#### 2.3 Final CTA

Same as homepage section 1.11.

### SEO

- DE title: "Unsere Leistungen — StepNow Rides & Movers"
- EN title: "Our Services — StepNow Rides & Movers"

---

## 3. Service detail page — `/dienstleistungen/{slug}` (DE) and `/en/services/{slug}` (EN)

### Purpose
Convince a visitor that this specific service is right for them. The SEO foundation of the site.

### Routing

`{slug}` corresponds to a localized slug stored in the `services` table:
- `flughafentransfer` (DE) / `airport-transfer` (EN)
- `krankenhausfahrten` (DE) / `hospital-transport` (EN)
- `schuelerbefoerderung` (DE) / `school-transport` (EN)
- `shuttle-service` (DE/EN identical)

**Implementation:** The DE route handler `/dienstleistungen/[slug]` calls `GET /api/v0/public/services/{slug}?locale=de`. The EN route handler `/en/services/[slug]` calls the same endpoint with `?locale=en`. The backend resolves the right row by matching the slug against `slug_de` or `slug_en` depending on locale. The frontend reads `slug_de` and `slug_en` from the response so the language switcher can construct the correct alternate-language URL.

### Sections

#### 3.1 Breadcrumb

Static. "Startseite > Dienstleistungen > Flughafentransfer" — uses BreadcrumbList schema.

#### 3.2 Page header

Content: **Database — `services.title`, `services.short_description`**

- Service title (serif, very large)
- Short description (sans, 18-20px, 2-3 lines)
- Primary CTA: "Diesen Service buchen" → `/buchen?service={slug}` (pre-fills service in booking flow)
- Service icon (large, gold) in top right or above title

Optional small atmospheric image (stock — airport terminal, hospital exterior, school zone, etc.) — only if it adds atmosphere, not as a focal point.

#### 3.3 Long description / story

Content: **Database — `services.long_description` (markdown)**

Single column, max-width 720px, body type, generous line-height. Naeem writes 400-800 words covering:
- What this service includes
- Who it's for (specific use cases)
- What makes StepNow's version different
- Any specifics (e.g., for airport: flight tracking, meet & greet at terminal, luggage assistance)

Markdown supports headings, lists, bold, links — so Naeem can structure naturally.

#### 3.4 Process — 3 or 4 steps specific to this service

Content: **Static (UI strings, keyed per service)**

Same visual treatment as homepage section 1.5, but content adapted to the service. Example for Flughafentransfer:
1. Buchung mit Flugnummer
2. Wir verfolgen Ihren Flug
3. Fahrer wartet im Terminal
4. Direkte Fahrt zum Ziel

#### 3.5 Inclusions / What's included

Content: **Static (UI strings, keyed per service)**

Two-column list: ✓ items included + ✗ items not included.

Example for Flughafentransfer:
✓ Festpreis garantiert
✓ Flugverfolgung
✓ Meet & Greet im Terminal
✓ 60 Minuten Wartezeit kostenfrei
✓ Gepäckhilfe
✓ Kindersitz auf Anfrage
✗ Mautgebühren (falls anfallend)
✗ Parkgebühren am Abholort

#### 3.6 Pricing snapshot

Content: **Database — `GET /api/v0/public/services/{slug}/pricing?locale=de`**

Table or card layout showing 4-6 sample routes with fixed prices. Each row: from → to, price.

The endpoint returns the full nested tree (categories + items). For the snapshot, take the first category and its first 4-6 items.

Below the table, small note: "Andere Strecken auf Anfrage — Festpreis-Angebot innerhalb von 30 Minuten."

CTA: "Vollständige Preise ansehen" → `/preise`

#### 3.7 Service-specific FAQ

Content: **Database — `GET /api/v0/public/faqs?locale=de&category={service_slug}`**

Accordion. 3-5 questions specific to this service.

#### 3.8 Booking CTA

Content: **Static**

Full-width dark band with: "Bereit für Ihren [Flughafentransfer]?" + primary CTA pre-filling the service.

#### 3.9 Related services

Content: **Database (the other 3 active services from `/public/services`)**

3-up grid showing the other services with mini-cards.

### SEO

Per service. Example for Flughafentransfer (DE):
- title: "Flughafentransfer Stuttgart — Festpreis, vorgebucht — StepNow Rides"
- description: "Zuverlässiger Flughafentransfer zum/vom Flughafen Stuttgart. Festpreis-Garantie, Meet & Greet, Flugverfolgung. Konzessioniert nach PBefG. Jetzt buchen."

The actual title and description come from `services.meta_title_de` / `services.meta_description_de`, fallback to `site_settings.default_meta_title_de` if not set.

Each service page targets specific local + service keywords (e.g., "Flughafentransfer Stuttgart Festpreis", "Krankenfahrt Esslingen Mietwagen", "Schülerbeförderung Stuttgart Mietwagen").

---

## 4. Pricing page — `/preise` (DE) and `/en/pricing` (EN)

### Purpose
Transparent pricing builds trust. Critical for German market — customers don't book without seeing prices.

### Sections

#### 4.1 Page header

Content: **Static (UI strings)**

- Title: "Transparente Festpreise" / "Transparent Fixed Prices"
- Intro paragraph explaining: prices are fixed before the ride, include 19% MwSt, valid for the route shown

#### 4.2 Pricing tables (one per service)

Content: **Database — for each service, `GET /api/v0/public/services/{slug}/pricing?locale=de`**

For each service, render a table:
- Columns: Von / From | Nach / To | Preis / Price | Hinweise / Notes
- Rows from `pricing_items` (flattened locale)
- Visual: clean, restrained, gold accent on totals

Above each table: service name (serif heading) + 1-line description (from the pricing category, e.g. "Stuttgart Flughafen").

The endpoint returns nested categories; render each category as its own sub-section within the service's pricing block.

If a service has no pricing categories or no items, show a placeholder: "Festpreis-Angebot auf Anfrage" with a quote-request CTA.

#### 4.3 What's always included

Content: **Static (UI strings)**

Bulleted list:
- 19% Mehrwertsteuer
- Gepäck (Standard)
- 15 Minuten Wartezeit am Abholort
- Kindersitz auf Anfrage (kostenfrei)

#### 4.4 What's not included

Content: **Static (UI strings)**

Bulleted list:
- Mautgebühren (falls anfallend)
- Parkgebühren am Abholort über 30 Minuten
- Reinigungspauschale bei Verschmutzung

#### 4.5 Payment methods

Content: **Static (UI strings)**

- Barzahlung
- EC-Karte / Girocard (im Fahrzeug)
- Rechnung für Geschäftskunden (mit Vereinbarung)
- PayPal (auf Anfrage)

#### 4.6 Cancellation policy

Content: **Static (UI strings)**

Plain-language explanation of cancellation terms. Brief — full terms in AGB.

#### 4.7 Custom quote CTA

Content: **Static**

Final section with quote-request form (or link to `/buchen`).

### SEO

- DE title: "Preise & Tarife — StepNow Rides & Movers"
- EN title: "Pricing — StepNow Rides & Movers"

---

## 5. About page — `/ueber-uns` (DE) and `/en/about` (EN)

### Purpose
Build trust through transparency about who runs the business.

### Sections

#### 5.1 Page header

Content: **Static (UI strings)**

- Title: "Über StepNow" / "About StepNow"
- Subhead: "Ihr regionaler Mobilitätspartner für vorbestellte Fahrten."

#### 5.2 Naeem's story

Content: **Static text + 1 photo**

Left: Naeem's portrait photo (the one professional phone shot). Right: 3-4 short paragraphs in his voice, covering:
- Who he is, where he's from
- Why he started StepNow
- What he believes about service
- Personal note (family, regional ties)

This is the single most important section for trust. Should feel like reading about a person, not a company.

The story copy lives in `ui_strings` (keys like `about.story.paragraph_1`, etc.) so Naeem can refine it over time without code changes.

#### 5.3 Our values / Principles

Content: **Static (UI strings)**

3-4 principles, each with a heading and short paragraph:
- Verlässlichkeit / Reliability
- Sicherheit / Safety
- Transparenz / Transparency
- Persönlicher Service / Personal Service

#### 5.4 The fleet

Content: **Database — `GET /api/v0/public/vehicles?locale=de`**

Same layout as homepage section 1.7, but full grid showing all active vehicles.

#### 5.5 Credentials & qualifications

Content: **Static + dynamic concession from `/api/v0/public/settings`**

Card layout:
- "Konzession nach § 49 PBefG — Lizenz-Nr. {concession_number} — erteilt durch {concession_authority}"
- Berufskraftfahrer-Qualifikation (BKrFQG)
- Personenbeförderungs-Haftpflichtversicherung
- Mitglied [if applicable: BZP / Taxi-Verband / etc.]

Optional: small images of certificate scans (if Naeem wants to upload).

#### 5.6 Service area

Content: **Static + map**

Description of covered area + interactive map:
- Use **OpenStreetMap with Leaflet** (no DSGVO complications, unlike Google Maps)
- Mark the business location (Blumenstr. 8, Deizisau — from `site_settings`)
- Draw a service radius polygon (e.g., 50km around Deizisau, or specific city list)

#### 5.7 Final CTA

Static. Same pattern as elsewhere.

### SEO

- DE title: "Über uns — StepNow Rides & Movers — Mietwagen mit Fahrer Stuttgart"
- EN title: "About StepNow Rides & Movers — Chauffeur service Stuttgart region"

---

## 6. Contact page — `/kontakt` (DE) and `/en/contact` (EN)

### Purpose
Make it easy to reach StepNow by any channel.

### Sections

#### 6.1 Page header

Content: **Static (UI strings)**

- Title: "Kontakt" / "Contact"
- Subhead: "So erreichen Sie uns."

#### 6.2 Contact methods

Content: **Database — `GET /api/v0/public/settings?locale=de`**

Three large cards or stacked rows:

**Telefon / Phone**
- Number (clickable `tel:` link, from `site_settings.phone`)
- Hours available (from `opening_hours`)

**E-Mail**
- Address (clickable `mailto:` link, from `site_settings.email`)
- Expected response time

**Adresse / Address**
- Business address (from `site_settings.address_*`)
- Opening hours

Optional: WhatsApp link if `site_settings.whatsapp_url` is set.

#### 6.3 Contact form

Content: **Static structure, submits to `/api/v0/public/contact`**

Simple form:
- Name (`name`)
- E-Mail (`email`)
- Phone (`phone`, optional)
- Betreff / Subject (`subject_category` — dropdown: `general` / `booking` / `complaint` / `business` / `other`)
- Nachricht / Message (`message`, textarea)
- Privacy checkbox (`consent_dsgvo`)
- Honeypot field `website` (hidden, must be empty)
- Submit

Submit creates a row in `contact_messages` table (separate from bookings) and sends notification to Naeem in the background. Rate-limited to 5 submissions/minute per IP.

#### 6.4 Map

Content: **Static (OpenStreetMap)**

Embedded Leaflet map showing business address (from `site_settings`).

#### 6.5 FAQ teaser

Same as homepage section 1.10.

### SEO

- DE title: "Kontakt — StepNow Rides & Movers Deizisau"
- EN title: "Contact — StepNow Rides & Movers, Deizisau, Germany"

---

## 7. Booking page — `/buchen` (DE) and `/en/book` (EN)

### Purpose
The conversion page. Turn an intent into a booking request.

### Architecture

Multi-step form on a single page (no full page reloads between steps). Progress indicator at top. Cross-step state lives in Zustand (see `docs/architecture/frontend.md` §14).

### Steps

#### Step 1: Service selection
- Card grid of 4 services (pulled from `/api/v0/public/services`)
- Selection is optional — the form accepts a booking without a specific service set (`service_id` is optional in the backend schema)

#### Step 2: Trip details
- Pickup: `pickup_address` (text, required), `pickup_postcode` (5 digits, optional), `pickup_city` (optional)
- Destination: `destination_address` (required), `destination_postcode` (optional), `destination_city` (optional)
- Date picker + time picker, combined into `requested_datetime` ISO string
- `passenger_count` (1-8)
- `luggage_count` (0-20)

#### Step 3: Special requirements (optional)
- Checkboxes feed into `special_requirements` text (Kindersitz / Rollstuhlgerecht / Tier mitfahren / Sonstiges)
- Free-form textarea: zusätzliche Anmerkungen
- Toggle: Bin ich Geschäftskunde? → reveals `company_name` + `company_vatid` fields, sets `is_business=true`

#### Step 4: Contact info
- `customer_name` (required, min 2 chars)
- `customer_phone` (required, regex `/^[\d\s+\-()]{6,}$/`)
- `customer_email` (required, valid email)
- `consent_dsgvo` checkbox (required, links to `/datenschutz`)
- Optional marketing opt-in (separate flag, default unchecked per DSGVO)
- Hidden honeypot field `website` (must be empty)
- `language` set automatically from the current locale

### Submit handling

POST to `/api/v0/public/bookings` with full JSON body (snake_case fields):

The backend:
1. Validates the schema; honeypot present → returns 201 silently with `reference=null`
2. Inserts a row in `booking_requests` with `status="new"`, generates `reference` as `SN-YYYYMMDD-XXXXXX`
3. Writes an audit log entry
4. Dispatches via BackgroundTasks: confirmation email to customer (in their language) + notification email to Naeem (always in German, includes all details)
5. Returns `{ reference: "SN-...", status: "new", message: "..." }`

Rate-limited to 5 submissions/min per IP. Honeypot trips silently — submission appears to succeed but no row is created and no notifications go out.

### Confirmation screen

- Large checkmark icon
- "Danke! Ihre Anfrage ist eingegangen."
- "Wir melden uns innerhalb von 30 Minuten mit einem Festpreis-Angebot."
- Reference number (e.g. `SN-20260511-AB3F93`)
- CTA: "Zurück zur Startseite" / Back to homepage

### Booking lifecycle (admin view)

For reference — what happens to the booking after submission. Naeem manages the lifecycle in `/admin/bookings`:

```
new → contacted → quoted → confirmed → completed
                    ↓
              cancelled (terminal, can transition from any state)
```

Status transitions auto-stamp timestamps:
- `status="quoted"` auto-sets `quoted_at`
- `status="completed"` auto-sets `completed_at`

Naeem can also set `quoted_price_eur` and `internal_notes` per booking.

### Anti-spam
- Honeypot field `website` (hidden, must be empty)
- Rate limiting per IP (5 submissions per minute, enforced by FastAPI)
- Optional: hCaptcha (DSGVO-friendly, unlike reCAPTCHA) — only if spam becomes a problem

### SEO

Pages 7-9 should have `noindex` since they're transactional, not content.

---

## 8. Legal pages

All legal pages render via `GET /api/v0/public/legal-pages/{slug}?locale=de`. The backend resolves placeholder syntax `{site_settings.field_name}` server-side from the live `site_settings` row, so when Naeem updates the concession number or address in `/admin/settings`, every legal page reflects it immediately.

Naeem edits legal pages via the workflow at `/admin/legal-pages/{slug}`:

1. **Load draft** — clicking "Bearbeiten" opens the bilingual markdown editor with the current draft. If no draft exists, one is created from the latest published version.
2. **Edit + save** — the draft is saved on each "Speichern" click without affecting the published version.
3. **Preview** — "Vorschau" renders the draft using the actual public template at `/admin/legal-pages/{slug}/preview`.
4. **Publish** — "Veröffentlichen" promotes the draft to published, writes a new immutable row to `legal_page_versions`, and updates the public-facing render within the cache TTL (5–10 minutes).
5. **Rollback** — at `/admin/legal-pages/{slug}/versions`, every past version is listed with a "Wiederherstellen" button that creates a NEW version copying the chosen historical one (the historical row is never mutated — append-only).

A non-blocking warning banner at the top of the editor reminds Naeem that legal-page changes have legal consequences. The audit log captures every save, publish, and rollback.

### 8.1 Impressum — `/impressum` (DE) and `/en/legal-notice` (EN)

Content: **Database — `GET /api/v0/public/legal-pages/impressum?locale=de`**

Initial content seeded from `docs/legal/impressum-de.md` and `docs/legal/impressum-en.md`. German is legally binding; English shows a banner.

Concession number, business name, phone, etc. come from `site_settings` via placeholders, so they update without re-editing the page body.

### 8.2 Datenschutzerklärung — `/datenschutz` (DE) and `/en/privacy` (EN)

Content: **Database — `GET /api/v0/public/legal-pages/datenschutz?locale=de`**

Initial content seeded from `docs/legal/datenschutz-de.md`. Updated for actually-deployed third-party services (Postmark, Plausible, OpenStreetMap).

### 8.3 AGB — `/agb` (DE) and `/en/terms` (EN)

Content: **Database — `GET /api/v0/public/legal-pages/agb?locale=de`**

To be drafted before launch. If not yet drafted, the legal page slug shows a placeholder body: "AGB werden derzeit erarbeitet. Bei Fragen kontaktieren Sie uns bitte direkt."

### SEO

All legal pages: `noindex` (not for SEO).

---

## 9. 404 page

Content: **Static (UI strings with critical-string fallbacks)**

- "Seite nicht gefunden / Page not found"
- Friendly explanation
- Links back to homepage, services, contact

The 404 page text uses `is_locked` UI strings (`404.heading`, `404.cta`, etc.) with code-level fallbacks (see `docs/architecture/frontend.md` §10.4) so the page renders even if `ui_strings` returns nothing.

---

## 10. Implementation phases

### ✅ Phase 0 — Documentation & planning (complete)
- Architecture docs (backend, frontend)
- Website outline (this doc)
- Design direction
- Legal page drafts (Impressum DE/EN, Datenschutz DE)
- Triage checklist for live site

### ✅ Phase 1 — Backend foundation (complete)
- Repo set up, monorepo structure on GitHub
- Database schema — 16 tables, Alembic migration deploys cleanly
- All 51 API endpoints implemented and validated end-to-end against real Postgres
- Authentication (JWT + refresh tokens, bcrypt password hashing)
- Audit log (append-only, every mutation tracked)
- Soft delete + restore on every content resource
- All seven architectural safeguards in place (audit, soft-delete, required-field validation, legal-page versioning, preview-before-publish, daily-backup-ready, warning-banner-ready)

### Phase 2 — Frontend foundation (next)
- Next.js 14 App Router scaffolding at `apps/frontend/`
- Tailwind config with design tokens from `docs/design-direction.md`
- Self-hosted fonts via `next/font` (DSGVO)
- i18n middleware + cookie handling
- `t()` helper backed by `/api/v0/public/ui-strings`
- Tier 1 component library (Button, Input, etc.)
- Tier 2 shared components (Header, Footer, LanguageSwitcher)
- Service layer + API client with snake_case types

### Phase 3 — Public content pages
- Homepage (all sections from §1)
- Services list + 4 service detail pages
- About page
- Contact page (with form submission to `/api/v0/public/contact`)
- Pricing page (per-service tables from `/api/v0/public/services/{slug}/pricing`)
- Legal pages rendering from `/api/v0/public/legal-pages/{slug}`

### Phase 4 — Booking flow
- Multi-step booking form (Zustand store + RHF + Zod)
- Submit to `/api/v0/public/bookings`
- Confirmation screen with reference number
- Anti-spam (honeypot + rate-limit)

### Phase 5 — Admin panel
- Login (`/admin/login`) → JWT in sessionStorage
- All 14 admin sections (see §0.4)
- Bilingual edit forms
- Draft → preview → publish flow for legal pages
- Status lifecycle UI for bookings
- Trash + restore

### Phase 6 — Operational
- Real email provider (Postmark or Resend) — replace `EmailService` log-only stub
- Seed scripts: `seed_site_settings.py`, `seed_legal_pages.py`, `seed_ui_strings.py`
- nginx config + systemd service files
- Daily pg_dump cron job
- Plausible analytics
- Cutover from current step-now.de

### Phase 7 — Polish & launch
- SEO meta on all pages
- Structured data (LocalBusiness, Service, BreadcrumbList, FAQPage)
- Sitemap, robots
- Lighthouse pass (target 90+ on public pages)
- Cross-browser, mobile testing
- Legal review of legal pages
- Real fleet photos + actual prices uploaded via admin
- Real testimonials gathered with author consent

### Content from Naeem (blocking the launch, not the build)
- Real concession number, authority, and grant date (PBefG)
- USt-IdNr / Steuernummer
- Real fleet list — vehicles, capacities, features
- Actual prices — at least 5-10 sample routes per service
- Opening hours — phone hours and ride hours
- Service area boundaries — exact postcodes or city list covered
- Driver qualifications — what specific badges/qualifications to highlight
- Real testimonials — at least 3 to start
- Naeem's portrait + 2 vehicle photos

The Phase 1 backend can run with placeholder content; the frontend can be built and tested against placeholders too. But the **launch** depends on these items.

---

## 11. Cross-page references — reusable component library

These appear across multiple pages and are built as shared components (see `docs/architecture/frontend.md` §6 for tier discipline):

| Component | Used on pages | Tier |
|---|---|---|
| `<Header>` | All | shared |
| `<Footer>` | All | shared |
| `<LanguageSwitcher>` | Header, footer | shared |
| `<HeroCTAButtons>` | Homepage, service pages, about | features/home |
| `<TrustStrip>` | Homepage, service pages | shared |
| `<ServiceCard>` (small) | Homepage, footer | features/services |
| `<ServiceListItem>` (large, alternating layout) | Services list page | features/services |
| `<ProcessSteps>` (3-step layout) | Homepage, service pages | shared |
| `<VehicleCard>` | Homepage, about page | features/vehicles |
| `<TestimonialCard>` | Homepage, about | features/home |
| `<FAQAccordion>` | Homepage, service pages, contact | shared |
| `<BookingFormEmbedded>` (single screen) | Homepage | features/booking |
| `<BookingWizard>` (multi-step) | Booking page | features/booking |
| `<PricingTable>` | Pricing page, service pages | features/pricing |
| `<LeafletMap>` | Contact, about | shared |
| `<FinalCTABand>` | Homepage, service pages, about | shared |
| `<Breadcrumb>` | All non-homepage pages | shared |
| `<Markdown>` | Service descriptions, FAQ answers, legal pages | shared |

All components are bilingual-aware: receive locale as prop, render correct language fields.

---

## 12. Visual reference quick links by page

| Page | Primary inspiration | Secondary |
|---|---|---|
| Homepage hero | Aesop product pages, Blacklane composition | Carey homepage |
| Homepage services | Linear features grid | MyDriver service grid |
| Homepage trust strip | Stripe trust signals | Vercel testimonial strip |
| Homepage process | Blacklane "How it works" | Uber How it works |
| Service detail | Blacklane individual service pages | Booking.com property pages (info hierarchy) |
| Pricing | Linear pricing page (restraint) | Stripe pricing |
| About | Hermès "About" sections | Aesop story pages |
| Contact | Apple Store contact pages (simplicity) | Stripe contact |
| Booking | Blacklane multi-step booking | Lufthansa booking (clarity) |

All references are calibration only — none are to be cloned. The point is to study how premium services handle each pattern. Full visual direction in `docs/design-direction.md`.

---

## 13. Open decisions before launch

These need answers from Naeem (with you as translator) before launch:

1. **Concession number, authority, and grant date** — for Impressum and About page credentials
2. **USt-IdNr / Steuernummer** — for Impressum
3. **Real fleet list** — vehicles, capacities, features (entered in `/admin/vehicles`)
4. **Actual prices** — at least 5-10 sample routes per service (entered in `/admin/pricing`)
5. **Opening hours** — phone hours and ride hours (entered in `/admin/settings`)
6. **Service area boundaries** — exact postcodes or city list covered
7. **Driver qualifications** — what specific badges/qualifications to highlight on the About page
8. **Real testimonials** — at least 3 to start (entered in `/admin/testimonials` with author consent)
9. **Booking lead time** — minimum advance booking time (becomes a `ui_strings` entry)
10. **Naeem's portrait + 2 vehicle photos** — for hero and About page

Without items 1–10, the site can be built and deployed with placeholders or empty states (the Phase 5 admin allows Naeem to fill them in himself once content is ready). Items 1–3 are blocking for legal/trust reasons. Items 4–10 are quality-degrading but not blocking.
