# apps/backend/app/Services/InvoicePdfService.py
# Renders an invoice (+ its order) to a PDF using reportlab (pure-Python; no system libs,
# Railway-safe). Writes to a NON-public storage dir — invoices hold customer personal data,
# so they are never placed under the public /uploads mount; they stream via the authenticated
# admin endpoint. Issuer details come from SiteSettings, not hardcoded.
#
# Requires: reportlab  (add `reportlab==4.2.5` to requirements.txt)

from decimal import Decimal
from pathlib import Path
from sqlalchemy.orm import Session
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from app.Models.invoices import Invoice
from app.Models.settings import SiteSettings

STORAGE_DIR = Path("storage/invoices")  # gitignored (apps/backend/storage/)
_INK = colors.HexColor("#0F1115")
_GOLD = colors.HexColor("#A8865A")
_MUTE = colors.HexColor("#64748B")


def _eur(value) -> str:
    return f"{Decimal(value):,.2f} €"


class InvoicePdfService:

    @staticmethod
    def storage_path(invoice: Invoice) -> Path:
        return STORAGE_DIR / f"{invoice.invoice_number}.pdf"

    @staticmethod
    def render(db: Session, invoice: Invoice) -> str:
        """Generate the PDF, return its (relative) storage path string."""
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        out = InvoicePdfService.storage_path(invoice)
        order = invoice.order
        s = db.query(SiteSettings).filter(SiteSettings.id == 1).first()

        styles = getSampleStyleSheet()
        small = ParagraphStyle("small", parent=styles["Normal"], fontSize=8, textColor=_MUTE, leading=11)
        body = ParagraphStyle("body", parent=styles["Normal"], fontSize=9.5, leading=13)
        h_right = ParagraphStyle("hr", parent=styles["Normal"], fontSize=8, alignment=2, textColor=_MUTE, leading=11)
        title = ParagraphStyle("title", parent=styles["Title"], fontSize=20, textColor=_INK, spaceAfter=2)

        # ── Issuer block (from SiteSettings, with sensible fallbacks) ──
        biz = (s.business_name if s else "StepNow Rides & Movers")
        owner = (s.owner_name if s and s.owner_name else "")
        issuer_line = f"{biz}" + (f" – {owner}" if owner else "")
        contact_bits = []
        if s and s.phone: contact_bits.append(s.phone)
        if s and s.email: contact_bits.append(s.email)
        contact_line = "  ·  ".join(contact_bits) if contact_bits else ""
        tax_no = invoice.tax_number or (s.tax_number if s else None)

        doc = SimpleDocTemplate(
            str(out), pagesize=A4,
            leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm, bottomMargin=18 * mm,
            title=f"Rechnung {invoice.invoice_number}",
        )
        story = []

        # Header
        story.append(Paragraph(issuer_line, ParagraphStyle("issuer", parent=body, fontSize=10, textColor=_INK)))
        if contact_line:
            story.append(Paragraph(contact_line, small))
        if tax_no:
            story.append(Paragraph(f"Steuer-Nr.: {tax_no}", small))
        story.append(Spacer(1, 10 * mm))

        # Recipient + invoice meta side by side
        recipient = (invoice.recipient_block or order.customer_name or "").replace("\n", "<br/>")
        meta = [
            ["Rechnungs-Nr.:", invoice.invoice_number],
            ["Rechnungsdatum:", str(invoice.issue_date)],
            ["Auftrags-Nr.:", order.order_number],
        ]
        if invoice.due_date:
            meta.append(["Fällig bis:", str(invoice.due_date)])
        meta_tbl = Table([[Paragraph(f"<b>{k}</b>", small), Paragraph(v, small)] for k, v in meta], colWidths=[32 * mm, 40 * mm])
        meta_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
        head = Table(
            [[Paragraph("<b>Rechnung an</b><br/>" + recipient, body), meta_tbl]],
            colWidths=[95 * mm, 75 * mm],
        )
        head.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
        story.append(head)
        story.append(Spacer(1, 8 * mm))
        story.append(Paragraph("Rechnung", title))
        story.append(Spacer(1, 3 * mm))

        # Line items
        rate_pct = f"{(Decimal(invoice.vat_rate) * 100):.0f}%"
        base_net = Decimal(invoice.net_amount) - (Decimal(invoice.surcharge_net) if invoice.surcharge_net else Decimal("0"))
        rows = [["Pos.", "Beschreibung", "Netto", "MwSt", "Brutto"]]
        desc = order.service_description or "Transportleistung"
        # Route from the canonical stops (N pickups → 1 drop); legacy columns are the fallback.
        _pickups = [st for st in (order.stops or []) if not st.is_deleted and st.stop_type == "pickup"]
        _drop = next((st for st in (order.stops or []) if not st.is_deleted and st.stop_type == "drop"), None)
        _from = (_pickups[0].address if _pickups else order.pickup_address) or "—"
        if len(_pickups) > 1:
            _from = f"{_from} (+{len(_pickups) - 1})"
        _to = (_drop.address if _drop else order.destination_address) or "—"
        route = f"{_from} → {_to}"
        rows.append(["1", Paragraph(f"{desc}<br/><font size=7 color='#64748B'>{route}</font>", small),
                     _eur(base_net), rate_pct, _eur(base_net * (1 + Decimal(invoice.vat_rate)))])
        if invoice.surcharge_net:
            sn = Decimal(invoice.surcharge_net)
            rows.append(["2", invoice.surcharge_label or "Zuschlag", _eur(sn), rate_pct, _eur(sn * (1 + Decimal(invoice.vat_rate)))])

        items = Table(rows, colWidths=[12 * mm, 88 * mm, 23 * mm, 16 * mm, 23 * mm])
        items.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("BACKGROUND", (0, 0), (-1, 0), _INK),
            ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
            ("LINEBELOW", (0, 1), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(items)
        story.append(Spacer(1, 4 * mm))

        # Totals
        totals = [
            ["Netto", _eur(invoice.net_amount)],
            [f"MwSt {rate_pct}", _eur(invoice.vat_amount)],
            ["Gesamtbetrag", _eur(invoice.gross_amount)],
        ]
        t = Table(totals, colWidths=[40 * mm, 32 * mm], hAlign="RIGHT")
        t.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 9.5),
            ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
            ("LINEABOVE", (0, -1), (-1, -1), 0.6, _INK),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("TEXTCOLOR", (0, -1), (-1, -1), _GOLD),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(t)
        story.append(Spacer(1, 8 * mm))

        # Skonto + payment terms
        if invoice.skonto_pct and invoice.skonto_days:
            story.append(Paragraph(
                f"Skonto: {invoice.skonto_pct}% bei Zahlung innerhalb von {invoice.skonto_days} Tagen.", small))
        if invoice.due_date:
            story.append(Paragraph(
                f"Zahlungsziel: {invoice.payment_due_days} Tage – zahlbar bis {invoice.due_date}.", small))
        story.append(Spacer(1, 10 * mm))
        story.append(Paragraph("Vielen Dank für Ihren Auftrag.", h_right))

        doc.build(story)
        return str(out)
