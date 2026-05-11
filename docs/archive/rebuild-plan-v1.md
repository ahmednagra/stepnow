# StepNow Rides & Movers — Website Rebuild Plan

**Project owner:** Muzakir (developer) for Naeem Ahmad (business owner)
**Domain:** step-now.de
**Business:** Mietwagenverkehr (passenger transport with driver), marketed as "TAXI-Alternative"
**Region:** Deizisau / Esslingen / Stuttgart area
**Target launch:** [To be confirmed — pending concession]
**Drafted:** May 2026

---

## 1. What we're building

A single-purpose marketing and booking site for a regional Mietwagen operator. Four service lines, bilingual (German primary, English secondary), B2C and B2B booking flows.

**Explicitly NOT in scope:**
- Parcel delivery (Paketdienst) — removed from public-facing site despite being on the Gewerbe-Anmeldung
- Taxi service — business is Mietwagen only (pre-booked, no street hail, no taxi rank)
- Real-time GPS tracking, driver app — out of scope for V1
- E-commerce / cart — bookings are quote requests, not direct purchases

---

## 2. Pre-launch dependencies (must be done before site goes live)

These are not website tasks but block the launch:

1. **PBefG concession (§ 49)** — applied, awaiting decision. Without this, site cannot legally promote passenger transport.
2. **USt-IdNr** from Finanzamt Esslingen — needed for Impressum and invoicing
3. **Mietwagen vehicle approvals** — each car must be registered with the Verkehrsbehörde (Konzessionsurkunde per vehicle)
4. **Driver licenses** — every driver needs a Personenbeförderungsschein (P-Schein / Fahrerlaubnis zur Fahrgastbeförderung) plus, depending on vehicle type, BKrFQG qualification
5. **Business liability insurance** — Mietwagen operators must have specific passenger transport insurance (Personenbeförderungs-Haftpflicht)
6. **Tarifordnung / Preisaushang** — pricing must be publicly displayable
7. **Legal review of Impressum, Datenschutz, AGB** — by a German lawyer or via eRecht24

If any of these are not in place by launch, the website should not go live with booking functionality enabled.

---

## 3. Sitemap (passenger-only)

```
step-now.de  (Homepage)
│
├── /flughafentransfer        Airport transfer service detail page
├── /krankenhausfahrten        Hospital / medical transport service detail page
├── /schuelerbefoerderung      School transport service detail page
├── /shuttle-service           Group / business shuttle service detail page
│
├── /preise                    Pricing — rates per service, FAQ-style
├── /ueber-uns                 About: Naeem, fleet, drivers, certifications
├── /kontakt                   Contact: phone, email, address, hours, form
│
├── /buchen                    Main booking form (linked from all CTAs)
│
├── /impressum                 Legal notice (mandatory)
├── /datenschutz               Privacy policy (mandatory)
└── /agb                       Terms & conditions (strongly recommended)
```

English equivalents under `/en/...` with same structure (`/en/airport-transfer`, etc.)

**No `/services` index page** — clutter. Service links live in nav and homepage tiles only.
**No `/blog`** — V1. Maybe later for SEO.

---

## 4. Page-by-page content brief

### 4.1 Homepage (/)

**Above the fold:**
- Logo top-left, language switcher top-right (DE / EN)
- Phone number top-right — always visible
- Hero headline: **"TAXI-Alternative — StepNow Rides"**
- Subheadline: **"Vorbestellte Fahrten in der Region Stuttgart. Sicher, pünktlich, zum Festpreis."**
  - (English: "Pre-booked rides in the Stuttgart region. Safe, on time, at a fixed price.")
- Two primary CTAs: **"Jetzt buchen"** (form) and **"Anrufen: +49 7153 9292841"** (tel: link)
- Hero image: ONE real photo — either Naeem standing next to a clean vehicle, or a professional fleet shot. NO stock photos.

**Below the fold (in order):**

