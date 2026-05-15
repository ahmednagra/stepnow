# scripts/seeders/seed_legal_pages_google.py
# Publishes a new Datenschutz version that adds DSGVO-required disclosures for Google Maps, Fonts, Analytics.
from config.database import SessionLocal  # noqa: E402
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip  # noqa: E402


GOOGLE_BLOCK_DE = """

**Google Maps, Google Fonts und Google Analytics** (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland, sowie Google LLC, USA)

Diese Dienste werden ausschließlich nach Ihrer ausdrücklichen Einwilligung über unseren Cookie-Banner geladen. Vor der Einwilligung werden keine Daten an Google übertragen.

- **Google Maps:** Anzeige der Karte auf Kontakt- und Über-uns-Seite. Bei Aktivierung werden Ihre IP-Adresse sowie Nutzungsdaten an Google in den USA übertragen.
- **Google Fonts:** Schriftarten Inter und Playfair Display von Google-Servern. Standardmäßig nutzen wir selbst gehostete Schriftarten; Google Fonts werden nur bei Einwilligung nachgeladen.
- **Google Analytics 4 (GA4):** Anonymisierte Reichweitenmessung. Wir nutzen Google Consent Mode v2; ohne Ihre Einwilligung werden keine Analyse-Cookies gesetzt und keine personenbezogenen Daten erhoben.

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Sie können Ihre Einwilligung jederzeit über den Link „Cookie-Einstellungen" im Footer widerrufen.

**Drittlandtransfer:** Google überträgt Daten in die USA. Es gilt das EU-US Data Privacy Framework (Angemessenheitsbeschluss der EU-Kommission vom 10.07.2023, Az. C(2023) 4745).

Datenschutzerklärung von Google: https://policies.google.com/privacy
"""

GOOGLE_BLOCK_EN = """

**Google Maps, Google Fonts and Google Analytics** (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland, and Google LLC, USA)

These services are loaded only after your explicit consent via our cookie banner. No data is transmitted to Google before consent.

- **Google Maps:** Map display on the contact and about pages. When activated, your IP address and usage data are transmitted to Google in the USA.
- **Google Fonts:** Inter and Playfair Display fonts from Google servers. By default we serve fonts self-hosted; Google Fonts are only loaded after consent.
- **Google Analytics 4 (GA4):** Anonymised reach measurement. We use Google Consent Mode v2; without your consent no analytics cookies are set and no personal data is collected.

**Legal basis:** Art. 6(1)(a) GDPR (consent). You may withdraw consent at any time via the "Cookie settings" link in the footer.

**Third-country transfer:** Google transfers data to the USA. The EU-US Data Privacy Framework applies (EU Commission adequacy decision of 10 July 2023, Az. C(2023) 4745).

Google's privacy policy: https://policies.google.com/privacy
"""


def _append_block(body: str, block: str, anchor: str) -> str:
    if "Google Maps, Google Fonts" in body:
        return body
    idx = body.find(anchor)
    return body[:idx] + block + "\n" + body[idx:] if idx != -1 else body + block


def run() -> None:
    log_section("Legal pages: Google services disclosure (Datenschutz v2)")
    db = SessionLocal()
    try:
        from app.Models.legal_pages import LegalPage
        from app.Services.LegalPagesService import LegalPagesService
        actor = get_system_actor(db)
        page = db.query(LegalPage).filter(LegalPage.slug == "datenschutz").first()
        if not page or not page.published_version_id:
            log_skip("datenschutz", "no published version yet — run seed_legal_pages first")
            return
        current = db.query(type(page).published_version.property.mapper.class_).filter_by(id=page.published_version_id).first()
        if current and "Google Maps, Google Fonts" in (current.body_de or ""):
            log_skip("datenschutz", "Google services block already disclosed")
            return
        new_de = _append_block(current.body_de or "", GOOGLE_BLOCK_DE, "## 6. Ihre Rechte")
        new_en = _append_block(current.body_en or "", GOOGLE_BLOCK_EN, "## 6. Your Rights")
        LegalPagesService.save_draft(db, "datenschutz", {
            "title_de": current.title_de,
            "title_en": current.title_en,
            "body_de": new_de,
            "body_en": new_en,
            "changes_summary": "Google Maps, Google Fonts und Google Analytics (GA4) hinzugefügt — Einbindung nur nach Einwilligung über Cookie-Banner.",
        }, actor, request=None)
        LegalPagesService.publish_draft(db, "datenschutz", actor, request=None)
        log_create("datenschutz", "v2 published with Google services disclosure")
    finally:
        db.close()


if __name__ == "__main__":
    run()
