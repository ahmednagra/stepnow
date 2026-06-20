# apps/backend/app/Services/InvoicePdfService.py
# Renders an invoice (+ its order) to a PDF using reportlab (pure-Python; no system libs,
# Railway-safe). Writes to a NON-public storage dir — invoices hold customer personal data,
# so they are never placed under the public /uploads mount; they stream via the authenticated
# admin endpoint. Issuer/bank/legal details come from SiteSettings, not hardcoded. Layout
# follows the client RECHNUNG template: issuer + Steuer-Nr top-right, Kunden-/Referenz-Nr meta,
# salutation + route intro, Einzelpreis/Gesamtpreis line table, Skonto with computed €,
# Zahlungsbedingungen (IBAN/BIC/Verwendungszweck/Fälligkeitsdatum), closing + Handelsregister footer.
#
# Requires: reportlab  (reportlab==4.2.5 in requirements.txt)

from datetime import date
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
from app.Utils.finance import money

STORAGE_DIR = Path("storage/invoices")  # gitignored (apps/backend/storage/)
_INK = colors.HexColor("#0F1115")
_GOLD = colors.HexColor("#A8865A")
_MUTE = colors.HexColor("#64748B")


def _eur(value) -> str:
    return f"{Decimal(value):,.2f} €"


def _de_date(d) -> str:
    return d.strftime("%d.%m.%Y") if isinstance(d, date) else (str(d) if d else "—")


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
        h_right = ParagraphStyle("hr", parent=styles["Normal"], fontSize=9, alignment=2, textColor=_INK, leading=12)
        h_right_s = ParagraphStyle("hrs", parent=small, alignment=2)
        title = ParagraphStyle("title", parent=styles["Title"], fontSize=20, textColor=_INK, spaceAfter=2)

        # ── Issuer block (from SiteSettings, with sensible fallbacks) ──
        biz = (s.business_name if s else "StepNow Rides & Movers")
        owner = (s.owner_name if s and s.owner_name else "")
        issuer_line = f"{biz}" + (f" – {owner}" if owner else "")
        contact_bits = []
        if s and s.phone: contact_bits.append(s.phone)
        if s and s.email: contact_bits.append(f"Email: {s.email}")
        contact_line = "  ·  ".join(contact_bits) if contact_bits else ""
        tax_no = invoice.tax_number or (s.tax_number if s else None)
        loc = " ".join(p for p in (s.address_postcode, s.address_city) if p) if s else ""
        addr_parts = [p for p in (s.address_street if s else None, loc) if p]
        sender_line = " · ".join([biz, *addr_parts])

        doc = SimpleDocTemplate(
            str(out), pagesize=A4,
            leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm, bottomMargin=18 * mm,
            title=f"Rechnung {invoice.invoice_number}",
        )
        story = []

        # Header — issuer right-aligned with Steuer-Nr (template puts it top-right)
        story.append(Paragraph(issuer_line, h_right))
        if contact_line:
            story.append(Paragraph(contact_line, h_right_s))
        if tax_no:
            story.append(Paragraph(f"Steuer-Nr.: {tax_no}", h_right_s))
        story.append(Spacer(1, 8 * mm))

        # Recipient + invoice meta side by side. Sender one-liner over the address window.
        recipient = (invoice.recipient_block or order.customer_name or "").replace("\n", "<br/>")
        cust_no = order.customer.customer_number if order.customer and order.customer.customer_number else None
        meta = [["Kunden-Nr.:", cust_no]] if cust_no else []
        meta += [
            ["Rechnungs-Nr.:", invoice.invoice_number],
            ["Datum:", _de_date(invoice.issue_date)],
        ]
        if order.client_reference:
            meta.append(["Referenz-Nr.:", order.client_reference])
        meta_tbl = Table([[Paragraph(f"<b>{k}</b>", small), Paragraph(v, small)] for k, v in meta], colWidths=[28 * mm, 44 * mm])
        meta_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
        recipient_cell = Paragraph(
            f"<font size=6.5 color='#94A3B8'>{sender_line}</font><br/><br/>" + recipient, body)
        head = Table([[recipient_cell, meta_tbl]], colWidths=[95 * mm, 75 * mm])
        head.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
        story.append(head)
        story.append(Spacer(1, 8 * mm))
        story.append(Paragraph("Rechnung", title))
        story.append(Spacer(1, 3 * mm))

        # Salutation + intro referencing the service date + route.
        _pickups = [st for st in (order.stops or []) if not st.is_deleted and st.stop_type == "pickup"]
        _drop = next((st for st in (order.stops or []) if not st.is_deleted and st.stop_type == "drop"), None)
        _from_city = (_pickups[0].city if _pickups and _pickups[0].city else order.pickup_city) or (
            _pickups[0].address if _pickups else order.pickup_address) or "—"
        _to_city = (_drop.city if _drop and _drop.city else order.destination_city) or (
            _drop.address if _drop else order.destination_address) or "—"
        service_date = order.preferred_date or (order.scheduled_datetime.date() if order.scheduled_datetime else invoice.issue_date)
        story.append(Paragraph("Sehr geehrte Damen und Herren,", body))
        story.append(Paragraph(
            f"vielen Dank für Ihren Auftrag. Für die nachfolgend aufgeführte Transportleistung "
            f"vom {_de_date(service_date)} ({_from_city} nach {_to_city}) erlauben wir uns, "
            f"folgende Rechnung zu stellen:", body))
        story.append(Spacer(1, 4 * mm))

        # Line items — Pos. / Beschreibung / Einzelpreis / MwSt / Gesamtpreis
        rate_pct = f"{(Decimal(invoice.vat_rate) * 100):.0f}%"
        base_net = Decimal(invoice.net_amount) - (Decimal(invoice.surcharge_net) if invoice.surcharge_net else Decimal("0"))
        rows = [["Pos.", "Beschreibung", "Einzelpreis", "MwSt", "Gesamtpreis"]]
        desc = order.service_description or "Transportleistung"
        route = f"{_from_city} → {_to_city}"
        rows.append(["1", Paragraph(f"{desc}<br/><font size=7 color='#64748B'>{route}</font>", small),
                     _eur(base_net), rate_pct, _eur(base_net * (1 + Decimal(invoice.vat_rate)))])
        if invoice.surcharge_net:
            sn = Decimal(invoice.surcharge_net)
            rows.append(["2", invoice.surcharge_label or "Zuschlag", _eur(sn), rate_pct, _eur(sn * (1 + Decimal(invoice.vat_rate)))])

        items = Table(rows, colWidths=[12 * mm, 80 * mm, 26 * mm, 16 * mm, 28 * mm])
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

        # Totals — Summe Netto / zzgl. USt. X% / Gesamtbetrag
        totals = [
            ["Summe Netto", _eur(invoice.net_amount)],
            [f"zzgl. USt. {rate_pct}", _eur(invoice.vat_amount)],
            ["Gesamtbetrag", _eur(invoice.gross_amount)],
        ]
        t = Table(totals, colWidths=[44 * mm, 32 * mm], hAlign="RIGHT")
        t.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 9.5),
            ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
            ("LINEABOVE", (0, -1), (-1, -1), 0.6, _INK),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("TEXTCOLOR", (0, -1), (-1, -1), _GOLD),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(t)
        story.append(Spacer(1, 6 * mm))

        # Skonto with computed € amount
        if invoice.skonto_pct and invoice.skonto_days:
            disc = money(Decimal(invoice.gross_amount) * Decimal(invoice.skonto_pct) / Decimal("100"))
            story.append(Paragraph(
                f"Skonto: Bei Zahlung binnen {invoice.skonto_days} Tagen {invoice.skonto_pct}% "
                f"= {_eur(disc)} Abzug möglich.", small))
            story.append(Spacer(1, 3 * mm))

        # Zahlungsbedingungen — bank block + Verwendungszweck + Fälligkeitsdatum
        story.append(Paragraph("<b>Zahlungsbedingungen</b>", body))
        story.append(Paragraph(
            f"Bitte überweisen Sie den Rechnungsbetrag von {_eur(invoice.gross_amount)} innerhalb von "
            f"{invoice.payment_due_days} Tagen ohne Abzug auf das folgende Konto:", small))
        if s and (s.iban or s.bic):
            bank = "  ·  ".join(p for p in (
                f"IBAN: {s.iban}" if s.iban else None,
                f"BIC: {s.bic}" if s.bic else None,
                s.bank_account_holder or None,
            ) if p)
            story.append(Paragraph(bank, small))
        story.append(Paragraph(
            f"Bitte geben Sie als Verwendungszweck die Rechnungsnummer {invoice.invoice_number} an.", small))
        if invoice.due_date:
            story.append(Paragraph(f"Fälligkeitsdatum: {_de_date(invoice.due_date)}", small))
        story.append(Spacer(1, 8 * mm))

        # Closing
        story.append(Paragraph("Mit freundlichen Grüßen", body))
        if owner:
            story.append(Paragraph(owner, body))

        # Legal footer
        reg = " ".join(p for p in (s.commercial_register, s.register_court) if p) if s else ""
        footer_bits = [p for p in (sender_line, reg, s.website if s else None) if p]
        if footer_bits:
            story.append(Spacer(1, 6 * mm))
            story.append(Paragraph("  ·  ".join(footer_bits),
                                   ParagraphStyle("foot", parent=small, fontSize=7.5, alignment=1)))

        doc.build(story)
        return str(out)