1. **Trust strip** — a single row: "Konzessioniert nach PBefG" + "Festpreis vor Fahrtbeginn" + "Erfahrene Fahrer" + "24/7 vorbestellbar". Icons + short labels, no fluff.

2. **Service tiles (4)** — Flughafentransfer / Krankenhausfahrten / Schülerbeförderung / Shuttle Service. Each: icon, name, 1-sentence description, "Mehr erfahren" link to detail page.

3. **How it works (3 steps)** — "1. Anfrage senden" → "2. Festpreis-Bestätigung erhalten" → "3. Pünktlich abgeholt werden". Visual, simple.

4. **Why StepNow (3-4 points)** — fixed price (not metered), pre-booked reliability, professional drivers, regional knowledge. Differentiates from random taxis.

5. **Booking form** — same form as `/buchen`, embedded. Fields: name, phone, email, pickup, destination, date/time, passenger count, notes. Submit triggers email + WhatsApp notification to Naeem.

6. **Real testimonials** — only if real ones exist. If not, omit entirely. Fake testimonials are conversion-killers in Germany.

7. **FAQ (5-6 questions)** — booking process, cancellation, payment, vehicle types, advance booking time.

8. **Contact strip** — phone, email, address, opening hours.

9. **Footer** — service quick links, legal links (Impressum / Datenschutz / AGB), social (only if accounts actually exist).

**Remove from current site:**
- ❌ "00+" placeholder stats
- ❌ All `example.com` social links
- ❌ "Mini Car" page title
- ❌ Footer tagline "Wo Frühadopter und Innovationssuchende lebendige, kreative Technik finden"
- ❌ "Ablauf der Autovermietung" heading (wrong business)
- ❌ Service tile "Kurier- und Firmendienste" (no parcel)
- ❌ Footer service link "Dash Transport"
- ❌ FAQ entries about "Limousinen, SUVs, Vans und Elektrofahrzeuge" (replace with real fleet info)

### 4.2 Service detail pages

Each of the four service pages follows the same template:

1. **Hero** — service name, one-sentence value prop, primary CTA "Diesen Service buchen"
2. **What this service includes** — specific to the service (e.g., airport transfer = meet & greet at terminal, luggage assistance, flight tracking, fixed price)
3. **Pricing snapshot** — typical price range or "Festpreis auf Anfrage" with a quote form
4. **Who this is for** — concrete examples (e.g., business travelers, families with elderly, school children with mobility needs)
5. **How to book this service** — 3 steps specific to the service
6. **Booking form** — pre-filled with the service name
7. **FAQ** — 3-4 service-specific questions
8. **Related services** — links to the other 3

These pages are **the SEO foundation**. Each one targets specific search terms:
- /flughafentransfer → "Flughafentransfer Stuttgart", "Flughafentransfer Esslingen", "Flughafen Stuttgart Taxi Alternative"
- /krankenhausfahrten → "Krankenfahrt Esslingen", "Krankentransport Mietwagen Stuttgart"
- /schuelerbefoerderung → "Schülerbeförderung Esslingen", "Schultaxi Deizisau"
- /shuttle-service → "Shuttle Service Stuttgart", "Gruppenfahrt Mietwagen Esslingen"

Each page must have **unique content**, not template fill. Aim 600-1000 words per service page.

### 4.3 /preise (Pricing)

Critical for trust. German customers don't book without seeing prices.

Structure:
- **Table or card layout per service type**
- For airport: fixed prices to STR (Stuttgart Airport) from major regional postcodes
- For hospital: per-km rate or fixed packages
- For school: monthly subscription tiers
- For shuttle: per-vehicle, per-hour, or per-day
- **Inclusions**: 19% MwSt, luggage, waiting time (15 min free), child seat
- **Exclusions**: tolls, parking fees
- **Cancellation policy**: 24h free, after that X%
- **Payment methods accepted**: cash, EC card, invoice (for B2B), PayPal
- **Quote request CTA** at bottom

### 4.4 /ueber-uns (About)

Trust page. Should answer "who is behind this business?"

