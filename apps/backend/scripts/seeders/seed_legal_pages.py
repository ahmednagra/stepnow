# scripts/seeders/seed_legal_pages.py
"""Seed Impressum, Datenschutz, and AGB legal pages.

Workflow:
1. Create the page slug
2. Save a draft with title + body in both languages
3. Publish the draft → writes immutable version row

Placeholders use the validated single-brace syntax {site_settings.field}.
The backend resolves them at GET-time from the live site_settings row.

Idempotent: if a page slug exists and has a published version, the seeder
skips it. To reset, soft-delete the page first via admin, then re-run.
"""

from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402


IMPRESSUM_DE = """\
# Impressum

**Angaben gemäß § 5 TMG**

{site_settings.business_name}
{site_settings.owner_name}
{site_settings.legal_form}

{site_settings.address_street}
{site_settings.address_postcode} {site_settings.address_city}
{site_settings.address_country}

**Kontakt**

Telefon: {site_settings.phone}
Mobil: {site_settings.phone_mobile}
E-Mail: {site_settings.email}

**Genehmigung nach § 49 PBefG (Mietwagen mit Fahrer)**

Konzessionsnummer: {site_settings.concession_number}
Genehmigungsbehörde: {site_settings.concession_authority}
Erteilt am: {site_settings.concession_date}

**Aufsichtsbehörde**

Landratsamt Esslingen, Pulverwiesen 11, 73726 Esslingen am Neckar

**Umsatzsteuer-ID**

USt-IdNr.: {site_settings.vat_id}
Steuernummer: {site_settings.tax_number}

**Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV**

{site_settings.owner_name}
{site_settings.address_street}
{site_settings.address_postcode} {site_settings.address_city}

**EU-Streitschlichtung**

Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr.
Unsere E-Mail-Adresse finden Sie oben im Impressum.

**Verbraucherstreitbeilegung / Universalschlichtungsstelle**

Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.

**Haftung für Inhalte**

Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.

**Haftung für Links**

Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.

**Urheberrecht**

Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
"""

IMPRESSUM_EN = """\
# Legal Notice (Impressum)

> This is a translation for convenience. The German version is legally binding.

**Information pursuant to § 5 TMG (German Telemedia Act)**

{site_settings.business_name}
{site_settings.owner_name}
{site_settings.legal_form}

{site_settings.address_street}
{site_settings.address_postcode} {site_settings.address_city}
{site_settings.address_country}

**Contact**

Phone: {site_settings.phone}
Mobile: {site_settings.phone_mobile}
Email: {site_settings.email}

**Authorization under § 49 PBefG (Passenger Transport with Rental Cars)**

License number: {site_settings.concession_number}
Issuing authority: {site_settings.concession_authority}
Issued on: {site_settings.concession_date}

**Supervisory Authority**

Landratsamt Esslingen, Pulverwiesen 11, 73726 Esslingen am Neckar, Germany

**VAT Identification Number**

VAT ID: {site_settings.vat_id}
Tax Number: {site_settings.tax_number}

**Responsible for content pursuant to § 18(2) MStV**

{site_settings.owner_name}
{site_settings.address_street}
{site_settings.address_postcode} {site_settings.address_city}

**EU Online Dispute Resolution**

The European Commission provides a platform for online dispute resolution (ODR): https://ec.europa.eu/consumers/odr. Our email address is shown above.

**Consumer Dispute Resolution**

We are neither willing nor obligated to participate in dispute resolution proceedings before a consumer arbitration body.

**Liability for Content**

As a service provider, we are responsible for our own content on these pages in accordance with general laws pursuant to § 7(1) TMG. According to §§ 8 to 10 TMG, however, we are not obligated as a service provider to monitor transmitted or stored third-party information.

**Liability for Links**

Our offer contains links to external third-party websites over whose content we have no influence. Therefore, we cannot assume any liability for these external contents. The respective provider or operator of the pages is always responsible for the content of the linked pages.

**Copyright**

The content and works on these pages created by the site operators are subject to German copyright law. Duplication, processing, distribution and any form of commercialisation outside the limits of copyright law require the written consent of the respective author or creator.
"""

