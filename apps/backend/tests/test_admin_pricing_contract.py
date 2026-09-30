# apps/backend/tests/test_admin_pricing_contract.py
# PricingController._serialize_category builds the admin category response field by field. A column
# added to the model + schema but not to the serializer (e.g. prices_net) must fail here, not as a
# 500 on /admin/services/{id}/pricing-categories. Pure: fake rows, no database.

from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from app.Http.Controllers.admin.PricingController import PricingController

NOW = datetime.now(timezone.utc)


def _category(net: bool):
    return SimpleNamespace(
        id=uuid4(), service_id=uuid4(), sort_order=0, name_de="Festpreise", name_en="Fixed prices",
        description_de=None, description_en=None, prices_net=net, is_deleted=False,
        created_at=NOW, updated_at=NOW, items=[],
    )


def test_serialize_category_carries_prices_net():
    assert PricingController._serialize_category(_category(net=True)).prices_net is True
    assert PricingController._serialize_category(_category(net=False)).prices_net is False
