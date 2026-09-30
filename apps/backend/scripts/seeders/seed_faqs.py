# apps/backend/scripts/seeders/seed_faqs.py
# Seeds the FAQ list with the questions German chauffeur customers actually ask, grouped by the
# category that decides where each one surfaces on the site.
#
# general -> homepage teaser · booking -> the booking process · pricing -> how prices work
# airport / hospital / courier -> pinned to their own service page (category = service slug_de).
#
# Each entry has a stable "key" (stored as faqs.seed_key), so an admin rewording a question does not
# make the seeder create a duplicate. Managed seed (see _base.py): an FAQ is updated only while it is
# unedited since seeding; one an admin edited or deleted is kept as is. FAQs removed from this list
# are not deleted automatically (STALE_QUESTIONS_DE lists the few the seeder retires, again only
# when unedited).

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, human_edited_ids, is_unedited, log_kept, log_section, reconcile, seed_fingerprint

FIELDS = ("sort_order", "active", "category", "question_de", "question_en", "answer_de", "answer_en")
# Left over from the old car-rental template.
STALE_QUESTIONS_DE = ["Wie kann ich ein Auto buchen?"]

FAQS = [
    # === GENERAL ===
    {
        "key": "general.advance_booking",
        "sort_order": 10,
        "category": "general",
        "question_de": "Wie weit im Voraus muss ich buchen?",
        "question_en": "How far in advance do I need to book?",
        "answer_de": "Wir empfehlen mindestens **24 Stunden** im Voraus, um Ihren Wunschtermin garantiert zu erhalten. Kurzfristige Buchungen sind oft möglich — rufen Sie uns einfach an und wir prüfen die Verfügbarkeit.",
        "answer_en": "We recommend booking at least **24 hours** in advance to guarantee your preferred time. Short-notice bookings are often possible — just call us and we'll check availability.",
    },
    {
        "key": "general.vs_taxi",
        "sort_order": 20,
        "category": "general",
        "question_de": "Was unterscheidet Sie von einem Taxi?",
        "question_en": "How are you different from a taxi?",
        "answer_de": "Wir fahren ausschließlich auf Vorbestellung — kein spontaner Halt auf der Straße. Zum Flughafen und Hauptbahnhof Stuttgart gelten **Festpreise ab Ihrem Wohnort**, alle anderen Fahrten berechnen wir nach einem transparenten Tarif aus Anfahrt und Kilometern — ohne Taxameter-Überraschungen. Wir sind ein Mietwagenunternehmen nach § 49 PBefG, keine Taxi-Konzession. Praktisch bedeutet das: planbar, transparent, persönlich.",
        "answer_en": "We operate by pre-booking only — no spontaneous street pickups. Trips to Stuttgart Airport and Central Station have **fixed prices from your home town**; all other rides are charged at a transparent tariff of call-out charge plus kilometres — no taximeter surprises. We are a private-hire (Mietwagen) company under § 49 PBefG, not a taxi licence. In practice: predictable, transparent, personal.",
    },
    {
        "key": "general.short_notice",
        "sort_order": 25,
        "category": "general",
        "question_de": "Kann ich kurzfristig buchen?",
        "question_en": "Can I book at short notice?",
        "answer_de": "Kurzfristige Buchungen sind möglich — rufen Sie uns einfach an und wir prüfen die Verfügbarkeit.",
        "answer_en": "Short-notice bookings are possible — just give us a call and we'll check availability.",
    },
    {
        "key": "general.region",
        "sort_order": 30,
        "category": "general",
        "question_de": "In welcher Region fahren Sie?",
        "question_en": "Which area do you serve?",
        "answer_de": "Unser Hauptgebiet umfasst Deizisau, Altbach, Plochingen, Esslingen, Wernau, Wendlingen, Köngen, Aichwald, Ebersbach und Reichenbach/Hochdorf. Längere Strecken — etwa zu den Flughäfen Frankfurt oder München oder zu Reha-Kliniken — fahren wir ebenfalls; den Preis nennen wir Ihnen vorab. Bei Fragen zu Ihrer Strecke: einfach anrufen.",
        "answer_en": "Our main area covers Deizisau, Altbach, Plochingen, Esslingen, Wernau, Wendlingen, Köngen, Aichwald, Ebersbach and Reichenbach/Hochdorf. We also drive longer routes — for example to Frankfurt or Munich airport or to rehab clinics — and quote the price in advance. Questions about your route? Just give us a call.",
    },
    {
        "key": "general.health_insurance",
        "sort_order": 40,
        "category": "general",
        "question_de": "Sind Sie für Fahrten mit Krankenkassen-Erstattung zugelassen?",
        "question_en": "Are you authorized for trips with health insurance reimbursement?",
        "answer_de": "Wir stellen ordnungsgemäße Rechnungen mit allen Angaben aus, die Krankenkassen für eine Erstattung benötigen. Ob Ihre Kasse die Kosten übernimmt, hängt von der medizinischen Notwendigkeit und der jeweiligen Versicherung ab. Klären Sie das bitte vor der Fahrt mit Ihrer Krankenkasse.",
        "answer_en": "We provide proper invoices with all the information health insurers need for reimbursement. Whether your insurance covers the costs depends on medical necessity and your specific insurer. Please clarify this with your insurance before the trip.",
    },
    # === BOOKING ===
    {
        "key": "booking.how_to_book",
        "sort_order": 10,
        "category": "booking",
        "question_de": "Wie buche ich eine Fahrt?",
        "question_en": "How do I book a ride?",
        "answer_de": "Drei Wege: (1) Online über unser Buchungsformular unter step-now.de/buchen — innerhalb von 30 Minuten erhalten Sie ein verbindliches Angebot, und online vorbestellt sparen Sie bis zu 5 %. (2) Telefonisch unter 0155 1066 9395. (3) Per WhatsApp unter derselben Nummer.",
        "answer_en": "Three ways: (1) Online via our booking form at step-now.de/buchen — you receive a binding quote within 30 minutes, and booking online saves you up to 5%. (2) By phone at +49 155 1066 9395. (3) By WhatsApp on the same number.",
    },
    {
        "key": "booking.cancellation",
        "sort_order": 20,
        "category": "booking",
        "question_de": "Kann ich eine Buchung stornieren?",
        "question_en": "Can I cancel a booking?",
        "answer_de": "Ja. Bitte sagen Sie Ihre Fahrt so früh wie möglich ab — telefonisch, per WhatsApp oder E-Mail. Die genauen Stornierungsbedingungen finden Sie in unseren AGB. Bei medizinischen Notfällen finden wir selbstverständlich eine kulante Lösung.",
        "answer_en": "Yes. Please cancel your ride as early as possible — by phone, WhatsApp or email. The exact cancellation terms are set out in our terms and conditions (AGB). In medical emergencies we will of course find an accommodating solution.",
    },
    {
        "key": "booking.confirmation",
        "sort_order": 30,
        "category": "booking",
        "question_de": "Bekomme ich eine Bestätigung?",
        "question_en": "Will I receive a confirmation?",
        "answer_de": "Ja, sofort nach Buchung erhalten Sie eine E-Mail mit Ihrer Referenznummer (z. B. B-45260826) und allen Details. Diese Nummer begleitet Ihre Fahrt bis zur Rechnung. Sobald wir den Preis bestätigt haben, schicken wir Ihnen die endgültige Buchungsbestätigung.",
        "answer_en": "Yes, immediately after booking you receive an email with your reference number (e.g. B-45260826) and all details. That number stays with your ride all the way to the invoice. Once we've confirmed the price, we send you the final booking confirmation.",
    },
    # === PRICING ===
    {
        "key": "pricing.payment_methods",
        "sort_order": 10,
        "category": "pricing",
        "question_de": "Welche Zahlungsmethoden akzeptieren Sie?",
        "question_en": "Which payment methods do you accept?",
        "answer_de": "Im Fahrzeug: Bar oder EC-Karte / Girocard. Für Geschäftskunden: Rechnung mit 14 Tagen Zahlungsziel. PayPal auf Anfrage.",
        "answer_en": "In the vehicle: cash or EC card / Girocard. For business customers: invoice with 14-day payment terms. PayPal on request.",
    },
    {
        "key": "pricing.calculation",
        "sort_order": 15,
        "category": "pricing",
        "question_de": "Wie berechnen sich Ihre Preise?",
        "question_en": "How are your prices calculated?",
        "answer_de": "Zum Flughafen und Hauptbahnhof Stuttgart sowie für kurze Stadtfahrten bis 3 km gelten **Festpreise**. Alle anderen Fahrten berechnen wir nach Tarif: Anfahrt plus Kilometerpreis, gewünschte Wartezeit pro Minute. Die aktuellen Beträge finden Sie auf unserer Preisseite.",
        "answer_en": "Trips to Stuttgart Airport and Central Station and short local rides up to 3 km have **fixed prices**. All other rides are charged at our tariff: call-out charge plus price per kilometre, requested waiting time per minute. You'll find the current amounts on our pricing page.",
    },
    {
        "key": "pricing.overtime",
        "sort_order": 20,
        "category": "pricing",
        "question_de": "Was passiert, wenn die Fahrt länger dauert als geplant?",
        "question_en": "What happens if the trip takes longer than planned?",
        "answer_de": "Ein Festpreis bleibt fest — Sie zahlen nicht mehr, auch wenn wir wegen Stau länger unterwegs sind. Bei Fahrten nach Tarif zählen die gefahrenen Kilometer. Nur wenn **Sie** zusätzliche Stopps oder Wartezeit wünschen, berechnen wir diese nach Tarif — das besprechen wir vorher mit Ihnen.",
        "answer_en": "A fixed price stays fixed — you don't pay more, even if we take longer because of traffic. For tariff rides the kilometres driven count. Only if **you** request additional stops or waiting time do we charge these at our tariff — and we discuss that with you beforehand.",
    },
    {
        "key": "pricing.vat",
        "sort_order": 30,
        "category": "pricing",
        "question_de": "Sind die Preise inklusive Mehrwertsteuer?",
        "question_en": "Are prices including VAT?",
        "answer_de": "Ja, alle Preise für Personenfahrten sind Endpreise inklusive gesetzlicher Mehrwertsteuer. Kurierpreise verstehen sich netto zzgl. MwSt. Auf Rechnungen weisen wir die MwSt. selbstverständlich separat aus.",
        "answer_en": "Yes, all passenger prices are final prices including statutory VAT. Courier prices are net, plus VAT. We of course show VAT separately on invoices.",
    },
    {
        "key": "pricing.capacity",
        "sort_order": 40,
        "category": "pricing",
        "question_de": "Wie viele Personen können mitfahren?",
        "question_en": "How many people can ride along?",
        "answer_de": "Alle Preise gelten pro Fahrzeug für bis zu **4 Personen** — das ist die Fahrzeugkapazität, eine eigene Preisstufe für mehr Personen gibt es nicht. Für größere Gruppen setzen wir mehrere Fahrzeuge ein.",
        "answer_en": "All prices apply per vehicle for up to **4 persons** — that is the vehicle capacity; there is no separate price tier for more persons. For larger groups we deploy several vehicles.",
    },
    {
        "key": "pricing.discounts",
        "sort_order": 50,
        "category": "pricing",
        "question_de": "Gibt es Rabatte?",
        "question_en": "Do you offer discounts?",
        "answer_de": "Ja: Wenn Sie online vorbestellen, sparen Sie **bis zu 5 %**. Fahren Sie innerhalb einer Stunde mit uns zurück, erhalten Sie **10 % Rabatt auf die Rückfahrt**. Festpreise gelten je einfacher Fahrt — Hin- und Rückfahrt sind zwei Fahrten.",
        "answer_en": "Yes: pre-book online and save **up to 5%**. Ride back with us within one hour and get **10% off the return trip**. Fixed prices apply per one-way trip — outbound and return are two trips.",
    },
    # === AIRPORT-specific (category matches service slug for the service detail page) ===
    {
        "key": "airport.offer",
        "sort_order": 5,
        "category": "flughafentransfer",
        "question_de": "Bieten Sie Flughafentransfers an?",
        "question_en": "Do you offer airport transfers?",
        "answer_de": "Ja — zum Flughafen Stuttgart fahren wir zu **Festpreisen ab Ihrem Wohnort**, inklusive Flugverfolgung bei Abholungen. Andere Flughäfen wie Frankfurt oder München fahren wir ebenfalls; den Preis nennen wir Ihnen vorab.",
        "answer_en": "Yes — we drive to Stuttgart Airport at **fixed prices from your home town**, with flight tracking for pickups. We also drive to other airports such as Frankfurt or Munich and quote the price in advance.",
    },
    {
        "key": "airport.flight_delay",
        "sort_order": 10,
        "category": "flughafentransfer",
        "question_de": "Was passiert, wenn mein Flug Verspätung hat?",
        "question_en": "What happens if my flight is delayed?",
        "answer_de": "Wir verfolgen Ihren Flug und richten die Abholung nach der tatsächlichen Landung aus. Zusätzliche Wartezeit berechnen wir nach unserem Tarif pro Minute; bei längeren Verspätungen stimmen wir uns individuell mit Ihnen ab.",
        "answer_en": "We track your flight and time the pickup to your actual landing. Additional waiting time is charged at our per-minute tariff; for longer delays we coordinate with you individually.",
    },
    {
        "key": "airport.meet_driver",
        "sort_order": 20,
        "category": "flughafentransfer",
        "question_de": "Wie erkenne ich meinen Fahrer am Flughafen?",
        "question_en": "How do I recognize my driver at the airport?",
        "answer_de": "Auf Wunsch (Meet & Greet): Ihr Fahrer wartet am Ausgang des Terminals mit einem Schild, auf dem Ihr Name steht. Ohne Meet & Greet: Wir schicken Ihnen das Fahrzeug-Kennzeichen und einen Treffpunkt am Vortag per WhatsApp oder E-Mail.",
        "answer_en": "On request (Meet & Greet): your driver waits at the terminal exit with a sign showing your name. Without Meet & Greet: we send you the vehicle license plate and a meeting point the day before by WhatsApp or email.",
    },
    # === HOSPITAL-specific ===
    {
        "key": "hospital.companions",
        "sort_order": 10,
        "category": "krankenhausfahrten",
        "question_de": "Können Angehörige mitfahren?",
        "question_en": "Can family members come along?",
        "answer_de": "Selbstverständlich. Der Preis gilt pro Fahrzeug für bis zu 4 Personen — eine Begleitperson kostet also nichts extra. Bei mehreren Begleitpersonen sprechen Sie uns bitte vorher an.",
        "answer_en": "Of course. The price is per vehicle for up to 4 persons — so a companion costs nothing extra. For several companions, please let us know in advance.",
    },
    {
        "key": "hospital.mobility",
        "sort_order": 20,
        "category": "krankenhausfahrten",
        "question_de": "Sind Ihre Fahrzeuge für Personen mit eingeschränkter Mobilität geeignet?",
        "question_en": "Are your vehicles suitable for passengers with reduced mobility?",
        "answer_de": "Wir helfen beim Ein- und Aussteigen und unterstützen mit Gepäck und Gehhilfen. Für faltbare Rollstühle, vollelektrische Rollstühle oder schwere medizinische Geräte sprechen Sie uns bitte vor der Buchung an — wir klären gemeinsam, welches Fahrzeug zu Ihren Anforderungen passt.",
        "answer_en": "We help with getting in and out and assist with luggage and walking aids. For folding wheelchairs, powered wheelchairs or heavy medical equipment, please contact us before booking — we'll work out together which vehicle suits your needs.",
    },
    # === COURIER-specific ===
    {
        "key": "courier.base_price",
        "sort_order": 10,
        "category": "kurier-sondertransport",
        "question_de": "Was ist im Grundpreis für Kurierfahrten enthalten?",
        "question_en": "What does the courier base price include?",
        "answer_de": "Der Grundpreis enthält **5 km** Fahrstrecke und **1 Stunde** Be- und Entladezeit. Danach berechnen wir nach Kilometern und Wartezeit — je nach Fahrzeug (PKW/Kombi oder Sprinter). Express- und Sonderfahrten kosten einen Zuschlag; Strecken über 150 km nach Absprache. Kurierpreise verstehen sich netto zzgl. MwSt.",
        "answer_en": "The base price includes **5 km** of driving and **1 hour** of loading and unloading. After that we charge per kilometre and waiting time — depending on the vehicle (car/estate or Sprinter). Express and special trips carry a surcharge; distances over 150 km by arrangement. Courier prices are net, plus VAT.",
    },
]


