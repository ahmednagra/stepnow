# StepNow Rides & Movers — Detailed Website Outline

**Version:** 1.1 (May 2026)
**Purpose:** Page-by-page specification for the rebuild
**Tech stack:** Next.js 14+ (App Router) + FastAPI + Postgres, bilingual (DE at root, EN at /en/), database-driven content with admin panel
**Changelog v1.1:** URL structure updated — German at root (`step-now.de/`), English at `/en/` (no `/de/` prefix)

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
├─ layout.tsx                    # German root layout
├─ page.tsx                      # German homepage (/)
├─ dienstleistungen/
│  ├─ page.tsx                   # /dienstleistungen
│  └─ [slug]/page.tsx            # /dienstleistungen/{slug}
├─ preise/page.tsx               # /preise
├─ ueber-uns/page.tsx            # /ueber-uns
├─ kontakt/page.tsx              # /kontakt
├─ buchen/page.tsx               # /buchen
├─ impressum/page.tsx            # /impressum
├─ datenschutz/page.tsx          # /datenschutz
├─ agb/page.tsx                  # /agb
│
└─ en/
   ├─ layout.tsx                 # English layout
   ├─ page.tsx                   # /en
   ├─ services/
   │  ├─ page.tsx                # /en/services
   │  └─ [slug]/page.tsx         # /en/services/{slug}
   ├─ pricing/page.tsx           # /en/pricing
   ├─ about/page.tsx             # /en/about
   ├─ contact/page.tsx           # /en/contact
   ├─ book/page.tsx              # /en/book
   ├─ legal-notice/page.tsx      # /en/legal-notice
   ├─ privacy/page.tsx           # /en/privacy
   └─ terms/page.tsx             # /en/terms
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

**Translation files (`lib/i18n/`):**
```
lib/i18n/
├─ de.json          # German strings (single file or split by feature)
├─ en.json          # English strings
└─ index.ts         # Translation helper: t(key, locale)
```

For DB-sourced content, the locale is passed into queries and the helper picks the `_de` or `_en` field.

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

### 0.2 Static vs. dynamic content split

| Content type | Storage | Editable by |
|---|---|---|
| Page structure & section order | Code (Next.js components) | Developer |
| Hero copy & section headlines | Code (i18n JSON files) | Developer |
| Services list & descriptions | Database | Naeem (admin panel) |
| Pricing tiers & line items | Database | Naeem (admin panel) |
| Fleet vehicles | Database | Naeem (admin panel) |
| FAQ entries | Database | Naeem (admin panel) |
| Testimonials | Database | Naeem (admin panel — moderated) |
| Site settings (phone, hours, etc.) | Database (singleton config) | Naeem (admin panel) |
| Booking submissions | Database | Naeem (read-only history) |
| Legal pages (Impressum, Datenschutz, AGB) | Code (MDX files) | Developer only — too sensitive |

### 0.3 Database schema overview

