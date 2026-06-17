# StepNow Rides & Movers — Strategic Conversion & Competitive Research

**Prepared for:** step-now.de (public website + admin panel)
**Scope:** Product strategy · UX research · conversion optimization · frontend architecture
**Date:** 2026-06-17
**Method:** Full codebase audit (read-only) + 20-company competitor sweep + 6 deep-dive teardowns

---

## PHASE 1 — Full Project Understanding

### 1.1 Product Overview

**What StepNow is:** A licensed German passenger + courier transport operator (§ 49 PBefG — *Mietwagen mit Fahrer*) serving the Plochingen / Esslingen / Stuttgart / Deizisau corridor. The model is **pre-booked, fixed-price private transport** — explicitly *not* a taxi-meter or ride-hailing app.

**Service types (from `services` table, rendered dynamically on homepage + `/dienstleistungen`):**
1. **Flughafentransfer** — airport transfers (flight-tracked)
2. **Krankenfahrten / Krankenhausfahrten** — hospital / medical rides
3. **Schülerbeförderung** — school transport
4. **Shuttle / private Strecken** — shuttle & private routes
   (Plus courier / parcel + removal handled operationally in the admin via `orders.delivery_status`.)

**Booking flow (5-step `WizardShell`):**
1. **Service + Datetime** — pick service card, pickup date, pickup time (≥ 60 min lead, ≤ 180 days out)
2. **Route** — pickup address/PLZ/Ort + destination address/PLZ/Ort
3. **Details** — passenger count (1–8), luggage count (0–12), special requirements (≤ 500 chars)
4. **Contact** — name, phone, email, business toggle → company name + USt-IdNr
5. **Review** — read-only summary + DSGVO consent + honeypot → submit

On submit: `POST /api/v0/public/bookings` → FastAPI `/public/bookings` (rate-limited 3/min, 10/hr) → writes `booking_requests` row with status `new` and a `SN-YYYYMMDD-XXXXXX` reference → queues **two emails**: owner notification (`rides` mailbox) + customer confirmation (`accounts` mailbox). **No price is computed or shown** — staff quote manually within ~30 min.

**Two target audiences:**
- **B2C** — private travelers (airport, hospital, school runs). Primary public-site focus.
- **B2B** — businesses needing invoiced rides (the wizard has a business toggle; the admin has full invoicing with VAT, `recipient_block`, skonto, payment terms). **But the public site has no B2B landing/funnel** — only a checkbox and a contact-form subject.

**Core value proposition vs a regular taxi** (from `PricingComparison` on `/preise`): fixed price confirmed before the ride (no Taxameter), pre-booked planning (same vehicle/driver, no hailing), flight tracking + free waiting, licensed/regulated operator, one personal contact number. Positioned as *certainty and planability* over a metered taxi's variability.

**Regulatory basis:** § 49 PBefG (Personenbeförderungsgesetz, *Mietwagen mit Fahrer*). Concession number + authority stored in `site_settings`, surfaced via `ConcessionBadge` (`§ 49 PBefG · {concession_number}`). Drivers carry P-Schein (passenger certificate) tracked in `drivers`.

**Geographic scope:** Plochingen / Esslingen / Stuttgart / Deizisau (Baden-Württemberg). Reinforced in `WhyStepNow` ("Regional — spezialisiert auf Stuttgart, Esslingen und Deizisau") and `LocalBusiness` JSON-LD.

**VAT:** 7 % default for licensed short-distance passenger transport (PBefG), 19 % for courier/parcel — set per order (`Order.vat_rate`, `Numeric(5,4)`).

### 1.2 Design System Inventory

**Tailwind tokens (`tailwind.config.ts`):**

| Group | Tokens |
|---|---|
| **Colors** | `ink #000`, `charcoal #0F1115`, `elevation #1A1A1A`, `cream #F5F2EC`, `paper #FAFAF7`, `gold {DEFAULT #A8865A, light #C2A675, dark #86683F, deep #6E5430}`, `mute #5A5A5A`/`mute-soft #7A7A7A`/`mute-strong #3A3A3A`, `line #D8D5CE`/`line-soft`/`line-strong`, `danger #9A2A2A`, `success #2F7A4B`, `warn #B5651D` |
| **Fonts** | `serif → var(--font-serif)` (Cormorant), `sans → var(--font-sans)` (Inter) |
| **Font sizes** | `display-xl 6.5rem`, `display-lg/hero-lg 5rem`, `display-md 3.75rem`, `hero 4rem`, `section 3rem`, `sub 1.75rem`, `body-lg 1.1875rem` (19px), `body 1rem`, `label-sm 0.75rem` (tracked) |
| **Spacing** | `section 3.5rem`, `section-mobile 2.5rem`, `section-lg 4.5rem`, `section-hero* 2.5/3.5/4rem` |
| **Max-width** | `container 82rem`, `prose 44rem`, `narrow 36rem` |
| **Shadows** | `premium-sm/-/md/lg`, `premium-dark`, `ring-ink`, `ring-gold` |
| **Motion** | durations `fast 150 / base 250 / slow 400 / slower 600`; `ease-premium`, `ease-out-premium`; `fade-up`, `fade-in`, `fade-up-slow`, `nudge` |
| **Tracking** | `wordmark .22em`, `label-wide .18em`, `label-wider .22em` |

**⚠️ Critical inconsistency — two palettes coexist, and GREEN is the live one.** `globals.css` `:root` defines a **green/olive "eco" palette** in `--color-*` variables that conflicts with the charcoal/gold/cream Tailwind tokens:

```
--color-accent-primary: #558518   (green)      --color-text-primary: #2F3A1F (olive)
--color-accent-secondary: #A7C957 (lime)        --color-bg-strong: #558518   (green)
--color-accent-highlight: #D9B44A (gold-ish)    --color-accent-warm: #C96C4A (terracotta)
--color-bg-page: #F7F4EA           --color-gold: 168 134 90   --color-gold-deep: 110 84 48
```

