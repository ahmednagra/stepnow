# apps/backend/scripts/seeders/seed_legacy_orders.py
# Imports all 81 Auftraege from StepNow_Data.json as the full
# Order → Invoice → Payment chain using the existing services.
#
# Strategy:
#   1. Look up Customer by legacy_nr stored in internal_notes ("Legacy: K911XXX").
#   2. Create Order via direct DB insert (historical dates; avoids email triggers).
#   3. Create Invoice via InvoicesService.create_from_order() — idempotent.
#   4. If rechnung.stat == "Bezahlt": record Payment via PaymentsService.record().
#
# Financial authority: rechnung (invoice) amounts are canonical — not auftrag.net.
# rechnung.net == entry.net (0 mismatches confirmed). auftrag.net = quoted price.
#
# Idempotency: keyed by internal_notes tag "LEGACY_AUF:<nr>" on the Order.
# Source: StepNow_Data.json  fileId=STEPNOW-K911

from datetime import date, datetime, timezone
from decimal import Decimal
from types import SimpleNamespace

from config.database import SessionLocal
from scripts.seeders._base import get_system_actor, log_section, log_create

# ── All 81 auftraege — 100% identical values from StepNow_Data.json ───────────
# Fields per record:
#   auftrag_nr    : auftrag.nr  (e.g. "01010526")
#   rechnung_nr   : rechnung.id / auftrag.rechnungNr (becomes invoice_number via service)
#   cust_nr       : JSON custNr → used to look up Customer by internal_notes
#   ku            : customer name snapshot (as it appeared on the job)
#   von           : pickup (origin address)
#   nch           : destination
#   km            : distance in km (0 when not recorded / Ersatzwagen)
#   fz            : vehicle
#   termin        : job date (YYYY-MM-DD)
#   ref_nr        : customer reference number
#   # rechnung fields (canonical billing amounts):
#   r_net         : rechnung.net
#   r_vat_r       : rechnung.mwstR (rate as fraction e.g. 0.19)
#   r_vat_b       : rechnung.mwstB (VAT amount, pre-computed)
#   r_brutto      : rechnung.brutto
#   r_zz          : rechnung.zz (payment term days)
#   r_faellig     : rechnung.faellig (due date YYYY-MM-DD)
#   r_dat         : rechnung.dat (invoice issue date YYYY-MM-DD)
#   r_stat        : "Bezahlt" | "Unbezahlt"
#   r_skonto      : skonto percentage (0 = none)
#   empfaenger    : rechnung.empfaenger (recipient name on invoice)