DATENSCHUTZ_DE = """\
# Datenschutzerklärung

**Stand: 11. Mai 2026**

## 1. Verantwortlicher

Verantwortlicher im Sinne der DSGVO ist:

{site_settings.business_name}
{site_settings.owner_name}
{site_settings.address_street}
{site_settings.address_postcode} {site_settings.address_city}
{site_settings.address_country}

Telefon: {site_settings.phone}
E-Mail: {site_settings.email}

## 2. Allgemeines zur Datenverarbeitung

Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur Bereitstellung einer funktionsfähigen Website sowie unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung erfolgt regelmäßig nur nach Einwilligung des Nutzers oder wenn ein Gesetz die Verarbeitung gestattet.

## 3. Rechtsgrundlage für die Verarbeitung personenbezogener Daten

- **Art. 6 Abs. 1 lit. a DSGVO** — Einwilligung des Nutzers
- **Art. 6 Abs. 1 lit. b DSGVO** — Erforderlich zur Vertragserfüllung (Buchungsabwicklung)
- **Art. 6 Abs. 1 lit. c DSGVO** — Rechtliche Verpflichtung (z. B. Aufbewahrungspflichten)
- **Art. 6 Abs. 1 lit. f DSGVO** — Wahrung berechtigter Interessen

## 4. Welche Daten wir verarbeiten

**Bei einer Buchungsanfrage:**

- Name, Telefonnummer, E-Mail-Adresse
- Abhol- und Zieladresse, Datum, Uhrzeit
- Anzahl Personen, Gepäck, besondere Anforderungen
- Bei Geschäftskunden: Firmenname, USt-IdNr.
- IP-Adresse, Zeitstempel (zur Betrugsprävention, max. 30 Tage)

**Bei Kontaktaufnahme:**

- Name, E-Mail-Adresse, Telefon (optional)
- Inhalt Ihrer Nachricht

**Bei Webseitenbesuch (automatisch):**

- IP-Adresse (anonymisiert, max. 7 Tage zur Server-Absicherung)
- Browser-Typ, Betriebssystem, besuchte Seiten (über Plausible Analytics — siehe unten)

## 5. Drittanbieter

**Plausible Analytics** (Plausible Insights OÜ, Estland)
Wir nutzen Plausible für Reichweitenmessung. Plausible setzt **keine Cookies**, sammelt **keine personenbezogenen Daten** und überträgt **keine Daten in Drittländer**. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an Reichweitenanalyse).

**Postmark** (Wildbit LLC, USA)
Versand transaktionaler E-Mails (Buchungsbestätigungen). E-Mail-Adressen werden zur Zustellung verarbeitet. Verarbeitung auf Grundlage Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Es besteht ein Auftragsverarbeitungsvertrag.

**OpenStreetMap** (OpenStreetMap Foundation, UK)
Für die Karte auf unserer Kontaktseite. OpenStreetMap erfasst keine personenbezogenen Daten zur Profilbildung.

## 6. Ihre Rechte

Sie haben das Recht auf:

- **Auskunft** (Art. 15 DSGVO)
- **Berichtigung** (Art. 16 DSGVO)
- **Löschung** (Art. 17 DSGVO)
- **Einschränkung der Verarbeitung** (Art. 18 DSGVO)
- **Datenübertragbarkeit** (Art. 20 DSGVO)
- **Widerspruch** (Art. 21 DSGVO)
- **Beschwerde bei der Aufsichtsbehörde** (Art. 77 DSGVO)

Zuständige Aufsichtsbehörde: Landesbeauftragter für den Datenschutz und die Informationsfreiheit Baden-Württemberg, Lautenschlagerstraße 20, 70173 Stuttgart.

## 7. Aufbewahrungsdauer

Buchungsdaten werden gemäß handels- und steuerrechtlicher Vorgaben **10 Jahre** aufbewahrt. Kontaktanfragen ohne Geschäftsabschluss werden nach **6 Monaten** gelöscht. IP-Adressen aus Server-Logs werden nach **7 Tagen** gelöscht.

## 8. Datensicherheit

Wir verwenden SSL/TLS-Verschlüsselung für die Datenübertragung. Unsere Server stehen in Deutschland. Zugriff auf personenbezogene Daten ist auf den Inhaber beschränkt.

## 9. Kontakt zum Datenschutz

Für Auskünfte oder die Wahrnehmung Ihrer Rechte kontaktieren Sie:

{site_settings.owner_name}
{site_settings.email}
{site_settings.phone}
"""

