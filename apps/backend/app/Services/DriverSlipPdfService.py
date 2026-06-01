# apps/backend/app/Services/DriverSlipPdfService.py
# Renders the driver slip (Fahrauftrag) to a PDF with reportlab (pure-Python, Railway-safe).
# DELIBERATELY contains NO price — it is the run-sheet the driver receives. Mirrors
# InvoicePdfService: writes to a NON-public storage dir, streamed via the authed admin
# endpoint. Issuer details come from SiteSettings.
#
# Requires: reportlab (already used by InvoicePdfService).

from pathlib import Path
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
    def render(db: Session, order: Order) -> str:
        """Generate the driver-slip PDF, return its (relative) storage path string."""
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        out = DriverSlipPdfService.storage_path(order)
        s = db.query(SiteSettings).filter(SiteSettings.id == 1).first()

        styles = getSampleStyleSheet()
        small = ParagraphStyle("small", parent=styles["Normal"], fontSize=8, textColor=_MUTE, leading=11)
        body = ParagraphStyle("body", parent=styles["Normal"], fontSize=9.5, leading=13)
        title = ParagraphStyle("title", parent=styles["Title"], fontSize=20, textColor=_INK, spaceAfter=2)
        label = ParagraphStyle("label", parent=small, fontSize=7.5, textColor=_MUTE)

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
        story.append(Paragraph(f"Auftrags-Nr.: {order.order_number}", small))
        story.append(Spacer(1, 6 * mm))

        # Driver + customer contact (NO price anywhere)
        driver_label = order.driver_name or "Noch nicht zugewiesen"
        story.append(Paragraph(f"<b>Fahrer:</b> {driver_label}", body))
        story.append(Paragraph(f"<b>Auftraggeber:</b> {order.customer_name}  ·  <b>Mobil:</b> {order.customer_phone or '—'}", body))
        story.append(Spacer(1, 6 * mm))

        # Route
        route = Table(
            [
                [Paragraph("ABHOLUNG", label), Paragraph("ZUSTELLUNG", label)],
                [
                    Paragraph((order.pickup_address or "—") + (f", {order.pickup_city}" if order.pickup_city else ""), body),
                    Paragraph((order.destination_address or "—") + (f", {order.destination_city}" if order.destination_city else ""), body),
                ],
            ],
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
        if order.consignee:
            story.append(Spacer(1, 2 * mm))
            story.append(Paragraph(f"Empfänger: {order.consignee}", small))
        story.append(Spacer(1, 6 * mm))

        # Parcel line (qty + weight + contents — NO price)
        weight = f"{order.parcel_weight_kg} kg" if order.parcel_weight_kg is not None else "—"
        items = Table(
            [
                [Paragraph("POS.", label), Paragraph("SENDUNG / INHALT", label), Paragraph("MENGE", label), Paragraph("GEWICHT", label)],
                [
                    Paragraph("1", body),
                    Paragraph("Kuriersendung" + (f"<br/><font size=8 color='#64748B'>{order.parcel_description}</font>" if order.parcel_description else ""), body),
                    Paragraph(f"{order.parcel_quantity} St.", body),
                    Paragraph(weight, body),
                ],
            ],
            colWidths=[14 * mm, 110 * mm, 24 * mm, 22 * mm],
        )
        items.setStyle(TableStyle([
            ("LINEBELOW", (0, 0), (-1, 0), 1, _INK),
            ("LINEBELOW", (0, 1), (-1, 1), 0.5, _LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(items)
        story.append(Spacer(1, 22 * mm))

        # Signatures
        sign = Table(
            [[Paragraph("_______________________________", small), Paragraph("_______________________________", small)],
             [Paragraph("Unterschrift Abholung", small), Paragraph("Unterschrift Empfänger", small)]],
            colWidths=[85 * mm, 85 * mm],
        )
        sign.setStyle(TableStyle([("TOPPADDING", (0, 0), (-1, -1), 2)]))
        story.append(sign)
        story.append(Spacer(1, 8 * mm))
        story.append(Paragraph("Belegart Fahrauftrag — enthält bewusst keine Preisangaben.", small))

        doc.build(story)
        return str(out)