**Grep evidence (corrected):** the green `--color-*` system is the **dominant live accent — 250 refs across 42 component files** (Header, Footer, Hero, Pricing, Services, the booking wizard, Contact, About). The header nav underline, the "Jetzt buchen" button (`--color-bg-strong #558518`), link/active states, icons and borders all render **green**. The gold/charcoal Tailwind tokens (`text-gold`, `text-ink`, `bg-ink`, `gold-deep`, `text-cream`) are **97 refs across 25 files**, concentrated in the **UI primitive layer** (Button, Input, Select, Checkbox, Card, Badge, DatePicker), a few shared comps (`PhoneCTA`, `MobileStickyBar`, `ConcessionBadge`), and admin. The `globals.css` base layer sets body `bg-cream text-ink` + Cormorant headings + `gold-deep` eyebrows, and `layout.tsx` moved themeColor to `gold-deep #6E5430` *"instead of the off-brand green that was here before"* — signalling an **intent** to move toward gold that is **mostly not executed**. The net effect: a **visible two-accent split** (green chrome vs gold-accented form fields render in the same viewport). This is **not dead CSS** — it is a genuine brand-direction decision (green vs gold) that must be made before any "reconciliation" (see Phase 7).

**Font strategy:** Cormorant (serif) for H1/H2 + editorial quote text; Inter (sans) for H3/H4, body, labels, buttons, wordmark. Eyebrow labels use `label-sm` uppercase + wide tracking in `gold-deep`.

