# StepNow — Visual & Design Direction

**Goal:** Premium chauffeur aesthetic, Blacklane-inspired but original
**Constraint:** No photography budget — phone photos + stock only
**Strategy:** Achieve premium feel through typography, restraint, and space — not through expensive imagery

**Changelog**
- **v1.1 (May 2026)** — Added §11 documenting how the design system interacts with admin-editable content (admin-managed content cannot break the design; design tokens stay in code; content slots have predictable bounds).

---

## 1. Brand positioning (what the site must communicate)

In the visitor's first 5 seconds:

- "This is a *serious*, *licensed*, *professional* transport service"
- "These people are reliable — I trust them with my flight time / my parents' hospital trip / my children's school commute"
- "This isn't a cheap discount taxi — it's a calm, considered alternative"
- "Bilingual, properly run, German-quality"

What we are NOT trying to communicate:
- "Lowest price in town"
- "Available right now, instant pickup like a taxi"
- "Tech-startup, app-first, gig-economy"
- "Global, multinational" (we are regional and proud)

---

## 2. Visual references (calibration, not copy targets)

### Primary references — premium chauffeur

- **Blacklane (blacklane.com)** — the gold standard, but their site relies heavily on commercial photography we cannot replicate
- **Carey (careyworldwide.com)** — conservative, type-driven, less photo-dependent
- **Daimler EQ (mercedes-eq.com)** — automotive premium, restrained
- **MyDriver (mydriver.com)** — German market, mid-premium

### Secondary references — premium aesthetic without photography

Study these for how to look premium *without* commercial photography:

- **Aesop (aesop.com)** — luxury through typography, space, restraint
- **Cereal Magazine (readcereal.com)** — editorial premium, sparse imagery
- **COS (cosstores.com)** — minimalism, confident type
- **Reuters Graphics longform articles** — premium feel from layout and type alone
- **Hermès (hermes.com) "Tools for Life" sections** — premium without being flashy

The takeaway: premium ≠ lots of expensive photos. Premium = confidence, restraint, attention to detail.

---

## 3. Color palette

**Primary:**
- Deep black: `#0A0A0A` (not pure black — softer)
- Off-white: `#F8F6F1` (warm, not stark)

