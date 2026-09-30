# apps/backend/app/Services/DriverSlipPdfService.py
# Renders the TRANSPORTAUFTRAG to a PDF with reportlab, following the client's own Auftragsschein:
# letterhead + sender line, Auftrags-Nr./Datum block, Spediteur|Wichtige Infos, Beladeort|Entladeort,
# Load infos, Fahrzeug/Fahrer, the agreed price band, and both signature lines. Issuer, tax IDs and
# register details come from SiteSettings. The price is off by default (driver link, email, WhatsApp)
# so a run-sheet never shows the client's rate; only the admin download passes with_price=True.
# The two variants are separate files, each written atomically, so a driver can never be served
# the priced copy. Every user-controlled value is escaped before it enters Paragraph markup.
#
# Requires: reportlab (already used by InvoicePdfService).

from pathlib import Path
from decimal import Decimal
from babel.numbers import format_currency
from sqlalchemy.orm import Session
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import HRFlowable, SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from app.Models.customers import Customer
from app.Models.orders import Order
from app.Models.settings import SiteSettings
from app.Services.InvoicePdfService import logo_flowable
from app.Utils.pdf import atomic_output, esc, esc_lines

STORAGE_DIR = Path("storage/slips")  # gitignored (apps/backend/storage/)
_INK = colors.HexColor("#0F1115")
_MUTE = colors.HexColor("#4A4A4A")
_LINE = colors.HexColor("#9AA0A6")
_HEAD_BG = colors.HexColor("#EDEDED")
_COL_W = 82 * mm
_GUTTER = 6 * mm
_FULL_W = _COL_W * 2 + _GUTTER