**Visual identity (as actually rendered):** **Premium / editorial.** Cormorant serif headings + cream background + near-black text + **green (#558518) accent** + gold-deep eyebrow labels + generous spacing + subtle scroll-reveal animation. Closer to a boutique-hospitality look than a utilitarian transfer-booking tool — but the accent reads **green**, not the gold the tokens imply.

### 1.3 Public Website Sections Audit

Homepage section order (`app/(public)/page.tsx`, mirrored at `/en`):

| # | Section | Component | Communicates | Conversion weakness |
|---|---|---|---|---|
| 1 | Hero | `HeroHomeSection` + `HeroBookingWidget` | Headline/subhead (i18n), 2 CTAs (Book + Phone), 3 micro-points (Flughafen/Rückmeldung/Konzession), `§49` badge; right column = route widget (pickup/dest/date) | Widget **redirects without pricing**; headline is i18n-driven (generic); no live rating |
| 2 | Trust strip | `TrustStrip` | 4 icons: Konzessioniert · Pauschalpreis · Geprüfte Fahrer · Immer verfügbar | Static claims, no numbers (no review count / fleet size / years) |
| 3 | Services | `HomeServicesSection` | Service cards from DB, "ab €X" min price, link to detail | Good; could surface example routes |
| 4 | How it works | `HowItWorks` | 3 steps: Anfrage → Bestätigung (≤30 min Pauschalpreis) → Fahrt | Solid; "30 Minuten" is a strong promise underused elsewhere |
| 5 | Why StepNow | `WhyStepNow` | 5 differentiators (fixed price, pre-booked, licensed, personal, regional) | Text-heavy; no imagery proof |
| 6 | Fleet | `FleetPreview` | Vehicle cards: photo, name, features, pax + luggage capacity | Strong; no example price per vehicle |
| 7 | Testimonials | `TestimonialsSection` | Auto-rotating quotes (≤6), name/role/photo/rating | **Manual only — no live Google rating/aggregate**; 7s rotation fast |
| 8 | FAQ teaser | `FaqTeaser` + accordion | ≤5 general FAQs, link to full set | Fine; could show 5 vs 3 |
| 9 | Mobile sticky | `MobileStickyBar` | After 600px scroll: Anrufen + Jetzt buchen | Good pattern; no WhatsApp |

**Sub-pages:** `/preise` (PricingTabs per service → table, trust strip, included/excluded, **taxi comparison**, payment+cancellation, concession badge); `/dienstleistungen` (4-service index with "ab €" + rich alternating rows + repeated how-it-works); `/kontakt` (ContactForm with honeypot + time-trap, ContactMethods phone/email/address, ContactMap, FAQ grid); `/ueber-uns`, legal (`/impressum`, `/datenschutz`, `/agb`). EN parity via `/en/*` with route-map slug translation.

**i18n:** Custom `t()` from DB-backed `ui_strings` (de/en columns). Server: `getUiStringsServer(locale)` → `createT()`; client: `useUiStrings()`. `pickT(t, key, fallback)` provides English fallbacks. Locale switch (`LanguageSwitcher`) persists a cookie + maps to alternate route. **No third-party i18n lib; strings are admin-editable.**

**No announcement bar component exists.**

### 1.4 Booking Wizard Audit

- **5 steps** (Service+Datetime, Route, Details, Contact, Review); progress via `WizardProgress` ("Step X of 5", labels md+). State persisted to `localStorage` (`stepnow.booking_wizard.v1`); hero widget deep-links `?pickup&destination&date`.
- **zod schema (`schemas/booking.schema.ts`):**
  - Step 1: `service_id` uuid; `pickup_date` `YYYY-MM-DD`; `pickup_time` `HH:MM`; superRefine → datetime within [now+60min, now+180d]
  - Step 2: `pickup_address` min 3/max 255 (req); `destination_address` same; postcodes/cities optional
  - Step 3: `passenger_count` 1–8; `luggage_count` 0–12; `special_requirements` ≤2000
  - Step 4: `customer_name` 2–120; `customer_phone` `/^[\d\s+\-()]{6,}$/`; `customer_email` email; `is_business` bool; `company_name` required-if-business; `company_vatid` ≤40
  - Step 5: `consent_dsgvo` literal `true`; `website` honeypot (max 0)
- **On submit:** BFF `/api/v0/public/bookings` → FastAPI `/public/bookings` → `booking_requests` (status `new`, ref `SN-…`) → 2 emails (owner `rides`, customer `accounts`). Backend also enforces a server-side honeypot (silently returns a fake ref) + 1500 ms client time-trap.
- **No live price, no vehicle selection, no return-journey, no promo code, no "book for someone else", no passenger-named-others.** Vehicle is assigned later by staff.
- **Trust signals in wizard:** right rail "Warum StepNow" (3 checks) + "Direkte Hilfe" phone block; confirmation page "persönlich bestätigt, nicht automatisch" + "≤30 min Pauschalpreis-Angebot".
- **Abandonment risk per step:** S1 native date/time UX variance + the 60-min rule rejection; S2 6 address fields feel heavy, optional vs required unclear; S3 low; S4 strict phone regex may reject valid formats, business toggle low-visibility; S5 no price reward for completing + DSGVO link can navigate away. **Biggest structural risk: the user invests 5 steps and gets no price — only "we'll get back to you."**

### 1.5 Admin Panel Audit

**Routes under `app/admin/(authed)/`:** dashboard, orders (list/`[id]`/new), bookings (list/`[id]`), customers, drivers, vehicles, pricing (`[serviceId]`), services, faqs, testimonials, legal-pages, ui-strings, settings, notifications, contact-messages, audit-log.

**Models (24 domain + system):** `Order` (financial `status` open→completed/cancelled + independent `delivery_status` draft→dispatched→picked_up→delivered, VAT, vehicle/customer/driver FKs), `BookingRequest` (new→confirmed, `quoted_price_eur`), `Invoice` (draft→issued→paid/cancelled, sequential `invoice_number` §14 UStG, skonto, due terms), `Payment` (paid-state derived from `sum(payments)`, no boolean flag), `Customer`, `Driver` (license/P-Schein expiry + check-due), `Vehicle` (dual: public showcase + operational plate), `DriverVehicleAssignment` (period history), `Service`/`PricingCategory`/`PricingItem`, `FAQ`, `Testimonial` (has `source` field → could hold `google_review`), `LegalPage`+versions, `UiString`, `SiteSettings` (singleton, incl. `whatsapp_url`, concession, social), `AdminUser`/`RefreshToken`, `Notification`, `AuditLog`, `EmailLog`, `ContactMessage`, `Expense`/`ExpenseCategory` (legacy import), `MessageDelivery` (channel-agnostic — WhatsApp web-click + future SMS/push, with tokenized PDF links + download tracking).

**Order/invoice workflow:** public booking → admin `POST /admin/bookings/{id}/convert-to-order` (snapshots customer/route, sets VAT default 7%, `booking.status=confirmed`) → optional `POST /admin/orders/{id}/invoice` (sequential number, surcharge/skonto) → `POST /admin/orders/{id}/payments` (method cash/girocard/bank_transfer/paypal/other) → courier flow (send-to-driver → picked_up → delivered). Invoicing **is implemented**.

**Migration state:** Effectively **100% migrated to React Query** — hooks exist for orders, bookings, customers, drivers, vehicles, services, pricing, faqs, testimonials, legal-pages, contact-messages, settings, audit-log, ui-strings, notifications, dashboard, sidebar-counts. Only `expenses` has no hook (read-only legacy). The frontend CLAUDE.md's "🔲 create" markers are stale relative to code. *(Worth a quick re-verify before relying on it — see Phase 8.)*

**WebSocket:** in-process `connection_manager` (channels `admin`, `user:{id}`, `order:{id}`). Order events (`orders.order.created/updated/deleted`, `invoice.created`, `payment.recorded`) + `notification.created` push to the admin notification bell / order-detail views. Powers the realtime ops feed and durable notification inbox.

### 1.6 Technical Stack Snapshot

- **Public:** Next.js 15 App Router, RSC + `Suspense` streaming (hero/above-fold awaited, fleet/testimonials/FAQ deferred), ISR `revalidate 300`, DB-backed i18n, react-hook-form + zod, Tailwind custom tokens, AVIF imagery, `LocalBusiness` JSON-LD + `buildMetadata`.
- **Admin:** TanStack Query v5 hooks → `/api/v0/*` BFF (`extractBearerToken`) → FastAPI; localStorage bearer auth; client-side route guard.
- **Backend:** FastAPI, SQLAlchemy **sync**, PostgreSQL, Pydantic v2, soft-delete everywhere, JWT admin (no RBAC), Hostinger VPS + systemd, Hostinger SMTP. Schema via `create_all` + idempotent seeders.

---

## PHASE 2 — Competitor Longlist (20 companies)

StepNow competes in **pre-booked, fixed-price private transfer / chauffeur** in/around Stuttgart — not taxi aggregation.

| # | Company | URL | Geo | Scope | Pricing shown | Online booking | Lang | Tier |
|---|---|---|---|---|---|---|---|---|
| 1 | **Blacklane** | blacklane.com | Global (DE base) | Airport, hourly, city-to-city | Fixed, after search | Embedded widget | 8+ | Premium |
| 2 | **Bavaria Limousines** | bavaria-limousines.de | DE (Munich) | Airport, events, VIP | Fixed, calculator | Calculator + phone | DE/EN/RU | Premium |
| 3 | **Flughafen-Transport** | flughafen-transport.de | DE (Frankfurt) | Airport | **Instant inline calc** | Embedded hero calc | DE/EN | Professional |
| 4 | **Komfort Transfer** | komfort-transfer.de | DE (Stuttgart/FRA) | Airport | **"ab €320" tiers + calc** | Inline widget | DE/RU | Premium |
| 5 | **FlyingStar** | flyingstar-flughafentransfer.de | DE (Stuttgart/FRA) | Airport, regional | Fixed, after route | Calculator | DE/EN | Professional |
| 6 | **FH-Transfer** | fh-transfer.de | DE (FRA↔Stuttgart) | Airport, door-to-door | Fixed | Online + phone | DE/EN | Professional |
| 7 | **Schlienz-Tours** | schlienz.info | DE (Stuttgart/Esslingen) | Airport shuttle, accessible | Fixed | S-Shuttle app | DE | Premium |
| 8 | **Taxi Akbulut** | taxi-akbulut.de | DE (Tübingen/STR) | Airport, long-distance | Fixed, no surge | 24/7 online | DE/EN | Professional |
| 9 | **Taxista** | taxista.de | DE (Reutlingen/STR) | Airport | **Instant calculator** | 24/7 digital | DE/EN | Professional |
| 10 | **Noble Transfer** | nobletransfer.com | STR + pan-EU | Limo, airport, hourly | Fixed inclusive | 12h-advance online | 6 | Luxury |
| 11 | **Gondal Limousinenservice** | stuttgart-chauffeur.de | DE (Stuttgart) | Chauffeur, events | Quote | Phone/email | DE/EN | Luxury |
| 12 | **MyChauffeur** | mychauffeur.com | DE (12 cities) | Airport, chauffeur | Quote | Embedded widget | 6+ | Professional |
| 13 | **Chauffeur-Services (C&S)** | chauffeur-services.com | EU | Airport, intercity | Fixed transparent | Embedded widget | 7+ | Professional |
| 14 | **TOP-ALLIANCE** | top-alliance.com | CH/DE/global | Airport, events | Quote | Quick form | 4+ | Premium |
| 15 | **Hoppa** | hoppa.com | International | Airport + holiday transfers | Fixed, after search | Search→results | Multi | Professional |
| 16 | **Suntransfers** | suntransfers.com | EU (500+ airports) | Private + shared | Fixed from €3.34 | Widget | Multi | Professional/Budget |
| 17 | **Talixo** | talixo.com | International | Airport, city | Fixed (Eco/Business) | 3-step widget | Multi | Premium |
| 18 | **GS Limousine** | gs-limousine.de | DE (Frankfurt) | Airport, groups | Fixed €25–130 | 4-step flow | DE | Professional |
| 19 | **Cars-Exec** | cars-exec.com | UK | Airport, city | Fixed | 5-step instant quote | EN | Professional |
| 20 | **Limos4** | limos4.com | DE (Berlin) | Airport, groups | Fixed (15-min quote) | Inquiry→offer→pay | DE/EN | Premium |

*(Blocked/dead during research: Quality Line Limo 410, Bookinglane 403, SC Mobility refused.)*

---

## PHASE 3 — Top 5 Deep Analysis

Selected for closeness to StepNow's scope (regional, fixed-price, pre-booked) + professional public sites + fetchability. Two are direct Stuttgart-area airport competitors; one is the instant-price benchmark; one the premium-design benchmark; one a regional-premium model.

### COMPETITOR 1 — Flughafen-Transport (instant-price benchmark)
**URL:** flughafen-transport.de · **Region:** Germany (Frankfurt hub) · **Scope:** airport, fixed-price

- **Announcement:** "24/7 Service" guarantee. **Nav:** logo + services/fleet/contact + sticky "Jetzt Buchen". **Hero:** headline around *"24/7 Festpreisgarantie"*, **booking widget embedded in hero** — pickup ("Komplett-Adresse" + *"Verwenden Sie meinen Standort"*), destination (+ stopover), passengers (1–8), luggage (0–20), one-way/round-trip toggle; **"Festpreisgarantie" badge**.
- **Above-fold trust:** 24/7, "Keine versteckten Gebühren", Meet & Greet, real-time flight tracking, 20-min pickup guarantee.
- **Pricing:** **Highly visible dynamic calculator — price appears inline as the user fills the form** (no submit needed); example "ab 32,56 €". **Fleet:** 5 named categories (Limousine 4/2, Kombi 4/4, 7-/8-Seater, 8-Jumbo 8/16). Taxi comparison: implicit.
- **CTA:** "Jetzt Buchen" + "Preis Berechnen", multiple above fold → checkout. **Mobile:** sticky booking, touch-optimized. **Footer:** legal + DE/EN.
- **UX flow:** enter pickup → enter dropoff → choose one-way/return → set pax + luggage → **price auto-calculates (distance + ETA + fare) with no submit** → pick vehicle category → contact → confirm.
- **Conversion:** trust builder = repeated price-lock copy (*"Der Preis, den Sie buchen, ist der Preis, den Sie zahlen"*); urgency = live price lock-in + flight tracking; trigger = German precision/reliability; objections = no hidden costs, 20-min guarantee, flight tracking.
- **Design:** orange/blue accent on white, clean sans-serif, fleet photography, inline number-update animation; **no-nonsense efficient** (not luxury).

### COMPETITOR 2 — Komfort Transfer (regional premium, upfront tier pricing)
**URL:** komfort-transfer.de · **Region:** Stuttgart / Frankfurt · **Scope:** airport premium

- **Nav:** logo + All Destinations/FAQ/About/Gallery/Contacts + **WhatsApp/Telegram buttons** ("Whatsapp messages only"). **Hero:** *"Airport Shuttle Stuttgart: Fixed-Price Transfers"*, subhead *"Comfortable and exclusive business service … secure payments, 24/7, personal greeting at the terminal"*; primary CTA **"Calculate price"**; vehicle cards below hero.
- **Above-fold trust:** 24/7, secure payments, professional drivers, meet & greet (no star rating).
- **Services/pricing:** **tiered vehicle cards with "from" prices** — Standard (VW Touran/Mercedes B, €320+), Comfort (Vito 7p, €340+), Business (E-Class, €365+), Premium (V-Class 6p, €395+), each lists "bottled water". **"Better than a taxi"** block (4 advantages). Testimonials section present but below fold.
- **CTA:** "Calculate price" (low-friction) + "Book now" per card + WhatsApp; 4–5 above fold. **Mobile:** WhatsApp sticky header. **Footer:** DE/RU, hours Mo–Fr 9–20.
- **UX flow:** **vehicle tier first** (with "from" price) → one-way/round-trip → pickup/dropoff → date/time → exact price → submit.
- **Conversion:** trust = fixed pricing + professional standards; urgency = soft 12h advance; trigger = reliability ("unlike other shuttles … reliability"); objections = duration expectation, no delay fees, named meet-&-greet.
- **Design:** professional blue + white + green CTAs; modern sans-serif; Mercedes-only fleet (status); calm/organized.

### COMPETITOR 3 — FlyingStar (regional fixed-price + live Google Reviews + taxi savings)
**URL:** flyingstar-flughafentransfer.de · **Region:** Stuttgart / Frankfurt · **Scope:** airport, regional

- **Announcement:** phone + email pinned. **Nav:** logo + Startseite/Über uns/Dienstleistungen/Flughafentransfer(dropdown)/Kontakt + DE↔EN. **Hero:** *"Fahren Sie sicher mit uns!"* / *"Flughafentransfer Stuttgart Online Buchen Zum Festpreis"*; address calculator below; safety badge.
- **Above-fold trust:** **"Sparen Sie bis zu 40 % im Vergleich zu herkömmlichen Taxis"** (explicit taxi comparison), pro-driver credential, fixed-price, real-time flight monitoring.
- **Testimonials:** **embedded Google Reviews widget** with real names (e.g. *"Perfekt … Super Pünktlich, Super Freundlich"*). **Fleet:** 4 tiers (Standard→Luxus). **Pricing:** calculator-driven, full cost after route. **WhatsApp** contact available.
- **UX flow:** pickup address → vehicle tier + pax → price → book; autocomplete address.
- **Conversion:** trust = Festpreis-Garantie + Google Reviews; urgency = 24/7; trigger = safety + cost certainty; objections = 40% savings, real-time flight monitoring, FAQ.
- **Design:** corporate blue + white + warm CTA, modern sans-serif, real airport/vehicle photography; professional/efficient.

### COMPETITOR 4 — Blacklane (premium SaaS benchmark)
**URL:** blacklane.com · **Region:** global (DE base) · **Scope:** airport, hourly, city-to-city

- **Nav:** wordmark + Our services / For business / For chauffeurs + language + sign-in. **Hero:** Mercedes EQS passenger photo; **dual booking widget (one-way + hourly)** with origin/destination + date/time + "Search"; trust copy *"Chauffeur will wait 15 minutes free of charge"*.
- **Above-fold trust:** 3 benefit blocks — global availability, flexible cancellation (up to 1h), transparent pricing/no surge. **No testimonials/Google widget. Fleet:** minimal (implied via hero). **B2B:** "For business" corporate accounts.
- **CTA:** "Search" (widget) + app-store buttons; price **after** search. **Mobile:** app download prominent.
- **Conversion:** trust = transparent/no-surge pricing; urgency = free wait + free cancellation (risk reversal); trigger = aspirational authority ("nothing but the best"); objections = free cancellation, 15-min wait.
- **Design:** **monochrome dark/light, zero gold, modern sans-serif, NO serif headings**; luxury via photography + whitespace + copy. The luxury signal is photographic, not typographic.

### COMPETITOR 5 — Bavaria Limousines (regional-premium, trust-by-numbers + fleet showcase)
**URL:** bavaria-limousines.de · **Region:** Germany (Munich) · **Scope:** airport, events, VIP

- **Nav:** Services/Fleet/Locations/About + persistent **"Book now"**. **Hero:** *"Chauffeur service and VIP chauffeur service throughout Germany"*, clean professional imagery; **price-calculator link + phone** (no inline widget); badge **"Over 20 years"** + memberships (QLimo, NLA).
- **Above-fold trust:** **150+ vehicles**, **20–30,000 movements/year**, vehicles **< 36 months old**, multilingual staff. **Fleet:** rich showcase — Business/First/Luxury/Diamond classes, VIP vans, minibuses, coaches with interior/exterior photography. Testimonials present.
- **CTA:** "Book now" + calculator + International Reservation Center (phone/WhatsApp), 3 above fold. **Mobile:** phone + WhatsApp emphasized.
- **Conversion:** trust = longevity + fleet scale + volume proof; trigger = aspirational vehicle tiering ("Diamond"); objections = no cancellation fees, free wait.
- **Design:** dark navy/black + white + **gold/amber accents** (akin to StepNow's gold) but **modern sans-serif headings** (not serif); aspirational luxury photography.

**Cross-cutting pattern across all five:** (a) instant or near-instant **price** on the public site; (b) **route input that produces a number**; (c) heavy **WhatsApp/phone** on mobile; (d) **trust-by-numbers** (reviews, fleet size, years, movements); (e) **sans-serif** typography is universal — StepNow's Cormorant serif is the category outlier.

---

## PHASE 4 — Gap Analysis: StepNow vs Top 5

Scores 1–5. Gap ≥ 2 = **critical**.

| Dimension | StepNow | Comp Avg | Gap | Priority |
|---|---|---|---|---|
| Hero clarity (what/who/where) | 4 | 4.0 | 0 | — |
| **Booking widget *produces a price* in hero** | **2** | **4.4** | **2.4** | **CRITICAL** |
| **Price transparency / instant quote on landing** | **3** | **4.4** | **1.4** | High |
| Trust signals above fold | 4 | 4.2 | 0.2 | — |
| Service types clarity | 4 | 4.0 | 0 | — |
| **B2B / corporate section (public)** | **2** | **3.4** | **1.4** | High |
| Mobile sticky CTA | 5 | 3.4 | −1.6 | StepNow leads |
| Phone number prominence | 5 | 4.6 | −0.4 | StepNow leads |
| **Testimonials / live Google Reviews** | **3** | **3.8** | **0.8** | Medium |
| Fleet / vehicle showcase | 4 | 3.6 | −0.4 | StepNow leads |
| How-it-works section | 4 | 3.4 | −0.6 | StepNow leads |
| Comparison vs taxi (on homepage) | 3 | 3.4 | 0.4 | Medium |
| Legal trust (§49 / Impressum) | 5 | 4.0 | −1.0 | StepNow leads |
| DE/EN language switching UX | 5 | 3.4 | −1.6 | StepNow leads |
| Booking form UX (steps / friction) | 3 | 4.0 | 1.0 | High |
| Page load speed | 4 | 3.4 | −0.6 | StepNow leads |
| SEO (title / meta / schema) | 4 | 3.4 | −0.6 | StepNow leads |
| **WhatsApp / direct contact** | **2** | **4.0** | **2.0** | **CRITICAL** |
| Footer completeness | 5 | 4.0 | −1.0 | StepNow leads |
| Overall visual premium-ness | 5 | 3.6 | −1.4 | StepNow leads |

**Read:** StepNow is **ahead** on craft, trust legality, mobile sticky CTA, language UX, footer and visual polish. It is **behind on exactly the things that convert a transfer booking**: an instant price, a hero widget that returns a number, a WhatsApp channel, a public B2B funnel, and a live aggregate rating. The two critical gaps (price-in-widget, WhatsApp) are both addressable without rebuilding the design.

---

## PHASE 5 — Feature & Section Discovery

### A. Missing sections (every top competitor has, StepNow lacks)
| Section | Why it matters | Conv. impact | Effort |
|---|---|---|---|
| **WhatsApp contact** (header/sticky/footer) | German transfer buyers expect chat; lowest-friction conversion path | **H** | **S** (`whatsapp_url` already in settings) |
| **Live Google rating / review count** | Third-party credibility beats manual quotes | **H** | **S–M** |
| **Instant price teaser / route calculator** | The #1 expectation in this category | **H** | **L** |
| **B2B / corporate section** | Captures invoiced-billing demand the admin already supports | **M–H** | **M** |
| **Trust-by-numbers strip** (years, rides, fleet, on-time %) | Competitors lead with volume proof | **M** | **S** |
| **Announcement bar** | Surfaces one offer/USP friction-free | **M** | **S** |

### B. Missing booking-wizard features
Real-time price (the big one) · vehicle selection with photos + capacity · return-journey toggle · promo/voucher field · WhatsApp fallback if form fails · "book for someone else" · corporate quick-path. StepNow already has pax + luggage counters and a business toggle.

### C. B2B public features
Corporate inquiry section + "Geschäftskonto / Rechnung auf Monatsbasis" explainer · saved/repeat routes · instant quote for regular routes · invoice-billing reassurance. Backend invoicing (VAT, `recipient_block`, skonto) already exists — only the public funnel is missing.

### D. Trust & social-proof gaps
Live Google Reviews widget · aggregate star rating + count · fleet photo gallery · driver intro (name/photo/years/P-Schein) · license number shown prominently (partly done via `ConcessionBadge`) · insurance mention · years-in-operation · rides-completed counter.

### E. Innovative opportunities (build on existing FastAPI + Next.js)
1. **Fixed-route price calculator** — pricing table already in DB; map pickup/dropoff PLZ → nearest `PricingItem` → show "ab €X" instantly. *Feasibility: high (no new infra). Effort: M.*
2. **Realtime booking confirmation** — WebSocket already pushes `orders.*`; extend a public per-reference channel so the confirmation page flips to "bestätigt" live when staff quote. *Feasibility: high. Effort: M.*
3. **WhatsApp deep-link with prefilled booking summary** — `MessageDelivery` model already does tokenized web-click WhatsApp for driver slips; reuse for customer "send my request via WhatsApp". *Feasibility: high. Effort: S–M.*
4. **School-transport subscription** — recurring booking → monthly invoice (invoicing exists). *Feasibility: med. Effort: L.*
5. **Driver profile pages** — `drivers` already holds name/license; expose a public, privacy-safe subset as a trust builder. *Feasibility: high. Effort: M.*

---

## PHASE 6 — Landing Page Redesign Plan

Aligned to existing tokens (charcoal/cream/gold, Cormorant headings, Inter body) and DE-first/EN-parity, DSGVO-safe (no third-party tracking without consent).

1. **Announcement bar** *(new `AnnouncementBar`)* — Goal: surface one trust/offer. Copy: *"Festpreis sofort · Kein Taxameter · Antwort in 30 Min"*. Thin cream/charcoal bar above Header, dismissible, `site_settings`-driven so admin can edit. Reuse `MobileStickyBar` styling language.
2. **Navigation** *(`Header`)* — keep sticky; **add a WhatsApp icon button** beside phone on desktop top bar; keep gold-outline "Jetzt buchen" CTA (raise contrast — see Phase 7); phone stays in nav on desktop.
3. **Hero** *(`HeroHomeSection` + `HeroBookingWidget`)* — Headline formula *[outcome]+[differentiator]+[geography]*: **"Planbar ankommen — zum Festpreis, in der Region Stuttgart."** Subhead: one line on §49 + fixed price + 30-min confirmation. CTAs: primary Book + secondary Phone/WhatsApp. **Upgrade the widget to return a price** (pickup + dropoff + date → "ab €X · Festpreis") instead of a silent redirect. Trust micro-copy under CTA: *§49 PBefG · Festpreis · Antwort in 30 Min*.
4. **Trust strip** *(`TrustStrip`)* — keep 4 icons but **add numbers**: years active, rides completed, fleet size, ⭐ Google rating + count. Pull stats from `site_settings`.
5. **Services** *(`HomeServicesSection`)* — keep cards; ensure **"ab €X" price range** on every card (data exists); optionally add one example route per service.
6. **How it works** *(`HowItWorks`)* — 3 steps is right; tighten step-2 copy to foreground the **"Festpreis in 30 Minuten"** promise as the reason to complete the form.
7. **Fleet preview** *(`FleetPreview`)* — keep photo + capacity; **add an example "ab €" per vehicle** to connect vehicle ↔ price.
8. **Price transparency** *(new homepage teaser → `/preise`)* — embed a **mini route calculator / price teaser** ("Strecke eingeben → Festpreis ab €X") above the testimonials; full table stays on `/preise`. Format: 2 inputs + result chip, links to full pricing.
9. **Testimonials** *(`TestimonialsSection`)* — **add a live/periodically-synced Google rating header** (★ 4.9 · 120 Bewertungen) above the existing manual carousel; slow rotation to ~9–10s; add "alle Bewertungen" link. `Testimonial.source` already supports `google_review`.
10. **B2B section** *(new `BusinessSection`)* — Headline: *"Für Unternehmen: planbare Fahrten auf Rechnung."* 3 bullets (Monatsrechnung / fester Ansprechpartner / wiederkehrende Strecken). CTA → contact pre-set to `business` subject or a B2B inquiry form.
11. **FAQ teaser** *(`FaqTeaser`)* — show **5** questions: price certainty, lead time, cancellation, areas served, business invoicing.
12. **Final CTA** *(new `FinalCtaSection`)* — Headline *"Bereit, planbar anzukommen?"* + Book button + phone + WhatsApp; charcoal background, cream text, gold CTA.
13. **Footer** *(`Footer`)* — already strong; verify Impressum/Datenschutz/AGB, add **WhatsApp** link + social icons, keep language toggle and address block.

---

## PHASE 7 — Design System Recommendations

**Color**
- *Resolve the green-vs-gold split (the #1 system issue) — this is a BRAND decision, not a cleanup:* the site renders **green** as its live accent (42 files of `--color-*`) while the design tokens + UI primitives pull **gold/charcoal** (25 files). Decide one primary accent, then unify both layers on it. **Recommendation: commit to gold/charcoal/cream** — it matches the premium-transport category (Bavaria's gold/amber, Blacklane's monochrome) and the stated `layout.tsx` intent; green is a category outlier. Migration scope: ~42 files remap `--color-accent-primary`/`--color-bg-strong`/`--color-text-primary` → gold/charcoal/ink tokens. If green is kept deliberately (distinctiveness), instead remap the ~25 gold-token files to green. Either way: **one** source of truth. *Why:* the current split is visible to users (green chrome around gold form fields) and compounds with every new component.
- *Gold #A8865A:* reads premium and is **on-trend** (Bavaria uses gold/amber). Keep as the brand accent — but **not as the primary CTA fill** (contrast risk).
- *Charcoal hero vs cream-led:* charcoal hero is a valid premium choice; keep it but ensure the embedded widget sits on a cream surface for legibility.
- *CTA color:* gold on cream can fail 4.5:1. Recommend a **higher-contrast CTA** — `gold-deep #6E5430` fill (or charcoal) with cream text for primary buttons; reserve light gold for accents/borders. *Why:* accessibility + click-through.

**Typography**
- *Cormorant headings:* a genuine differentiator, but the **category outlier** (all 5 deep-dives use sans-serif). Verdict: **keep Cormorant for editorial headings** (it's part of StepNow's premium edge) but ensure mobile H1 is ~`text-section` (3rem) not `display-*`, weight 500–600, with tight line-height for punch. Don't let serif slow the functional surfaces (widget, wizard) — keep those Inter.
- *Inter body-lg 19px:* correct for readability; keep.
- *Unused tokens:* `display-xl/lg/md` and `hero-lg` appear under-used vs `section`/`hero`. Audit usage and **cut the display-* tokens that aren't referenced** to slim the scale.

**Spacing**
- Verify `section`/`section-lg`/`section-hero` applied consistently (some sections hardcode). `section-mobile 2.5rem` is a touch tight for a premium feel — consider 3rem on key breaks.

**Components**
- *Primary button:* re-check contrast (see CTA color); ensure visible focus ring (the gold-deep focus ring exists in `globals.css`).
- *Cards:* StepNow uses border + subtle `premium` shadow + hover lift (`card-hover`) — matches premium competitors; keep.
- *Inputs:* border-only is fine and on-brand; for the **booking widget**, larger touch targets + inline validation.
- *Mobile booking CTA:* `MobileStickyBar` is a **strength** competitors lack — keep, and add WhatsApp as a third action or swap phone↔whatsapp by setting.

**Animation**
- `ScrollReveal` is used tastefully (deferred sections) and respects `prefers-reduced-motion`. Not overused. For the wizard, add **inline price-update micro-animation** (number tween) when the calculator lands — mirrors Flughafen-Transport's "lock-in" feel.

---

## PHASE 8 — Implementation Roadmap

### QUICK WINS (1–3 days, frontend-only)
| Priority | Change | File(s) | Expected impact |
|---|---|---|---|
| 1 | **WhatsApp link** in Header, `MobileStickyBar`, Footer, contact | `shared/Header.tsx`, `MobileStickyBar.tsx`, `Footer.tsx`, `contact/ContactMethods.tsx` (use `settings.whatsapp_url`) | High — new low-friction channel |
| 2 | **Trust micro-copy under hero CTA** (§49 · Festpreis · 30 Min) | `home/HeroHomeSection.tsx` | Med — objection pre-empt |
| 3 | **Static Google rating + count** in TrustStrip/Testimonials header | `home/TrustStrip.tsx`, `TestimonialsSection.tsx` | High — social proof |
| 4 | **Numbers in trust strip** (years/rides/fleet) from settings | `home/TrustStrip.tsx`, `site_settings` | Med |
| 5 | **Announcement bar** (settings-driven) | new `shared/AnnouncementBar.tsx` | Med |
| 6 | **FAQ teaser 5 questions** | `home/FaqTeaserAccordion.tsx` | Low–Med |
| 7 | **"ab €" on FleetPreview cards** | `home/FleetPreview.tsx` | Med |
| 8 | **CTA contrast fix** (gold-deep fill) | button component / tokens | Med (a11y + CTR) |

### MEDIUM (1–2 weeks, may need a component or endpoint)
- **Homepage price teaser / mini route calculator** → `/preise` (maps PLZ → `PricingItem`). New component + a public pricing-lookup endpoint. Backend: light. Impact: High.
- **Homepage B2B section** + B2B inquiry path. New `BusinessSection`, reuse contact submit. Backend: none. Impact: Med–High.
- **Live Google Reviews sync** into `testimonials` (`source='google_review'`) via a periodic job; render aggregate. Backend: small. Impact: High.
- **Wizard: vehicle selection step with photos + capacity** (vehicles already public). Frontend mainly. Impact: Med.
- **Resolve green-vs-gold palette** (decide primary accent → remap ~42 green-`--color-*` files OR ~25 gold-token files onto it) + cut unused font tokens. Frontend-only but touches many files. Impact: High (visible brand consistency).
- **Verify admin migration status** end-to-end and update the stale "🔲 create" markers in `apps/frontend/CLAUDE.md`. Low effort, prevents confusion.

### LARGE STRATEGIC (1–2 months)
- **Route price calculator (real instant quote).** Backend 6-step: Model (reuse `PricingItem` + add zone/route table) → Schema (`PriceQuoteRequest/Response`) → `PricingQuoteService` (PLZ→zone→base+per-km, VAT 7%) → `PricingController` → `routes/api/v0/public/price-quote.py` → register router. Frontend: hero widget returns "ab €X · Festpreis", wizard shows running estimate. Business case: closes the #1 critical gap; matches every competitor.
- **Corporate account portal (B2B).** Login, view invoices, request recurring routes. Reuses invoicing + auth scaffolding. Business case: monetizes existing invoicing for monthly-billed clients.
- **Realtime booking confirmation.** Extend WebSocket to a public per-reference channel; confirmation page flips to "bestätigt + Festpreis" live when staff quote. Business case: removes the "did it go through?" anxiety; differentiator.
- **Driver profile pages** (trust builder) and **school-transport subscription** (recurring + monthly invoice).

---

## PHASE 9 — Executive Summary

**1. The 5 competitors analyzed**
- **Flughafen-Transport** — German fixed-price airport transfers. *Insight:* the hero widget computes the **price inline as you type** — no submit, no wait.
- **Komfort Transfer** — Stuttgart premium transfers. *Insight:* lead with **"ab €320" vehicle tiers** so price + comfort choice happen before commitment.
- **FlyingStar** — Stuttgart/FRA fixed-price. *Insight:* **live Google Reviews widget + "40 % günstiger als Taxi"** turn trust and savings into above-fold proof.
- **Blacklane** — global premium chauffeur. *Insight:* luxury is signaled by **photography + whitespace + risk-reversal** (free wait/cancellation), not serif type.
- **Bavaria Limousines** — Munich premium. *Insight:* **trust-by-numbers** (150+ cars, 20–30k rides/yr, 20+ years) plus a real fleet showcase.

**2. The 3 most critical gaps**
1. **No price anywhere in the booking path** — the hero widget redirects silently and the 5-step wizard ends with "we'll get back to you." Every competitor shows a number.
2. **No WhatsApp channel** — `whatsapp_url` exists in settings and a `MessageDelivery` WhatsApp mechanism exists, but no public link. Lowest-friction channel is missing.
3. **No live social proof / public B2B funnel** — manual testimonials only (no aggregate Google rating), and B2B billing the admin fully supports has no public entry point.

**3. The 3 highest-ROI quick wins (this week)**
1. Wire **WhatsApp** into Header + sticky bar + footer + contact (`settings.whatsapp_url`).
2. Add **Google rating + count** and **trust-by-numbers** to the trust strip / testimonials header.
3. Add **hero trust micro-copy** (§49 · Festpreis · Antwort in 30 Min) and fix **CTA contrast** to gold-deep.

**4. The single biggest booking-driver: an instant fixed-price quote.**
Sketch on the existing stack: a public `POST /public/price-quote` (FastAPI) → `PricingQuoteService` maps pickup/dropoff PLZ to a route/zone, reads the existing `PricingItem` table, applies 7% VAT, returns `{ from_price_eur, currency, note }`. Frontend: `HeroBookingWidget` calls it on input and shows **"ab €X · Festpreis"** (debounced, DSGVO-safe, no third-party); the wizard shows a running estimate; submit still creates the `booking_requests` row for staff confirmation. Reuses pricing data, BFF pattern, and zod schemas already in place — no new infrastructure.

**5. Recommended first sprint (5 tasks, ordered by impact)**
1. **WhatsApp everywhere** — `shared/Header.tsx`, `shared/MobileStickyBar.tsx`, `shared/Footer.tsx`, `contact/ContactMethods.tsx` (read `settings.whatsapp_url`).
2. **Hero trust micro-copy + CTA contrast** — `home/HeroHomeSection.tsx` + button token (gold-deep fill, cream text).
3. **Social proof upgrade** — `home/TrustStrip.tsx` + `home/TestimonialsSection.tsx` (Google rating/count + numbers from `site_settings`).
4. **Decide green-vs-gold, then unify palette** — confirm primary accent (recommend gold/charcoal/cream), then remap the green `--color-*` files (or vice-versa). Bigger than a one-file edit (~42 files) — schedule as its own PR.
5. **Spike the price-quote endpoint** — backend 6-step scaffold + wire `HeroBookingWidget` to show "ab €X" (kicks off the strategic calculator).

**6. Design verdict.**
StepNow's **Cormorant serif + editorial** styling is genuinely premium and more polished than most regional competitors — it is an asset, keep it. Two caveats correct the brief's premise. (a) The rendered accent is **green (#558518), not gold** — and green is a *double* category outlier (premium transport runs black/navy/gold/monochrome; see Bavaria, Blacklane). The tokens and `layout.tsx` already lean gold, so **commit to gold/charcoal/cream and retire the green** unless green is a deliberate brand signature. (b) The serif is also unusual (every deep-dived competitor uses sans-serif) but is a defensible differentiator — keep it for editorial headings, keep functional surfaces (widget, wizard) on Inter. The deeper issue is behavioural: the site *looks* like a boutique brand but *behaves* like a contact form. **Keep the visual identity; change the behaviour.** The single highest-impact change is to **put a fixed price into the hero widget** (and raise CTA contrast); the single highest-impact *visual* change is to **resolve the green-vs-gold split** so the brand renders one consistent accent.

---
*End of report.*