```
Site Configuration
├─ site_settings (singleton)
│  ├─ phone, email, address, opening_hours_*
│  ├─ social_facebook, social_instagram, etc.
│  └─ concession_number, concession_authority
│
Services
├─ services
│  ├─ id, icon, sort_order, active
│  ├─ slug_de, slug_en (e.g., "flughafentransfer" / "airport-transfer")
│  ├─ title_de, title_en
│  ├─ short_description_de, short_description_en
│  ├─ long_description_de (markdown), long_description_en (markdown)
│  ├─ hero_image_url, og_image_url
│  ├─ meta_title_de, meta_title_en
│  └─ meta_description_de, meta_description_en
│
Pricing
├─ pricing_categories
│  ├─ id, service_id (FK), sort_order
│  ├─ name_de, name_en
│  ├─ description_de, description_en
│  └─ items (one-to-many)
├─ pricing_items
│  ├─ id, category_id (FK)
│  ├─ from_location_de, from_location_en (e.g., "Esslingen", "Stuttgart City")
│  ├─ to_location_de, to_location_en (e.g., "Flughafen Stuttgart")
│  ├─ price_eur (decimal)
│  └─ note_de, note_en (e.g., "Festpreis inkl. MwSt.")
│
Fleet
├─ vehicles
│  ├─ id, sort_order, active
│  ├─ name_de, name_en (e.g., "Mercedes V-Klasse")
│  ├─ category (sedan / van / accessible)
│  ├─ capacity_passengers, capacity_luggage
│  ├─ features_de (array), features_en (array)
│  └─ image_url
│
Testimonials
├─ testimonials
│  ├─ id, sort_order, active, source (manual / google_review_id)
│  ├─ author_name (first name + initial only — DSGVO)
│  ├─ author_role_de, author_role_en (optional)
│  ├─ quote_de, quote_en
│  ├─ rating (1-5)
│  └─ date_given
│
FAQ
├─ faqs
│  ├─ id, sort_order, active, category (general / booking / pricing / vehicles)
│  ├─ question_de, question_en
│  └─ answer_de (markdown), answer_en (markdown)
│
Bookings
├─ booking_requests
│  ├─ id, created_at, status (new / quoted / accepted / declined / completed)
│  ├─ service_id (FK)
│  ├─ pickup_address, pickup_postcode, pickup_city
│  ├─ destination_address, destination_postcode, destination_city
│  ├─ requested_datetime (UTC)
│  ├─ passenger_count, luggage_count
│  ├─ special_requirements (text)
│  ├─ customer_name, customer_phone, customer_email
│  ├─ is_business (bool), company_name, company_vatid
│  ├─ language (de / en)
│  ├─ ip_address (logged for fraud), user_agent
│  └─ internal_notes (Naeem's private notes)
```

### 0.4 Admin panel scope (Phase 2 — not Phase 1)

Naeem gets a simple admin at `/admin` (FastAPI + a lightweight admin like Filament-style or SQLAdmin) with:
- Dashboard: new booking requests, weekly totals
- CRUD for services, pricing, vehicles, FAQ, testimonials
- View bookings, change status, add internal notes
- Edit site settings (phone, address, hours, social links)