def run() -> None:
    log_section(f"FAQs ({len(FAQS)} entries)")
    db = SessionLocal()
    try:
        from app.Models.faqs import Faq
        from app.Services.FaqsService import FaqsService

        actor = get_system_actor(db)
        human_ids = human_edited_ids(db, "faqs")
        counts = {"created": 0, "updated": 0, "unchanged": 0, "kept": 0, "retired": 0}
        for stale in db.query(Faq).filter(Faq.question_de.in_(STALE_QUESTIONS_DE), Faq.is_deleted == False).all():
            if is_unedited(stale, FIELDS, human_ids):
                FaqsService.soft_delete_faq(db, stale.id, actor, request=None)
                counts["retired"] += 1
        for entry in FAQS:
            key = entry["key"]
            values = {k: v for k, v in entry.items() if k != "key"}
            existing = (
                db.query(Faq).filter(Faq.seed_key == key).order_by(Faq.is_deleted).first()
                or db.query(Faq).filter(Faq.seed_key.is_(None), Faq.question_de == values["question_de"]).order_by(Faq.is_deleted).first()
            )
            stamp = {"seed_key": key, "seed_hash": seed_fingerprint(values)}
            if existing is None:
                FaqsService.create_faq(db, {**values, **stamp}, actor, request=None)
                counts["created"] += 1
                continue
            action = reconcile(existing, values, human_ids, actor)
            if action == "kept":
                log_kept(f"faq '{key}'")
                counts["kept"] += 1
            elif action == "same":
                existing.seed_key, existing.seed_hash = stamp["seed_key"], stamp["seed_hash"]
                db.commit()
                counts["unchanged"] += 1
            else:
                if existing.is_deleted:
                    FaqsService.restore_faq(db, existing.id, actor, request=None)
                FaqsService.update_faq(db, existing.id, {**values, **stamp}, actor, request=None)
                counts["updated"] += 1
        print("  [done] " + ", ".join(f"{n} {label}" for label, n in counts.items()))
    finally:
        db.close()


if __name__ == "__main__":
    run()