class DriverSlipPdfService:

    @staticmethod
    def storage_path(order: Order, with_price: bool = False) -> Path:
        return STORAGE_DIR / f"Transportauftrag_{order.order_number}{'' if with_price else '_Fahrer'}.pdf"

    @staticmethod
    def ensure(db: Session, order: Order, with_price: bool = False) -> str:
        """Render the slip FRESH and return its absolute path. Always re-renders so the document
        reflects the order's CURRENT state — it's a cheap single-page reportlab doc, and the prior
        cache-if-present behavior served stale slips after an order was edited. Only the driver
        copy is recorded on the order; the priced copy is an admin download."""
        path = DriverSlipPdfService.render(db, order, with_price=with_price)
        if not with_price and order.driver_slip_pdf_url != path:
            order.driver_slip_pdf_url = path
            db.commit()
            db.refresh(order)
        return str(Path(path).resolve())

    @staticmethod
    def _num(d) -> str:
        """Decimal → trimmed plain number ('295.00' → '295', None → '0'). Only fractional zeros are
        stripped — a bare rstrip('0') turns 300 into 3, which on a transport document is a lie."""
        if d is None:
            return "0"
        q = f"{Decimal(d):f}"
        return (q.rstrip("0").rstrip(".") or "0") if "." in q else q

    @staticmethod
    def _km(d) -> str:
        return f"{DriverSlipPdfService._num(d)} km"

    @staticmethod
    def _de_date(d) -> str:
        return d.strftime("%d.%m.%Y") if d else "—"

    @staticmethod
    def _hm(t) -> str | None:
        return t.strftime("%H:%M") if t else None

    @staticmethod
    def _window(stop, fallback_date) -> str:
        """'13.08.2026 – 07:00 – 07:30 Uhr' — the client's own Datum & Uhrzeit format."""
        if stop is None:
            return DriverSlipPdfService._de_date(fallback_date)
        d = DriverSlipPdfService._de_date(stop.stop_date or fallback_date)
        f, t = DriverSlipPdfService._hm(stop.time_from), DriverSlipPdfService._hm(stop.time_to)
        if f and t:
            return f"{d} – {f} – {t} Uhr"
        return f"{d} – ab {f} Uhr" if f else d

    @staticmethod
    def _addr_lines(stop, fallback_addr, fallback_pc, fallback_city, country: bool = True) -> str:
        """Company / Street / D-PLZ Ort, falling back to the legacy order columns."""
        if stop is not None:
            company, street, pc, city = stop.company, stop.address, stop.postcode, stop.city
        else:
            company, street, pc, city = None, fallback_addr, fallback_pc, fallback_city
        locality = " ".join(p for p in (pc, city) if p)
        if locality and country and pc:
            locality = f"D-{locality}"
        return "<br/>".join(esc(p) for p in (company, street, locality) if p) or "—"

    @staticmethod
    def _panel(title: str, body_html: str, width: float, min_h: float, head_st, body_st) -> Table:
        """One bordered block: grey caption row above a white body — the shape every section uses."""
        needed = (body_html.count("<br/>") + 1) * 4.8 * mm + 8 * mm
        t = Table(
            [[Paragraph(title, head_st)], [Paragraph(body_html, body_st)]],
            colWidths=[width], rowHeights=[7 * mm, max(min_h, needed)],
        )
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), _HEAD_BG),
            ("BOX", (0, 0), (-1, -1), 0.6, _LINE),
            ("LINEBELOW", (0, 0), (0, 0), 0.6, _LINE),
            ("VALIGN", (0, 0), (0, 0), "MIDDLE"),
            ("VALIGN", (0, 1), (0, 1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 1), (0, 1), 5), ("BOTTOMPADDING", (0, 1), (0, 1), 5),
        ]))
        return t

    @staticmethod
    def _side_by_side(left: Table, right: Table) -> Table:
        t = Table([[left, "", right]], colWidths=[_COL_W, _GUTTER, _COL_W])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        return t

    @staticmethod
    def render(db: Session, order: Order, with_price: bool = False) -> str:
        """Generate the Transportauftrag PDF and return its (relative) storage path string."""
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        out = DriverSlipPdfService.storage_path(order, with_price)
        s = db.query(SiteSettings).filter(SiteSettings.id == 1).first()

        styles = getSampleStyleSheet()
        tiny = ParagraphStyle("tiny", parent=styles["Normal"], fontSize=7.5, textColor=_MUTE, leading=10)
        small = ParagraphStyle("small", parent=styles["Normal"], fontSize=8, textColor=_INK, leading=11)
        body = ParagraphStyle("body", parent=styles["Normal"], fontSize=8.5, textColor=_INK, leading=12)
        head = ParagraphStyle("head", parent=body, fontName="Helvetica-Bold", fontSize=9)
        title = ParagraphStyle("title", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=20, textColor=_INK, leading=24)
        r_tiny = ParagraphStyle("r_tiny", parent=tiny, alignment=TA_RIGHT)
        r_bold = ParagraphStyle("r_bold", parent=small, fontName="Helvetica-Bold", alignment=TA_RIGHT)
        r_amount = ParagraphStyle("r_amount", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=16, textColor=_INK, alignment=TA_RIGHT, leading=20)
        c_tiny = ParagraphStyle("c_tiny", parent=tiny, alignment=TA_CENTER)

        biz = s.business_name if s else "StepNow Rides & Movers"
        owner = s.owner_name if s else ""
        issuer = biz + (f" – {owner}" if owner else "")
        street = s.address_street if s else ""
        locality = " ".join(p for p in ((s.address_postcode, s.address_city) if s else ()) if p)
        sender_line = "  ·  ".join(p for p in (issuer, street, locality) if p)
        contact = "  ·  ".join(p for p in (
            ((s.phone_mobile or s.phone), f"Email: {s.email}") if s else ()) if p)
        tax_line = "  ·  ".join(p for p in (
            (f"Steuer-Nr. {s.tax_number}" if s and s.tax_number else None),
            (f"USt-IdNr.: {s.vat_id}" if s and s.vat_id else None),
        ) if p)
        register = " ".join(p for p in ((s.commercial_register, s.register_court) if s else ()) if p)
        footer_text = "  ·  ".join(p for p in (
            issuer, street, locality, register, (s.website if s else None)) if p)

        def _footer(canvas, _doc):
            canvas.saveState()
            canvas.setStrokeColor(_LINE)
            canvas.setLineWidth(0.6)
            canvas.line(20 * mm, 20 * mm, A4[0] - 20 * mm, 20 * mm)
            canvas.setFont("Helvetica", 7)
            canvas.setFillColor(_MUTE)
            canvas.drawCentredString(A4[0] / 2, 15 * mm, footer_text)
            canvas.restoreState()

        story = []

        # Letterhead — logo and issuer block sit right, the way the client's document does.
        logo = logo_flowable(s, max_w_mm=52, max_h_mm=20)
        if logo:
            logo.hAlign = "RIGHT"
            story.append(logo)
            story.append(Spacer(1, 2 * mm))
        story.append(Paragraph(esc(issuer), r_bold))
        if contact:
            story.append(Paragraph(esc(contact), r_tiny))
        if tax_line:
            story.append(Paragraph(esc(tax_line), r_tiny))
        story.append(Spacer(1, 7 * mm))

        # DIN-style sender line above the recipient block.
        story.append(Paragraph(esc(sender_line), tiny))
        story.append(HRFlowable(width="52%", thickness=0.6, color=_LINE, hAlign="LEFT", spaceBefore=1))
        story.append(Spacer(1, 6 * mm))

        doc_date = (
            order.preferred_date
            or (order.scheduled_datetime.date() if order.scheduled_datetime else None)
            or (order.created_at.date() if order.created_at else None)
        )
        meta = Table(
            [[Paragraph("<b>Auftrags-Nr.:</b>", small), Paragraph(f"<b>{esc(order.order_number)}</b>", r_bold)],
             [Paragraph("<b>Datum:</b>", small), Paragraph(f"<b>{DriverSlipPdfService._de_date(doc_date)}</b>", r_bold)]],
            colWidths=[30 * mm, 35 * mm],
        )
        meta.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 1), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ]))
        head_row = Table([[Paragraph("Transportauftrag", title), meta]], colWidths=[_FULL_W - 65 * mm, 65 * mm])
        head_row.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ]))
        story.append(head_row)
        story.append(HRFlowable(width="100%", thickness=1.6, color=_INK, spaceBefore=5, spaceAfter=7))

        cust = db.query(Customer).filter(Customer.id == order.customer_id).first() if order.customer_id else None
        spediteur = "<br/>".join(esc(p) for p in (
            order.company_name or order.customer_name,
            cust.street if cust else None,
            " ".join(q for q in ((cust.plz, cust.ort) if cust else ()) if q) or None,
        ) if p) or "—"
        infos = "<br/>".join(p for p in (
            esc_lines(order.service_description),
            f"Lade-Ref.: {esc(order.client_reference)}" if order.client_reference else None,
        ) if p) or "—"
        story.append(DriverSlipPdfService._side_by_side(
            DriverSlipPdfService._panel("Spediteur / Auftraggeber", spediteur, _COL_W, 26 * mm, head, body),
            DriverSlipPdfService._panel("Wichtige Infos", infos, _COL_W, 26 * mm, head, body),
        ))
        story.append(Spacer(1, 5 * mm))

        # Beladeort / Entladeort — canonical order.stops, legacy columns as the fallback.
        stops = [st for st in (order.stops or []) if not st.is_deleted]
        pickups = [st for st in stops if st.stop_type == "pickup"]
        drops = [st for st in stops if st.stop_type == "drop"]
        fallback_date = doc_date

        def _side(side_stops, legacy_addr, legacy_pc, legacy_city) -> str:
            if len(side_stops) > 1:
                return "<br/><br/>".join(
                    f"{i}. " + DriverSlipPdfService._addr_lines(st, None, None, None)
                    for i, st in enumerate(side_stops, start=1)
                )
            return DriverSlipPdfService._addr_lines(
                side_stops[0] if side_stops else None, legacy_addr, legacy_pc, legacy_city)

        load_body = "<br/>".join([
            f"<b>Datum &amp; Uhrzeit:</b> {DriverSlipPdfService._window(pickups[0] if pickups else None, fallback_date)}",
            "Abholadresse:",
            _side(pickups, order.pickup_address, order.pickup_postcode, order.pickup_city),
        ])
        unload_body = "<br/>".join([
            f"<b>Datum &amp; Uhrzeit:</b> {DriverSlipPdfService._window(drops[0] if drops else None, fallback_date)}",
            "Lieferadresse:",
            _side(drops, order.destination_address, order.destination_postcode, order.destination_city),
        ])
        story.append(DriverSlipPdfService._side_by_side(
            DriverSlipPdfService._panel("Beladeort", load_body, _COL_W, 30 * mm, head, body),
            DriverSlipPdfService._panel("Entladeort", unload_body, _COL_W, 30 * mm, head, body),
        ))
        story.append(Spacer(1, 5 * mm))

        load_bits = []
        for st in pickups:
            if st.package_count:
                load_bits.append(f"{st.package_count} Stk")
            if st.weight_kg:
                load_bits.append(f"{DriverSlipPdfService._num(st.weight_kg)} KG")
            if st.notes:
                load_bits.append(esc_lines(st.notes))
        if not load_bits and order.parcel_quantity:
            load_bits.append(f"{order.parcel_quantity} Stk")
        if not any("KG" in b for b in load_bits) and order.parcel_weight_kg:
            load_bits.append(f"{DriverSlipPdfService._num(order.parcel_weight_kg)} KG")
        story.append(DriverSlipPdfService._panel(
            "Load infos", ", ".join(load_bits) or "—", _FULL_W, 12 * mm, head, body))
        story.append(Spacer(1, 5 * mm))

        vehicle = esc(order.vehicle_name or "Noch nicht gewählt")
        driver = esc(order.driver_name or "Noch nicht zugewiesen")
        fahrzeug_body = "<br/>".join([
            f"Selection from cars: {vehicle}  ·  Fahrer: {driver}",
            f"Km to load: {DriverSlipPdfService._km(order.km_to_load)}",
            f"Km to Unload: {DriverSlipPdfService._km(order.km_to_unload)}",
            f"driven Km: {DriverSlipPdfService._km(order.total_km)}",
            f"Km / Besetzt: {DriverSlipPdfService._km(order.occupied_km)}",
        ])
        story.append(DriverSlipPdfService._panel(
            "Fahrzeug / Fahrer", fahrzeug_body, _FULL_W, 24 * mm, head, body))

        if with_price:
            story.append(Spacer(1, 7 * mm))
            terms = f"Zahlungsziel: {order.payment_due_days} Tage | Fällig: {DriverSlipPdfService._de_date(order.due_date)}"
            amount = format_currency(Decimal(order.net_amount), order.currency, locale="de_DE")
            price = Table(
                [[Paragraph("<b>Vereinbarter Transportpreis (zzgl. MwSt.):</b>", head),
                  Paragraph(esc(amount), r_amount)],
                 [Paragraph(terms, tiny), ""]],
                colWidths=[_FULL_W - 55 * mm, 55 * mm],
            )
            price.setStyle(TableStyle([
                ("SPAN", (1, 0), (1, 1)),
                ("BACKGROUND", (0, 0), (-1, -1), _HEAD_BG),
                ("BOX", (0, 0), (-1, -1), 0.6, _LINE),
                ("VALIGN", (1, 0), (1, 1), "MIDDLE"),
                ("VALIGN", (0, 0), (0, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (0, 0), 6), ("BOTTOMPADDING", (0, 1), (0, 1), 6),
            ]))
            story.append(price)

        story.append(Spacer(1, 14 * mm))
        # Signature rules are LINEABOVE on the caption row — a shared HRFlowable instance cannot be
        # placed in two cells, and reportlab silently drops the row when you try.
        sign = Table(
            [[Paragraph("Auftraggeber (Datum, Unterschrift)", tiny), "",
              Paragraph("Auftragnehmer (Datum, Unterschrift)", tiny)]],
            colWidths=[76 * mm, 18 * mm, 76 * mm],
        )
        sign.setStyle(TableStyle([
            ("LINEABOVE", (0, 0), (0, 0), 0.6, _INK),
            ("LINEABOVE", (2, 0), (2, 0), 0.6, _INK),
            ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, 0), 3),
        ]))
        story.append(sign)
        if not with_price:
            story.append(Spacer(1, 4 * mm))
            story.append(Paragraph("Fahrerexemplar — ohne Preisangaben.", c_tiny))

        with atomic_output(out) as tmp:
            SimpleDocTemplate(
                str(tmp), pagesize=A4,
                leftMargin=20 * mm, rightMargin=20 * mm, topMargin=15 * mm, bottomMargin=26 * mm,
                title=f"Transportauftrag {order.order_number}",
            ).build(story, onFirstPage=_footer, onLaterPages=_footer)
        return str(out)
