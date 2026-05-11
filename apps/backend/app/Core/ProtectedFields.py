# apps/backend/app/Core/ProtectedFields.py
# Architecture §15.3: fields listed here cannot be cleared via admin.
# Services must raise RequiredFieldError when a clear is attempted.

LEGALLY_REQUIRED_FIELDS: dict[str, dict[str, str]] = {
    "site_settings": {
        "business_name": "Geschäftsname ist gesetzliche Pflicht (§ 5 TMG).",
        "owner_name": "Inhaber-Name ist gesetzliche Pflicht (§ 5 TMG).",
        "address_street": "Adresse ist gesetzliche Pflicht (§ 5 TMG).",
        "address_postcode": "PLZ ist gesetzliche Pflicht (§ 5 TMG).",
        "address_city": "Ort ist gesetzliche Pflicht (§ 5 TMG).",
        "phone": "Telefon ist gesetzliche Pflicht (§ 5 TMG).",
        "email": "E-Mail ist gesetzliche Pflicht (§ 5 TMG).",
    },
}

LEGAL_PAGE_ALLOWED_PLACEHOLDERS: set[str] = {
    "site_settings.business_name",
    "site_settings.owner_name",
    "site_settings.legal_form",
    "site_settings.address_street",
    "site_settings.address_postcode",
    "site_settings.address_city",
    "site_settings.address_country",
    "site_settings.phone",
    "site_settings.phone_mobile",
    "site_settings.email",
    "site_settings.tax_number",
    "site_settings.vat_id",
    "site_settings.concession_number",
    "site_settings.concession_authority",
    "site_settings.concession_date",
}
