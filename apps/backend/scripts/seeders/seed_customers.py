# apps/backend/scripts/seeders/seed_customers.py
# Imports all 69 B2B customers from StepNow_Data.json — values copied VERBATIM.
# All are business dispatch clients (Frachtführer / Kurierdienste).
#
# Name splitting: first word → first_name, remainder → last_name.
# company_name = full name from JSON.
# company_vatid = ustId from JSON (where provided).
# kontakt field → internal_notes (contact person if present).
# All have is_business=True (100% B2B freight companies).
# Idempotent: keyed by company_vatid if non-empty, otherwise by last_name (company full name).
# Legacy customer number stored in internal_notes as "Legacy: K911XXX".

from config.database import SessionLocal
from scripts.seeders._base import get_system_actor, log_section, log_create, log_skip

# fmt: off
CUSTOMERS = [
    # ── K911001 ──
    {"legacy_nr": "K911001", "company": "Radovanovic GmbH - Express & Logistik", "kontakt": "", "street": "Stockäcker Str. 8", "plz": "88281", "ort": "Schlier", "vat_id": ""},
    # ── K911002 ──
    {"legacy_nr": "K911002", "company": "Ontour transport service GmbH", "kontakt": "", "street": "Seinestraße 1", "plz": "65479", "ort": "Raunheim", "vat_id": ""},
    # ── K911003 ──
    {"legacy_nr": "K911003", "company": "Rüdinger Transport GmbH", "kontakt": "", "street": "Lilienthal Straße 7", "plz": "70825", "ort": "Korntak-Münchingen", "vat_id": ""},
    # ── K911004 ──
    {"legacy_nr": "K911004", "company": "Erb Transporte GmbH", "kontakt": "", "street": "Plankstrße 9", "plz": "71665", "ort": "Vaihingen/Enz", "vat_id": ""},
    # ── K911005 ──
    {"legacy_nr": "K911005", "company": "Expresslogistik Reinwald GmbH", "kontakt": "", "street": "Gewerbegebiet 1", "plz": "91741", "ort": "Theilenhofen", "vat_id": ""},
    # ── K911006 ──
    {"legacy_nr": "K911006", "company": "Transport Betz GmbH & Co.", "kontakt": "", "street": "Daimlerstraße 22", "plz": "76316", "ort": "Malsch", "vat_id": ""},
    # ── K911007 ──
    {"legacy_nr": "K911007", "company": "H & M Kuriere GmbH", "kontakt": "", "street": "Walter-Bothe-Straße 1", "plz": "68169", "ort": "Mannheim", "vat_id": ""},
    # ── K911008 ──
    {"legacy_nr": "K911008", "company": "Rahn-Transporte e.K.", "kontakt": "", "street": "Leibnizstraße 5", "plz": "89231", "ort": "Neu-Ulm", "vat_id": ""},
    # ── K911009 ──
    {"legacy_nr": "K911009", "company": "Maintaler Express Logistik GmbH Co. & KG", "kontakt": "", "street": "Keltenstraße 7", "plz": "63486", "ort": "Bruchköbel", "vat_id": ""},
    # ── K911010 ──
    {"legacy_nr": "K911010", "company": "Senex Logistik GmbH", "kontakt": "", "street": "Steinweg 8", "plz": "71263", "ort": "Weil der Stadt", "vat_id": ""},
    # ── K911011 ──
    {"legacy_nr": "K911011", "company": "A & M direkt-express GmbH", "kontakt": "", "street": "Neun Morgen 11", "plz": "76764", "ort": "Rheinzabern", "vat_id": ""},
    # ── K911012 ──
    {"legacy_nr": "K911012", "company": "bgm express logistik GmbH", "kontakt": "", "street": "Stuttgarter Straße 59", "plz": "74321", "ort": "Beitigheim-Bissingen", "vat_id": ""},
    # ── K911013 ──
    {"legacy_nr": "K911013", "company": "Concord Express GmbH & Co. KG", "kontakt": "", "street": "Mozartstraße 16", "plz": "76761", "ort": "Rülzheim", "vat_id": ""},
    # ── K911014 ──
    {"legacy_nr": "K911014", "company": "Leo Express Kurier", "kontakt": "Patricia Szilvasi", "street": "Wurmburger Straße 32", "plz": "75446", "ort": "Wiernsheim", "vat_id": ""},
    # ── K911015 ──
    {"legacy_nr": "K911015", "company": "E-express-Logistic GmbH", "kontakt": "", "street": "Driburger Str. 10", "plz": "33647", "ort": "Bielefeld", "vat_id": ""},
    # ── K911016 ──
    {"legacy_nr": "K911016", "company": "OCU Express & Logistics GmbH", "kontakt": "", "street": "Stützeläckerweg 13", "plz": "60489", "ort": "Frankfurt am Main", "vat_id": ""},
    # ── K911017 ──
    {"legacy_nr": "K911017", "company": "Transportservice Gräßle", "kontakt": "", "street": "Tannenweg 5", "plz": "63863", "ort": "Eschau", "vat_id": ""},
    # ── K911018 ──
    {"legacy_nr": "K911018", "company": "Speed Europe GmbH", "kontakt": "", "street": "Daimler Straße 15", "plz": "73037", "ort": "Göppingen", "vat_id": ""},
    # ── K911019 ──
    {"legacy_nr": "K911019", "company": "Baden Express Logistics GmbH", "kontakt": "", "street": "Mättich 12", "plz": "77880", "ort": "Sasbach", "vat_id": ""},
    # ── K911020 ──
    {"legacy_nr": "K911020", "company": "GXPRESS Eiltransport", "kontakt": "", "street": "Bergstraße 8", "plz": "74429", "ort": "Sulzbach-Laufen", "vat_id": ""},
    # ── K911021 ──
    {"legacy_nr": "K911021", "company": "Euralogistik GmbH", "kontakt": "", "street": "Silcher Straße 19", "plz": "70825", "ort": "Korntal-Münchingen", "vat_id": ""},
    # ── K911022 ──
    {"legacy_nr": "K911022", "company": "HHK-Express Inh. Sylvio Klär", "kontakt": "", "street": "Gosheimer Straße 4", "plz": "78564", "ort": "Wehingen", "vat_id": ""},
    # ── K911023 ──
    {"legacy_nr": "K911023", "company": "Express Solution GmbH", "kontakt": "", "street": "Enz Straße 35", "plz": "70806", "ort": "Kornwestheim", "vat_id": ""},
    # ── K911024 ──
    {"legacy_nr": "K911024", "company": "Altinok Transporte", "kontakt": "", "street": "Talstr. 36", "plz": "72336", "ort": "Balingen", "vat_id": ""},
    # ── K911025 ──
    {"legacy_nr": "K911025", "company": "RIES Express & Logistik GmbH", "kontakt": "", "street": "Kastner Straße 6", "plz": "92224", "ort": "Amberg", "vat_id": ""},
    # ── K911026 ──
    {"legacy_nr": "K911026", "company": "Spedition H.P. Sobeck GmbH", "kontakt": "", "street": "Gewerbestr. 2", "plz": "71332", "ort": "Waiblingen", "vat_id": ""},
    # ── K911027 ──
    {"legacy_nr": "K911027", "company": "GIGA  Logistics GmbH", "kontakt": "", "street": "Friedenstr. 22", "plz": "70806", "ort": "Kornwestheim", "vat_id": ""},
    # ── K911028 ──
    {"legacy_nr": "K911028", "company": "H T R Logistik", "kontakt": "Hans Jürgen Trappe", "street": "Graf Wilhelm Straße 13", "plz": "89613", "ort": "Oberstadion", "vat_id": ""},
    # ── K911029 ──
    {"legacy_nr": "K911029", "company": "Inside Logistics", "kontakt": "", "street": "Bahnhof Straße 20", "plz": "71332", "ort": "Waiblingen", "vat_id": ""},
    # ── K911030 ──
    {"legacy_nr": "K911030", "company": "Zacherl-Transporte", "kontakt": "", "street": "Kathrinen Straße 1", "plz": "70794", "ort": "Filderstadt", "vat_id": ""},
    # ── K911031 ──
    {"legacy_nr": "K911031", "company": "KDE Transport GmbH", "kontakt": "", "street": "Willi-Grasser-Str. 18", "plz": "91056", "ort": "Erlangen", "vat_id": ""},
    # ── K911032 ──
    {"legacy_nr": "K911032", "company": "Heuber Kurier GmbH", "kontakt": "", "street": "Greutweg 29", "plz": "78559", "ort": "Gosheim", "vat_id": ""},
    # ── K911033 ──
    {"legacy_nr": "K911033", "company": "Die Funkpiloten GmbH", "kontakt": "", "street": "Eiffestraße 78", "plz": "20537", "ort": "Hamburg", "vat_id": ""},
    # ── K911034 ──
    {"legacy_nr": "K911034", "company": "ECL euro.COURIER Logistecs GmbH", "kontakt": "", "street": "Jagdschänken Straße 100", "plz": "09116", "ort": "Chemnitz", "vat_id": ""},
    # ── K911035 ──
    {"legacy_nr": "K911035", "company": "Gomes Transporte", "kontakt": "", "street": "Brigach Straße 15", "plz": "70376", "ort": "Stuttgart", "vat_id": ""},
    # ── K911036 ──
    {"legacy_nr": "K911036", "company": "Tefra Terminfracht GmbH", "kontakt": "", "street": "Erich-Herion-Str. 16", "plz": "70736", "ort": "Fellbach", "vat_id": ""},
    # ── K911037 ──
    {"legacy_nr": "K911037", "company": "Priority Freight Europe GmbH", "kontakt": "", "street": "Hanns-Martin.Schleyer-Str. 9d", "plz": "47877", "ort": "Willich", "vat_id": "DE815200781"},
    # ── K911038 ──
    {"legacy_nr": "K911038", "company": "STEX GmbH", "kontakt": "", "street": "Schneller Straße 60", "plz": "12439", "ort": "Berlin", "vat_id": "DE31116267"},
    # ── K911039 ──
    {"legacy_nr": "K911039", "company": "Concept Logistics GmbH", "kontakt": "", "street": "Mole Straße 37", "plz": "63452", "ort": "Hanau", "vat_id": "DE265264116"},
    # ── K911040 ──
    {"legacy_nr": "K911040", "company": "Hipke Transporte", "kontakt": "", "street": "In der Aue 2 b", "plz": "53773", "ort": "Hennef", "vat_id": "DE269201368"},
    # ── K911041 ──
    {"legacy_nr": "K911041", "company": "Sovereign Speed Germany GmbH", "kontakt": "", "street": "Behrung Straße 126", "plz": "22763", "ort": "Hamburg", "vat_id": "DE301790581"},
    # ── K911042 ──
    {"legacy_nr": "K911042", "company": "Damsen Express Logistik GmbH", "kontakt": "", "street": "Gewerbegasse 3", "plz": "83395", "ort": "Freilassing", "vat_id": "DE324984572"},
    # ── K911043 ──
    {"legacy_nr": "K911043", "company": "DAGO Express GmbH", "kontakt": "", "street": "Karl-Marx-Straße 193", "plz": "15230", "ort": "Frankfurt (Oder)", "vat_id": "DE 342078274"},
    # ── K911044 ──
    {"legacy_nr": "K911044", "company": "Spedition Höhner GmbH", "kontakt": "", "street": "Im Bruch 9", "plz": "57635", "ort": "Weyerbusch", "vat_id": ""},
    # ── K911045 ──
    {"legacy_nr": "K911045", "company": "Peter Adolf Molde Internationale Transport e.K.", "kontakt": "", "street": "Aindorfer Straße 135", "plz": "80689", "ort": "München", "vat_id": "DE358280185"},
    # ── K911046 ──
    {"legacy_nr": "K911046", "company": "Nexa  Spedition GmbH", "kontakt": "", "street": "Rheinstraße 13", "plz": "65795", "ort": "Hattersheim", "vat_id": "DE305112014"},
    # ── K911047 ──
    {"legacy_nr": "K911047", "company": "The Special Carrier Frachtservice GmbH", "kontakt": "", "street": "Halskestr 38", "plz": "22113", "ort": "Hamburg", "vat_id": "DE812506555"},
    # ── K911048 ──
    {"legacy_nr": "K911048", "company": "ILS Express Logistic GmbH", "kontakt": "", "street": "Erich-Herion-Straße 6", "plz": "70736", "ort": "Fellbach", "vat_id": ""},
    # ── K911049 ──
    {"legacy_nr": "K911049", "company": "Herrhammer Transporte GmbH", "kontakt": "", "street": "Kreillerstr. 175", "plz": "81825", "ort": "München", "vat_id": "DE454593478"},
    # ── K911050 ──
    {"legacy_nr": "K911050", "company": "Keterle Transporte", "kontakt": "", "street": "Feld 1", "plz": "88353", "ort": "Kißlegg", "vat_id": ""},
    # ── K911051 ──
    {"legacy_nr": "K911051", "company": "Speed Trans GmbH & Co. KG", "kontakt": "", "street": "Mauer Straße 10", "plz": "30916", "ort": "Isernhagen", "vat_id": "DE284816659"},
    # ── K911052 ──
    {"legacy_nr": "K911052", "company": "TSB Transport Spedition Bauriedl", "kontakt": "Herr Fran Bauriedl", "street": "Am Heckelchen 8", "plz": "53639", "ort": "Königswinter", "vat_id": "DE177827381"},
    # ── K911053 ──
    {"legacy_nr": "K911053", "company": "ML Express & Logistics GmbH", "kontakt": "", "street": "Edison Straße 8a", "plz": "63477", "ort": "Maintal", "vat_id": "DE266123716"},
    # ── K911054 ──
    {"legacy_nr": "K911054", "company": "Fahrlogistik Wächter Gmbh", "kontakt": "NL Wuppertal", "street": "Zeughausstraße 63", "plz": "42287", "ort": "Wuppertal", "vat_id": "DE81497642"},
    # ── K911055 ──
    {"legacy_nr": "K911055", "company": "SKD Express & Speditions GmbH", "kontakt": "", "street": "Hohe Steiner 8", "plz": "58509", "ort": "Lüdenscheid", "vat_id": "DE 125803272"},
    # ── K911056 ──
    {"legacy_nr": "K911056", "company": "Schmalz+Schön Logistics GmbH", "kontakt": "", "street": "Ring Straße 39-41", "plz": "70736", "ort": "Fellbach", "vat_id": "DE"},
    # ── K911057 ──
    {"legacy_nr": "K911057", "company": "KHD Sonderfahrtenlogistik", "kontakt": "Karl Heinz Drabandt", "street": "Oberkemmathener Straße 20", "plz": "91731", "ort": "Langfurth", "vat_id": "DE 209154090"},
    # ── K911058 ──
    {"legacy_nr": "K911058", "company": "Karle Logistics GmbH & Co. KG", "kontakt": "", "street": "Gottlieb-Daimler-Straße 18", "plz": "71394", "ort": "Kernen (Remstal)", "vat_id": "DE815573377"},
    # ── K911059 ──
    {"legacy_nr": "K911059", "company": "am express GmbH", "kontakt": "", "street": "Ferdinand-Porsche.Str. 7", "plz": "76275", "ort": "Ettlingen", "vat_id": "DE305507976"},
    # ── K911060 ──
    {"legacy_nr": "K911060", "company": "MOE-Logistik", "kontakt": "Inh. Benjamin Allgaier", "street": "Am Leitzelbach 20", "plz": "74889", "ort": "Sinsheim", "vat_id": "DE 248984431"},
    # ── K911061 ──
    {"legacy_nr": "K911061", "company": "DWK Kurierdienst GmbH", "kontakt": "", "street": "Laubenhof 4", "plz": "45326", "ort": "Essen", "vat_id": "DE186030655"},
    # ── K911062 ──
    {"legacy_nr": "K911062", "company": "Forward Direct Limited", "kontakt": "", "street": "Unit 93 Newtown Way, Malahide Road Industrial Park, Coolock", "plz": "", "ort": "Dublin 17", "vat_id": "IE 8295736V"},
    # ── K911063 ──
    {"legacy_nr": "K911063", "company": "AktivLogistik int. Spedition", "kontakt": "Inh. Thorsten Labus", "street": "Untere Stöckstr. 10d", "plz": "75180", "ort": "Pforzheim", "vat_id": ""},
    # ── K911064 ──
    {"legacy_nr": "K911064", "company": "Katja Transporte", "kontakt": "", "street": "Nasov'ce 9", "plz": "1218", "ort": "Komenda", "vat_id": ""},
    # ── K911065 ──
    {"legacy_nr": "K911065", "company": "Leo - Express", "kontakt": "Inh.  Miguel Sampedro Martinez", "street": "Grovestraße 10", "plz": "30853", "ort": "Langenhagen", "vat_id": "DE36463358"},
    # ── K911066 ──
    {"legacy_nr": "K911066", "company": "TimeStar Logistik GmbH", "kontakt": "", "street": "", "plz": "", "ort": "", "vat_id": ""},
    # ── K911067 ──
    {"legacy_nr": "K911067", "company": "Hans Peter Roos Speditionsdienstleistungen", "kontakt": "Marem Roos", "street": "", "plz": "", "ort": "", "vat_id": ""},
    # ── K911068 ──
    {"legacy_nr": "K911068", "company": "Spedition Askari GmbH", "kontakt": "Tanveer Askari", "street": "", "plz": "", "ort": "", "vat_id": ""},
    # ── K911069 ──
    {"legacy_nr": "K911069", "company": "Go Logistik GmbH", "kontakt": "", "street": "", "plz": "", "ort": "", "vat_id": ""},
]
# fmt: on


