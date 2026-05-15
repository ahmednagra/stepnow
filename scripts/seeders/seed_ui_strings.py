# scripts/seeders/seed_ui_strings.py
"""Seed the ui_strings table with all labels the frontend needs.

Organized by namespace (nav, hero, common, errors, booking, footer, ...) so
admin can filter when editing. Critical strings — those that, if missing,
break rendering — are marked is_locked=True so they can't be accidentally
deleted by Naeem in the admin.

Idempotent: each row is keyed by unique 'key' field. Existing rows are
skipped; only new keys are inserted.
"""

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402
from app.Models.ui_strings import UiString
from app.Services.AuditService import AuditService


# Format: (key, namespace, value_de, value_en, description, is_locked)
# is_locked: critical strings the frontend depends on — protect from accidental edit/delete
UI_STRINGS: list[tuple[str, str, str, str, str | None, bool]] = [

    # === NAVIGATION ===
    ("nav.home", "nav", "Startseite", "Home", "Navigation: home link", True),
    ("nav.services", "nav", "Dienstleistungen", "Services", "Navigation: services dropdown", True),
    ("nav.pricing", "nav", "Preise", "Pricing", "Navigation: pricing page", True),
    ("nav.about", "nav", "Über uns", "About", "Navigation: about page", True),
    ("nav.contact", "nav", "Kontakt", "Contact", "Navigation: contact page", True),
    ("nav.book_now", "nav", "Jetzt buchen", "Book now", "Navigation: primary CTA button", True),
    ("nav.menu", "nav", "Menü", "Menu", "Mobile menu toggle label", False),

    # === LANGUAGE SWITCHER (must always work) ===
    ("language.switch.de", "language", "Deutsch", "German", "Language switcher: DE label", True),
    ("language.switch.en", "language", "Englisch", "English", "Language switcher: EN label", True),
    ("language.switch.current", "language", "Aktuelle Sprache", "Current language", "ARIA label for switcher", True),

    # === HERO (homepage) ===
    ("home.hero.pre_heading", "hero", "IHRE TAXI-ALTERNATIVE", "YOUR TAXI ALTERNATIVE", "Hero pre-heading, small caps", False),
    ("home.hero.headline", "hero", "Sicher, pünktlich, zum Festpreis.", "Safe, on time, fixed price.", "Hero main headline", False),
    ("home.hero.subhead", "hero", "Vorbestellte Fahrten in der Region Stuttgart. Konzessioniert nach § 49 PBefG.", "Pre-booked transfers in the Stuttgart region. Licensed under § 49 PBefG.", "Hero subhead", False),
    ("home.hero.cta_book", "hero", "Jetzt buchen", "Book now", "Hero primary CTA", True),
    ("home.hero.cta_call", "hero", "Anrufen", "Call us", "Hero secondary CTA (paired with phone number)", False),
    # Hero booking widget — caption rendered beneath the inline quick-quote inputs
    ("hero_widget.note", "hero", "Unverbindliche Anfrage — Festpreis-Angebot innerhalb von 30 Minuten.", "No-obligation request — fixed-price quote within 30 minutes.", "Caption below the hero booking widget inputs", False),

    # === TRUST STRIP ===
    ("home.trust.licensed", "trust", "Konzessioniert nach PBefG", "Licensed under PBefG", "Trust strip: license credential", False),
    ("home.trust.fixed_price", "trust", "Festpreis vor Fahrtbeginn", "Fixed price before departure", "Trust strip: pricing", False),
    ("home.trust.drivers", "trust", "Geprüfte, erfahrene Fahrer", "Verified, experienced drivers", "Trust strip: driver quality", False),
    ("home.trust.always_available", "trust", "24/7 vorbestellbar", "24/7 pre-bookable", "Trust strip: availability", False),

    # === HOMEPAGE SECTION HEADINGS ===
    ("home.services.heading", "home", "Unsere Leistungen", "Our Services", "Services section heading", False),
    ("home.services.subheading", "home", "Vier spezialisierte Transportdienstleistungen — alle vorbestellt, alle zum Festpreis.", "Four specialized transport services — all pre-booked, all at a fixed price.", "Services section subheading", False),
    ("home.how.pre_heading", "home", "Ablauf", "How it works", "How-it-works section eyebrow (small caps above heading)", False),
    ("home.how.heading", "home", "So einfach geht's", "How it works", "How-it-works section heading", False),
    ("home.how.step1.title", "home", "Anfrage senden", "Send your request", "Step 1 title", False),
    ("home.how.step1.body", "home", "Füllen Sie unser kurzes Buchungsformular aus oder rufen Sie uns an.", "Fill out our short booking form or give us a call.", "Step 1 body", False),
    ("home.how.step2.title", "home", "Festpreis-Bestätigung erhalten", "Receive a fixed-price quote", "Step 2 title", False),
    ("home.how.step2.body", "home", "Innerhalb von 30 Minuten erhalten Sie unser verbindliches Festpreis-Angebot.", "Within 30 minutes you receive our binding fixed-price quote.", "Step 2 body", False),
    ("home.how.step3.title", "home", "Entspannt ankommen", "Arrive relaxed", "Step 3 title", False),
    ("home.how.step3.body", "home", "Ihr Fahrer wartet pünktlich am vereinbarten Ort.", "Your driver is waiting on time at the agreed location.", "Step 3 body", False),
    ("home.why.pre_heading", "home", "Differenzierung", "What sets us apart", "Why-section eyebrow (small caps above heading)", False),
    ("home.why.heading", "home", "Warum StepNow?", "Why StepNow?", "Why-section heading", False),
    ("home.why.intro", "home", "Wir sind kein anonymes Callcenter und keine Plattform. Wir sind Ihr regionaler Partner für sichere, vorbestellte Fahrten.", "We're not an anonymous call centre or a platform. We're your regional partner for safe, pre-booked transfers.", "Why-section intro paragraph", False),
    ("home.why.bullet.fixed_price", "home", "Festpreis statt Taxameter — der Preis steht vor der Fahrt fest", "Fixed price instead of taximeter — the price is set before the ride", "Why bullet", False),
    ("home.why.bullet.prebooked", "home", "Vorbestellt statt Glücksspiel — Ihr Fahrer wartet bereits auf Sie", "Pre-booked, not a gamble — your driver is already waiting for you", "Why bullet", False),
    ("home.why.bullet.licensed", "home", "Konzessioniert und versichert — volle Personenbeförderungs-Haftpflicht", "Licensed and insured — full passenger transport liability coverage", "Why bullet", False),
    ("home.why.bullet.personal", "home", "Persönlicher Service — direkter Kontakt, kein anonymes Callcenter", "Personal service — direct contact, no anonymous call centre", "Why bullet", False),
    ("home.why.bullet.regional", "home", "Regional verwurzelt — wir kennen die Strecken zwischen Esslingen, Stuttgart und Umgebung", "Regionally rooted — we know the routes between Esslingen, Stuttgart and the surrounding area", "Why bullet", False),
    ("home.fleet.pre_heading", "home", "Unsere Flotte", "Our fleet", "Fleet section eyebrow (small caps above heading)", False),
    ("home.fleet.heading", "home", "Unsere Fahrzeuge", "Our Fleet", "Fleet section heading", False),
    ("home.testimonials.pre_heading", "home", "Stimmen unserer Kunden", "Customer voices", "Testimonials section eyebrow (small caps above heading)", False),
    ("home.testimonials.heading", "home", "Was unsere Kunden sagen", "What our customers say", "Testimonials section heading", False),
    ("home.faq.pre_heading", "home", "FAQ", "FAQ", "FAQ section eyebrow (small caps above the heading)", False),
    ("home.faq.heading", "home", "Häufige Fragen", "Frequently Asked Questions", "FAQ section heading", False),
    ("home.faq.view_all", "home", "Alle Fragen ansehen", "View all questions", "Link to full FAQ", False),
    ("home.final_cta.heading", "home", "Bereit für Ihre Fahrt?", "Ready for your ride?", "Final CTA heading", False),
    ("home.final_cta.subhead", "home", "Buchen Sie jetzt oder rufen Sie an — wir melden uns innerhalb von 30 Minuten.", "Book now or give us a call — we'll get back to you within 30 minutes.", "Final CTA subhead", False),

    # === SERVICES LIST PAGE ===
    ("services.page.title", "services", "Unsere Leistungen", "Our Services", "Services list page title", False),
    ("services.page.subhead", "services", "Vier spezialisierte Transportdienstleistungen für Privat- und Geschäftskunden im Raum Stuttgart.", "Four specialized transport services for private and business customers in the Stuttgart area.", "Services list page subhead", False),
    ("services.card.learn_more", "services", "Mehr erfahren", "Learn more", "Service card CTA", False),
    ("services.card.book", "services", "Diesen Service buchen", "Book this service", "Service card secondary CTA", False),

    # Service detail page — primary CTA at the bottom of the page
    ("services.detail.cta_book", "services", "Diesen Service jetzt buchen", "Book this service now", "Service detail page primary CTA button", False),

    # Service detail page — "Related services" section (cross-sell to other services)
    ("services.related.eyebrow", "services", "Weitere Leistungen", "More services", "Related-services section eyebrow (small caps above heading)", False),
    ("services.related.heading", "services", "Das könnte Sie auch interessieren", "You might also be interested in", "Related-services section heading", False),

    # Short service labels used in Footer + HeroFeatureBlock
    ("services.flughafentransfer", "services", "Flughafentransfer", "Airport Transfer", "Short service label — footer, hero feature block", True),
    ("services.krankenhausfahrten", "services", "Krankenhausfahrten", "Hospital Transport", "Short service label — footer, hero feature block", True),
    ("services.schuelerbefoerderung", "services", "Schülerbeförderung", "School Transport", "Short service label — footer, hero feature block", True),
    ("services.shuttle", "services", "Shuttle Service", "Shuttle Service", "Short service label — footer, hero feature block", True),

    # === PRICING PAGE ===
    ("pricing.page.eyebrow", "pricing", "Preise & Tarife", "Pricing & rates", "Pricing page hero eyebrow (small caps above the title)", False),
    ("pricing.page.title", "pricing", "Transparente Festpreise", "Transparent Fixed Prices", "Pricing page title", False),
    ("pricing.page.intro", "pricing", "Alle Preise inkl. 19 % MwSt. Der Preis steht vor Fahrtbeginn fest und ändert sich nicht.", "All prices include 19% VAT. The price is set before the ride begins and does not change.", "Pricing page intro", False),
    ("pricing.disclaimer", "pricing", "Alle Preise inkl. MwSt. Festpreis-Garantie ab Buchungsbestätigung.", "All prices include VAT. Fixed-price guarantee from booking confirmation.", "Pricing page sub-intro disclaimer (also used by PricingSnapshot on service detail)", False),
    ("pricing.footnote", "pricing", "Alle Preise inkl. MwSt. Festpreis-Garantie ab Buchungsbestätigung. Andere Strecken auf Anfrage.", "All prices include VAT. Fixed-price guarantee from booking confirmation. Other routes on request.", "Footnote below each per-service pricing table", False),
    ("pricing.table.from", "pricing", "Von", "From", "Pricing table column", False),
    ("pricing.table.to", "pricing", "Nach", "To", "Pricing table column", False),
    ("pricing.table.price", "pricing", "Preis", "Price", "Pricing table column", False),
    ("pricing.table.note", "pricing", "Hinweise", "Notes", "Pricing table column", False),
    ("pricing.empty.heading", "pricing", "Festpreis-Angebot auf Anfrage", "Fixed-price quote on request", "Empty pricing state heading", False),
    ("pricing.empty.cta", "pricing", "Angebot anfordern", "Request a quote", "Empty pricing state CTA", False),
    ("pricing.includes.heading", "pricing", "Im Preis enthalten", "What's included", "Pricing inclusions heading", False),
    ("pricing.excludes.heading", "pricing", "Nicht enthalten", "Not included", "Pricing exclusions heading", False),

    # === ABOUT PAGE — header & values ===
    ("about.page.title", "about", "Über StepNow", "About StepNow", "About page title", False),
    ("about.page.subhead", "about", "Ihr regionaler Mobilitätspartner für vorbestellte Fahrten.", "Your regional mobility partner for pre-booked transfers.", "About page subhead", False),

    # Story section
    ("about.story.eyebrow", "about", "Die Geschichte", "The story", "Eyebrow above 'Our story' heading", False),
    ("about.story.heading", "about", "Meine Geschichte", "My Story", "Story section heading", False),
    ("about.story.author", "about", "Naeem Ahmad", "Naeem Ahmad", "Owner name displayed under the portrait", False),
    ("about.story.paragraph_1", "about",
     "Ich bin Naeem Ahmad — Inhaber von StepNow Rides & Movers und seit über zehn Jahren in der Region Stuttgart unterwegs.",
     "I'm Naeem Ahmad — owner of StepNow Rides & Movers and a driver in the Stuttgart region for more than ten years.",
     "Owner story paragraph 1", False),
    ("about.story.paragraph_2", "about",
     "StepNow ist aus einer einfachen Idee entstanden: Mobilität soll vorhersehbar sein. Festpreise vor der Fahrt, keine Überraschungen am Taxameter und ein Fahrer, der pünktlich am vereinbarten Ort wartet.",
     "StepNow grew from a simple idea: mobility should be predictable. Fixed prices before the ride, no taximeter surprises, and a driver who is on time at the agreed location.",
     "Owner story paragraph 2", False),
    ("about.story.paragraph_3", "about",
     "Wir sind kein anonymes Callcenter. Wenn Sie bei uns buchen, sprechen Sie direkt mit dem Inhaber — und unser Team kennt die Strecken zwischen Esslingen, Stuttgart und Umgebung wie die eigene Westentasche.",
     "We are not an anonymous call centre. When you book with us, you speak directly with the owner — and our team knows the routes between Esslingen, Stuttgart and the surrounding area like the back of their hand.",
     "Owner story paragraph 3", False),
    ("about.story.paragraph_4", "about",
     "Ob Flughafentransfer, Krankenfahrt, Schülerbeförderung oder Shuttle — wir behandeln jede Fahrt mit dem Respekt, den sie verdient.",
     "Whether it's an airport transfer, a hospital ride, a school run, or a shuttle — we treat every trip with the respect it deserves.",
     "Owner story paragraph 4", False),

    # Values section
    ("about.values.eyebrow", "about", "Unsere Prinzipien", "Our principles", "Eyebrow above the values grid", False),
    ("about.values.heading", "about", "Was uns wichtig ist", "What matters to us", "Values section heading", False),
    ("about.values.reliability.title", "about", "Verlässlichkeit", "Reliability", "Value title", False),
    ("about.values.reliability.body", "about", "Pünktlich, vorbestellt, bestätigt — keine Überraschungen am Abholtag.", "On time, pre-booked, confirmed — no surprises on pickup day.", "Value body", False),
    ("about.values.safety.title", "about", "Sicherheit", "Safety", "Value title", False),
    ("about.values.safety.body", "about", "Geprüfte Fahrer, gewartete Fahrzeuge und volle Haftpflicht.", "Vetted drivers, maintained vehicles, and full liability insurance.", "Value body", False),
    ("about.values.transparency.title", "about", "Transparenz", "Transparency", "Value title", False),
    ("about.values.transparency.body", "about", "Festpreise vor der Fahrt. Keine versteckten Aufschläge, keine Taxameter-Überraschungen.", "Fixed prices up front. No hidden surcharges, no meter surprises.", "Value body", False),
    ("about.values.service.title", "about", "Persönlicher Service", "Personal service", "Value title (4th tile)", False),
    ("about.values.service.body", "about", "Direkter Kontakt zum Inhaber, kein anonymes Callcenter.", "Direct contact with the owner — no anonymous call center.", "Value body (4th tile)", False),
    # Legacy alias kept for backwards compatibility
    ("about.values.personal.title", "about", "Persönlicher Service", "Personal Service", "Alias for about.values.service.title", False),
    ("about.values.personal.body", "about", "Sie sprechen mit dem Inhaber — nicht mit einem anonymen Callcenter.", "You talk to the owner — not an anonymous call centre.", "Alias for about.values.service.body", False),

    # Credentials section
    ("about.credentials.eyebrow", "about", "Qualifikationen", "Credentials", "Eyebrow above credentials list", False),
    ("about.credentials.heading", "about", "Qualifikationen & Zulassungen", "Credentials & Licenses", "Credentials heading", False),
    ("about.credentials.pbefg.title", "about", "Konzession nach § 49 PBefG", "License under § 49 PBefG", "Credential row title — PBefG concession", False),
    ("about.credentials.pbefg.body", "about", "Lizenziert nach dem deutschen Personenbeförderungsgesetz. Volle Konzessionspflicht erfüllt.", "Licensed under the German Passenger Transport Act. Full concession compliance.", "Credential row body — PBefG concession", False),
    ("about.credentials.bkrfqg.title", "about", "Berufskraftfahrer-Qualifikation", "Professional driver qualification", "Credential row title — BKrFQG", False),
    ("about.credentials.bkrfqg.body", "about", "Qualifikation nach BKrFQG mit regelmäßigen Weiterbildungen.", "BKrFQG-certified with regular continuing education.", "Credential row body — BKrFQG", False),
    ("about.credentials.insurance.title", "about", "Personenbeförderungs-Haftpflicht", "Passenger transport liability", "Credential row title — insurance", False),
    ("about.credentials.insurance.body", "about", "Volle Personenbeförderungs-Haftpflichtversicherung für alle Fahrten.", "Full passenger transport liability insurance on every ride.", "Credential row body — insurance", False),
    ("about.credentials.handelsregister.title", "about", "Eintrag im Handelsregister", "Trade register entry", "Credential row title — Handelsregister", False),
    ("about.credentials.handelsregister.body", "about", "Eingetragenes Unternehmen am Amtsgericht — Geschäftssitz Deizisau.", "Registered business at the local commercial court — based in Deizisau.", "Credential row body — Handelsregister", False),

    # Service-area section (used by ServiceAreaMap on about page)
    ("about.area.eyebrow", "about", "Einsatzgebiet", "Service area", "Eyebrow above service-area map", False),
    ("about.area.heading", "about", "Unser Einzugsgebiet", "Our service area", "Service-area section heading", False),
    ("about.area.body", "about", "Wir bedienen die Region Stuttgart, Esslingen, Deizisau und das gesamte mittlere Neckartal — sowie Fahrten zu allen umliegenden Flughäfen.", "We serve the Stuttgart, Esslingen, Deizisau region and the entire central Neckar valley — plus rides to all surrounding airports.", "Service-area body", False),
    ("about.area.empty.title", "about", "Karte nicht verfügbar", "Map unavailable", "Empty-state title when settings has no coordinates", False),
    ("about.area.empty.body", "about", "Standort wird in Kürze hinterlegt.", "Our location will be added shortly.", "Empty-state body when settings has no coordinates", False),

    # Legacy keys kept for backwards compatibility
    ("about.service_area.heading", "about", "Unser Einzugsgebiet", "Our service area", "Alias for about.area.heading", False),
    ("about.service_area.body", "about", "Wir bedienen die Region Stuttgart, Esslingen, Deizisau und das gesamte mittlere Neckartal — sowie Fahrten zu allen umliegenden Flughäfen.", "We serve the Stuttgart, Esslingen, Deizisau region and the entire central Neckar valley — plus rides to all surrounding airports.", "Alias for about.area.body", False),

    # === CONTACT PAGE ===
    ("contact.page.title", "contact", "Kontakt", "Contact", "Contact page title", False),
    ("contact.page.subhead", "contact", "So erreichen Sie uns.", "How to reach us.", "Contact page subhead", False),

    # Methods (left column of contact page)
    ("contact.methods.eyebrow", "contact", "Direkt", "Direct", "Eyebrow above 'How to reach us' column", False),
    ("contact.methods.heading", "contact", "So erreichen Sie uns", "How to reach us", "Heading above contact methods list", False),
    ("contact.methods.intro", "contact", "Telefon, E-Mail oder direkt vor Ort — wir antworten innerhalb eines Werktages.", "Phone, email, or in person — we reply within one business day.", "Short intro paragraph above the contact methods list", False),
    ("contact.method.phone", "contact", "Telefon", "Phone", "Contact method label", False),
    ("contact.method.email", "contact", "E-Mail", "Email", "Contact method label", False),
    ("contact.method.address", "contact", "Adresse", "Address", "Contact method label", False),
    ("contact.method.hours", "contact", "Fahrzeiten", "Operating hours", "Contact method label — opening / ride hours", False),
    ("contact.method.whatsapp", "contact", "WhatsApp", "WhatsApp", "Contact method label", False),

    # Form (right column of contact page)
    ("contact.form.eyebrow", "contact", "Anfrage", "Inquiry", "Eyebrow above the contact form", False),
    ("contact.form.heading", "contact", "Schreiben Sie uns", "Write to us", "Contact form heading", False),
    ("contact.form.intro", "contact", "Schildern Sie uns kurz Ihr Anliegen — wir melden uns mit allen Details.", "Tell us briefly what you need — we'll get back to you with the details.", "Short intro paragraph above the contact form", False),
    ("contact.form.name", "contact", "Name", "Name", "Form field", False),
    ("contact.form.email", "contact", "E-Mail", "Email", "Form field", False),
    ("contact.form.phone", "contact", "Telefon (optional)", "Phone (optional)", "Form field", False),
    ("contact.form.subject", "contact", "Betreff", "Subject", "Form field", False),
    ("contact.form.subject.general", "contact", "Allgemeine Anfrage", "General inquiry", "Subject option", False),
    ("contact.form.subject.booking", "contact", "Buchung", "Booking", "Subject option", False),
    ("contact.form.subject.complaint", "contact", "Beschwerde", "Complaint", "Subject option", False),
    ("contact.form.subject.business", "contact", "Geschäftskunde", "Business customer", "Subject option", False),
    ("contact.form.subject.other", "contact", "Sonstiges", "Other", "Subject option", False),
    ("contact.form.message", "contact", "Nachricht", "Message", "Form field", False),
    ("contact.form.submit", "contact", "Nachricht senden", "Send message", "Form submit button", False),
    ("contact.form.success", "contact", "Vielen Dank! Wir melden uns innerhalb von 24 Stunden bei Ihnen.", "Thank you! We'll get back to you within 24 hours.", "Form success", False),
    ("contact.form.success.body", "contact", "Wir melden uns innerhalb eines Werktages bei Ihnen.", "We'll get back to you within one business day.", "Form success body", False),
    # Consent label is split across the privacy-policy link
    ("contact.form.consent_intro", "contact", "Ich stimme der ", "I agree to the ", "Text before the privacy-policy link in the consent checkbox", True),
    ("contact.form.consent_zu", "contact", " zu.", ".", "Text after the privacy-policy link in the consent checkbox (German trailing 'zu.', simple period in EN)", True),

    # Map section
    ("contact.map.eyebrow", "contact", "Standort", "Location", "Eyebrow above the map section", False),
    ("contact.map.heading", "contact", "So finden Sie uns", "Find us", "Heading for the map section on the contact page", False),
    ("contact.map.empty.title", "contact", "Karte nicht verfügbar", "Map unavailable", "Empty-state title when no coordinates", False),
    ("contact.map.empty.body", "contact", "Die Standortkoordinaten wurden noch nicht hinterlegt.", "Location coordinates have not been added yet.", "Empty-state body when no coordinates", False),

    # === BOOKING FORM ===
    ("booking.page.title", "booking", "Fahrt buchen", "Book a ride", "Booking page title", False),
    ("booking.step.service", "booking", "Service wählen", "Choose service", "Step 1 label", True),
    ("booking.step.trip", "booking", "Fahrtdetails", "Trip details", "Step 2 label", True),
    ("booking.step.requirements", "booking", "Besondere Anforderungen", "Special requirements", "Step 3 label", True),
    ("booking.step.contact", "booking", "Kontaktdaten", "Contact info", "Step 4 label", True),
    ("booking.field.pickup_address", "booking", "Abholadresse", "Pickup address", "Form field", False),
    ("booking.field.pickup_postcode", "booking", "PLZ", "Postcode", "Form field", False),
    ("booking.field.destination_address", "booking", "Zieladresse", "Destination address", "Form field", False),
    ("booking.field.date", "booking", "Datum", "Date", "Form field", False),
    ("booking.field.time", "booking", "Uhrzeit", "Time", "Form field", False),
    ("booking.field.passengers", "booking", "Personen", "Passengers", "Form field", False),
    ("booking.field.luggage", "booking", "Gepäckstücke", "Luggage pieces", "Form field", False),
    ("booking.field.requirements", "booking", "Besondere Wünsche", "Special requests", "Form field", False),
    ("booking.field.is_business", "booking", "Geschäftskunde", "Business customer", "Form field", False),
    ("booking.field.company_name", "booking", "Firmenname", "Company name", "Form field", False),
    ("booking.field.company_vatid", "booking", "USt-IdNr.", "VAT ID", "Form field", False),
    ("booking.field.customer_name", "booking", "Ihr Name", "Your name", "Form field", False),
    ("booking.field.customer_phone", "booking", "Ihre Telefonnummer", "Your phone number", "Form field", False),
    ("booking.field.customer_email", "booking", "Ihre E-Mail-Adresse", "Your email address", "Form field", False),
    ("booking.field.consent_dsgvo", "booking", "Ich habe die Datenschutzerklärung gelesen und stimme der Verarbeitung meiner Daten zu.", "I have read the privacy policy and consent to the processing of my data.", "DSGVO checkbox label", True),
    ("booking.next", "booking", "Weiter", "Next", "Booking wizard next button", False),
    ("booking.back", "booking", "Zurück", "Back", "Booking wizard back button", False),
    ("booking.submit", "booking", "Buchungsanfrage senden", "Submit booking request", "Final submit", False),
    ("booking.confirmation.heading", "booking", "Vielen Dank! Ihre Anfrage ist eingegangen.", "Thank you! Your request has been received.", "Confirmation heading", True),
    ("booking.confirmation.body", "booking", "Wir melden uns innerhalb von 30 Minuten mit einem verbindlichen Festpreis-Angebot.", "We'll get back to you within 30 minutes with a binding fixed-price quote.", "Confirmation body", True),
    ("booking.confirmation.reference_label", "booking", "Ihre Referenznummer", "Your reference number", "Confirmation reference label", True),
    ("booking.confirmation.back_home", "booking", "Zurück zur Startseite", "Back to homepage", "Confirmation home link", False),

    # === FOOTER ===
    ("footer.col.brand", "footer", "StepNow Rides & Movers", "StepNow Rides & Movers", "Footer brand col", False),
    ("footer.col.quick_links", "footer", "Schnellzugriff", "Quick Links", "Footer column heading", False),
    ("footer.col.services", "footer", "Dienstleistungen", "Services", "Footer column heading", False),
    ("footer.col.contact", "footer", "Kontakt", "Contact", "Footer column heading", False),
    ("footer.legal.impressum", "footer", "Impressum", "Legal notice", "Footer legal link", True),
    ("footer.legal.datenschutz", "footer", "Datenschutz", "Privacy", "Footer legal link", True),
    ("footer.legal.agb", "footer", "AGB", "Terms", "Footer legal link", True),
    ("footer.rights_reserved", "footer", "Alle Rechte vorbehalten.", "All rights reserved.", "Suffix for the bottom-strip copyright line; year + business name come from the Footer component.", False),
    
    # === COMMON ===
    ("common.loading", "common", "Lädt…", "Loading…", "Generic loading", True),
    ("common.save", "common", "Speichern", "Save", "Generic save action", False),
    ("common.cancel", "common", "Abbrechen", "Cancel", "Generic cancel", False),
    ("common.close", "common", "Schließen", "Close", "Generic close", False),
    ("common.book_now", "common", "Jetzt buchen", "Book now", "Universal CTA", True),
    ("common.call_us", "common", "Anrufen", "Call us", "Universal phone CTA", False),
    ("common.required", "common", "Pflichtfeld", "Required field", "Required indicator label", False),

    # === ERRORS ===
    ("errors.generic", "errors", "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.", "An error occurred. Please try again.", "Generic error", True),
    ("errors.required", "errors", "Dieses Feld ist erforderlich.", "This field is required.", "Required error", True),
    ("errors.invalid_email", "errors", "Bitte geben Sie eine gültige E-Mail-Adresse ein.", "Please enter a valid email address.", "Email validation error", True),
    ("errors.email", "errors", "Bitte geben Sie eine gültige E-Mail-Adresse ein.", "Please enter a valid email address.", "Alias for errors.invalid_email used by ContactForm", True),
    ("errors.invalid_phone", "errors", "Bitte geben Sie eine gültige Telefonnummer ein.", "Please enter a valid phone number.", "Phone validation error", True),
    ("errors.invalid_postcode", "errors", "Bitte geben Sie eine gültige Postleitzahl ein (5 Ziffern).", "Please enter a valid postcode (5 digits).", "Postcode validation error", True),
    ("errors.date_in_past", "errors", "Bitte wählen Sie ein zukünftiges Datum.", "Please choose a future date.", "Date validation error", True),
    ("errors.consent_required", "errors", "Bitte stimmen Sie der Datenschutzerklärung zu, um fortzufahren.", "Please accept the privacy policy to continue.", "DSGVO consent error", True),
    ("errors.rate_limited", "errors", "Zu viele Anfragen. Bitte versuchen Sie es in einer Minute erneut.", "Too many requests. Please try again in a minute.", "Rate limit error", True),

    # === 404 ===
    ("404.heading", "errors", "Seite nicht gefunden", "Page not found", "404 heading", True),
    ("404.body", "errors", "Die gesuchte Seite existiert nicht oder wurde verschoben.", "The page you're looking for doesn't exist or has been moved.", "404 body", True),
    ("404.cta", "errors", "Zur Startseite", "Back to homepage", "404 CTA", True),

    # === LEGAL ===
    ("legal.translation_disclaimer", "legal", "Dies ist eine Übersetzung zur Information. Rechtlich verbindlich ist die deutsche Fassung.", "This is a translation for your convenience. The German version is legally binding.", "EN legal page banner", True),
    ("legal.last_updated", "legal", "Stand", "Last updated", "Legal page date label", False),
]


def run() -> None:
    log_section(f"UI strings ({len(UI_STRINGS)} keys)")
    db = SessionLocal()
    try:
        actor = get_system_actor(db)
        created = 0
        skipped = 0
        for key, namespace, value_de, value_en, description, is_locked in UI_STRINGS:
            existing = db.query(UiString).filter(UiString.key == key).first()
            if existing:
                skipped += 1
                continue
            row = UiString(
                key=key,
                namespace=namespace,
                value_de=value_de,
                value_en=value_en,
                description=description,
                is_locked=is_locked,
            )
            db.add(row)
            db.flush()
            snapshot = {"key": key, "namespace": namespace, "value_de": value_de, "value_en": value_en, "description": description, "is_locked": is_locked}
            AuditService.log(db, actor, "ui_strings", str(row.id), "create", None, snapshot, None)
            created += 1
        db.commit()
        print(f"  [done] {created} created, {skipped} skipped")
    finally:
        db.close()


if __name__ == "__main__":
    run()