DATENSCHUTZ_EN = """\
# Privacy Policy

> This is a translation for convenience. The German version is legally binding.

**Last updated: 11 May 2026**

## 1. Data Controller

The data controller within the meaning of the GDPR is:

{site_settings.business_name}
{site_settings.owner_name}
{site_settings.address_street}
{site_settings.address_postcode} {site_settings.address_city}
{site_settings.address_country}

Phone: {site_settings.phone}
Email: {site_settings.email}

## 2. General Information on Data Processing

We process the personal data of our users only to the extent necessary to provide a functioning website and our content and services. Processing regularly takes place only with the user's consent or where a law permits the processing.

## 3. Legal Basis for Processing Personal Data

- **Art. 6(1)(a) GDPR** — User consent
- **Art. 6(1)(b) GDPR** — Necessary for contract performance (booking processing)
- **Art. 6(1)(c) GDPR** — Legal obligation (e.g. retention requirements)
- **Art. 6(1)(f) GDPR** — Protection of legitimate interests

## 4. What Data We Process

**For a booking request:**

- Name, phone number, email address
- Pickup and destination address, date, time
- Number of passengers, luggage, special requirements
- For business customers: company name, VAT ID
- IP address, timestamp (for fraud prevention, max. 30 days)

**For contact inquiries:**

- Name, email address, phone (optional)
- Content of your message

**On website visit (automatic):**

- IP address (anonymized, max. 7 days for server security)
- Browser type, operating system, pages visited (via Plausible Analytics — see below)

## 5. Third-Party Services

**Plausible Analytics** (Plausible Insights OÜ, Estonia)
We use Plausible for reach measurement. Plausible sets **no cookies**, collects **no personal data**, and transfers **no data to third countries**. Legal basis: Art. 6(1)(f) GDPR (legitimate interest in reach analysis).

**Postmark** (Wildbit LLC, USA)
Sending transactional emails (booking confirmations). Email addresses are processed for delivery. Processing on the basis of Art. 6(1)(b) GDPR (contract performance). A data processing agreement is in place.

**OpenStreetMap** (OpenStreetMap Foundation, UK)
For the map on our contact page. OpenStreetMap does not collect personal data for profiling.

## 6. Your Rights

You have the right to:

- **Information** (Art. 15 GDPR)
- **Rectification** (Art. 16 GDPR)
- **Erasure** (Art. 17 GDPR)
- **Restriction of processing** (Art. 18 GDPR)
- **Data portability** (Art. 20 GDPR)
- **Object** (Art. 21 GDPR)
- **Complaint to a supervisory authority** (Art. 77 GDPR)

Competent supervisory authority: Landesbeauftragter für den Datenschutz und die Informationsfreiheit Baden-Württemberg, Lautenschlagerstraße 20, 70173 Stuttgart, Germany.

## 7. Retention Period

Booking data is retained in accordance with commercial and tax law requirements for **10 years**. Contact inquiries without business conclusion are deleted after **6 months**. IP addresses from server logs are deleted after **7 days**.

## 8. Data Security

We use SSL/TLS encryption for data transmission. Our servers are located in Germany. Access to personal data is restricted to the owner.

## 9. Contact for Data Protection

For inquiries or to exercise your rights, contact:

{site_settings.owner_name}
{site_settings.email}
{site_settings.phone}
"""

