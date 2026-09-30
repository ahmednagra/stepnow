# apps/backend/tests/conftest.py
# Tests never touch the working tables. The DB-backed suite builds the schema into a dedicated
# PostgreSQL *schema* and pins search_path to it ALONE — including `public` in the path makes
# create_all find the real tables and silently run the suite against live data. Set
# TEST_DATABASE_URL to point the suite at a separate database instead.

import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-long-enough-for-production-check")
os.environ.setdefault("ENVIRONMENT", "test")

TEST_SCHEMA = "stepnow_test"


@pytest.fixture(scope="session")
def monkeypatch_session():
    from _pytest.monkeypatch import MonkeyPatch

    mp = MonkeyPatch()
    yield mp
    mp.undo()


@pytest.fixture(scope="session")
def db_engine(monkeypatch_session):
    from sqlalchemy import create_engine, text
    from config.settings import settings

    override = os.getenv("TEST_DATABASE_URL")
    url = override or settings.DATABASE_URL
    connect_args = {} if override else {"options": f"-csearch_path={TEST_SCHEMA}"}
    try:
        engine = create_engine(url, future=True, connect_args=connect_args)
        if not override:
            bootstrap = create_engine(url, isolation_level="AUTOCOMMIT")
            with bootstrap.connect() as conn:
                conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {TEST_SCHEMA}"))
            bootstrap.dispose()
        with engine.connect() as conn:
            conn.execute(text("select 1"))
    except Exception as exc:
        pytest.skip(f"no test database reachable: {exc}")

    import config.database as database
    import main

    monkeypatch_session.setattr(database, "engine", engine)
    monkeypatch_session.setattr(database, "SessionLocal", database.sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, future=True))
    monkeypatch_session.setattr(main, "engine", engine)
    main.sync_schema()
    return engine


@pytest.fixture
def db(db_engine):
    import config.database as database

    session = database.SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()