**Accent (pick one — don't use multiple):**

Option A — **Gold** (`#B8935A` or `#C9A961`)
→ Most "Blacklane-adjacent." Classic luxury. Best for chauffeur positioning.

Option B — **Deep blue** (`#1E3A5F`)
→ Trustworthy, less obviously luxury. Good for B2B focus.

Option C — **Burgundy** (`#7A2E2E`)
→ Distinctive, sophisticated. Less common in the category — could be a differentiator.

**My recommendation: Option A (Gold)** — the safest, most consistent with "premium chauffeur" positioning.

**Supporting neutrals:**
- Mid-grey: `#5A5A5A` (body text on light backgrounds)
- Light grey: `#D8D5CE` (dividers, subtle borders)
- Background grey: `#1A1A1A` (slight elevation from pure black)

**Rule:** Each page uses NO MORE than 4 colors total. The site overall is essentially monochrome with one accent. Restraint is the entire point.

---

## 4. Typography

**Headlines — Serif** (premium, editorial feel):
- **Cormorant Garamond** (Google Fonts, free) — elegant, slightly literary
- OR **Fraunces** (Google Fonts, free) — more modern, contemporary
- OR **Playfair Display** (Google Fonts, free) — well-known, classic

Use weights: 400 (regular) and 600 (semibold). Skip ultra-thin and ultra-bold.

**Body — Sans-serif** (clean, readable):
- **Inter** (Google Fonts, free) — neutral, modern, excellent on screens
- OR **Manrope** (Google Fonts, free) — slightly warmer Inter alternative

Use weights: 400 (body), 500 (UI elements), 600 (occasional emphasis).

**Implementation note:** Self-host fonts (don't load from Google Fonts CDN). Loading Google Fonts from Google's servers is a DSGVO problem in Germany — there have been actual lawsuits (LG München, Az. 3 O 17493/20, 2022). Use `next/font` in Next.js for automatic self-hosting.

**Type scale:**
- Hero headline: 64-80px (serif)
- Section headline: 40-48px (serif)
- Subsection: 24-28px (serif)
- Body large: 18-20px (sans)
- Body: 16px (sans)
- Caption / label: 13-14px (sans, often uppercase with letter-spacing)

**Critical detail:** Use generous line-height (1.5-1.7 for body, 1.1-1.2 for large headlines) and let things breathe. Cramped type kills premium feel instantly.

---

## 5. Photography strategy (with zero budget)

### What to do with phone photography

If Naeem can do a 30-minute photo session with his phone (any modern phone — iPhone 11+ or equivalent Android), aim for these THREE shots:

**Shot 1: The hero vehicle, exterior**
- One car, side angle
- Golden hour (just before sunset) or blue hour (just after sunset) — magic light
- Clean parking lot or in front of plain wall, no clutter
- Wipe the car spotless first
- Use portrait mode for slight background blur if available
- Shoot landscape, wide enough to crop later

**Shot 2: Interior detail**
- Tight crop on something specific: steering wheel, leather seat, dashboard
- Natural light from window — not flash, not direct sun
- Vehicle interior must be immaculate

**Shot 3: Naeem himself**
- Wearing what he wears for work (suit + tie, or a clean dark shirt)
- Against a plain background (white wall, dark wall, or natural — outside a building)
- Window light from the side (one window in a room = perfect light)
- Chest up, looking at camera, slight smile or neutral expression
- Multiple takes — pick the best

These three photos, edited with a consistent filter (Lightroom Mobile free preset, or VSCO), will carry the entire site.

### Editing

Free apps that produce professional results:
- **Lightroom Mobile** (free tier) — pick a moody preset like "B&W Strong" or "Cinematic"
- **VSCO** (free tier) — A6 or KK1 filters work well for chauffeur look
- Consistency matters more than the specific filter. ALL photos use the same one.

### Stock photography — only specific categories

If you must use stock, restrict to:
- **Atmospheric shots:** night skyline of Stuttgart, autobahn at twilight, airport terminal architecture, rain on a windshield
- **Abstract details:** hands on steering wheel (close crop), dashboard lights, leather texture
- **Architectural / non-human:** modern train station, airport arrivals hall, business district

**Never use:**
- People in suits getting into cars (instantly recognized as stock)
- Smiling drivers (instantly recognized)
- Generic taxi/car-rental imagery (yellow taxis especially)
- Anything with visible Western or American context (signs, license plates, etc.)

**Sources (in quality order):**
1. **Unsplash.com** — best free option, curated, modern
2. **Pexels.com** — second-best free
3. **Stocksy.com** — paid but distinctive; €10-30 per image
4. **Adobe Stock / Shutterstock** — last resort; most generic, but huge selection

---

## 6. Design devices that don't need photos

Use these to add visual polish without imagery:

### Backgrounds
- Solid dark backgrounds (#0A0A0A) with light text — premium default
- Subtle gradients (#0A0A0A → #1A1A1A) for slight depth
- Off-white sections (#F8F6F1) for content-heavy areas

### Decorative elements
- Thin hairline rules (1px gold or 1px light grey) as dividers
- Generous letter-spacing on small caps labels (e.g., `LANGUAGES SPOKEN`)
- Vertical and horizontal rules to structure content (think editorial newspaper layout)

### Icons
- One consistent icon set throughout:
  - **Lucide** (lucide.dev) — free, modern, clean
  - **Phosphor** (phosphoricons.com) — free, slightly more refined
- Use thin (1px) or regular weight, gold or off-white color
- No emoji ever

### Motion
- Subtle fade-in on scroll (200-300ms)
- No bounces, no flashy animations
- Maybe one understated parallax effect on hero
- Use sparingly — premium is calm, not active

### Trust signals (use these everywhere)
- "Konzessioniert nach § 49 PBefG" badge — top of pages, near hero
- "Festpreis vor Fahrtbeginn" guarantee
- "Erfahrene, geprüfte Fahrer mit Personenbeförderungsschein"
- Real Google rating once available
- Real testimonials once gathered
- Years of experience (if applicable)

---

## 7. Layout principles

### Whitespace
- Section padding: minimum 96px top and bottom on desktop, 64px on mobile
- Container max-width: 1200-1280px (don't go ultra-wide; intimate feel)
- Inside containers, use comfortable padding (24-48px)
- Don't fill every pixel — let things breathe

### Grid
- 12-column grid on desktop
- Most content lives in 6-8 columns (centered), not full width
- Use asymmetric layouts occasionally for visual interest

### Hierarchy
- Each section: ONE clear focal point — a headline, an image, or a CTA
- Never compete for attention within a section
- "Above the fold" matters most: hero must do its job in 5 seconds

### Mobile
- Mobile is 60%+ of traffic in Germany for local services
- Design mobile-first. Test every screen on a real phone.
- Phone numbers must be clickable. Booking form must be easy on a small screen.
- Navigation collapses to hamburger; keep it simple — 4-5 items max

---

## 8. Specific page direction

### Homepage hero (most important)

Instead of trying to compete with Blacklane's photography:

**Option A — Type-only hero (recommended for budget)**
- Dark background (#0A0A0A)
- Large serif headline center or left: *"Ihre TAXI-Alternative."* (next line, smaller) *"Vorbestellt. Pünktlich. Zum Festpreis."*
- Below: two CTAs — *"Jetzt buchen"* and *"+49 7153 9292841"*
- Gold accent line above the headline
- A small concession badge bottom of hero: *"Konzessioniert nach § 49 PBefG"*

This works. No image needed. Looks premium because of restraint.

**Option B — One subtle background image**
- Same as above, but with one carefully-chosen atmospheric photo (autobahn at night, e.g.) behind a dark overlay (70-80% opacity black)
- The image isn't the hero — the text is. The image just sets atmosphere.

### Service detail pages

Each of the four service pages (Flughafen / Krankenhaus / Schüler / Shuttle):
- Header with service name in serif, large
- One descriptive paragraph
- Process — 3 steps in a horizontal row, each with an icon and short text
- Inclusions / what makes it different — bullet list or table
- Booking CTA — gold button, prominent
- Optional: one relevant atmospheric image (airport terminal for /flughafentransfer, hospital exterior for /krankenhausfahrten — these can be stock)

### Booking page

- Simple, clean, multi-step (4 steps with progress bar)
- Step 1: Service type (4 cards)
- Step 2: Date, time, passengers, luggage
- Step 3: Pickup and destination
- Step 4: Contact info + privacy consent
- Submit returns: "Wir senden Ihnen innerhalb von 30 Minuten ein Festpreis-Angebot." plus a booking reference in the format `SN-YYYYMMDD-XXXXXX` (e.g. `SN-20260511-AB3F93`)
- Each step takes the whole screen — no busy form on one page
- Form feels fast: instant validation, no friction

### About page

- Naeem's photo (the one professional phone shot) — half-width
- His story in his own words, polished — 3-4 short paragraphs
- The fleet — 2-3 cards with the real vehicles
- Credentials — concession, insurance, driver qualifications
- Service area — simple map (OpenStreetMap, not Google for DSGVO)

---

## 9. What this gives you

A site that:
- Looks premium in the same family as Blacklane, without imitating it
- Works on a zero-photography budget through typography and restraint
- Is technically excellent (Next.js, fast, SEO-friendly, DSGVO-clean)
- Represents StepNow honestly — no false promises customers can't verify
- Differentiates from every other CodeCanyon taxi template in the region

**What this does NOT give you:**
- The visual punch of full commercial photography
- The polish of a brand built over 10 years
- The trust of an established global name

Those things take time and budget to build. The site can be excellent within constraints, and grow as the business does.

---

## 10. Honest grading expectations

If we execute this plan well, here's where StepNow's site lands relative to peers:

- **Better than:** 95% of regional German Mietwagen/taxi-alternative sites (most of which look exactly like step-now.de currently does)
- **On par with:** Mid-tier premium chauffeur services (MyDriver level)
- **Below:** Blacklane, Carey, top global players (their advantage is photography + scale, not design system)

That ceiling is achievable and meaningful. Naeem's actual customers — locals booking airport transfers, families booking hospital trips, businesses booking employee transport in the Stuttgart area — will not compare him to Blacklane. They'll compare him to other regional operators. That's the right benchmark, and it's winnable.

---

## 11. How the design system interacts with admin-editable content

The visual design must hold up even though most of the content Naeem will see on the site comes from the database and can be edited via `/admin`. This section keeps design and content concerns properly separated.

### 11.1 What lives in code (design tokens) and what lives in the database (content)

| In code (Tailwind config, components, design tokens) | In the database (editable by Naeem via admin) |
|---|---|
| Color palette | Service descriptions, FAQ answers, testimonial quotes |
| Type scale and font choices | All UI labels (button text, error messages, navigation labels) |
| Spacing scale, grid, layout breakpoints | Site settings (phone, address, hours) |
| Icon set | Pricing categories and items |
| Animation timing curves | Legal page bodies (Impressum, Datenschutz, AGB) |
| Component visual structure (where things go, how they nest) | Vehicle list and features |
| Section padding, hairlines, decorative rules | Hero copy and section headlines (via `ui_strings`) |

A designer reading this doc must understand: **the design tokens are immutable in the running system. Only content varies.** When you sketch a component, treat the text it shows as a placeholder for arbitrary content within stated bounds.

### 11.2 Content slots have bounds

To prevent admin edits from breaking the design, every database column has a backend-enforced maximum length and (where it matters) a minimum. The design system must respect the same bounds:

| Content type | Max length | Design implication |
|---|---|---|
| Service title | 200 chars | Don't size hero text to expect only short titles. Test with the longest realistic German title. |
| Service short description | ~500 chars (no DB cap; UI suggests 2-3 sentences) | Card height must accommodate 3 lines comfortably. |
| Pricing item `from_location` / `to_location` | 200 chars each | Table cells should wrap, not truncate. |
| Vehicle feature pill | 200 chars per array element | Feature pills wrap to next line; never single-line scroll. |
| UI string value | 10,000 chars | But typical values are short. The `is_locked` flag protects critical strings from being expanded into novels. |
| FAQ question | 500 chars | Accordion headers wrap; don't size to 1-line assumption. |
| Testimonial quote | unbounded (text column) | Cards have a "Read more" affordance after ~300 chars in design. |
| Legal page body | unbounded (text column) | Standard prose styling; long-form expected. |

### 11.3 Empty-state design

Some sections only render if their data exists. The design must specify both states:

| Section | Populated state | Empty state |
|---|---|---|
| Fleet preview (homepage §1.7) | 3-up grid of vehicle cards | **Hide section entirely** |
| Testimonials (homepage §1.9) | Carousel of customer quotes | **Hide section entirely** — never show placeholders |
| Service pricing snapshot (§3.6) | Mini-table with 4-6 routes | "Festpreis-Angebot auf Anfrage" + quote CTA |
| Pricing tables (§4.2, per-service) | Full pricing tree | "Festpreis-Angebot auf Anfrage" + quote CTA |
| Social icons in footer | Row of icons | Row hidden if no socials set |
| Concession badge in hero | "Konzessioniert nach § 49 PBefG · Lizenz {number}" | Show "Konzessioniert nach § 49 PBefG" alone until Naeem fills the number |

The empty states matter just as much as the populated ones. Designing both ensures the site looks complete even before Naeem has finished populating content.

### 11.4 Booking reference number — a small but visible design element

Every successful booking surfaces a reference in the format `SN-YYYYMMDD-XXXXXX` (e.g. `SN-20260511-AB3F93`). It appears on the confirmation screen and in the customer's confirmation email.

Design treatment:
- Mono-spaced font in confirmation UI (or normal sans with letter-spacing) — makes it look like a real, official identifier rather than a chat message
- Large enough to read across a phone screen — at least 18px
- Selectable text (not in an image) so customers can copy it
- Subtle "Copy" affordance (icon button next to it) on the confirmation screen

### 11.5 Localization-aware design

The site is bilingual. German strings are often 15-30% longer than their English equivalents. Design for German first; English will fit comfortably.

The reverse — designing for English and hoping German fits — is the most common failure mode for bilingual sites built by English-speaking designers. Buttons especially: "Jetzt buchen" is longer than "Book now"; "Festpreis-Garantie" is longer than "Fixed-price guarantee."

When in doubt, ask: "Will the longest plausible German translation of this string still look balanced?"

### 11.6 Admin UI design — German-only, restrained

The admin panel at `/admin` is German-only (Naeem's working language). It does not need to be visually exciting; it needs to be:

- Calm and uncluttered — Naeem will spend hours here over the years
- Predictable — every list/edit/save flow looks identical across the 14 admin sections
- Forgiving — undo via soft-delete + restore is one click; never destructive
- Honest — when the backend rejects an edit with a `RequiredFieldError`, the German message is shown verbatim ("Geschäftsname ist gesetzliche Pflicht (§ 5 TMG)") in red inline next to the offending field, not in a generic error toast

Admin design references: Linear admin views (calm CRUD), Stripe Dashboard (clear hierarchy), Vercel project settings (predictable form layout). Admin is not where the brand shows off — it's where Naeem gets work done.

---

## 12. Cross-references

- Page-by-page specifications: `docs/website-outline.md`
- Frontend architecture (component tiers, i18n, data fetching): `docs/architecture/frontend.md`
- Backend architecture (API contract, content model, safeguards): `docs/architecture/backend.md`
- Legal page drafts: `docs/legal/`
- Live-site triage list: `docs/triage-checklist.md`