- Naeem's photo and short bio (3-4 sentences, real story)
- Business background: when started, why this region, what makes the service different
- The fleet — real photos of actual vehicles, with model and capacity
- The drivers — qualifications (P-Schein, BKrFQG), languages spoken
- Service area — map of covered region
- Licenses and certifications — PBefG concession reference, insurance

### 4.5 /kontakt (Contact)

- Phone (clickable on mobile)
- Email
- Business address (Blumenstr. 8, 73779 Deizisau)
- Opening hours (when phone is staffed)
- Google Maps embed (only after Datenschutz updated for it)
- Contact form (simple — name, email, message)
- WhatsApp link (if business WhatsApp is set up)

### 4.6 /buchen (Booking form — standalone)

The most important page after homepage. Form fields:

**Service selection** (radio or tile):
- Flughafentransfer / Krankenhausfahrt / Schülerbeförderung / Shuttle / Andere

**Pickup details:**
- Abholort (address with postcode, autocomplete recommended)
- Datum (date picker)
- Uhrzeit (time picker)

**Trip details:**
- Zielort (destination address)
- Anzahl Personen (1-8 dropdown)
- Gepäck (none / 1-2 / 3+ pieces)
- Besondere Anforderungen (textarea — wheelchair, child seat, etc.)

**Contact:**
- Name (Pflichtfeld)
- Telefon (Pflichtfeld)
- E-Mail (Pflichtfeld)

**Consent:**
- Checkbox: "Ich habe die Datenschutzerklärung gelesen und akzeptiere sie."
- Submit button: "Festpreis-Angebot anfordern"

**Post-submit:**
- Confirmation page: "Danke! Wir melden uns innerhalb von 30 Minuten mit einem Festpreis-Angebot zurück."
- Email to customer confirming receipt
- Email + WhatsApp to Naeem with full booking details
- For B2B: option to mark as "Geschäftskunde" with company name + USt-IdNr fields

---

## 5. Bilingual implementation

**URL structure:**
- German (default): `step-now.de/...`
- English: `step-now.de/en/...`
- `hreflang` tags on every page pointing to both versions
- Language switcher in header (always visible, top-right)
- Auto-detect on first visit (German IP → DE, others → EN), but **always honor user choice** via cookie

**Content:**
- ALL pages exist in both languages
- ALL form labels, error messages, validation text translated
- ALL email confirmations, SMS, WhatsApp messages respect user's chosen language
- Legal pages (Impressum, Datenschutz, AGB) in **both** German and English
  - German version is the legally binding one
  - English version must include disclaimer: "This is a translation for convenience. The German version is legally binding."

**SEO:**
- Each language version has its own meta title, description, OG tags
- German keywords for German pages, English keywords for English pages — don't translate keywords literally

---

## 6. Tech stack recommendation

Given the project scope (small site, mostly content + one form, SEO-critical, low operational complexity) and Muzakir's existing skill set (Python/FastAPI, Tailwind):

**Option A — Recommended: Next.js (App Router) + Tailwind + Postgres**
- Server-rendered for SEO (critical for German local search)
- File-based routing matches the sitemap cleanly
- i18n built-in via `next-intl` or `next-i18next`
- Form submission to FastAPI backend (or Next API route directly)
- Hosted on Vercel or Hetzner (German hosting = better for DSGVO + faster DE traffic)
- Postgres for: bookings table, contact submissions, future user accounts

**Option B — Faster to ship: Astro + Tailwind + FastAPI backend**
- Static-first, very fast, very SEO-friendly
- Smaller learning curve if Next.js feels heavy for this
- Astro's i18n is solid
- FastAPI handles form submissions, email/WhatsApp dispatch

**Option C — Keep current Laravel template, rebuild content**
- Fastest path to "fixed" site
- But: the current template's foundation (PHP, generic theme) limits long-term flexibility
- Risk: continues to feel like a generic template

**My recommendation: Option A or B.** Don't keep patching the current template. It's a generic taxi-rental theme that wasn't built for this business. A clean rebuild on Next.js/Astro will be faster long-term and produce a site that actually represents the business.

