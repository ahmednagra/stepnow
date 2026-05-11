# StepNow Live Site — Emergency Triage Checklist

**Goal:** Stop the harm the current site is doing, in 1-2 days, before any rebuild work.
**Status:** Business is live, concession granted, full admin access available.
**Approach:** Content edits to existing template only. NO new code or design.

---

## Priority 0 — Legal exposure (do first, today)

### ✅ Task 1: Deploy Impressum page

- Use the draft from `impressum_de.md` (German version goes live, English version optional but recommended for bilingual approval compliance)
- Fill in the placeholders:
  - PBefG concession: issuing authority, reference number, date granted
  - Supervisory authority (Aufsichtsbehörde)
  - Steuernummer or USt-IdNr (whichever has been issued so far)
- Page URL: `/impressum`
- Add link to footer (every page must link to it)
- Add link to main navigation if possible (German convention is footer; nav is bonus)

### ✅ Task 2: Deploy Datenschutzerklärung page

- Use the draft from `datenschutz_de.md`
- Verify the "currently no Google services" assumption still holds on the live site
- If you've already added Google Maps / Fonts / Analytics, swap in the corresponding sections from Section 6 of the draft
- Page URL: `/datenschutz`
- Add link to footer alongside Impressum

### ✅ Task 3: Add AGB page (Terms & Conditions)

- This is technically optional but strongly recommended for Mietwagen operators
- Cover: booking process, cancellation policy, payment terms, liability limits, complaints process
- Get this drafted next week — for triage, a placeholder "AGB folgen in Kürze" is acceptable
- Page URL: `/agb`

---

## Priority 1 — Visible junk that destroys trust (do next, same day)

### ✅ Task 4: Fix page title (browser tab)

**Current:** `Home | Mini Car`
**Change to:** `StepNow Rides — Ihre TAXI-Alternative in der Region Stuttgart`

Set this in the site's general settings (likely Admin → Settings → SEO / Meta).

### ✅ Task 5: Fix footer tagline

**Current:** "Car – Wo Frühadopter und Innovationssuchende lebendige, kreative Technik finden."
**Change to:** "StepNow Rides & Movers — Ihre zuverlässige TAXI-Alternative in Deizisau, Esslingen und der Region Stuttgart. Vorbestellte Fahrten zum Festpreis."

This appears twice in the footer (once in main column, once near logo). Fix both.

### ✅ Task 6: Remove placeholder stats section

**Current:** "00+ Fahrzeugflotte / 00M+ Gefahrene Meilen / 00K+ Reservierte Buchungen / 00K+ Abhol- & Rückgabeorte"

**Options:**
- **A (best):** Replace with real numbers from Naeem (since Jan 2026 → ~4 months of operation, there should be some real data)
- **B (acceptable):** Replace with non-numeric trust signals: "✓ Konzessioniert nach PBefG / ✓ Festpreis vor Fahrtbeginn / ✓ Erfahrene, geprüfte Fahrer / ✓ 24/7 vorbestellbar"
- **C (last resort):** Remove the section entirely

Do NOT leave "00+" placeholders.

### ✅ Task 7: Replace fake social media links

**Current (all four):**
- facebook.com/example
- instagram.com/example
- youtube.com/example
- tiktok.com/@example

**Options:**
- If real accounts exist → replace with real URLs
- If no real accounts → remove the icons entirely (no broken/example links)
- Half-measure to avoid: don't point all icons at the homepage as a "fix"

### ✅ Task 8: Remove parcel/courier mentions

**Service tile to remove:**
- "Kurier- und Firmendienste" from the services grid on homepage and `/services` page

**Footer link to remove:**
- "Dash Transport" from footer service quick-links

Reason: business is passenger-only, parcel content confuses positioning.

### ✅ Task 9: Fix wrong-business section headings

**Current heading:** "Ablauf der Autovermietung" (car rental process)
**Change to:** "Ablauf einer Buchung" (booking process)

You're not a car rental company. This heading appears above the "Fahrzeug auswählen → Kontakt aufnehmen → Abholort auswählen → Fahrt genießen" steps.

### ✅ Task 10: Fix vehicle FAQ entry

**Current Q&A:**
> Q: Welche Fahrzeuge stehen zur Verfügung?
> A: Wir bieten Limousinen, SUVs, Vans und Elektrofahrzeuge für alle Bedürfnisse.

**Change to (use real fleet — ask Naeem):**
> Q: Welche Fahrzeuge stehen zur Verfügung?
> A: Unsere Flotte umfasst [real vehicles, e.g., "Mercedes E-Klasse, VW Caddy Maxi (bis 7 Personen) und einen rollstuhlgerechten Transporter"]. Für besondere Anforderungen sprechen Sie uns gerne an.

### ✅ Task 11: Remove duplicate FAQ entries

**Current:** The same 4 FAQ questions are listed twice (you can see "Wie kann ich ein Auto buchen?" appears twice, "Bieten Sie Flughafentransfers an?" appears twice). One block is even broken (answer missing on the second).

**Fix:** Remove the duplicate block entirely. Keep one clean set of FAQ entries.

---

## Priority 2 — CTA and booking clarity (same day or next day)