AGB_DE = """\
# Allgemeine Geschäftsbedingungen (AGB)

**Stand: 11. Mai 2026**

> **Hinweis:** Diese AGB sind ein Erstentwurf. Vor Live-Schaltung bitte juristisch prüfen lassen.

## 1. Geltungsbereich

Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge über die Beförderung von Personen mit Mietwagen, die zwischen {site_settings.business_name} (nachfolgend "Anbieter") und dem Kunden geschlossen werden.

## 2. Vertragsschluss

Die Darstellung der Leistungen auf der Website stellt kein verbindliches Angebot dar. Mit Absenden des Buchungsformulars oder telefonischer Anfrage gibt der Kunde ein Angebot zum Vertragsschluss ab. Der Vertrag kommt durch eine Bestätigungs-E-Mail oder mündliche Bestätigung des Anbieters mit dem verbindlichen Pauschalpreis zustande.

## 3. Pauschalpreis-Garantie

Der bei Buchungsbestätigung mitgeteilte Pauschalpreis ist verbindlich und ändert sich nicht durch verkehrsbedingte Verzögerungen oder kürzere/längere Fahrtdauer. Änderungen entstehen nur, wenn der Kunde zusätzliche Strecken, Stopps oder Wartezeiten verlangt; in diesem Fall wird vor der Änderung ein neuer Pauschalpreis vereinbart.

## 4. Stornierungsbedingungen

- Bis **24 Stunden** vor Fahrtbeginn: kostenfreie Stornierung
- Bis **2 Stunden** vor Fahrtbeginn: 50 % des Pauschalpreis
- Weniger als 2 Stunden oder Nichterscheinen: 100 % des Pauschalpreis
- Bei medizinisch begründeten Notfällen kann die Stornogebühr im Einzelfall reduziert werden

## 5. Pünktlichkeit & Verspätungen

Der Anbieter ist bestrebt, den vereinbarten Abholzeitpunkt einzuhalten. Bei Flughafenabholungen wird die Flugnummer verfolgt; Wartezeiten bis 60 Minuten nach planmäßiger Landung sind kostenfrei. Höhere Gewalt, Unwetter, Verkehrsunfälle oder behördliche Maßnahmen begründen keine Schadensersatzansprüche gegen den Anbieter.

## 6. Pflichten des Kunden

Der Kunde hat:
- Korrekte Kontaktdaten und Abhol-/Zieladressen anzugeben
- Sich pünktlich am Abholort einzufinden
- Während der Fahrt die Anweisungen des Fahrers zu befolgen (Sicherheitsgurt, etc.)
- Beschädigungen oder Verschmutzungen des Fahrzeugs zu ersetzen

## 7. Haftung

Der Anbieter haftet bei Vorsatz und grober Fahrlässigkeit nach den gesetzlichen Bestimmungen. Bei einfacher Fahrlässigkeit haftet der Anbieter nur bei Verletzung vertragswesentlicher Pflichten (Kardinalpflichten) und begrenzt auf den vorhersehbaren, typischerweise eintretenden Schaden. Die Haftung für Personenschäden bleibt unberührt.

## 8. Versicherung

Der Anbieter unterhält die nach § 23 PBefG vorgeschriebene Personenbeförderungs-Haftpflichtversicherung mit ausreichender Deckungssumme.

## 9. Datenschutz

Es gilt die Datenschutzerklärung des Anbieters, einsehbar unter der URL /datenschutz.

## 10. Gerichtsstand & Anwendbares Recht

Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand für Streitigkeiten aus Verträgen mit Unternehmern ist {site_settings.address_city}. Für Verträge mit Verbrauchern gelten die gesetzlichen Gerichtsstände.

## 11. Salvatorische Klausel

Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. An die Stelle der unwirksamen Bestimmung tritt die gesetzliche Regelung.

## 12. Kontakt

{site_settings.business_name}
{site_settings.address_street}
{site_settings.address_postcode} {site_settings.address_city}
Telefon: {site_settings.phone}
E-Mail: {site_settings.email}
"""