AUFTRAEGE = [
    # ── A1 ──
    {"auftrag_nr":"01010526","rechnung_nr":"R01010526","cust_nr":"K911003","ku":"Rüdinger Transport GmbH","von":"Esslingen","nch":"Nüziders","km":278,"fz":"SN 9889","termin":"2026-05-01","ref_nr":"260401718","r_net":Decimal("240.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("45.60"),"r_brutto":Decimal("285.60"),"r_zz":30,"r_faellig":"2026-05-31","r_dat":"2026-05-01","r_stat":"Bezahlt","r_skonto":Decimal("3.5"),"empfaenger":"Rüdinger Transport GmbH"},
    # ── A2 ──
    {"auftrag_nr":"01040526","rechnung_nr":"R01040526","cust_nr":"K911037","ku":"Priority Freight Europe GmbH","von":"Wernau","nch":"Asbach-Bäuhmenheim","km":200,"fz":"SN 1122","termin":"2026-05-04","ref_nr":"1025872/1020901","r_net":Decimal("250.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("47.50"),"r_brutto":Decimal("297.50"),"r_zz":30,"r_faellig":"2026-06-09","r_dat":"2026-05-10","r_stat":"Unbezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Priority Freight Europe GmbH"},
    # ── A3 ──
    {"auftrag_nr":"02040526","rechnung_nr":"R02040526","cust_nr":"K911004","ku":"Erb Transporte GmbH","von":"Kirchheim (Teck)","nch":"Saarbrücken","km":216,"fz":"SN 9889","termin":"2026-05-04","ref_nr":"000364732","r_net":Decimal("180.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("34.20"),"r_brutto":Decimal("214.20"),"r_zz":45,"r_faellig":"2026-06-24","r_dat":"2026-05-10","r_stat":"Bezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Erb Transporte GmbH"},
    # ── A4 ──
    {"auftrag_nr":"03040526","rechnung_nr":"R03040526","cust_nr":"K911004","ku":"Erb Transporte GmbH","von":"Sankt Ingbert","nch":"Burgdorf","km":380,"fz":"SN 9889","termin":"2026-05-04","ref_nr":"","r_net":Decimal("400.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("76.00"),"r_brutto":Decimal("476.00"),"r_zz":45,"r_faellig":"2026-06-24","r_dat":"2026-05-10","r_stat":"Unbezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Erb Transporte GmbH"},
    # ── A5 ──
    {"auftrag_nr":"04040526","rechnung_nr":"R04040526","cust_nr":"K911003","ku":"Rüdinger Transport GmbH","von":"Esslingen","nch":"Feldkirchen-Westerham","km":260,"fz":"SN 1122","termin":"2026-05-04","ref_nr":"260500109","r_net":Decimal("230.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("43.70"),"r_brutto":Decimal("273.70"),"r_zz":30,"r_faellig":"2026-06-09","r_dat":"2026-05-10","r_stat":"Bezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Rüdinger Transport GmbH"},
    # ── A6 ──
    {"auftrag_nr":"01050526","rechnung_nr":"R01050526","cust_nr":"K911004","ku":"Erb Transporte GmbH","von":"Nürtingen","nch":"Mühllheim","km":200,"fz":"SN 9889","termin":"2026-05-05","ref_nr":"000365289","r_net":Decimal("190.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("36.10"),"r_brutto":Decimal("226.10"),"r_zz":45,"r_faellig":"2026-06-24","r_dat":"2026-05-10","r_stat":"Bezahlt","r_skonto":Decimal("0"),"empfaenger":"Erb Transporte GmbH"},
    # ── A7 ──
    {"auftrag_nr":"01060526","rechnung_nr":"R01060526","cust_nr":"K911021","ku":"Euralogistik GmbH","von":"Hadamar","nch":"Birkenfeld","km":151,"fz":"SN 1122","termin":"2026-05-06","ref_nr":"CN 13248918","r_net":Decimal("101.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("19.19"),"r_brutto":Decimal("120.19"),"r_zz":30,"r_faellig":"2026-06-09","r_dat":"2026-05-10","r_stat":"Bezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Euralogistik GmbH"},
    # ── A8 ──
    {"auftrag_nr":"02060526","rechnung_nr":"R02060526","cust_nr":"K911004","ku":"Erb Transporte GmbH","von":"Weissach","nch":"Brannenburg","km":360,"fz":"SN 9889","termin":"2026-05-06","ref_nr":"","r_net":Decimal("330.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("62.70"),"r_brutto":Decimal("392.70"),"r_zz":45,"r_faellig":"2026-06-24","r_dat":"2026-05-10","r_stat":"Bezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Erb Transporte GmbH"},
    # ── A9 ──
    {"auftrag_nr":"03060526","rechnung_nr":"R03060526","cust_nr":"K911039","ku":"Concept Logistics GmbH","von":"Hanau","nch":"Baden Baden","km":210,"fz":"SN 9889","termin":"2026-05-06","ref_nr":"1042322","r_net":Decimal("190.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("36.10"),"r_brutto":Decimal("226.10"),"r_zz":30,"r_faellig":"2026-06-09","r_dat":"2026-05-10","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"Concept Logistics GmbH"},
    # ── A10 ──
    {"auftrag_nr":"04060526","rechnung_nr":"R04060526","cust_nr":"K911045","ku":"Peter Adolf Molde Internationale Transport e.K.","von":"Landstuhl","nch":"Lohmar","km":250,"fz":"SN 1122","termin":"2026-05-06","ref_nr":"","r_net":Decimal("250.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("47.50"),"r_brutto":Decimal("297.50"),"r_zz":30,"r_faellig":"2026-06-09","r_dat":"2026-05-10","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Peter Adolf Molde Internationale Transport e.K."},
    # ── A11 ──
    {"auftrag_nr":"01070526","rechnung_nr":"R01070526","cust_nr":"K911038","ku":"STEX GmbH","von":"Neulingen","nch":"Weilbach","km":160,"fz":"SN 1122","termin":"2026-05-07","ref_nr":"12222/Oxytechnik 26.0062","r_net":Decimal("150.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("28.50"),"r_brutto":Decimal("178.50"),"r_zz":30,"r_faellig":"2026-06-09","r_dat":"2026-05-10","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"STEX GmbH"},
    # ── A12 ──
    {"auftrag_nr":"02070526","rechnung_nr":"R02070526","cust_nr":"K911040","ku":"Hipke Transporte","von":"Sinzheim","nch":"Wolfschlugen","km":120,"fz":"SN 1122","termin":"2026-05-07","ref_nr":"CN 13255416","r_net":Decimal("85.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("16.15"),"r_brutto":Decimal("101.15"),"r_zz":30,"r_faellig":"2026-06-09","r_dat":"2026-05-10","r_stat":"Unbezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Hipke Transporte"},
    # ── A13 ──
    {"auftrag_nr":"03070526","rechnung_nr":"R03070526","cust_nr":"K911041","ku":"Sovereign Speed Germany GmbH","von":"Ottobrunn","nch":"Stuttgart","km":200,"fz":"SN 9889","termin":"2026-05-07","ref_nr":"3801741875","r_net":Decimal("85.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("16.15"),"r_brutto":Decimal("101.15"),"r_zz":30,"r_faellig":"2026-06-10","r_dat":"2026-05-11","r_stat":"Unbezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Sovereign Speed Germany GmbH"},
    # ── A14 ──
    {"auftrag_nr":"04070526","rechnung_nr":"R04070526","cust_nr":"K911003","ku":"Rüdinger Transport GmbH","von":"Nürtingen","nch":"Weißenhorn","km":0,"fz":"Ersatzwagen","termin":"2026-05-07","ref_nr":"260500400","r_net":Decimal("85.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("16.15"),"r_brutto":Decimal("101.15"),"r_zz":30,"r_faellig":"2026-06-10","r_dat":"2026-05-11","r_stat":"Bezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Rüdinger Transport GmbH"},
    # ── A15 ──
    {"auftrag_nr":"05070526","rechnung_nr":"R05070526","cust_nr":"K911003","ku":"Rüdinger Transport GmbH","von":"Esslingen","nch":"Nüziders","km":260,"fz":"SN 924","termin":"2026-05-07","ref_nr":"260500407","r_net":Decimal("240.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("45.60"),"r_brutto":Decimal("285.60"),"r_zz":30,"r_faellig":"2026-06-10","r_dat":"2026-05-11","r_stat":"Unbezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Rüdinger Transport GmbH"},
    # ── A16 ──
    {"auftrag_nr":"06070526","rechnung_nr":"R06070526","cust_nr":"K911004","ku":"Erb Transporte GmbH","von":"Nürtingen","nch":"Friedrichhafen","km":210,"fz":"SN 924","termin":"2026-05-07","ref_nr":"000365944","r_net":Decimal("185.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("35.15"),"r_brutto":Decimal("220.15"),"r_zz":45,"r_faellig":"2026-06-25","r_dat":"2026-05-11","r_stat":"Unbezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Erb Transporte GmbH"},
    # ── A17 ──
    {"auftrag_nr":"01080526","rechnung_nr":"R01080526","cust_nr":"K911004","ku":"Erb Transporte GmbH","von":"Laupheim","nch":"Klettgau","km":158,"fz":"SN 924","termin":"2026-05-08","ref_nr":"000366057","r_net":Decimal("125.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("23.75"),"r_brutto":Decimal("148.75"),"r_zz":45,"r_faellig":"2026-06-25","r_dat":"2026-05-11","r_stat":"Bezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Erb Transporte GmbH"},
    # ── A18 ──
    {"auftrag_nr":"02080526","rechnung_nr":"R02080526","cust_nr":"K911042","ku":"Damsen Express Logistik GmbH","von":"Neenstetten","nch":"Bischweier","km":150,"fz":"SN 1122","termin":"2026-05-08","ref_nr":"2608040042","r_net":Decimal("170.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("32.30"),"r_brutto":Decimal("202.30"),"r_zz":30,"r_faellig":"2026-06-10","r_dat":"2026-05-11","r_stat":"Unbezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Damsen Express Logistik GmbH"},
    # ── A19 ──
    {"auftrag_nr":"03080526","rechnung_nr":"R03080526","cust_nr":"K911043","ku":"DAGO Express GmbH","von":"65934 Frankfurt","nch":"60318 Frankfurt","km":18,"fz":"SN 9889","termin":"2026-05-08","ref_nr":"34986","r_net":Decimal("68.46"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("13.01"),"r_brutto":Decimal("81.47"),"r_zz":30,"r_faellig":"2026-06-09","r_dat":"2026-05-10","r_stat":"Unbezahlt","r_skonto":Decimal("3.0"),"empfaenger":"DAGO Express GmbH"},
    # ── A20 ──
    {"auftrag_nr":"04080526","rechnung_nr":"R04080526","cust_nr":"K911044","ku":"Spedition Höhner GmbH","von":"Reutlingen","nch":"Erkheim","km":150,"fz":"SN 1122","termin":"2026-05-08","ref_nr":"41513131","r_net":Decimal("175.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("33.25"),"r_brutto":Decimal("208.25"),"r_zz":30,"r_faellig":"2026-06-09","r_dat":"2026-05-10","r_stat":"Unbezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Spedition Höhner GmbH"},
    # ── A21 ──
    {"auftrag_nr":"05080526","rechnung_nr":"R05080526","cust_nr":"K911046","ku":"Nexa  Spedition GmbH","von":"Neulingen","nch":"Oberursel","km":150,"fz":"SN 9889","termin":"2026-05-08","ref_nr":"","r_net":Decimal("150.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("28.50"),"r_brutto":Decimal("178.50"),"r_zz":30,"r_faellig":"2026-06-09","r_dat":"2026-05-10","r_stat":"Unbezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Nexa  Spedition GmbH"},
    # ── A22 ──
    {"auftrag_nr":"06080526","rechnung_nr":"R06080526","cust_nr":"K911003","ku":"Rüdinger Transport GmbH","von":"Esslingen","nch":"Friedrichhafen","km":200,"fz":"SN 112","termin":"2026-05-08","ref_nr":"260500526","r_net":Decimal("160.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("30.40"),"r_brutto":Decimal("190.40"),"r_zz":30,"r_faellig":"2026-06-13","r_dat":"2026-05-14","r_stat":"Bezahlt","r_skonto":Decimal("0"),"empfaenger":"Rüdinger Transport GmbH"},
    # ── A23 ──
    {"auftrag_nr":"07080526","rechnung_nr":"R07080526","cust_nr":"K911003","ku":"Rüdinger Transport GmbH","von":"Esslingen","nch":"Olbernhau","km":470,"fz":"SN 1122","termin":"2026-05-08","ref_nr":"260500541","r_net":Decimal("360.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("68.40"),"r_brutto":Decimal("428.40"),"r_zz":30,"r_faellig":"2026-06-13","r_dat":"2026-05-14","r_stat":"Bezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Rüdinger Transport GmbH"},
    # ── A24 ──
    {"auftrag_nr":"01090526","rechnung_nr":"R01090526","cust_nr":"K911003","ku":"Rüdinger Transport GmbH","von":"Schorndorf","nch":"Sankt Ingbert","km":262,"fz":"SN 1122","termin":"2026-05-09","ref_nr":"260500176","r_net":Decimal("250.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("47.50"),"r_brutto":Decimal("297.50"),"r_zz":30,"r_faellig":"2026-06-09","r_dat":"2026-05-10","r_stat":"Bezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Rüdinger Transport GmbH"},
    # ── A25 ──
    {"auftrag_nr":"01110526","rechnung_nr":"R01110526","cust_nr":"K911034","ku":"ECL euro.COURIER Logistecs GmbH","von":"Schmölln","nch":"Stuttgart","km":470,"fz":"SN 1122","termin":"2026-05-11","ref_nr":"958934","r_net":Decimal("350.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("66.50"),"r_brutto":Decimal("416.50"),"r_zz":30,"r_faellig":"2026-06-13","r_dat":"2026-05-14","r_stat":"Bezahlt","r_skonto":Decimal("5.0"),"empfaenger":"ECL euro.COURIER Logistecs GmbH"},
    # ── A26 ──
    {"auftrag_nr":"02110526","rechnung_nr":"R02110526","cust_nr":"K911003","ku":"Rüdinger Transport GmbH","von":"Nürtingen","nch":"Arnstadt","km":370,"fz":"SN 112","termin":"2026-05-11","ref_nr":"260500582","r_net":Decimal("290.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("55.10"),"r_brutto":Decimal("345.10"),"r_zz":30,"r_faellig":"2026-06-13","r_dat":"2026-05-14","r_stat":"Bezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Rüdinger Transport GmbH"},
    # ── A27 ──
    {"auftrag_nr":"03110526","rechnung_nr":"R03110526","cust_nr":"K911047","ku":"The Special Carrier Frachtservice GmbH","von":"Altbach","nch":"München","km":212,"fz":"SN 9889","termin":"2026-05-11","ref_nr":"CN 13267416","r_net":Decimal("180.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("34.20"),"r_brutto":Decimal("214.20"),"r_zz":30,"r_faellig":"2026-06-13","r_dat":"2026-05-14","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"The Special Carrier Frachtservice GmbH"},
    # ── A28 ──
    {"auftrag_nr":"04110526","rechnung_nr":"R04110526","cust_nr":"K911034","ku":"ECL euro.COURIER Logistecs GmbH","von":"Schmölln","nch":"Stuttgart","km":0,"fz":"SN 9889","termin":"2026-05-11","ref_nr":"958934","r_net":Decimal("60.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("11.40"),"r_brutto":Decimal("71.40"),"r_zz":45,"r_faellig":"2026-06-28","r_dat":"2026-05-14","r_stat":"Bezahlt","r_skonto":Decimal("5.0"),"empfaenger":"ECL euro.COURIER Logistecs GmbH"},
    # ── A29 ──
    {"auftrag_nr":"01120526","rechnung_nr":"R01120526","cust_nr":"K911003","ku":"Rüdinger Transport GmbH","von":"Esslingen","nch":"Pforzheim","km":75,"fz":"SN 9889","termin":"2026-05-12","ref_nr":"260500657","r_net":Decimal("57.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("10.83"),"r_brutto":Decimal("67.83"),"r_zz":30,"r_faellig":"2026-06-13","r_dat":"2026-05-14","r_stat":"Bezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Rüdinger Transport GmbH"},
    # ── A30 ──
    {"auftrag_nr":"02120526","rechnung_nr":"R02120526","cust_nr":"K911004","ku":"Erb Transporte GmbH","von":"Stuttgart","nch":"Friedberg","km":210,"fz":"SN 9889","termin":"2026-05-12","ref_nr":"000366575","r_net":Decimal("157.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("29.83"),"r_brutto":Decimal("186.83"),"r_zz":45,"r_faellig":"2026-06-28","r_dat":"2026-05-14","r_stat":"Bezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Erb Transporte GmbH"},
    # ── A31 ──
    {"auftrag_nr":"03120526","rechnung_nr":"R03120526","cust_nr":"K911016","ku":"OCU Express & Logistics GmbH","von":"Frankfurt","nch":"Böblingen","km":200,"fz":"SN 9889","termin":"2026-05-12","ref_nr":"CN 13272278","r_net":Decimal("125.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("23.75"),"r_brutto":Decimal("148.75"),"r_zz":30,"r_faellig":"2026-06-13","r_dat":"2026-05-14","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"OCU Express & Logistics GmbH"},
    # ── A32 ──
    {"auftrag_nr":"04120526","rechnung_nr":"R04120526","cust_nr":"K911004","ku":"Erb Transporte GmbH","von":"Birkenfeld","nch":"Gilching","km":275,"fz":"SN 112","termin":"2026-05-12","ref_nr":"000366751","r_net":Decimal("195.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("37.05"),"r_brutto":Decimal("232.05"),"r_zz":45,"r_faellig":"2026-06-28","r_dat":"2026-05-14","r_stat":"Bezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Erb Transporte GmbH"},
    # ── A33 ──
    {"auftrag_nr":"05120526","rechnung_nr":"R05120526","cust_nr":"K911014","ku":"Leo Express Kurier","von":"Wernau","nch":"Klettgau","km":175,"fz":"SN 9889","termin":"2026-05-12","ref_nr":"","r_net":Decimal("100.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("19.00"),"r_brutto":Decimal("119.00"),"r_zz":30,"r_faellig":"2026-06-13","r_dat":"2026-05-14","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Leo Express Kurier"},
    # ── A34 ──
    {"auftrag_nr":"06120526","rechnung_nr":"R06120526","cust_nr":"K911048","ku":"ILS Express Logistic GmbH","von":"Köngen","nch":"Zürich","km":260,"fz":"SN 9889","termin":"2026-05-12","ref_nr":"A0156/05/2026","r_net":Decimal("250.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("47.50"),"r_brutto":Decimal("297.50"),"r_zz":45,"r_faellig":"2026-06-28","r_dat":"2026-05-14","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"ILS Express Logistic GmbH"},
    # ── A35 ──
    {"auftrag_nr":"07120526","rechnung_nr":"R07120526","cust_nr":"K911049","ku":"Herrhammer Transporte GmbH","von":"München","nch":"Altdorf","km":160,"fz":"SN 112","termin":"2026-05-12","ref_nr":"CN 13275332","r_net":Decimal("90.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("17.10"),"r_brutto":Decimal("107.10"),"r_zz":30,"r_faellig":"2026-06-13","r_dat":"2026-05-14","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Herrhammer Transporte GmbH"},
    # ── A36 ──
    {"auftrag_nr":"08120526","rechnung_nr":"R08120526","cust_nr":"K911050","ku":"Keterle Transporte","von":"Waldsee","nch":"Kolbermoor","km":200,"fz":"SN 112","termin":"2026-05-12","ref_nr":"SK","r_net":Decimal("180.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("34.20"),"r_brutto":Decimal("214.20"),"r_zz":30,"r_faellig":"2026-06-13","r_dat":"2026-05-14","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Keterle Transporte"},
    # ── A37 ──
    {"auftrag_nr":"01130526","rechnung_nr":"R01130526","cust_nr":"K911012","ku":"bgm express logistik GmbH","von":"Stuttgart","nch":"Bad Krozingen","km":170,"fz":"SN 1122","termin":"2026-05-13","ref_nr":"26558150","r_net":Decimal("137.75"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("26.17"),"r_brutto":Decimal("163.92"),"r_zz":45,"r_faellig":"2026-06-28","r_dat":"2026-05-14","r_stat":"Bezahlt","r_skonto":Decimal("5.0"),"empfaenger":"bgm express logistik GmbH"},
    # ── A38 ──
    {"auftrag_nr":"02130526","rechnung_nr":"R02130526","cust_nr":"K911032","ku":"Heuber Kurier GmbH","von":"Wellendingen","nch":"Schwebheim","km":345,"fz":"SN 112","termin":"2026-05-13","ref_nr":"CN 13279869","r_net":Decimal("220.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("41.80"),"r_brutto":Decimal("261.80"),"r_zz":45,"r_faellig":"2026-06-28","r_dat":"2026-05-14","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Heuber Kurier GmbH"},
    # ── A39 ──
    {"auftrag_nr":"03130526","rechnung_nr":"R03130526","cust_nr":"K911004","ku":"Erb Transporte GmbH","von":"Wannweil","nch":"Nürnberg","km":220,"fz":"SN 112","termin":"2026-05-13","ref_nr":"000367073","r_net":Decimal("118.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("22.42"),"r_brutto":Decimal("140.42"),"r_zz":45,"r_faellig":"2026-06-28","r_dat":"2026-05-14","r_stat":"Bezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Erb Transporte GmbH"},
    # ── A40 ──
    {"auftrag_nr":"04130526","rechnung_nr":"R04130526","cust_nr":"K911063","ku":"AktivLogistik int. Spedition","von":"Pforzheim","nch":"Troisdorf","km":260,"fz":"SN 1122","termin":"2026-05-13","ref_nr":"T-20260533","r_net":Decimal("240.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("45.60"),"r_brutto":Decimal("285.60"),"r_zz":45,"r_faellig":"2026-07-09","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"AktivLogistik int. Spedition"},
    # ── A41 ──
    {"auftrag_nr":"01150526","rechnung_nr":"R01150526","cust_nr":"K911012","ku":"bgm express logistik GmbH","von":"Bissingen (TecK)","nch":"Neumarkt","km":260,"fz":"SN 9889","termin":"2026-05-15","ref_nr":"26559256","r_net":Decimal("190.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("36.10"),"r_brutto":Decimal("226.10"),"r_zz":45,"r_faellig":"2026-07-09","r_dat":"2026-05-25","r_stat":"Bezahlt","r_skonto":Decimal("5.0"),"empfaenger":"bgm express logistik GmbH"},
    # ── A42 ──
    {"auftrag_nr":"02150526","rechnung_nr":"R02150526","cust_nr":"K911026","ku":"Spedition H.P. Sobeck GmbH","von":"Renningen","nch":"Schiffweiler","km":50,"fz":"SN 9889","termin":"2026-05-15","ref_nr":"s1505001","r_net":Decimal("95.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("18.05"),"r_brutto":Decimal("113.05"),"r_zz":30,"r_faellig":"2026-06-24","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Spedition H.P. Sobeck GmbH"},
    # ── A43 ──
    {"auftrag_nr":"03150526","rechnung_nr":"R03150526","cust_nr":"K911051","ku":"Speed Trans GmbH & Co. KG","von":"Kernen (Remstal)","nch":"Herzogenrath","km":380,"fz":"SN 112","termin":"2026-05-15","ref_nr":"c.net 13282388","r_net":Decimal("350.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("66.50"),"r_brutto":Decimal("416.50"),"r_zz":45,"r_faellig":"2026-07-09","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"Speed Trans GmbH & Co. KG"},
    # ── A44 ──
    {"auftrag_nr":"01180526","rechnung_nr":"R01180526","cust_nr":"K911052","ku":"TSB Transport Spedition Bauriedl","von":"Bonn","nch":"Markteidenfeld","km":200,"fz":"SN 112","termin":"2026-05-18","ref_nr":"C.net 13286900","r_net":Decimal("150.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("28.50"),"r_brutto":Decimal("178.50"),"r_zz":30,"r_faellig":"2026-06-24","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"TSB Transport Spedition Bauriedl"},
    # ── A45 ──
    {"auftrag_nr":"02180526","rechnung_nr":"R02180526","cust_nr":"K911058","ku":"Karle Logistics GmbH & Co. KG","von":"Königsbach-Stein","nch":"Kernen (Remstal)","km":77,"fz":"SN 1122","termin":"2026-05-18","ref_nr":"LS-Nr. 5255495","r_net":Decimal("75.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("14.25"),"r_brutto":Decimal("89.25"),"r_zz":30,"r_faellig":"2026-06-24","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"Karle Logistics GmbH & Co. KG"},
    # ── A46 ──
    {"auftrag_nr":"03180526","rechnung_nr":"R03180526","cust_nr":"K911059","ku":"am express GmbH","von":"Feldkirchen","nch":"Walzbachtal","km":250,"fz":"SN 9889","termin":"2026-05-18","ref_nr":"260500358","r_net":Decimal("150.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("28.50"),"r_brutto":Decimal("178.50"),"r_zz":45,"r_faellig":"2026-07-09","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"am express GmbH"},
    # ── A47 ──
    {"auftrag_nr":"01190526","rechnung_nr":"R01190526","cust_nr":"K911053","ku":"ML Express & Logistics GmbH","von":"Leingarten","nch":"Ingolstadt","km":250,"fz":"SN 112","termin":"2026-05-19","ref_nr":"202606171.01","r_net":Decimal("225.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("42.75"),"r_brutto":Decimal("267.75"),"r_zz":45,"r_faellig":"2026-07-09","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"ML Express & Logistics GmbH"},
    # ── A48 ──
    {"auftrag_nr":"02190526","rechnung_nr":"R02190526","cust_nr":"K911014","ku":"Leo Express Kurier","von":"Spaichingen","nch":"Löningen","km":600,"fz":"SN 112","termin":"2026-05-19","ref_nr":"C.net 13292425","r_net":Decimal("520.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("98.80"),"r_brutto":Decimal("618.80"),"r_zz":45,"r_faellig":"2026-07-09","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"Leo Express Kurier"},
    # ── A49 ──
    {"auftrag_nr":"03190526","rechnung_nr":"R03190526","cust_nr":"K911003","ku":"Rüdinger Transport GmbH","von":"Esslingen","nch":"Aldingen","km":120,"fz":"SN 9889","termin":"2026-05-19","ref_nr":"260501063","r_net":Decimal("95.46"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("18.14"),"r_brutto":Decimal("113.60"),"r_zz":30,"r_faellig":"2026-06-24","r_dat":"2026-05-25","r_stat":"Bezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Rüdinger Transport GmbH"},
    # ── A50 ──
    {"auftrag_nr":"04190526","rechnung_nr":"R04190526","cust_nr":"K911060","ku":"MOE-Logistik","von":"Lohmar","nch":"Mannheim","km":200,"fz":"SN 1122","termin":"2026-05-19","ref_nr":"","r_net":Decimal("200.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("38.00"),"r_brutto":Decimal("238.00"),"r_zz":30,"r_faellig":"2026-06-24","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"MOE-Logistik"},
    # ── A51 ──
    {"auftrag_nr":"05190526","rechnung_nr":"R05190526","cust_nr":"K911013","ku":"Concord Express GmbH & Co. KG","von":"Spaichingen","nch":"Cirié","km":635,"fz":"SN 9889","termin":"2026-05-19","ref_nr":"260500869","r_net":Decimal("570.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("108.30"),"r_brutto":Decimal("678.30"),"r_zz":30,"r_faellig":"2026-06-24","r_dat":"2026-05-25","r_stat":"Bezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Concord Express GmbH & Co. KG"},
    # ── A52 ──
    {"auftrag_nr":"01200526","rechnung_nr":"R01200526","cust_nr":"K911054","ku":"Fahrlogistik Wächter Gmbh","von":"Kevelaer","nch":"Oy-Mittelberg","km":600,"fz":"SN 112","termin":"2026-05-20","ref_nr":"C.net 13296973","r_net":Decimal("520.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("98.80"),"r_brutto":Decimal("618.80"),"r_zz":45,"r_faellig":"2026-07-09","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"Fahrlogistik Wächter Gmbh"},
    # ── A53 ──
    {"auftrag_nr":"02200526","rechnung_nr":"R02200526","cust_nr":"K911055","ku":"SKD Express & Speditions GmbH","von":"Lüdenscheid","nch":"Renningen","km":350,"fz":"SN 112","termin":"2026-05-20","ref_nr":"260520133","r_net":Decimal("190.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("36.10"),"r_brutto":Decimal("226.10"),"r_zz":45,"r_faellig":"2026-07-09","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"SKD Express & Speditions GmbH"},
    # ── A54 ──
    {"auftrag_nr":"01210526","rechnung_nr":"R01210526","cust_nr":"K911004","ku":"Erb Transporte GmbH","von":"Weisach","nch":"Amberg","km":280,"fz":"SN 112","termin":"2026-05-21","ref_nr":"000368527","r_net":Decimal("200.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("38.00"),"r_brutto":Decimal("238.00"),"r_zz":45,"r_faellig":"2026-07-09","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"Erb Transporte GmbH"},
    # ── A55 ──
    {"auftrag_nr":"02210526","rechnung_nr":"R02210526","cust_nr":"K911003","ku":"Rüdinger Transport GmbH","von":"Esslingen","nch":"Rosenheim","km":240,"fz":"SN 1122","termin":"2026-05-21","ref_nr":"26501396","r_net":Decimal("195.46"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("37.14"),"r_brutto":Decimal("232.60"),"r_zz":30,"r_faellig":"2026-06-24","r_dat":"2026-05-25","r_stat":"Bezahlt","r_skonto":Decimal("0"),"empfaenger":"Rüdinger Transport GmbH"},
    # ── A56 ──
    {"auftrag_nr":"03210526","rechnung_nr":"R03210526","cust_nr":"K911062","ku":"Forward Direct Limited","von":"Weil der Stadt","nch":"Süßen","km":77,"fz":"SN 1122","termin":"2026-05-21","ref_nr":"1180800","r_net":Decimal("70.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("13.30"),"r_brutto":Decimal("83.30"),"r_zz":45,"r_faellig":"2026-07-09","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"Forward Direct Limited"},
    # ── A57 ──
    {"auftrag_nr":"01220526","rechnung_nr":"R01220526","cust_nr":"K911057","ku":"KHD Sonderfahrtenlogistik","von":"Nürnberg","nch":"Freudenstadt","km":250,"fz":"SN 112","termin":"2026-05-22","ref_nr":"C.net 13308395","r_net":Decimal("152.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("28.88"),"r_brutto":Decimal("180.88"),"r_zz":30,"r_faellig":"2026-06-30","r_dat":"2026-05-31","r_stat":"Bezahlt","r_skonto":Decimal("5.0"),"empfaenger":"KHD Sonderfahrtenlogistik"},
    # ── A58 ──
    {"auftrag_nr":"02220526","rechnung_nr":"R02220526","cust_nr":"K911061","ku":"DWK Kurierdienst GmbH","von":"Garching","nch":"Lupburg","km":120,"fz":"SN 1122","termin":"2026-05-22","ref_nr":"C.net 13307848","r_net":Decimal("100.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("19.00"),"r_brutto":Decimal("119.00"),"r_zz":45,"r_faellig":"2026-07-09","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"DWK Kurierdienst GmbH"},
    # ── A59 ──
    {"auftrag_nr":"03220526","rechnung_nr":"R03220526","cust_nr":"K911004","ku":"Erb Transporte GmbH","von":"Putzbrunn","nch":"Isny","km":160,"fz":"SN 112","termin":"2026-05-22","ref_nr":"000368665","r_net":Decimal("140.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("26.60"),"r_brutto":Decimal("166.60"),"r_zz":45,"r_faellig":"2026-07-15","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Erb Transporte GmbH"},
    # ── A60 ──
    {"auftrag_nr":"04220526","rechnung_nr":"R04220526","cust_nr":"K911053","ku":"ML Express & Logistics GmbH","von":"Hohentengen","nch":"Ingolstadt","km":165,"fz":"SN 112","termin":"2026-05-22","ref_nr":"MLX 202606457.01","r_net":Decimal("160.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("30.40"),"r_brutto":Decimal("190.40"),"r_zz":45,"r_faellig":"2026-07-15","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"ML Express & Logistics GmbH"},
    # ── A61 ──
    {"auftrag_nr":"01240526","rechnung_nr":"R01240526","cust_nr":"K911056","ku":"Schmalz+Schön Logistics GmbH","von":"Kaufbeuren","nch":"Fellbach","km":200,"fz":"SN 112","termin":"2026-05-24","ref_nr":"F27260028624","r_net":Decimal("140.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("26.60"),"r_brutto":Decimal("166.60"),"r_zz":30,"r_faellig":"2026-06-24","r_dat":"2026-05-25","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"Schmalz+Schön Logistics GmbH"},
    # ── A62 ──
    {"auftrag_nr":"01250526","rechnung_nr":"R01250526","cust_nr":"K911053","ku":"ML Express & Logistics GmbH","von":"Reutlingen","nch":"Prüm","km":320,"fz":"SN 1122","termin":"2026-05-25","ref_nr":"TA 68137 - Tour 58210","r_net":Decimal("300.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("57.00"),"r_brutto":Decimal("357.00"),"r_zz":45,"r_faellig":"2026-07-15","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("3.0"),"empfaenger":"ML Express & Logistics GmbH"},
    # ── A63 ──
    {"auftrag_nr":"01260526","rechnung_nr":"R01260526","cust_nr":"K911003","ku":"Rüdinger Transport GmbH","von":"Auderath","nch":"Magstadt","km":0,"fz":"SN 1122","termin":"2026-05-26","ref_nr":"2605015522","r_net":Decimal("200.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("38.00"),"r_brutto":Decimal("238.00"),"r_zz":30,"r_faellig":"2026-06-30","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Rüdinger Transport GmbH"},
    # ── A64 ──
    {"auftrag_nr":"02260526","rechnung_nr":"R02260526","cust_nr":"K911019","ku":"Baden Express Logistics GmbH","von":"Schömberg","nch":"Karlsruhe","km":35,"fz":"SN 1122","termin":"2026-05-26","ref_nr":"C.net 13316382","r_net":Decimal("70.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("13.30"),"r_brutto":Decimal("83.30"),"r_zz":45,"r_faellig":"2026-07-15","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Baden Express Logistics GmbH"},
    # ── A65 ──
    {"auftrag_nr":"03260526","rechnung_nr":"R03260526","cust_nr":"K911064","ku":"Katja Transporte","von":"Neuenburg","nch":"Neunkirchen","km":160,"fz":"SN 1122","termin":"2026-05-26","ref_nr":"2026 - 1565","r_net":Decimal("120.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("22.80"),"r_brutto":Decimal("142.80"),"r_zz":30,"r_faellig":"2026-06-30","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("4.0"),"empfaenger":"Katja Transporte"},
    # ── A66 ──
    {"auftrag_nr":"04260526","rechnung_nr":"R04260526","cust_nr":"K911066","ku":"TimeStar Logistik GmbH","von":"Eichstätt","nch":"Niederlauer","km":230,"fz":"SN 112","termin":"2026-05-26","ref_nr":"TO 222133","r_net":Decimal("200.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("38.00"),"r_brutto":Decimal("238.00"),"r_zz":45,"r_faellig":"2026-07-15","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"TimeStar Logistik GmbH"},
    # ── A67 ──
    {"auftrag_nr":"05260526","rechnung_nr":"R05260526","cust_nr":"K911043","ku":"DAGO Express GmbH","von":"Stuttgart","nch":"Krumbach","km":170,"fz":"SN 9889","termin":"2026-05-26","ref_nr":"35353","r_net":Decimal("176.54"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("33.54"),"r_brutto":Decimal("210.08"),"r_zz":45,"r_faellig":"2026-07-15","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"DAGO Express GmbH"},
    # ── A68 ──
    {"auftrag_nr":"01270526","rechnung_nr":"R01270526","cust_nr":"K911003","ku":"Rüdinger Transport GmbH","von":"Nürtingen","nch":"Hutthurm","km":360,"fz":"SN 1122","termin":"2026-05-27","ref_nr":"260501747","r_net":Decimal("330.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("62.70"),"r_brutto":Decimal("392.70"),"r_zz":30,"r_faellig":"2026-06-30","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Rüdinger Transport GmbH"},
    # ── A69 ──
    {"auftrag_nr":"02270526","rechnung_nr":"R02270526","cust_nr":"K911006","ku":"Transport Betz GmbH & Co.","von":"Bretten","nch":"Friedrischhafen","km":260,"fz":"SN 9889","termin":"2026-05-27","ref_nr":"260527137","r_net":Decimal("200.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("38.00"),"r_brutto":Decimal("238.00"),"r_zz":45,"r_faellig":"2026-07-15","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Transport Betz GmbH & Co."},
    # ── A70 ──
    {"auftrag_nr":"03270526","rechnung_nr":"R03270526","cust_nr":"K911067","ku":"Hans Peter Roos Speditionsdienstleistungen","von":"Obrigheim","nch":"Mayen","km":240,"fz":"SN 112","termin":"2026-05-27","ref_nr":"26051033920","r_net":Decimal("220.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("41.80"),"r_brutto":Decimal("261.80"),"r_zz":30,"r_faellig":"2026-06-30","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Hans Peter Roos Speditionsdienstleistungen"},
    # ── A71 ──
    {"auftrag_nr":"04270526","rechnung_nr":"R04270526","cust_nr":"K911049","ku":"Herrhammer Transporte GmbH","von":"Aulendorf","nch":"Ulm","km":80,"fz":"SN 9889","termin":"2026-05-27","ref_nr":"","r_net":Decimal("80.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("15.20"),"r_brutto":Decimal("95.20"),"r_zz":30,"r_faellig":"2026-06-30","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("0"),"empfaenger":"Herrhammer Transporte GmbH"},
    # ── A72 ──
    {"auftrag_nr":"01310526","rechnung_nr":"R0280526","cust_nr":"K911013","ku":"Concord Express GmbH & Co. KG","von":"Schierling","nch":"Löchgau","km":300,"fz":"SN 1122","termin":"2026-05-28","ref_nr":"2628050024","r_net":Decimal("275.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("52.25"),"r_brutto":Decimal("327.25"),"r_zz":45,"r_faellig":"2026-07-15","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Concord Express GmbH & Co. KG"},
    # ── A73 ──
    {"auftrag_nr":"01280526","rechnung_nr":"R01280526","cust_nr":"K911068","ku":"Spedition Askari GmbH","von":"Wittlich","nch":"Mannheim","km":175,"fz":"SN 112","termin":"2026-05-28","ref_nr":"202051956","r_net":Decimal("165.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("31.35"),"r_brutto":Decimal("196.35"),"r_zz":30,"r_faellig":"2026-06-30","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Spedition Askari GmbH"},
    # ── A74 ──
    {"auftrag_nr":"02280526","rechnung_nr":"R12280526","cust_nr":"K911069","ku":"Go Logistik GmbH","von":"Halsenbach","nch":"Worms","km":145,"fz":"SN 112","termin":"2026-05-28","ref_nr":"","r_net":Decimal("130.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("24.70"),"r_brutto":Decimal("154.70"),"r_zz":45,"r_faellig":"2026-07-15","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Go Logistik GmbH"},
    # ── A75 ──
    {"auftrag_nr":"03280526","rechnung_nr":"R03280526","cust_nr":"K911007","ku":"H & M Kuriere GmbH","von":"Mannheim","nch":"Hofkirchen","km":390,"fz":"SN 112","termin":"2026-05-28","ref_nr":"C.net 13327863","r_net":Decimal("325.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("61.75"),"r_brutto":Decimal("386.75"),"r_zz":45,"r_faellig":"2026-07-15","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"H & M Kuriere GmbH"},
    # ── A76 ──
    {"auftrag_nr":"04280526","rechnung_nr":"R04280526","cust_nr":"K911006","ku":"Transport Betz GmbH & Co.","von":"Sindelfingen","nch":"Offenberg","km":320,"fz":"SN 112","termin":"2026-05-28","ref_nr":"26052800265","r_net":Decimal("200.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("38.00"),"r_brutto":Decimal("238.00"),"r_zz":45,"r_faellig":"2026-07-15","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Transport Betz GmbH & Co."},
    # ── A77 ──
    {"auftrag_nr":"06280526","rechnung_nr":"R06280526","cust_nr":"K911026","ku":"Spedition H.P. Sobeck GmbH","von":"Gätringen","nch":"Unterschließheim","km":260,"fz":"SN 9889","termin":"2026-05-28","ref_nr":"s2805026","r_net":Decimal("200.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("38.00"),"r_brutto":Decimal("238.00"),"r_zz":30,"r_faellig":"2026-06-30","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Spedition H.P. Sobeck GmbH"},
    # ── A78 ──
    {"auftrag_nr":"07280526","rechnung_nr":"R07280526","cust_nr":"K911003","ku":"Rüdinger Transport GmbH","von":"Esslingen","nch":"Augusburg","km":200,"fz":"SN 9889","termin":"2026-05-28","ref_nr":"260501859","r_net":Decimal("140.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("26.60"),"r_brutto":Decimal("166.60"),"r_zz":30,"r_faellig":"2026-06-30","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Rüdinger Transport GmbH"},
    # ── A79 ──
    {"auftrag_nr":"01290526","rechnung_nr":"R01290526","cust_nr":"K911028","ku":"H T R Logistik","von":"Laupheim","nch":"Aldingen","km":125,"fz":"SN 9889","termin":"2026-05-29","ref_nr":"CN 13232026","r_net":Decimal("105.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("19.95"),"r_brutto":Decimal("124.95"),"r_zz":15,"r_faellig":"2026-05-16","r_dat":"2026-05-01","r_stat":"Bezahlt","r_skonto":Decimal("3.0"),"empfaenger":"H T R Logistik"},
    # ── A80 ──
    {"auftrag_nr":"02290526","rechnung_nr":"R02290526","cust_nr":"K911065","ku":"Leo - Express","von":"Überherrn","nch":"Ballrechten-Dottingen","km":260,"fz":"SN 1122","termin":"2026-05-29","ref_nr":"C.net 13331101","r_net":Decimal("200.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("38.00"),"r_brutto":Decimal("238.00"),"r_zz":15,"r_faellig":"2026-06-15","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("3.0"),"empfaenger":"Leo - Express"},
    # ── A81 ──
    {"auftrag_nr":"03290526","rechnung_nr":"R03290526","cust_nr":"K911013","ku":"Concord Express GmbH & Co. KG","von":"Schierling","nch":"Bad Rappenau","km":250,"fz":"SN 112","termin":"2026-05-29","ref_nr":"260501497","r_net":Decimal("200.00"),"r_vat_r":Decimal("0.19"),"r_vat_b":Decimal("38.00"),"r_brutto":Decimal("238.00"),"r_zz":45,"r_faellig":"2026-07-15","r_dat":"2026-05-31","r_stat":"Unbezahlt","r_skonto":Decimal("5.0"),"empfaenger":"Concord Express GmbH & Co. KG"},
]

TAX_NUMBER = "59500/72609"


def _find_customer(db, cust_nr: str):
    """Look up Customer by 'Legacy: K911XXX' tag in internal_notes."""
    from app.Models.customers import Customer
    tag = f"Legacy: {cust_nr}"
    return (
        db.query(Customer)
        .filter(Customer.internal_notes.like(f"%{tag}%"))
        .first()
    )


def _order_exists(db, auftrag_nr: str):
    """Check for existing Order by LEGACY_AUF:<nr> tag in internal_notes."""
    from app.Models.orders import Order
    tag = f"LEGACY_AUF:{auftrag_nr}"
    return (
        db.query(Order)
        .filter(Order.internal_notes.like(f"%{tag}%"))
        .first()
    )


def run() -> None:
    log_section(f"Legacy Orders — {len(AUFTRAEGE)} auftraege → Orders + Invoices + Payments")
    db = SessionLocal()
    try:
        from app.Models.customers import Customer
        from app.Models.orders import Order
        from app.Models.invoices import Invoice
        from app.Services.InvoicesService import InvoicesService
        from app.Services.PaymentsService import PaymentsService
        from app.Services.FleetService import FleetService
        from app.Utils.finance import compute_totals, order_date_sequence_number

        actor = get_system_actor(db)

        o_created = o_skipped = o_backfilled = inv_created = pay_created = 0
        missing_cust = []

        def _resolve_fleet(plate: str):
            """Resolve (or auto-register) the fleet car for a plate. Gap-free: never returns
            None for a non-empty plate, so no order is left without a car."""
            if not plate:
                return None
            return FleetService.get_or_create(
                db,
                plate,
                ownership_type="priv" if plate.strip().lower() == "ersatzwagen" else "firm",
                notes="Auto-registered from legacy order import.",
            )

        for a in AUFTRAEGE:
            # ── Idempotency check (with self-healing fleet backfill) ─────
            existing_order = _order_exists(db, a["auftrag_nr"])
            if existing_order:
                # Orders imported before the fleet rework have no vehicle link — link them now
                # from the plate so re-running this seeder closes the gap.
                if existing_order.vehicle_id is None and a["fz"]:
                    fv = _resolve_fleet(a["fz"])
                    if fv:
                        existing_order.vehicle_id = fv.id
                        if not existing_order.vehicle_name:
                            existing_order.vehicle_name = fv.plate
                        o_backfilled += 1
                o_skipped += 1
                continue

            # ── Customer lookup ──────────────────────────────────────────
            customer: Customer | None = _find_customer(db, a["cust_nr"])
            if not customer:
                missing_cust.append(a["cust_nr"])
                print(f"  [warn] {a['auftrag_nr']}: customer {a['cust_nr']} not found — run seed_customers first")
                continue

            display_name = customer.company_name or f"{customer.first_name} {customer.last_name}"

            # ── Money — use rechnung amounts verbatim ────────────────────
            net = a["r_net"]
            vat_rate = a["r_vat_r"]
            # Use pre-computed rechnung amounts directly (they are authoritative).
            _, _, gross = compute_totals(net, vat_rate)
            # We pass the rechnung's precomputed brutto to the payment, but the
            # invoice gross comes from compute_totals to stay consistent with the
            # service's own rounding. Any sub-cent diff is an accepted legacy artifact.

            termin_date = date.fromisoformat(a["termin"])
            due_date = date.fromisoformat(a["r_faellig"])
            issue_date = date.fromisoformat(a["r_dat"])

            # ── Create Order — direct DB insert (no email triggers) ──────
            notes_parts = [f"LEGACY_AUF:{a['auftrag_nr']}"]
            if a["ref_nr"]:
                notes_parts.append(f"Ref: {a['ref_nr']}")
            if a["fz"]:
                notes_parts.append(f"Fz: {a['fz']}")
            if a["km"]:
                notes_parts.append(f"km: {a['km']}")

            # ── Fleet car link (anchors car-order-history) ───────────────
            # Resolve the plate to a fleet vehicle, auto-registering any plate not in the
            # seeded fahrzeuge so no order is ever left without a car (gap-free). vehicle_name
            # snapshots the plate so the label survives even if the fleet row is later edited.
            fleet_vehicle = _resolve_fleet(a["fz"])

            order = Order(
                order_number=order_date_sequence_number(db, Order.order_number),
                booking_id=None,
                status="completed" if a["r_stat"] == "Bezahlt" else "open",
                delivery_status="delivered",
                customer_id=customer.id,
                driver_id=None,
                customer_name=display_name,
                customer_phone=customer.phone or "-",
                customer_email=customer.email or "noreply@step-now.de",
                is_business=True,
                company_name=customer.company_name,
                company_vatid=customer.company_vatid,
                pickup_address=a["von"],
                pickup_city=None,
                destination_address=a["nch"],
                destination_city=None,
                consignee=None,
                parcel_description=None,
                parcel_quantity=1,
                parcel_weight_kg=None,
                scheduled_datetime=datetime.combine(termin_date, datetime.min.time()).replace(tzinfo=timezone.utc),
                driver_name=None,
                vehicle_id=fleet_vehicle.id if fleet_vehicle else None,
                vehicle_name=fleet_vehicle.plate if fleet_vehicle else (a["fz"] or None),
                service_description="Sonderfahrt",
                net_amount=net,
                vat_rate=vat_rate,
                vat_amount=a["r_vat_b"],
                gross_amount=a["r_brutto"],
                payment_due_days=a["r_zz"],
                due_date=due_date,
                internal_notes=" | ".join(notes_parts),
                completed_at=datetime.combine(termin_date, datetime.min.time()).replace(tzinfo=timezone.utc) if a["r_stat"] == "Bezahlt" else None,
            )
            db.add(order)
            db.flush()
            o_created += 1

            # ── Create Invoice via service (idempotent) ──────────────────
            # SimpleNamespace mimics InvoiceCreateFromOrder without Pydantic validation.
            inv_payload = SimpleNamespace(
                issue_date=issue_date,
                payment_due_days=a["r_zz"],
                recipient_block=a["empfaenger"],
                tax_number=TAX_NUMBER,
                surcharge_label=None,
                surcharge_net=None,
                skonto_pct=a["r_skonto"] if a["r_skonto"] > 0 else None,
                skonto_days=None,
            )

            invoice: Invoice = InvoicesService.create_from_order(
                db, order.id, inv_payload, actor, request=None
            )
            # Override invoice_number to match the legacy rechnung ID exactly.
            if invoice.invoice_number != a["rechnung_nr"]:
                invoice.invoice_number = a["rechnung_nr"]
                db.flush()
            inv_created += 1

            # ── Record Payment if already paid ───────────────────────────
            if a["r_stat"] == "Bezahlt":
                pay_payload = SimpleNamespace(
                    amount=a["r_brutto"],
                    method="bank_transfer",
                    status="received",
                    received_at=datetime.combine(
                        due_date, datetime.min.time()
                    ).replace(tzinfo=timezone.utc),
                    invoice_id=invoice.id,
                    reference=a["rechnung_nr"],
                    notes=None,
                )

                PaymentsService.record(db, order.id, pay_payload, actor, request=None)
                pay_created += 1

            log_create(
                f"order A:{a['auftrag_nr']}",
                f"inv={a['rechnung_nr']} stat={a['r_stat']} {a['von']}→{a['nch']}",
            )

        db.commit()

        if missing_cust:
            print(f"  [warn] {len(missing_cust)} auftraege skipped — customers not found: {', '.join(set(missing_cust))}")

        print(
            f"  [done] orders: {o_created} created / {o_skipped} skipped "
            f"({o_backfilled} fleet-linked) | "
            f"invoices: {inv_created} created | payments: {pay_created} created"
        )
    finally:
        db.close()


if __name__ == "__main__":
    run()