def _split_name(company: str) -> tuple[str, str]:
    """Split 'First Rest of Name' → ('First', 'Rest of Name').
    If only one word, first_name=company, last_name=company.
    """
    parts = company.strip().split(" ", 1)
    if len(parts) == 1:
        return parts[0], parts[0]
    return parts[0], parts[1]


def run() -> None:
    log_section(f"Customers — legacy B2B ({len(CUSTOMERS)} companies from StepNow_Data.json)")
    db = SessionLocal()
    try:
        from app.Models.customers import Customer
        from app.Services.CustomersService import CustomersService

        actor = get_system_actor(db)
        created = skipped = 0
        for raw in CUSTOMERS:
            company = raw["company"]
            legacy_nr = raw["legacy_nr"]
            vat_id = raw["vat_id"].strip() or None
            # Normalise "DE" alone to None (incomplete VAT ID in source data)
            if vat_id == "DE":
                vat_id = None

            # Idempotency key: prefer VAT ID, fall back to full company name in last_name.
            existing = None
            if vat_id:
                existing = (
                    db.query(Customer)
                    .filter(Customer.company_vatid == vat_id)
                    .first()
                )
            if not existing:
                # Match on internal_notes legacy tag OR exact company_name
                existing = (
                    db.query(Customer)
                    .filter(Customer.company_name == company)
                    .first()
                )

            if existing:
                log_skip(f"customer '{legacy_nr}' — {company}", f"id={existing.id}")
                skipped += 1
                continue

            first_name, last_name = _split_name(company)
            kontakt = raw.get("kontakt", "").strip()
            notes_parts = [f"Legacy: {legacy_nr}"]
            if kontakt:
                notes_parts.append(f"Kontakt: {kontakt}")

            data = {
                "first_name": first_name,
                "last_name": last_name,
                "is_business": True,
                "company_name": company,
                "company_vatid": vat_id,
                "street": raw["street"] or None,
                "plz": raw["plz"] or None,
                "ort": raw["ort"] or None,
                "email": None,
                "phone": None,
                "internal_notes": " | ".join(notes_parts),
            }
            c = CustomersService.create(db, data, actor, request=None)
            log_create(f"customer '{legacy_nr}'", f"id={c.id}, company={company}")
            created += 1

        print(f"  [done] {created} created, {skipped} skipped")
    finally:
        db.close()


if __name__ == "__main__":
    run()
