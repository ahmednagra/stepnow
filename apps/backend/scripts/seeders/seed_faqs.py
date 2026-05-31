# scripts/seeders/seed_faqs.py
"""Seed FAQs real questions German chauffeur customers ask.

Categories:
- general works for the homepage teaser
- booking about the booking process
- pricing about how prices work
- airport specific to airport transfer service
- hospital specific to hospital transport service

Idempotent: keyed by question_de exact match.
"""

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section

FAQS = [
    # === GENERAL ===
    {
        "sort_order": 10,
        "category": "general",
        "question_de": "Wie weit im Voraus muss ich buchen?",
        "question_en": "How far in advance do I need to book?",
        "answer_de": "Wir empfehlen mindestens **24 Stunden** im Voraus, um Ihren Wunschtermin garantiert zu erhalten. Kurzfristige Buchungen sind oft möglich rufen Sie uns einfach an und wir prüfen die Verfügbarkeit.",
        "answer_en": "We recommend booking at least **24 hours** in advance to guarantee your preferred time. Short-notice bookings are often possible just call us and we'll check availability.",
    },
    {
        "sort_order": 20,
        "category": "general",
        "question_de": "Was unterscheidet Sie von einem Taxi?",
        "question_en": "How are you different from a taxi?",
        "answer_de": "Wir fahren ausschließlich auf Vorbestellung kein spontaner Halt auf der Straße. Der Preis steht **vor** der Fahrt fest (Pauschalpreis statt Taxameter). Wir sind ein konzessioniertes Mietwagenunternehmen nach § 49 PBefG, nicht eine Taxi-Konzession. Praktisch bedeutet das: planbar, kalkulierbar, persönlich.",
        "answer_en": "We operate by pre-booking only no spontaneous street pickups. The price is set **before** the ride (a price instead of a taximeter). We are a licensed Mietwagen company under § 49 PBefG, not a taxi license. In practice: predictable, calculable, personal.",
    },
    {
        "sort_order": 30,
        "category": "general",
        "question_de": "In welcher Region fahren Sie?",
        "question_en": "Which area do you serve?",
        "answer_de": "Unser Hauptgebiet umfasst Plochingen, Esslingen, Deizisau und das mittlere Neckartal. Längere Strecken zu Flughäfen (Frankfurt, München) und Reha-Kliniken fahren wir ebenfalls. Bei Fragen zu Ihrer Strecke: einfach anrufen.",
        "answer_en": "Our main area covers Plochingen, Esslingen, Deizisau and the central Neckar valley. We also serve longer routes to airports (Frankfurt, Munich) and rehab clinics. Questions about your specific route just give us a call.",
    },
    {
        "sort_order": 40,
        "category": "general",
        "question_de": "Sind Sie für Fahrten mit Krankenkassen-Erstattung zugelassen?",
        "question_en": "Are you authorized for trips with health insurance reimbursement?",
        "answer_de": "Wir stellen ordnungsgemäße Rechnungen mit allen Angaben aus, die Krankenkassen für eine Erstattung benötigen. Ob Ihre Kasse die Kosten übernimmt, hängt von der medizinischen Notwendigkeit und der jeweiligen Versicherung ab. Klären Sie das bitte vor der Fahrt mit Ihrer Krankenkasse.",
        "answer_en": "We provide proper invoices with all the information health insurers need for reimbursement. Whether your insurance covers the costs depends on medical necessity and your specific insurer. Please clarify this with your insurance before the trip.",
    },
    # === BOOKING ===
    {
        "sort_order": 10,
        "category": "booking",
        "question_de": "Wie buche ich eine Fahrt?",
        "question_en": "How do I book a ride?",
        "answer_de": "Drei Wege: (1) Online über unser Buchungsformular innerhalb von 30 Minuten erhalten Sie ein verbindliches Pauschalpreis-Angebot. (2) Telefonisch unter +49 7153 9292841. (3) Per WhatsApp für schnelle Anfragen.",
        "answer_en": "Three ways: (1) Online via our booking form within 30 minutes you receive a binding price quote. (2) By phone at +49 7153 9292841. (3) By WhatsApp for quick inquiries.",
    },
    {
        "sort_order": 20,
        "category": "booking",
        "question_de": "Kann ich eine Buchung stornieren?",
        "question_en": "Can I cancel a booking?",
        "answer_de": "Stornierungen bis **24 Stunden vor Fahrtbeginn** sind kostenfrei. Danach berechnen wir 50 % des vereinbarten Pauschalpreises, bei Nichterscheinen den vollen Preis. Bei Krankenhausfahrten und medizinischen Notfällen gelten kulante Sonderregelungen.",
        "answer_en": "Cancellations up to **24 hours before departure** are free. After that we charge 50% of the agreed price, or the full price for no-shows. For hospital transport and medical emergencies, we apply lenient special rules.",
    },
    {
        "sort_order": 30,
        "category": "booking",
        "question_de": "Bekomme ich eine Bestätigung?",
        "question_en": "Will I receive a confirmation?",
        "answer_de": "Ja, sofort nach Buchung erhalten Sie eine E-Mail mit Ihrer Referenznummer (Format: SN-JJJJMMTT-XXXXXX) und allen Details. Sobald wir den Pauschalpreis bestätigt haben, schicken wir Ihnen die endgültige Buchungsbestätigung.",
        "answer_en": "Yes, immediately after booking you receive an email with your reference number (format: SN-YYYYMMDD-XXXXXX) and all details. Once we've confirmed the price, we send you the final booking confirmation.",
    },
    # === PRICING ===
    {
        "sort_order": 10,
        "category": "pricing",
        "question_de": "Welche Zahlungsmethoden akzeptieren Sie?",
        "question_en": "Which payment methods do you accept?",
        "answer_de": "Im Fahrzeug: Bar oder EC-Karte / Girocard. Für Geschäftskunden: Rechnung mit 14 Tagen Zahlungsziel. PayPal auf Anfrage.",
        "answer_en": "In the vehicle: cash or EC card / Girocard. For business customers: invoice with 14-day payment terms. PayPal on request.",
    },
    {
        "sort_order": 20,
        "category": "pricing",
        "question_de": "Was passiert, wenn die Fahrt länger dauert als geplant?",
        "question_en": "What happens if the trip takes longer than planned?",
        "answer_de": "Der Pauschalpreis bleibt der Pauschalpreis — Sie zahlen keine Minute mehr, auch wenn wir wegen Stau länger unterwegs sind. Nur wenn **Sie** zusätzliche Stopps oder Wartezeiten wünschen, kann sich der Preis ändern, und das besprechen wir vorher.",
        "answer_en": "The price stays the price — you don't pay a minute more, even if we take longer because of traffic. Only if **you** request additional stops or waiting times can the price change, and we discuss that beforehand.",
    },
    {
        "sort_order": 30,
        "category": "pricing",
        "question_de": "Sind die Preise inklusive Mehrwertsteuer?",
        "question_en": "Are prices including VAT?",
        "answer_de": "Ja, alle ausgewiesenen Preise sind Endpreise inklusive Mehrwertsteuer. Für Geschäftskunden weisen wir die MwSt selbstverständlich auf der Rechnung separat aus.",
        "answer_en": "Yes, all displayed prices are final prices including VAT. For business customers we naturally show VAT separately on the invoice.",
    },
    # === AIRPORT-specific (category matches service slug for the service detail page) ===
    {
        "sort_order": 10,
        "category": "flughafentransfer",
        "question_de": "Was passiert, wenn mein Flug Verspätung hat?",
        "question_en": "What happens if my flight is delayed?",
        "answer_de": "Wir verfolgen alle Flüge in Echtzeit. Bei Verspätungen warten wir **60 Minuten kostenfrei** (für internationale Flüge nach Landung) bzw. **30 Minuten** für Inlandsflüge. Sollte sich die Verspätung darüber hinaus ziehen, koordinieren wir das individuell.",
        "answer_en": "We track all flights in real time. For delays we wait **60 minutes free of charge** (after landing, for international flights) or **30 minutes** for domestic flights. If the delay extends further, we coordinate individually.",
    },
    {
        "sort_order": 20,
        "category": "flughafentransfer",
        "question_de": "Wie erkenne ich meinen Fahrer am Flughafen?",
        "question_en": "How do I recognize my driver at the airport?",
        "answer_de": "Auf Wunsch (Meet & Greet): Ihr Fahrer wartet am Ausgang des Terminals mit einem Schild, auf dem Ihr Name steht. Ohne Meet & Greet: Wir schicken Ihnen das Fahrzeug-Kennzeichen und einen Treffpunkt am Vortag per WhatsApp oder E-Mail.",
        "answer_en": "On request (Meet & Greet): your driver waits at the terminal exit with a sign showing your name. Without Meet & Greet: we send you the vehicle license plate and a meeting point the day before by WhatsApp or email.",
    },
    # === HOSPITAL-specific ===
    {
        "sort_order": 10,
        "category": "krankenhausfahrten",
        "question_de": "Können Angehörige mitfahren?",
        "question_en": "Can family members come along?",
        "answer_de": "Selbstverständlich, eine Begleitperson fährt **kostenfrei** mit. Bei mehreren Personen sprechen Sie uns bitte vorher an wir setzen dann das passende Fahrzeug ein.",
        "answer_en": "Of course, one companion travels **free of charge**. For multiple passengers, please let us know in advance we'll arrange the appropriate vehicle.",
    },
    {
        "sort_order": 20,
        "category": "krankenhausfahrten",
        "question_de": "Sind Ihre Fahrzeuge für Personen mit eingeschränkter Mobilität geeignet?",
        "question_en": "Are your vehicles suitable for passengers with reduced mobility?",
        "answer_de": "Wir helfen beim Ein- und Aussteigen und unterstützen mit Gepäck und Gehhilfen. Für faltbare Rollstühle, vollelektrische Rollstühle oder schwere medizinische Geräte sprechen Sie uns bitte vor der Buchung an wir klären gemeinsam, welches Fahrzeug zu Ihren Anforderungen passt, und organisieren bei Bedarf ein geeignetes Fahrzeug.",
        "answer_en": "We help with getting in and out and assist with luggage and walking aids. For folding wheelchairs, powered wheelchairs or heavy medical equipment, please contact us before booking we'll work out together which vehicle suits your needs and arrange a suitable one if required.",
    },
]


def run() -> None:
    log_section(f"FAQs ({len(FAQS)} entries)")
    db = SessionLocal()
    try:
        from app.Models.faqs import Faq
        from app.Services.FaqsService import FaqsService

        actor = get_system_actor(db)
        created = 0
        skipped = 0
        for faq_data in FAQS:
            existing = (
                db.query(Faq).filter(Faq.question_de == faq_data["question_de"]).first()
            )
            if existing:
                skipped += 1
                continue
            FaqsService.create_faq(db, faq_data, actor, request=None)
            created += 1
        print(f"  [done] {created} created, {skipped} skipped")
    finally:
        db.close()


if __name__ == "__main__":
    run()
