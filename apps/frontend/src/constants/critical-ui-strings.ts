// src/constants/critical-ui-strings.ts
// Last-resort fallbacks for UI strings that must never be missing.
// The backend marks the same keys as is_locked=true so they can't be deleted.
// Wizard strings are included here so the booking flow works even if the backend
// hasn't been seeded with them — the wizard is too critical to fail silently.

import type { Locale } from "@/types";

export const CRITICAL_FALLBACKS: Record<string, Record<Locale, string>> = {
  // Language switcher
  "language.switch.de": { de: "Deutsch", en: "German" },
  "language.switch.en": { de: "Englisch", en: "English" },
  "language.switch.current": { de: "Sprache wählen", en: "Choose language" },

  // Common
  "common.loading": { de: "Lädt…", en: "Loading…" },
  "common.book_now": { de: "Jetzt buchen", en: "Book now" },
  "common.call_us": { de: "Anrufen", en: "Call us" },
  "common.back": { de: "Zurück", en: "Back" },
  "common.continue": { de: "Weiter", en: "Continue" },
  "common.submit": { de: "Absenden", en: "Submit" },
  "common.edit": { de: "Ändern", en: "Edit" },

  // Errors
  "errors.generic": { de: "Ein Fehler ist aufgetreten.", en: "An error occurred." },
  "errors.required": { de: "Dieses Feld ist erforderlich.", en: "This field is required." },
  "errors.consent_required": {
    de: "Bitte stimmen Sie der Datenschutzerklärung zu.",
    en: "Please accept the privacy policy.",
  },

  // 404
  "404.heading": { de: "Seite nicht gefunden", en: "Page not found" },
  "404.body": {
    de: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
    en: "The page you're looking for doesn't exist or has been moved.",
  },
  "404.cta": { de: "Zur Startseite", en: "Back to homepage" },

  // Home pre-headings
  "home.services.pre_heading": { de: "UNSERE LEISTUNGEN", en: "OUR SERVICES" },
  "home.final_cta.pre_heading": { de: "BEREIT FÜR IHRE FAHRT", en: "READY FOR YOUR RIDE" },

  // === Booking wizard ===
  // Page / shell
  "booking.page.title": { de: "Fahrt buchen", en: "Book your ride" },
  "booking.page.subhead": {
    de: "In wenigen Schritten zur unverbindlichen Buchungsanfrage. Wir melden uns mit Ihrem Pauschalpreis.",
    en: "A few steps to your non-binding booking request. We'll get back with your fixed price.",
  },
  "booking.step.service": { de: "Leistung", en: "Service" },
  "booking.step.route": { de: "Strecke", en: "Route" },
  "booking.step.details": { de: "Details", en: "Details" },
  "booking.step.contact": { de: "Kontakt", en: "Contact" },
  "booking.step.review": { de: "Bestätigen", en: "Review" },
  "booking.progress.step_of": {
    de: "Schritt {current} von {total}",
    en: "Step {current} of {total}",
  },

  // Step 1 — service
  "booking.service.heading": {
    de: "Welche Leistung benötigen Sie?",
    en: "Which service do you need?",
  },
  "booking.service.subhead": {
    de: "Wählen Sie die Art Ihrer Fahrt und den gewünschten Termin.",
    en: "Choose the type of ride and your preferred time.",
  },
  "booking.service.label": { de: "Leistung", en: "Service" },
  "booking.datetime.heading": {
    de: "Wann benötigen Sie die Fahrt?",
    en: "When do you need the ride?",
  },
  "booking.datetime.date_label": { de: "Datum", en: "Date" },
  "booking.datetime.time_label": { de: "Uhrzeit", en: "Time" },
  "booking.datetime.hint": {
    de: "Mindestens 1 Stunde im Voraus, maximal 6 Monate im Voraus.",
    en: "At least 1 hour in advance, no more than 6 months ahead.",
  },
  "booking.service.error.lead_time": {
    de: "Die Abholzeit muss mindestens 1 Stunde in der Zukunft liegen.",
    en: "Pickup time must be at least 1 hour from now.",
  },
  "booking.service.error.too_far": {
    de: "Buchungen sind maximal 6 Monate im Voraus möglich.",
    en: "Bookings are limited to 6 months in advance.",
  },

  // Step 2 — route
  "booking.route.heading": {
    de: "Wo soll die Fahrt beginnen und enden?",
    en: "Where does the ride start and end?",
  },
  "booking.route.subhead": {
    de: "Vollständige Adressen helfen uns, den besten Preis zu berechnen.",
    en: "Complete addresses help us calculate the best price.",
  },
  "booking.route.pickup_heading": { de: "Abholung", en: "Pickup" },
  "booking.route.destination_heading": { de: "Ziel", en: "Destination" },
  "booking.route.address_label": { de: "Adresse", en: "Address" },
  "booking.route.postcode_label": { de: "PLZ", en: "Postal code" },
  "booking.route.city_label": { de: "Stadt", en: "City" },

  // Step 3 — details
  "booking.details.heading": { de: "Passagiere & Gepäck", en: "Passengers & luggage" },
  "booking.details.subhead": {
    de: "Wir bringen das passende Fahrzeug. Sondernwünsche bitte unten angeben.",
    en: "We'll bring the right vehicle. Note special requirements below.",
  },
  "booking.details.passengers_label": { de: "Personen", en: "Passengers" },
  "booking.details.luggage_label": { de: "Gepäckstücke", en: "Luggage" },
  "booking.details.special_label": { de: "Besondere Wünsche", en: "Special requirements" },
  "booking.details.special_placeholder": {
    de: "z.B. Kindersitz, Rollstuhl, sehr großes Gepäck …",
    en: "e.g. child seat, wheelchair, oversized luggage …",
  },

  // Step 4 — contact
  "booking.contact.heading": { de: "Ihre Kontaktdaten", en: "Your contact details" },
  "booking.contact.subhead": {
    de: "Damit wir uns mit Ihrem Pauschalpreis melden können.",
    en: "So we can get back to you with your fixed price.",
  },
  "booking.contact.name_label": { de: "Name", en: "Name" },
  "booking.contact.phone_label": { de: "Telefon", en: "Phone" },
  "booking.contact.email_label": { de: "E-Mail", en: "Email" },
  "booking.contact.business_toggle": {
    de: "Ich buche für ein Unternehmen",
    en: "I'm booking for a business",
  },
  "booking.contact.company_name_label": { de: "Firmenname", en: "Company name" },
  "booking.contact.vatid_label": { de: "USt-IdNr. (optional)", en: "VAT ID (optional)" },

  // Step 5 — review
  "booking.review.heading": { de: "Bitte prüfen und bestätigen", en: "Please review and confirm" },
  "booking.review.subhead": {
    de: "Buchungsanfrage absenden — wir melden uns mit Ihrem Pauschalpreis innerhalb von 2 Stunden.",
    en: "Submit your booking request — we'll come back with a fixed price within 2 hours.",
  },
  "booking.review.section.service": { de: "Leistung & Termin", en: "Service & time" },
  "booking.review.section.route": { de: "Strecke", en: "Route" },
  "booking.review.section.details": { de: "Details", en: "Details" },
  "booking.review.section.contact": { de: "Kontakt", en: "Contact" },
  "booking.review.consent": {
    de: "Ich habe die Datenschutzerklärung gelesen und stimme der Verarbeitung meiner Daten zur Abwicklung der Anfrage zu.",
    en: "I have read the privacy policy and consent to the processing of my data to fulfill this request.",
  },
  "booking.review.consent_link": { de: "Datenschutzerklärung", en: "Privacy policy" },
  "booking.review.submit": { de: "Buchungsanfrage absenden", en: "Submit booking request" },
  "booking.review.submit_note": {
    de: "Mit dem Absenden bestätigen Sie Ihre Buchungsanfrage. Wir melden uns mit Ihrem Pauschalpreis.",
    en: "By submitting, you confirm your booking request. We'll get back with your fixed price.",
  },

  // Confirmation page
  "booking.confirmation.heading": {
    de: "Buchungsanfrage gesendet",
    en: "Booking request received",
  },
  "booking.confirmation.reference_label": {
    de: "Ihre Referenznummer",
    en: "Your reference number",
  },
  "booking.confirmation.next_steps_heading": { de: "Wie es weitergeht", en: "What happens next" },
  "booking.confirmation.next_step_1": {
    de: "Sie erhalten innerhalb von 2 Stunden eine telefonische Rückmeldung mit Ihrem Pauschalpreis.",
    en: "Within 2 hours, we'll call you back with your fixed price.",
  },
  "booking.confirmation.next_step_2": {
    de: "Nach Ihrer Bestätigung wird die Fahrt fest gebucht.",
    en: "Once you confirm, the ride is firmly booked.",
  },
  "booking.confirmation.next_step_3": {
    de: "Am Tag der Fahrt bekommen Sie eine SMS mit Fahrer- und Fahrzeuginformationen.",
    en: "On the day of the ride, you'll receive an SMS with driver and vehicle details.",
  },
  "booking.confirmation.urgent_heading": { de: "Dringend?", en: "Urgent?" },
  "booking.confirmation.urgent_body": {
    de: "Für kurzfristige Buchungen rufen Sie uns direkt an.",
    en: "For short-notice bookings, please call us directly.",
  },
  "booking.confirmation.cta_home": { de: "Zur Startseite", en: "Back to homepage" },
  "booking.confirmation.cta_call": { de: "Jetzt anrufen", en: "Call now" },

  // Hero widget (homepage)
  "hero_widget.heading": { de: "Pauschalpreis-Anfrage", en: "Get a fixed price" },
  "hero_widget.from_label": { de: "Von", en: "From" },
  "hero_widget.from_placeholder": { de: "Abholadresse", en: "Pickup address" },
  "hero_widget.to_label": { de: "Nach", en: "To" },
  "hero_widget.to_placeholder": { de: "Zieladresse", en: "Destination" },
  "hero_widget.when_label": { de: "Wann", en: "When" },
  "hero_widget.cta": { de: "Pauschalpreis erfragen", en: "Continue" },
};