Admin is German-only (Naeem's language).

### 0.5 SEO baseline (applies to every page)

- `<title>` and `<meta description>` per page, per language
- Open Graph tags (og:title, og:description, og:image)
- Structured data:
  - `LocalBusiness` schema on homepage and contact page
  - `Service` schema on each service detail page
  - `BreadcrumbList` schema everywhere
  - `FAQPage` schema on pages with FAQ
- Sitemap: `/sitemap.xml` (auto-generated, lists both DE and EN URLs)
- Robots: `/robots.txt` (allow all, point to sitemap)

---

## 1. Homepage — `/` (DE) and `/en/` (EN)

### Purpose
First impression. 5 seconds to communicate: legitimate, premium, reliable, easy to book.

### Sections (top to bottom)

#### 1.1 Header (global — on every page)

Content: **Static**

- Logo (left)
- Navigation (center on desktop, hamburger on mobile):
  - Startseite / Home
  - Dienstleistungen / Services (dropdown on hover → 4 service items)
  - Preise / Pricing
  - Über uns / About
  - Kontakt / Contact
- Language switcher (right): DE | EN, current language bold
- Phone CTA (right, prominent): `+49 7153 9292841` — clickable `tel:` link
- "Jetzt buchen" / "Book now" button (rightmost, gold accent)

Sticky on scroll, with subtle shadow once scrolled.

#### 1.2 Hero

Content: **Static (code-controlled)**

- Background: deep black (#0A0A0A) with optional subtle atmospheric image (Stuttgart skyline at twilight, or autobahn at night — stock, dark overlay)
- Pre-heading (small, uppercase, gold, letter-spaced): `IHRE TAXI-ALTERNATIVE / YOUR TAXI ALTERNATIVE`
- Main heading (large serif, 64-80px desktop):
  - DE: "Sicher, pünktlich, zum Festpreis."
  - EN: "Safe, on time, fixed price."
- Subheadline (sans, 20px):
  - DE: "Vorbestellte Fahrten in der Region Stuttgart. Konzessioniert nach § 49 PBefG."
  - EN: "Pre-booked transfers in the Stuttgart region. Licensed under § 49 PBefG."
- Two CTAs side-by-side:
  - Primary (gold): "Jetzt buchen" / "Book now" → `/buchen` or `/book`
  - Secondary (outline): "+49 7153 9292841" — `tel:` link
- Below CTAs, small trust strip: `Konzessioniert · Festpreis-Garantie · 24/7 buchbar`

**Reference:** Aesop product page hero (typography-driven), Blacklane homepage hero (composition only — not the photography)

#### 1.3 Trust strip (icons + short labels, single row)

Content: **Static**

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

Content: **Database (services table)**

Heading: "Unsere Leistungen" / "Our Services"
Subheading: "Vier spezialisierte Transportdienstleistungen — alle vorbestellt, alle zum Festpreis."

Grid of 4 service cards (2x2 desktop, 1x4 mobile). Each card:
- Icon (from services.icon, Lucide name)
- Title (from services.title_*)
- Short description (from services.short_description_*)
- "Mehr erfahren →" / "Learn more →" link to `/dienstleistungen/{slug}` (DE) or `/en/services/{slug}` (EN)

Services to display (active=true, ordered by sort_order):
1. Flughafentransfer / Airport Transfer
2. Krankenhausfahrten / Hospital Transport
3. Schülerbeförderung / School Transport
4. Shuttle Service

**Reference:** MyDriver service grid, Carey service categories

#### 1.5 How it works (3-step process)

Content: **Static**

Heading: "So einfach geht's" / "How it works"

Three steps in a horizontal row:

| Step | DE | EN |
|---|---|---|
| 1 | Anfrage senden | Send your request |
| 2 | Festpreis-Bestätigung erhalten | Receive a fixed-price quote |
| 3 | Entspannt ankommen | Arrive relaxed |

Each step: number (large gold serif), short title (serif), 1-sentence description (sans).

#### 1.6 Why StepNow (differentiators)

Content: **Static**

Heading: "Warum StepNow?" / "Why StepNow?"

Two-column layout. Left: a short paragraph of value proposition. Right: bulleted list of 4-5 key differentiators (all DE/EN translated):

- Festpreis statt Taxameter — der Preis steht vor der Fahrt fest
- Vorbestellt statt Glücksspiel — Ihr Fahrer wartet bereits auf Sie
- Konzessioniert und versichert — volle Personenbeförderungs-Haftpflicht
- Persönlicher Service — direkter Kontakt, kein anonymes Callcenter
- Regional verwurzelt — wir kennen die Strecken zwischen Esslingen, Stuttgart und Umgebung

**Reference:** Blacklane "Why Blacklane" section, Hermès tools-for-life sections

#### 1.7 Fleet preview (optional — only if real photos exist)

Content: **Database (vehicles table)**

Heading: "Unsere Fahrzeuge" / "Our Fleet"

Horizontal scrollable row (or 3-up grid on desktop) of vehicle cards. Each card:
- Image (vehicles.image_url) — fallback to placeholder if missing
- Name (vehicles.name_*)
- Passenger capacity icon + count
- Luggage capacity icon + count
- 2-3 feature pills (vehicles.features_*)

If vehicles table is empty or has no images, hide this section entirely.

#### 1.8 Booking form (embedded preview)

Content: **Static structure, dynamic service options from DB**

Heading: "Festpreis-Angebot anfordern" / "Request a fixed-price quote"

Simplified version of the full booking form — single screen:
- Service dropdown (options from services table)
- Pickup location (text input with PLZ field)
- Date + time pickers
- Passenger count
- Name, phone, email
- Privacy checkbox linking to `/datenschutz`
- Submit: "Angebot anfordern" / "Request quote"

Submit either:
- Sends data to FastAPI `/api/bookings` endpoint, shows success message inline
- OR redirects to `/buchen` with pre-filled fields (cleaner UX)

#### 1.9 Testimonials (only if real ones exist)

Content: **Database (testimonials table where active=true)**

Heading: "Was unsere Kunden sagen" / "What our customers say"

Carousel or 3-up grid. Each testimonial:
- Star rating (1-5)
- Quote
- Author name + role (if provided)
- Date (optional)

If testimonials table is empty, **hide the entire section**. Do not show placeholder testimonials.

#### 1.10 FAQ teaser (top 4-5 questions)

Content: **Database (faqs table, category=general, top 5 by sort_order)**

Heading: "Häufige Fragen" / "Frequently Asked Questions"

Accordion: question + collapsible answer. Below the list, link: "Alle Fragen ansehen →" / "View all FAQs →" → `/faq` page (or just lives on homepage if list is small).

#### 1.11 Final CTA section

Content: **Static**

Full-width dark background section with:
- Heading: "Bereit für Ihre Fahrt?" / "Ready for your ride?"
- Subheading: "Buchen Sie jetzt oder rufen Sie an — wir melden uns innerhalb von 30 Minuten."
- Two CTAs: primary "Jetzt buchen", secondary phone number
- Concession reference text below: "StepNow Rides & Movers · Konzessioniert nach § 49 PBefG · [Konzessions-Nr.]"

#### 1.12 Footer (global — on every page)

Content: **Mostly static, settings from DB**

Four columns on desktop, stacked on mobile:

**Column 1 — Brand**
- Logo
- Tagline (1 line)
- Social icons (only if real accounts exist — pull from site_settings)

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
- Address (from site_settings)
- Phone (clickable)
- Email (clickable)
- Opening hours

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

Content: **Static**

- Page title (serif, large): "Unsere Leistungen" / "Our Services"
- Subheading (sans, intro paragraph): "Vier spezialisierte Transportdienstleistungen für Privat- und Geschäftskunden im Raum Stuttgart."

#### 2.2 Service cards (large)

Content: **Database (services table, active=true, all)**

Each service rendered as a full-width row (alternating left/right layout):
- Left/right (alternating): hero_image_url
- Other side: title (serif), long_description_de/en (first paragraph only — markdown rendered), CTA: "Mehr zu diesem Service →"

If hero_image_url is missing, use a typographic block instead (large service name on dark background with subtle pattern).

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

**Implementation:** Store both `slug_de` and `slug_en` columns on the `services` table. The DE route handler `/dienstleistungen/[slug]` queries `WHERE slug_de = $slug`, and the EN route handler `/en/services/[slug]` queries `WHERE slug_en = $slug`. The language switcher uses these stored slugs to build the correct alternate-language URL for any given page.

### Sections

#### 3.1 Breadcrumb

Static. "Startseite > Dienstleistungen > Flughafentransfer" — uses BreadcrumbList schema.

#### 3.2 Page header

Content: **Database (services.title, services.short_description)**

- Service title (serif, very large)
- Short description (sans, 18-20px, 2-3 lines)
- Primary CTA: "Diesen Service buchen" → `/buchen?service={slug}` (pre-fills service in booking flow)
- Service icon (large, gold) in top right or above title

Optional small atmospheric image (stock — airport terminal, hospital exterior, school zone, etc.) — only if it adds atmosphere, not as a focal point.

#### 3.3 Long description / story

Content: **Database (services.long_description, markdown)**

Single column, max-width 720px, body type, generous line-height. Naeem (or copywriter) writes 400-800 words covering:
- What this service includes
- Who it's for (specific use cases)
- What makes StepNow's version different
- Any specifics (e.g., for airport: flight tracking, meet & greet at terminal, luggage assistance)

Markdown supports headings, lists, bold, links — so Naeem can structure naturally.

#### 3.4 Process — 3 or 4 steps specific to this service

Content: **Static (per service, in code/i18n)**

Same visual treatment as homepage section 1.5, but content adapted to the service. Example for Flughafentransfer:
1. Buchung mit Flugnummer
2. Wir verfolgen Ihren Flug
3. Fahrer wartet im Terminal
4. Direkte Fahrt zum Ziel

#### 3.5 Inclusions / What's included

Content: **Database (or hardcoded list in services)**

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

Content: **Database (pricing_items where service_id matches)**

Table or card layout showing 4-6 sample routes with fixed prices. Each row: from → to, price.

Below the table, small note: "Andere Strecken auf Anfrage — Festpreis-Angebot innerhalb von 30 Minuten."

CTA: "Vollständige Preise ansehen" → `/preise`

#### 3.7 Service-specific FAQ

Content: **Database (faqs where category={service_slug})**

Accordion. 3-5 questions specific to this service.

#### 3.8 Booking CTA

Content: **Static**

Full-width dark band with: "Bereit für Ihren [Flughafentransfer]?" + primary CTA pre-filling the service.

#### 3.9 Related services

Content: **Database (other 3 services)**

3-up grid showing the other services with mini-cards.

### SEO

Per service. Example for Flughafentransfer (DE):
- title: "Flughafentransfer Stuttgart — Festpreis, vorgebucht — StepNow Rides"
- description: "Zuverlässiger Flughafentransfer zum/vom Flughafen Stuttgart. Festpreis-Garantie, Meet & Greet, Flugverfolgung. Konzessioniert nach PBefG. Jetzt buchen."

Each service page targets specific local + service keywords (e.g., "Flughafentransfer Stuttgart Festpreis", "Krankenfahrt Esslingen Mietwagen", "Schülerbeförderung Stuttgart Mietwagen").

---

## 4. Pricing page — `/preise` (DE) and `/en/pricing` (EN)

### Purpose
Transparent pricing builds trust. Critical for German market — customers don't book without seeing prices.

### Sections

#### 4.1 Page header

Content: **Static**

- Title: "Transparente Festpreise" / "Transparent Fixed Prices"
- Intro paragraph explaining: prices are fixed before the ride, include 19% MwSt, valid for the route shown

#### 4.2 Pricing tables (one per service)

Content: **Database (pricing_categories grouped by service)**

For each service, render a table:
- Columns: Von / From | Nach / To | Preis / Price | Hinweise / Notes
- Rows from pricing_items
- Visual: clean, restrained, gold accent on totals

Above each table: service name (serif heading) + 1-line description.

If pricing_items for a service is empty, show a placeholder: "Festpreis-Angebot auf Anfrage" with a quote-request CTA.

#### 4.3 What's always included

Content: **Static**

Bulleted list:
- 19% Mehrwertsteuer
- Gepäck (Standard)
- 15 Minuten Wartezeit am Abholort
- Kindersitz auf Anfrage (kostenfrei)

#### 4.4 What's not included

Content: **Static**

Bulleted list:
- Mautgebühren (falls anfallend)
- Parkgebühren am Abholort über 30 Minuten
- Reinigungspauschale bei Verschmutzung

#### 4.5 Payment methods

Content: **Static (could move to settings)**

- Barzahlung
- EC-Karte / Girocard (im Fahrzeug)
- Rechnung für Geschäftskunden (mit Vereinbarung)
- PayPal (auf Anfrage)

#### 4.6 Cancellation policy

Content: **Static**

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

Content: **Static**

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

#### 5.3 Our values / Principles

Content: **Static (code or i18n)**

3-4 principles, each with a heading and short paragraph:
- Verlässlichkeit / Reliability
- Sicherheit / Safety
- Transparenz / Transparency
- Persönlicher Service / Personal Service

#### 5.4 The fleet

Content: **Database (vehicles table)**

Same layout as homepage section 1.7, but full grid showing all active vehicles.

#### 5.5 Credentials & qualifications

Content: **Static, but pulls from site_settings for concession number**

Card layout:
- Konzession nach § 49 PBefG — Lizenz-Nr. {concession_number} — erteilt durch {concession_authority}
- Berufskraftfahrer-Qualifikation (BKrFQG)
- Personenbeförderungs-Haftpflichtversicherung
- Mitglied [if applicable: BZP / Taxi-Verband / etc.]

Optional: small images of certificate scans (if Naeem wants to upload).

#### 5.6 Service area

Content: **Static + map**

Description of covered area + interactive map:
- Use **OpenStreetMap with Leaflet** (no DSGVO complications, unlike Google Maps)
- Mark the business location (Blumenstr. 8, Deizisau)
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

Content: **Static**

- Title: "Kontakt" / "Contact"
- Subhead: "So erreichen Sie uns."

#### 6.2 Contact methods

Content: **Database (site_settings)**

Three large cards or stacked rows:

**Telefon / Phone**
- Number (clickable `tel:` link)
- Hours available (from settings)

**E-Mail**
- Address (clickable `mailto:` link)
- Expected response time

**Adresse / Address**
- Business address
- Opening hours

Optional: WhatsApp link if business WhatsApp set up.

#### 6.3 Contact form

Content: **Static structure, submits to DB**

Simple form:
- Name
- E-Mail
- Phone (optional)
- Betreff / Subject (dropdown: Allgemeine Anfrage / Buchung / Beschwerde / Sonstiges)
- Nachricht / Message (textarea)
- Privacy checkbox
- Submit

Submit creates a row in `contact_messages` table (separate from bookings) and sends notification to Naeem.

#### 6.4 Map

Content: **Static (OpenStreetMap)**

Embedded Leaflet map showing business address.

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

Multi-step form on a single page (no full page reloads between steps). Progress indicator at top.

### Steps

#### Step 1: Service selection
- Card grid of 4 services (pulled from DB)
- One must be selected to proceed

#### Step 2: Trip details
- Pickup location: address + postcode (autocomplete via Nominatim/OSM for DE; fallback plain text)
- Destination: same
- Date picker
- Time picker
- Passenger count (1-8)
- Luggage count (none / 1-2 / 3+)

#### Step 3: Special requirements (optional)
- Checkboxes: Kindersitz / Rollstuhlgerecht / Tier mitfahren / Sonstiges
- Textarea: Zusätzliche Anmerkungen
- Toggle: Bin ich Geschäftskunde? → reveals company name + USt-IdNr fields

#### Step 4: Contact info
- Vorname, Nachname
- Telefon (required)
- E-Mail (required)
- Privacy consent checkbox (links to /datenschutz)
- Marketing opt-in checkbox (optional, default unchecked — DSGVO)

### Submit handling

POST to `/api/bookings`:
1. Validate (server-side)
2. Insert into `booking_requests` with status='new', language=current_locale
3. Send confirmation email to customer (in their language)
4. Send notification email to Naeem (always in German, includes all details)
5. Send WhatsApp notification to Naeem (if Twilio/WhatsApp set up)
6. Return success → show confirmation screen

### Confirmation screen
- Large checkmark icon
- "Danke! Ihre Anfrage ist eingegangen."
- "Wir melden uns innerhalb von 30 Minuten mit einem Festpreis-Angebot."
- Reference number (booking_requests.id formatted as STN-2026-00123)
- CTA: "Zurück zur Startseite" / Back to homepage

### Anti-spam
- Honeypot field (hidden, must be empty)
- Rate limiting per IP (5 submissions per hour)
- Optional: hCaptcha (DSGVO-friendly, unlike reCAPTCHA) — only if spam becomes a problem

### SEO

Pages 7-9 should have `noindex` since they're transactional, not content.

---

## 8. Legal pages

### 8.1 Impressum — `/impressum` (DE) and `/en/legal-notice` (EN)

Content: **Static MDX file**

Use the draft from `impressum_de.md` (German) and `impressum_en.md` (English). German is legally binding; English shows banner.

Concession number pulled from site_settings (so it can update without code deploy).

### 8.2 Datenschutzerklärung — `/datenschutz` (DE) and `/en/privacy` (EN)

Content: **Static MDX file**

Use the draft from `datenschutz_de.md`. Update for actually-deployed third-party services.

### 8.3 AGB — `/agb` (DE) and `/en/terms` (EN)

Content: **Static MDX file**

To be drafted in Phase 2 of the build. For Phase 1, show placeholder: "AGB werden derzeit erarbeitet. Bei Fragen kontaktieren Sie uns bitte direkt."

### SEO

All legal pages: `noindex` (not for SEO).

---

## 9. 404 page

Content: **Static**

- "Seite nicht gefunden / Page not found"
- Friendly explanation
- Links back to homepage, services, contact

---

## 10. Implementation phases

### Phase 1 — Foundation (Week 1-2)
- Repo setup, hosting, i18n infrastructure
- DB schema migration
- Component library (header, footer, buttons, forms, cards)
- Legal pages (Impressum, Datenschutz from existing drafts)
- Placeholder homepage with hero + footer

### Phase 2 — Content pages (Week 3-4)
- Homepage (all sections)
- Services list + 4 service detail pages
- About page
- Contact page (with form submission to DB)
- Pricing page

### Phase 3 — Booking flow (Week 5)
- Multi-step booking form
- Backend submission handling
- Email + WhatsApp notifications
- Confirmation screen
- Anti-spam

### Phase 4 — Admin panel (Week 6)
- Auth (just Naeem — single admin account)
- CRUD for services, vehicles, FAQ, pricing, testimonials, settings
- Bookings view (read-only with status updates)

### Phase 5 — Polish & launch (Week 7)
- SEO meta on all pages
- Structured data
- Sitemap, robots
- Lighthouse pass (target 90+)
- Cross-browser, mobile testing
- Legal review of legal pages
- Cutover from old site

---

## 11. Cross-page references — reusable component library

These appear across multiple pages and should be built as shared components:

| Component | Used on pages |
|---|---|
| `<Header>` | All |
| `<Footer>` | All |
| `<LanguageSwitcher>` | Header, footer |
| `<HeroCTAButtons>` | Homepage, service pages, about |
| `<TrustStrip>` | Homepage, service pages |
| `<ServiceCard>` (small) | Homepage, footer |
| `<ServiceCard>` (large, alternating layout) | Services list page |
| `<ProcessSteps>` (3-step layout) | Homepage, service pages |
| `<VehicleCard>` | Homepage, about page |
| `<TestimonialCard>` | Homepage, about |
| `<FAQAccordion>` | Homepage, service pages, contact |
| `<BookingFormEmbedded>` (single screen) | Homepage |
| `<BookingFormFull>` (multi-step) | Booking page |
| `<PricingTable>` | Pricing page, service pages |
| `<MapEmbed>` (OpenStreetMap) | Contact, about |
| `<FinalCTABand>` | Homepage, service pages, about |
| `<Breadcrumb>` | All non-homepage pages |
| `<MarkdownContent>` | Service descriptions, FAQ answers |

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

All references are calibration only — none are to be cloned. The point is to study how premium services handle each pattern.

---

## 13. Open decisions before implementation

These need answers from Naeem (with you as translator) before building:

1. **Concession number and authority** — for Impressum and About page credentials
2. **USt-IdNr / Steuernummer** — for Impressum
3. **Real fleet list** — vehicles, capacities, features
4. **Actual prices** — at least 5-10 sample routes per service
5. **Opening hours** — phone hours and ride hours
6. **Service area boundaries** — exact postcodes or city list covered
7. **Driver qualifications** — what specific badges/qualifications to highlight
8. **Real testimonials** — at least 3 to start (Google reviews acceptable substitute)
9. **Booking lead time** — minimum advance booking time
10. **Naeem's portrait + 2 vehicle photos** — for hero and About page

Without items 1-10, the site can be built and deployed, but with placeholders/empty states. Items 1-3 are blocking (legal/trust). Items 4-10 are quality-degrading but not blocking.
