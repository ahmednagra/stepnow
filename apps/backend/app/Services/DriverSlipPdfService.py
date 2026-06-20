# apps/backend/app/Services/DriverSlipPdfService.py
# Renders the driver transport order (TRANSPORTAUFTRAG) to a PDF with reportlab (pure-Python,
# Railway-safe). DELIBERATELY contains NO price — it is the run-sheet the driver receives.
# Mirrors InvoicePdfService: writes to a NON-public storage dir, streamed via the authed admin
# endpoint. Issuer + legal details come from SiteSettings. Layout follows the client template:
# Spediteur/Auftraggeber + Wichtige Infos, Beladeort/Entladeort (date + time window + address),
# Load infos, Fahrzeug/Fahrer band, the km legs, and the Handelsregister footer.
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
        return STORAGE_DIR / f"Transportauftrag_{order.order_number}.pdf"

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
    def _hm(t) -> str:
        return t.strftime("%H:%M") if t else None

    @staticmethod
    def _window(stop, fallback_date) -> str:
        """Datum & Uhrzeit line for a stop: '19.06.2026 · 12:00 – 13:00 Uhr'."""
        d = DriverSlipPdfService._de_date(fallback_date)
        f, t = DriverSlipPdfService._hm(stop.time_from), DriverSlipPdfService._hm(stop.time_to)
        if f and t:
            return f"{d} · {f} – {t} Uhr"
        return f"{d} · ab {f} Uhr" if f else d

    @staticmethod
    def _addr_lines(stop, fallback_addr, fallback_pc, fallback_city) -> str:
        """Company / Street / PLZ Ort block for a stop, falling back to the legacy order columns."""
        if stop is not None:
            parts = [stop.company, stop.address, " ".join(p for p in (stop.postcode, stop.city) if p)]
        else:
            parts = [None, fallback_addr, " ".join(p for p in (fallback_pc, fallback_city) if p)]
        return "<br/>".join(p for p in parts if p) or "—"

    @staticmethod
    def render(db: Session, order: Order) -> str:
        """Generate the Transportauftrag PDF, return its (relative) storage path string. Mirrors the
        admin live preview: Spediteur/Auftraggeber, Beladeort/Entladeort with date+time windows,
        vehicle-anchored Fahrzeug/Fahrer, the km legs and the Leistungsart — never a price."""
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

        biz = s.business_name if s else "StepNow Rides & Movers"
        owner = s.owner_name if s else ""
        issuer_line = f"{biz}" + (f" – {owner}" if owner else "")
        contact_line = "  ·  ".join(p for p in ((s.phone, s.email) if s else ()) if p)
        addr_line = ", ".join(p for p in (
            (s.address_street, " ".join(q for q in (s.address_postcode, s.address_city) if q)) if s else ()
        ) if p)

        doc = SimpleDocTemplate(
            str(out), pagesize=A4,
            leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm, bottomMargin=18 * mm,
            title=f"Transportauftrag {order.order_number}",
        )
        story = []

        # Header
        story.append(Paragraph(issuer_line, ParagraphStyle("issuer", parent=body, fontSize=10, textColor=_INK)))
        if contact_line:
            story.append(Paragraph(contact_line, small))
        if addr_line:
            story.append(Paragraph(addr_line, small))
        story.append(Spacer(1, 8 * mm))
        story.append(Paragraph("TRANSPORTAUFTRAG", title))
        ref = f"  ·  Lade-Ref.: {order.client_reference}" if order.client_reference else ""
        story.append(Paragraph(f"Auftrags-Nr.: A-{order.order_number}{ref}", small))
        story.append(Spacer(1, 5 * mm))

        # Spediteur / Auftraggeber + Wichtige Infos (two columns)
        spediteur = "<br/>".join(p for p in (
            f"<b>{order.company_name or order.customer_name}</b>",
            order.customer_name if order.company_name else None,
            f"Tel.: {order.customer_phone}" if order.customer_phone and order.customer_phone != "-" else None,
            f"E-Mail: {order.customer_email}" if order.customer_email and "noreply@" not in order.customer_email else None,
        ) if p) or "—"
        infos = "<br/>".join(p for p in (
            f"Lade Referenz: {order.client_reference}" if order.client_reference else None,
            order.service_description or None,
        ) if p) or "—"
        head = Table(
            [[Paragraph("SPEDITEUR / AUFTRAGGEBER", label), Paragraph("WICHTIGE INFOS", label)],
             [Paragraph(spediteur, body), Paragraph(infos, body)]],
            colWidths=[85 * mm, 85 * mm],
        )
        head.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, _LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, _LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(head)
        story.append(Spacer(1, 5 * mm))

        # Beladeort / Entladeort — date + time window + address. Canonical order.stops; legacy
        # columns are the fallback for older single-pickup orders that predate order_stops.
        stops = [st for st in (order.stops or []) if not st.is_deleted]
        pickups = [st for st in stops if st.stop_type == "pickup"]
        drop = next((st for st in stops if st.stop_type == "drop"), None)
        fallback_date = order.preferred_date or (order.scheduled_datetime.date() if order.scheduled_datetime else None)

        load_win = DriverSlipPdfService._window(pickups[0], fallback_date) if pickups else DriverSlipPdfService._de_date(fallback_date)
        unload_win = DriverSlipPdfService._window(drop, fallback_date) if drop else DriverSlipPdfService._de_date(fallback_date)
        if len(pickups) > 1:
            load_addr = "<br/><br/>".join(
                f"{i}. " + DriverSlipPdfService._addr_lines(st, None, None, None)
                for i, st in enumerate(pickups, start=1)
            )
        else:
            load_addr = DriverSlipPdfService._addr_lines(
                pickups[0] if pickups else None, order.pickup_address, order.pickup_postcode, order.pickup_city)
        unload_addr = DriverSlipPdfService._addr_lines(
            drop, order.destination_address, order.destination_postcode, order.destination_city)

        load_header = f"BELADEORT ({len(pickups)})" if len(pickups) > 1 else "BELADEORT"
        route = Table(
            [[Paragraph(load_header, label), Paragraph("ENTLADEORT", label)],
             [Paragraph(f"<b>Datum &amp; Uhrzeit:</b> {load_win}", small), Paragraph(f"<b>Datum &amp; Uhrzeit:</b> {unload_win}", small)],
             [Paragraph(load_addr, body), Paragraph(unload_addr, body)]],
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
        story.append(Spacer(1, 4 * mm))

        # Load infos — package count / weight / per-stop notes (from the stops, when present).
        load_info_bits = []
        for st in (pickups or []):
            bits = []
            if st.package_count:
                bits.append(f"{st.package_count} Stück")
            if st.weight_kg:
                bits.append(f"{DriverSlipPdfService._km(st.weight_kg).replace(' km', '')} kg".replace("—", ""))
            if st.notes:
                bits.append(st.notes)
            if bits:
                load_info_bits.append(" · ".join(bits))
        load_info = "; ".join(load_info_bits)
        if load_info:
            story.append(Paragraph(f"<b>Load infos:</b> {load_info}", small))
            story.append(Spacer(1, 3 * mm))

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
        story.append(Spacer(1, 5 * mm))

        if order.service_type:
            story.append(Paragraph(f"<b>Leistungsart:</b> {order.service_type}", body))
        if order.consignee:
            story.append(Paragraph(f"Empfänger: {order.consignee}", small))
        story.append(Spacer(1, 3 * mm))

        # Km legs (Fahrtenbuch): to-load / to-unload / driven / Besetzt. Leer is derived.
        leer = None
        if order.total_km is not None and order.occupied_km is not None:
            leer = Decimal(order.total_km) - Decimal(order.occupied_km)
        km_tbl = Table(
            [[Paragraph("Km to load", label), Paragraph("Km to Unload", label),
              Paragraph("driven Km", label), Paragraph("Km / Besetzt", label), Paragraph("Leer", label)],
             [Paragraph(f"<b>{DriverSlipPdfService._km(order.km_to_load)}</b>", body),
              Paragraph(f"<b>{DriverSlipPdfService._km(order.km_to_unload)}</b>", body),
              Paragraph(f"<b>{DriverSlipPdfService._km(order.total_km)}</b>", body),
              Paragraph(f"<b>{DriverSlipPdfService._km(order.occupied_km)}</b>", body),
              Paragraph(f"<b>{DriverSlipPdfService._km(leer)}</b>", body)]],
            colWidths=[34 * mm, 34 * mm, 34 * mm, 34 * mm, 34 * mm],
        )
        km_tbl.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, _LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, _LINE),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(km_tbl)
        story.append(Spacer(1, 16 * mm))

        # Signatures
        sign = Table(
            [[Paragraph("_______________________________", small), Paragraph("_______________________________", small)],
             [Paragraph("Unterschrift Fahrer", small), Paragraph("Unterschrift Auftraggeber", small)]],
            colWidths=[85 * mm, 85 * mm],
        )
        sign.setStyle(TableStyle([("TOPPADDING", (0, 0), (-1, -1), 2)]))
        story.append(sign)
        story.append(Spacer(1, 5 * mm))
        story.append(Paragraph("Belegart Transportauftrag — enthält bewusst keine Preisangaben.", small))

        # Legal footer (Sitz · Geschäftsführung · Handelsregister)
        footer_bits = [biz]
        if addr_line:
            footer_bits.append(f"Sitz: {addr_line}")
        if owner:
            footer_bits.append(f"Geschäftsführung: {owner}")
        reg = " ".join(p for p in (s.commercial_register, s.register_court) if p) if s else ""
        if reg:
            footer_bits.append(f"Handelsregister: {reg}")
        story.append(Spacer(1, 4 * mm))
        story.append(Paragraph("  ·  ".join(footer_bits), label))

        doc.build(story)
        return str(out)
