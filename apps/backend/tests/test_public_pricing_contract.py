# apps/backend/tests/test_public_pricing_contract.py
# The public pricing payload is built by PricingService._public_categories and validated by the
# public schemas. A field added on one side only (e.g. prices_net) must fail here, not as a 500 on
# /public/pricing. Pure: fake rows, no database.

from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

from app.Schemas.public import PricingCategoryPublicResponse, PricingItemPublicResponse
from app.Services.PricingService import PricingService

NOW = datetime.now(timezone.utc)


def _item(price, **kw):
    return SimpleNamespace(
        id=uuid4(), is_deleted=False, sort_order=kw.get("sort", 10), created_at=NOW,
        from_location_de="Köngen", from_location_en="Köngen", to_location_de="Flughafen Stuttgart",
        to_location_en="Stuttgart Airport", price_eur=price, price_unit=kw.get("unit"),
        is_from_price=kw.get("from_price", False), currency="EUR", distance_km=None,
        note_de=None, note_en=None,
    )


def _category(items, net=False):
    return SimpleNamespace(
        id=uuid4(), name_de="Festpreise", name_en="Fixed prices", description_de=None,
        description_en=None, prices_net=net, items=items,
    )


def test_payload_and_schema_have_the_same_fields():
    [cat] = PricingService._public_categories([_category([_item(Decimal("39.00"))])], is_de=True)
    assert set(cat) == set(PricingCategoryPublicResponse.model_fields)
    assert set(cat["items"][0]) == set(PricingItemPublicResponse.model_fields)


def test_on_request_unit_and_net_prices_validate():
    cats = PricingService._public_categories([
        _category([_item(None), _item(Decimal("2.30"), unit="km", sort=20), _item(Decimal("40.00"), from_price=True, sort=30)], net=True),
    ], is_de=False)
    model = PricingCategoryPublicResponse.model_validate(cats[0])
    assert model.prices_net is True
    assert [i.price_eur for i in model.items] == [None, "2.30", "40.00"]
    assert model.items[1].price_unit == "km" and model.items[2].is_from_price
    assert model.items[0].to_location == "Stuttgart Airport"
