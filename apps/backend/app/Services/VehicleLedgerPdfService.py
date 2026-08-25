# apps/backend/app/Services/VehicleLedgerPdfService.py
# Per-vehicle account PDF: that vehicle's orders + ORDER prices + totals (drivers are paid on a
# percentage of this). Uses Order amounts only — never the editable invoice amounts.

from pathlib import Path
from decimal import Decimal
from babel.numbers import format_currency
from sqlalchemy.orm import Session
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from app.Models.settings import SiteSettings
from app.Utils.finance import default_currency
from app.Services.InvoicePdfService import logo_flowable

STORAGE_DIR = Path("storage/ledgers")  # gitignored
_INK = colors.HexColor("#0F1115")
_GOLD = colors.HexColor("#A8865A")
_MUTE = colors.HexColor("#64748B")
_LINE = colors.HexColor("#E2E8F0")


def _money(value, currency: str) -> str:
    """Symbol and placement come from CLDR, so any ISO 4217 renders correctly — no symbol map."""
    return format_currency(Decimal(value), currency, locale="de_DE")


def _de_date(d) -> str:
    return d.strftime("%d.%m.%Y") if d else "—"


class VehicleLedgerPdfService:

    @staticmethod
    def render(db: Session, vehicle, rows, totals, date_from=None, date_to=None) -> str:
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        label = vehicle.plate or vehicle.name_de
        out = STORAGE_DIR / f"Fahrzeugkonto_{label.replace(' ', '_')}.pdf"
        s = db.query(SiteSettings).filter(SiteSettings.id == 1).first()

        styles = getSampleStyleSheet()
        small = ParagraphStyle("small", parent=styles["Normal"], fontSize=8, textColor=_MUTE, leading=11)
        body = ParagraphStyle("body", parent=styles["Normal"], fontSize=9, leading=12)
        title = ParagraphStyle("title", parent=styles["Title"], fontSize=18, textColor=_INK, spaceAfter=2)

        doc = SimpleDocTemplate(
            str(out), pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm, topMargin=16 * mm, bottomMargin=16 * mm,
            title=f"Fahrzeugkonto {label}",
        )
        story = []
        logo = logo_flowable(s)
        if logo:
            story.append(logo)
            story.append(Spacer(1, 3 * mm))
        story.append(Paragraph((s.business_name if s else "StepNow Rides & Movers"),
                               ParagraphStyle("biz", parent=body, fontSize=10, textColor=_INK)))
        story.append(Spacer(1, 5 * mm))
        story.append(Paragraph(f"Fahrzeugkonto — {label}", title))
        period = " – ".join(p for p in (_de_date(date_from) if date_from else None, _de_date(date_to) if date_to else None) if p)
        story.append(Paragraph(f"Zeitraum: {period}" if period else "Alle Aufträge", small))
        story.append(Spacer(1, 5 * mm))

        cur = rows[0][0].currency if rows else default_currency(db)
        head = ["Auftrag", "Datum", "Kunde", "Von → Nach", "Netto", "Brutto", "Bezahlt", "Offen"]
        data = [head]
        for o, paid, balance in rows:
            data.append([
                f"A-{o.order_number}",
                _de_date(o.preferred_date or (o.scheduled_datetime.date() if o.scheduled_datetime else None)),
                Paragraph(o.customer_name, small),
                Paragraph(f"{o.pickup_city or o.pickup_address or '—'} → {o.destination_city or o.destination_address or '—'}", small),
                _money(o.net_amount, cur), _money(o.gross_amount, cur), _money(paid, cur), _money(balance, cur),
            ])
        data.append(["", "", "", "Summe", _money(totals["net"], cur), _money(totals["gross"], cur), _money(totals["paid"], cur), _money(totals["balance"], cur)])

        tbl = Table(data, colWidths=[22 * mm, 18 * mm, 34 * mm, 46 * mm, 18 * mm, 18 * mm, 18 * mm, 18 * mm], repeatRows=1)
        tbl.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 7.5),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("BACKGROUND", (0, 0), (-1, 0), _INK),
            ("ALIGN", (4, 0), (-1, -1), "RIGHT"),
            ("LINEBELOW", (0, 1), (-1, -2), 0.3, _LINE),
            ("LINEABOVE", (0, -1), (-1, -1), 0.6, _INK),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("TEXTCOLOR", (4, -1), (-1, -1), _GOLD),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(tbl)
        story.append(Spacer(1, 4 * mm))
        story.append(Paragraph(f"{totals['count']} Auftrag/Aufträge · Beträge sind Auftragspreise (nicht die Rechnungsbeträge).", small))

        doc.build(story)
        return str(out)