### ✅ Task 12: Fix the broken booking CTA

**Current:** Button says "Buchungen folgen in Kürze" (Bookings coming soon)
**Reality:** Business is operating; bookings ARE happening via phone right now.

**Change to:**
- Primary CTA: "Jetzt anrufen: +49 7153 9292841" (clickable `tel:` link)
- Secondary CTA: "Per Formular anfragen" (scrolls down to the booking form lower on page)

The form lower on the homepage already exists ("Auto buchen" form with name, email, phone, pickup, destination, etc.). Confirm it actually submits somewhere (sends an email to Naeem). If not, that's bug #1 to fix before anything else.

### ✅ Task 13: Verify and fix the booking form

Check that the form on the homepage:
1. Actually submits when filled in
2. Sends an email to Naeem (info@step-now.de or wherever)
3. Includes ALL the fields visible (don't lose data)
4. Shows a confirmation message to the user after submission
5. Has a privacy checkbox: "Ich akzeptiere die Datenschutzerklärung" (link to /datenschutz)

If the form is currently fake/non-functional, this is critical — remove the form and replace with phone-only CTA until you can fix it. A broken form is worse than no form.

### ✅ Task 14: Replace testimonials section

**Current:** Three fake-looking testimonials (Anna Müller, Maria Becker, Lukas Schmidt) with stock photos.

**Options:**
- **A (best):** Get 3 real testimonials from actual customers (with permission to use first name + last initial + photo if they're comfortable)
- **B (acceptable):** Show Google review snippets if Naeem has a Google Business Profile with reviews
- **C (interim):** Remove the testimonials section entirely until real ones exist

Fake testimonials are illegal under UWG (Gesetz gegen den unlauteren Wettbewerb) in Germany and routinely lead to Abmahnungen. They're also the most common reason customers bounce.

---

## Priority 3 — Hero and identity (next day, if time)

### ✅ Task 15: Verify hero section consistency

**Current state seems OK:**
- Headline: "TAXI-Alternative - StepNow Rides" ✓ (client wants this kept)
- Subheadline: "Mit StepNow sicher und pünktlich ans Ziel - Ihr Mobilitätspartner vor Ort" ✓

**Just confirm:** The hero image isn't a stock photo of a stranger or a luxury car the fleet doesn't actually have. If it is → replace with a real photo of one of Naeem's vehicles (even a phone photo is better than misleading stock).

### ✅ Task 16: Add concession badge to homepage

Once the PBefG concession number is in the Impressum, add a small badge/strip near the hero or in the trust strip:

> "Konzessioniert nach § 49 PBefG | Lizenz-Nr. [number] | Erteilt durch [authority]"

This is your strongest single trust signal as a new operator. Hide it and you compete unevenly with established taxi companies. Show it and you're at parity.

---

## Priority 4 — Bilingual basics (within this week)

### ✅ Task 17: Add language switcher (DE / EN)

The German authority required bilingual operation, but the site is currently German-only. Even if the English version isn't fully built yet, at minimum:

- Add a DE/EN switcher to the top-right of the header
- For now, EN can link to a single English landing page that says: "English version coming soon. For bookings, please call +49 7153 9292841 or email info@step-now.de."
- Add `hreflang` tags pointing DE ↔ EN

Full English version comes in the proper rebuild (Track 2).

---

## What NOT to do during triage

- ❌ Don't redesign the homepage layout
- ❌ Don't change the template's CSS or visual style
- ❌ Don't add new features (booking calendar, payment integration, etc.)
- ❌ Don't write the proper rebuild while triaging — keep them separate
- ❌ Don't publish AGB without lawyer review (placeholder is fine)
- ❌ Don't add Google Analytics or Maps without first updating Datenschutz

---

## Checklist summary — single page

```
[ ] 1.  Impressum page deployed and linked in footer
[ ] 2.  Datenschutz page deployed and linked in footer
[ ] 3.  AGB placeholder or draft deployed
[ ] 4.  Page title fixed: no more "Mini Car"
[ ] 5.  Footer tagline rewritten (StepNow, not tech-startup copy)
[ ] 6.  Placeholder stats removed or replaced with real ones
[ ] 7.  Fake social media links replaced or removed
[ ] 8.  "Kurier- und Firmendienste" service tile removed
[ ] 9.  "Dash Transport" footer link removed
[ ] 10. "Ablauf der Autovermietung" → "Ablauf einer Buchung"
[ ] 11. Vehicle FAQ updated with real fleet info
[ ] 12. Duplicate FAQ entries removed
[ ] 13. CTA fixed: "Jetzt anrufen" instead of "Buchungen folgen in Kürze"
[ ] 14. Booking form verified working (or removed if broken)
[ ] 15. Testimonials: real ones, Google reviews, or removed
[ ] 16. Hero image: confirm real, not misleading stock
[ ] 17. Concession badge added near hero
[ ] 18. DE/EN language switcher (even with stub EN page)
```

Total estimated effort: **6-10 hours of focused work**, mostly content editing in the admin panel.

Once this is done, the site stops actively harming the business — even though it's still a template that needs a proper rebuild. That rebuild is Track 2 and runs over the next 6-7 weeks.