**Hosting & infra:**
- **Hosting:** Hetzner Cloud (Germany) — €5-15/mo, DSGVO-friendly, German jurisdiction
- **Domain:** already have step-now.de
- **Email:** Postmark or Resend for transactional emails (booking confirmations)
- **SMS/WhatsApp:** Twilio or WhatsApp Business API (later phase)
- **Analytics:** Plausible (DSGVO-compliant, no cookies, no consent banner needed) — strongly preferred over Google Analytics
- **Maps:** Once added, consider OpenStreetMap (no DSGVO complications) instead of Google Maps

---

## 7. Phased delivery plan

### Phase 1 — Foundation (Week 1-2)
- Set up repo, hosting, domain pointed correctly
- Build component library (header, footer, forms, cards, language switcher)
- Implement i18n infrastructure
- Create legal pages: Impressum, Datenschutz, AGB (use the drafts already created, get lawyer review)
- Deploy a placeholder homepage that says "Webseite im Aufbau — bitte rufen Sie uns an: +49 7153 9292841" — replaces the current confused site immediately

### Phase 2 — Core content (Week 3-4)
- Homepage with all sections
- 4 service detail pages with real, unique copy
- Pricing page (requires real prices from Naeem)
- About page (requires real photos and bio from Naeem)
- Contact page

### Phase 3 — Booking flow (Week 5)
- Booking form with all fields, validation, multi-step UX
- Backend endpoint for submissions
- Email confirmation to customer
- Email + WhatsApp notification to Naeem
- Anti-spam (honeypot + rate limiting + optional captcha)

### Phase 4 — Polish & SEO (Week 6)
- Meta tags, OG images, structured data (LocalBusiness schema, Service schema)
- Sitemap.xml, robots.txt
- Performance pass (Lighthouse 90+ targets)
- Accessibility pass (WCAG AA basics — alt text, keyboard nav, color contrast)
- Cross-browser testing
- Mobile testing on real devices

### Phase 5 — Pre-launch (Week 7)
- Legal review of all legal pages by German lawyer
- Final content review with Naeem
- Set up Google Business Profile
- Set up Plausible analytics
- Verify all emails arrive correctly
- Soft launch: tell Naeem only, run for 3-5 days with real bookings to catch bugs
- Hard launch: announce, run Google Ads if budgeted

---

## 8. What I need from Naeem to start

These cannot be invented; the client must provide them:

1. **Photos** — at least 3-5: of Naeem, of vehicles (inside + outside), of drivers if multiple
2. **Real prices** — at minimum a price list for airport transfer (most common service)
3. **Service areas** — exact regions covered (postcode range, or city list)
4. **Vehicle details** — make, model, year, capacity for each car in the fleet
5. **Driver qualifications** — P-Schein numbers, any language skills
6. **Hours of operation** — when bookings are accepted, when rides happen
7. **Booking lead time** — how far in advance do they need a booking?
8. **Real testimonials** — from existing customers, with permission to use names
9. **Concession reference number** — once granted, for the Impressum and About page
10. **USt-IdNr** — once issued by Finanzamt

Without these, the site will look generic and untrustworthy — exactly the problem with the current version.

---

## 9. Risks and open questions

- **Concession timing** — if it doesn't arrive before launch, the site cannot go live with passenger transport messaging. Fallback plan needed.
- **Naeem's involvement** — content quality depends entirely on his willingness to provide real photos, prices, and stories. If he wants a "set and forget" site, expectations need adjusting.
- **Competition** — locally, real taxi companies and FreeNow have strong incumbency. Realistic expectation: first 6 months are about establishing trust and capturing local-intent searches, not high volume.
- **Liability** — Mietwagen operators have specific legal duties (Rückkehrpflicht, Auftragsbuch documentation). The site shouldn't promise things that violate these (e.g., "instant pickup like a taxi").

---

*This document is a working plan. It will be refined as questions get answered and the project progresses.*
