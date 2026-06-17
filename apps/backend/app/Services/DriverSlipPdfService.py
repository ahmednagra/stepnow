# apps/backend/app/Services/DriverSlipPdfService.py
# Renders the driver slip (Fahrauftrag) to a PDF with reportlab (pure-Python, Railway-safe).
# DELIBERATELY contains NO price — it is the run-sheet the driver receives. Mirrors
# InvoicePdfService: writes to a NON-public storage dir, streamed via the authed admin
# endpoint. Issuer details come from SiteSettings.
#
# Requires: reportlab (already used by InvoicePdfService).

from pathlib import Path
from decimal import Decimal
from sqlalchemy.orm import Session
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from app.Models.orders import Order
from app.Models.settings import SiteSettings

STORAGE_DIR = Path("storage/slips")  # gitignored (apps/backend/storage/)
_INK = colors.HexColor("#0F1115")
_MUTE = colors.HexColor("#64748B")
_LINE = colors.HexColor("#D9CFC0")


class DriverSlipPdfService:

    @staticmethod
    def storage_path(order: Order) -> Path:
        return STORAGE_DIR / f"Fahrauftrag_{order.order_number}.pdf"

    @staticmethod
    def ensure(db: Session, order: Order) -> str:
        """Render the slip FRESH and return its absolute path. Always re-renders so the document
        reflects the order's CURRENT state — it's a cheap single-page reportlab doc, and the prior
        cache-if-present behavior served stale slips after an order was edited. The deterministic
        path is cached on the order for the email-attachment flow. Reused by the admin download
        and the public driver download."""
        path = DriverSlipPdfService.render(db, order)
        if order.driver_slip_pdf_url != path:
            order.driver_slip_pdf_url = path
            db.commit()
            db.refresh(order)
        return str(Path(path).resolve())

    @staticmethod
    def _km(d) -> str:
        """Decimal km → trimmed string with unit ('454.00' → '454 km', None → '—')."""
        if d is None:
            return "—"
        return (f"{Decimal(d):f}".rstrip("0").rstrip(".") or "0") + " km"

    @staticmethod
    def _de_date(d) -> str:
        return d.strftime("%d.%m.%Y") if d else "—"

    @staticmethod
    def _loc(address, postcode, city) -> str:
        loc = " ".join(p for p in (postcode, city) if p)
        return (address or "—") + (f", {loc}" if loc else "")

    @staticmethod
    def render(db: Session, order: Order) -> str:
        """Generate the driver-slip PDF, return its (relative) storage path string. Mirrors the
        admin live preview: vehicle-anchored, N pickups → 1 drop (from order.stops), the logbook,
        and the Leistungsart — never a price."""
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        out = DriverSlipPdfService.storage_path(order)
        s = db.query(SiteSettings).filter(SiteSettings.id == 1).first()

        styles = getSampleStyleSheet()
        small = ParagraphStyle("small", parent=styles["Normal"], fontSize=8, textColor=_MUTE, leading=11)
        body = ParagraphStyle("body", parent=styles["Normal"], fontSize=9.5, leading=13)
        title = ParagraphStyle("title", parent=styles["Title"], fontSize=20, textColor=_INK, spaceAfter=2)
        label = ParagraphStyle("label", parent=small, fontSize=7.5, textColor=_MUTE)
        on_dark = ParagraphStyle("on_dark", parent=body, textColor=colors.white)
        on_dark_b = ParagraphStyle("on_dark_b", parent=on_dark, fontName="Helvetica-Bold")
        on_dark_l = ParagraphStyle("on_dark_l", parent=label, textColor=colors.HexColor("#94A3B8"))

        biz = (s.business_name if s else "StepNow Rides & Movers")
        owner = (s.owner_name if s and getattr(s, "owner_name", None) else "")
        issuer_line = f"{biz}" + (f" – {owner}" if owner else "")
        contact_bits = []
        if s and getattr(s, "phone", None):
            contact_bits.append(s.phone)
        if s and getattr(s, "email", None):
            contact_bits.append(s.email)
        contact_line = "  ·  ".join(contact_bits)

        doc = SimpleDocTemplate(
            str(out), pagesize=A4,
            leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm, bottomMargin=18 * mm,
            title=f"Fahrauftrag {order.order_number}",
        )
        story = []

        # Header
        story.append(Paragraph(issuer_line, ParagraphStyle("issuer", parent=body, fontSize=10, textColor=_INK)))
        if contact_line:
            story.append(Paragraph(contact_line, small))
        story.append(Spacer(1, 8 * mm))
        story.append(Paragraph("Fahrauftrag", title))
        ref = f"  ·  Ref.: {order.client_reference}" if order.client_reference else ""
        story.append(Paragraph(f"Auftrags-Nr.: {order.order_number}{ref}", small))
        story.append(Spacer(1, 6 * mm))

        # FAHRZEUG — the order's anchor (vehicle first, driver second). Dark band like the preview.
        fahrzeug = Table(
            [[Paragraph("FAHRZEUG", on_dark_l),
              Paragraph(order.vehicle_name or "Noch nicht gewählt", on_dark_b),
              Paragraph(f"Fahrer: {order.driver_name or 'Noch nicht zugewiesen'}", on_dark)]],
            colWidths=[26 * mm, 74 * mm, 70 * mm],
        )
        fahrzeug.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), _INK),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (2, 0), (2, 0), "RIGHT"),
            ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(fahrzeug)
        story.append(Spacer(1, 6 * mm))

        # Route — N pickups → 1 drop from the canonical order.stops; legacy columns are the
        # fallback for older single-pickup orders that predate order_stops.
        stops = [st for st in (order.stops or []) if not st.is_deleted]
        pickups = [st for st in stops if st.stop_type == "pickup"]
        drop = next((st for st in stops if st.stop_type == "drop"), None)
        if len(pickups) > 1:
            pick_lines = "<br/>".join(
                f"{i}. {DriverSlipPdfService._loc(st.address, st.postcode, st.city)}"
                for i, st in enumerate(pickups, start=1)
            )
        elif pickups:
            pick_lines = DriverSlipPdfService._loc(pickups[0].address, pickups[0].postcode, pickups[0].city)
        else:
            pick_lines = DriverSlipPdfService._loc(order.pickup_address, order.pickup_postcode, order.pickup_city)
        drop_line = (
            DriverSlipPdfService._loc(drop.address, drop.postcode, drop.city) if drop
            else DriverSlipPdfService._loc(order.destination_address, order.destination_postcode, order.destination_city)
        )
        pick_header = f"ABHOLUNG ({len(pickups)})" if len(pickups) > 1 else "ABHOLUNG"
        route = Table(
            [[Paragraph(pick_header, label), Paragraph("ZIEL", label)],
             [Paragraph(pick_lines, body), Paragraph(drop_line, body)]],
            colWidths=[85 * mm, 85 * mm],
        )
        route.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, _LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, _LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(route)
        story.append(Spacer(1, 5 * mm))

        # Auftraggeber / Termin / Strecke (mirrors the preview's meta strip)
        termin = DriverSlipPdfService._de_date(order.preferred_date or order.scheduled_datetime)
        meta = Table(
            [[Paragraph(f"<b>Auftraggeber:</b> {order.company_name or order.customer_name}", body),
              Paragraph(f"<b>Termin:</b> {termin}", body),
              Paragraph(f"<b>Strecke:</b> {DriverSlipPdfService._km(order.distance_km)}", body)]],
            colWidths=[90 * mm, 45 * mm, 35 * mm],
        )
        meta.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, _LINE),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(meta)
        story.append(Spacer(1, 4 * mm))

        if order.service_type:
            story.append(Paragraph(f"<b>Leistungsart:</b> {order.service_type}", body))
        if order.consignee:
            story.append(Paragraph(f"Empfänger: {order.consignee}", small))
        if order.service_description:
            story.append(Paragraph(order.service_description, small))
        story.append(Spacer(1, 3 * mm))

        # Fahrtenbuch (logbook) — Leer-KM is derived (total − occupied), never stored.
        leer = None
        if order.total_km is not None and order.occupied_km is not None:
            leer = Decimal(order.total_km) - Decimal(order.occupied_km)
        story.append(Paragraph(
            f"Gefahrene KM: <b>{DriverSlipPdfService._km(order.total_km)}</b>"
            f"   ·   Besetzt: <b>{DriverSlipPdfService._km(order.occupied_km)}</b>"
            f"   ·   Leer: <b>{DriverSlipPdfService._km(leer)}</b>",
            small,
        ))
        story.append(Spacer(1, 18 * mm))

        # Signatures
        sign = Table(
            [[Paragraph("_______________________________", small), Paragraph("_______________________________", small)],
             [Paragraph("Unterschrift Fahrer", small), Paragraph("Unterschrift Auftraggeber", small)]],
            colWidths=[85 * mm, 85 * mm],
        )
        sign.setStyle(TableStyle([("TOPPADDING", (0, 0), (-1, -1), 2)]))
        story.append(sign)
        story.append(Spacer(1, 6 * mm))
        story.append(Paragraph("Belegart Fahrauftrag — enthält bewusst keine Preisangaben.", small))

        doc.build(story)
        return str(out)
