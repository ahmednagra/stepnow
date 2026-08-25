# apps/backend/app/Models/base.py
from sqlalchemy import Index, text
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def live_unique(name: str, *cols: str, where: str = "is_deleted = false") -> Index:
    """Uniqueness that ignores soft-deleted rows. A plain UNIQUE would keep a deleted row's
    value reserved forever, so the service-layer guard (which filters is_deleted) says 'free'
    while the database still says 'taken'."""
    return Index(name, *cols, unique=True, postgresql_where=text(where))