AGB_EN = """\
# Terms and Conditions

**Last updated: 11 May 2026**

> **Note:** These terms are a first draft. Please have them reviewed legally before going live.

## 1. Scope

These General Terms and Conditions apply to all contracts for the transport of persons by rental vehicle concluded between {site_settings.business_name} (hereinafter "Provider") and the customer.

## 2. Conclusion of Contract

The presentation of services on the website does not constitute a binding offer. By submitting the booking form or making a telephone inquiry, the customer submits an offer to conclude a contract. The contract is concluded by a confirmation email or verbal confirmation from the Provider with the binding fixed price.

## 3. Fixed-Price Guarantee

The fixed price communicated upon booking confirmation is binding and does not change due to traffic delays or shorter/longer travel times. Changes only arise if the customer requests additional routes, stops or waiting times; in this case, a new fixed price is agreed before the change.

## 4. Cancellation Terms

- Up to **24 hours** before departure: free cancellation
- Up to **2 hours** before departure: 50% of the fixed price
- Less than 2 hours or no-show: 100% of the fixed price
- In medically justified emergencies, the cancellation fee may be reduced on a case-by-case basis

## 5. Punctuality & Delays

The Provider endeavours to meet the agreed pickup time. For airport pickups, the flight number is tracked; waiting times of up to 60 minutes after scheduled landing are free of charge. Force majeure, severe weather, traffic accidents or official measures do not give rise to claims for damages against the Provider.

## 6. Customer Obligations

The customer must:
- Provide correct contact details and pickup/destination addresses
- Arrive punctually at the pickup location
- Follow the driver's instructions during the journey (seatbelt, etc.)
- Compensate for damage or soiling of the vehicle

## 7. Liability

The Provider is liable for intent and gross negligence in accordance with statutory provisions. In the case of simple negligence, the Provider is only liable for the breach of contractual obligations essential to the contract (cardinal obligations) and limited to the foreseeable, typically occurring damage. Liability for personal injury remains unaffected.

## 8. Insurance

The Provider maintains the passenger transport liability insurance required by § 23 PBefG with sufficient coverage.

## 9. Data Protection

The Provider's privacy policy applies, available at the URL /privacy.

## 10. Jurisdiction & Applicable Law

German law applies, excluding the UN Convention on Contracts for the International Sale of Goods. The place of jurisdiction for disputes from contracts with businesses is {site_settings.address_city}. Statutory places of jurisdiction apply for contracts with consumers.

## 11. Severability

If any provision of these terms is invalid, the validity of the remaining provisions remains unaffected. The statutory regulation takes the place of the invalid provision.

## 12. Contact

{site_settings.business_name}
{site_settings.address_street}
{site_settings.address_postcode} {site_settings.address_city}
Phone: {site_settings.phone}
Email: {site_settings.email}
"""


LEGAL_PAGES = [
    {
        "slug": "impressum",
        "title_de": "Impressum",
        "title_en": "Legal Notice",
        "body_de": IMPRESSUM_DE,
        "body_en": IMPRESSUM_EN,
        "changes_summary": "Initial seed: Impressum gemäß § 5 TMG mit Konzessions- und Aufsichtsbehörde-Angaben.",
    },
    {
        "slug": "datenschutz",
        "title_de": "Datenschutzerklärung",
        "title_en": "Privacy Policy",
        "body_de": DATENSCHUTZ_DE,
        "body_en": DATENSCHUTZ_EN,
        "changes_summary": "Initial seed: DSGVO-konforme Datenschutzerklärung mit Plausible, Postmark, OpenStreetMap.",
    },
    {
        "slug": "agb",
        "title_de": "Allgemeine Geschäftsbedingungen",
        "title_en": "Terms and Conditions",
        "body_de": AGB_DE,
        "body_en": AGB_EN,
        "changes_summary": "Initial seed: AGB-Entwurf für Mietwagen-Personenbeförderung. Vor Live-Schaltung juristisch prüfen lassen.",
    },
]


def run() -> None:
    log_section(f"Legal pages ({len(LEGAL_PAGES)} pages)")
    db = SessionLocal()
    try:
        from app.Models.legal_pages import LegalPage, LegalPageVersion
        from app.Services.LegalPagesService import LegalPagesService
        actor = get_system_actor(db)
        created = 0
        skipped = 0
        for page_data in LEGAL_PAGES:
            slug = page_data["slug"]
            existing = db.query(LegalPage).filter(LegalPage.slug == slug).first()
            if existing and existing.published_version_id:
                log_skip(f"legal page '{slug}'", "has published version")
                skipped += 1
                continue
            # Create the page if missing
            if not existing:
                page = LegalPagesService.create_page(db, slug, actor, request=None)
            else:
                page = existing
            # Save draft
            draft = LegalPagesService.save_draft(
                db, slug,
                {
                    "title_de": page_data["title_de"],
                    "title_en": page_data["title_en"],
                    "body_de": page_data["body_de"],
                    "body_en": page_data["body_en"],
                    "changes_summary": page_data["changes_summary"],
                },
                actor, request=None,
            )
            # Publish the draft
            LegalPagesService.publish_draft(db, slug, actor, page_data["changes_summary"], request=None)
            log_create(f"legal page '{slug}'", f"title='{page_data['title_de']}', published")
            created += 1
        print(f"  [done] {created} created+published, {skipped} skipped")
    finally:
        db.close()


if __name__ == "__main__":
    run()
