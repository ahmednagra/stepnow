# apps/backend/config/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from config.settings import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, class_=Session, future=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
