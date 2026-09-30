// src/constants/critical-ui-strings.ts
// Last-resort fallbacks for UI strings that must never render as a raw key — the booking wizard,
// language switcher, 404 and core errors — used only when the ui_strings API is unreachable or the
// key is missing from the DB. Every value is identical to seed_ui_strings.py (DE + EN); the backend
// test tests/test_ui_strings_coverage.py fails on any drift or on a fallback no component uses.

import type { Locale } from "@/types";

export const CRITICAL_FALLBACKS: Record<string, Record<Locale, string>> = {
  // Language switcher
  "language.switch.de": { de: "Deutsch", en: "German" },
  "language.switch.en": { de: "Englisch", en: "English" },
  "language.switch.current": { de: "Sprache wählen", en: "Choose language" },

  // Common
  "common.call_us": { de: "Anrufen", en: "Call us" },
  "common.back": { de: "Zurück", en: "Back" },
  "common.continue": { de: "Weiter", en: "Continue" },
  "common.edit": { de: "Ändern", en: "Edit" },

  // Errors
  "errors.generic": {
    de: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
    en: "An error occurred. Please try again.",
  },
  "errors.required": { de: "Dieses Feld ist erforderlich.", en: "This field is required." },
  "errors.consent_required": {
    de: "Bitte stimmen Sie der Datenschutzerklärung zu, um fortzufahren.",
    en: "Please accept the privacy policy to continue.",
  },
  "errors.page.eyebrow": { de: "Fehler", en: "Error" },
  "errors.page.heading": { de: "Etwas ist schiefgelaufen", en: "Something went wrong" },
  "errors.page.body": {
    de: "Die Seite konnte nicht geladen werden. Bitte versuchen Sie es erneut.",
    en: "The page could not be loaded. Please try again.",
  },
  "errors.page.retry": { de: "Erneut versuchen", en: "Try again" },

  // 404
  "404.heading": { de: "Seite nicht gefunden", en: "Page not found" },
  "404.body": {
    de: "Die gesuchte Seite existiert nicht oder wurde verschoben.",
    en: "The page you're looking for doesn't exist or has been moved.",
  },
  "404.cta": { de: "Zur Startseite", en: "Back to homepage" },

  // === Booking wizard ===
  // Page / shell
  "booking.page.title": { de: "Fahrt buchen", en: "Book your ride" },
  "booking.page.subhead": {
    de: "In wenigen Schritten zur unverbindlichen Buchungsanfrage. Wir melden uns mit Ihrem Preis — online vorbestellt sparen Sie bis zu 5 %.",
    en: "A few steps to your non-binding booking request. We'll get back with your price — book online and save up to 5%.",
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

  // Step 2 — route
  "booking.route.heading": {
    de: "Wo soll die Fahrt beginnen und enden?",
    en: "Where does the ride start and end?",
  },
  "booking.route.subhead": {
    de: "Vollständige Adressen helfen uns, den besten Preis zu berechnen.",
    en: "Complete addresses help us calculate the best price.",
  },
  "booking.route.address_label": { de: "Adresse", en: "Address" },
  "booking.route.postcode_label": { de: "PLZ", en: "Postal code" },
  "booking.route.city_label": { de: "Ort", en: "City" },

  // Step 3 — details
  "booking.details.heading": { de: "Passagiere & Gepäck", en: "Passengers & luggage" },
  "booking.details.subhead": {
    de: "Pro Fahrzeug fahren bis zu 4 Personen — für größere Gruppen setzen wir mehrere Fahrzeuge ein. Sonderwünsche bitte unten angeben.",
    en: "Each vehicle carries up to 4 persons — for larger groups we deploy several vehicles. Note any special requirements below.",
  },
  "booking.details.passengers_label": { de: "Fahrgäste", en: "Passengers" },
  "booking.details.luggage_label": { de: "Gepäckstücke", en: "Luggage pieces" },

  // Step 4 — contact
  "booking.contact.heading": { de: "Ihre Kontaktdaten", en: "Your contact details" },
  "booking.contact.subhead": {
    de: "Damit wir uns mit Ihrem Preis melden können.",
    en: "So we can get back to you with your price.",
  },
  "booking.contact.name_label": { de: "Name", en: "Name" },
  "booking.contact.phone_label": { de: "Telefon", en: "Phone" },
  "booking.contact.email_label": { de: "E-Mail", en: "Email" },
  "booking.contact.business_toggle": {
    de: "Ich buche als Geschäftskunde",
    en: "I'm booking as a business customer",
  },

  // Step 5 — review
  "booking.review.heading": { de: "Bitte prüfen und bestätigen", en: "Please review and confirm" },
  "booking.review.subhead": {
    de: "Buchungsanfrage absenden — wir melden uns innerhalb von 30 Minuten mit Ihrem Preis.",
    en: "Submit your booking request — we'll come back with your price within 30 minutes.",
  },
  "booking.review.submit": { de: "Buchungsanfrage absenden", en: "Submit booking request" },

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
    de: "Sie erhalten innerhalb von 30 Minuten zu unseren Telefonzeiten eine Rückmeldung mit Ihrem Preis.",
    en: "Within 30 minutes during our phone hours, we'll get back to you with your price.",
  },
  "booking.confirmation.next_step_2": {
    de: "Nach Ihrer Bestätigung wird die Fahrt fest gebucht.",
    en: "Once you confirm, the ride is firmly booked.",
  },
  "booking.confirmation.next_step_3": {
    de: "Am Tag der Fahrt erhalten Sie eine SMS mit Fahrer- und Fahrzeuginformationen.",
    en: "On the day of the ride, you'll receive an SMS with driver and vehicle details.",
  },
  "booking.confirmation.urgent_heading": { de: "Dringend?", en: "Urgent?" },
  "booking.confirmation.urgent_body": {
    de: "Für kurzfristige Buchungen rufen Sie uns direkt an.",
    en: "For short-notice bookings, please call us directly.",
  },
  "booking.confirmation.cta_home": { de: "Zur Startseite", en: "Back to homepage" },

  // Hero widget (homepage)
  "hero_widget.heading": { de: "Fahrt anfragen", en: "Request a ride" },
  "hero_widget.from_label": { de: "Von", en: "From" },
  "hero_widget.from_placeholder": { de: "Abholadresse", en: "Pickup address" },
  "hero_widget.to_label": { de: "Nach", en: "To" },
  "hero_widget.to_placeholder": { de: "Zieladresse", en: "Destination address" },
  "hero_widget.when_label": { de: "Wann", en: "When" },
  "hero_widget.cta": { de: "Preis anfragen", en: "Request your price" },
};
