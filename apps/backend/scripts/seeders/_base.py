# apps/backend/scripts/seeders/_base.py
# Shared seeder bootstrap: adds apps/backend to sys.path, loads .env, exposes get_system_actor(), log helpers
# and the managed-seed rule (seed_fingerprint / human_edited_ids / reconcile) used by upserting seeders.

import hashlib
import json
import os
import sys
from decimal import Decimal
from pathlib import Path


def use_utf8_stdout() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass


def bootstrap_path() -> None:
    # _base.py → seeders → scripts → apps/backend. Adds apps/backend to sys.path and loads its .env. Idempotent.
    backend_dir = Path(__file__).resolve().parent.parent.parent
    backend_path = str(backend_dir)
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)
    env_path = backend_dir / ".env"
    if not env_path.exists():
        return
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path, override=False)
    except ImportError:
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key, value = key.strip(), value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


use_utf8_stdout()
bootstrap_path()

SYSTEM_ACTOR_EMAIL = "system@stepnow.local"
SYSTEM_ACTOR_NAME = "Seed Script"


def get_system_actor(db):
    # Returns the inactive system AdminUser used as audit_log actor for seed inserts. Created on first call; non-functional password.
    from app.Models.admin import AdminUser
    from app.Utils.Helpers import hash_password
    actor = db.query(AdminUser).filter(AdminUser.email == SYSTEM_ACTOR_EMAIL).first()
    if actor:
        return actor
    actor = AdminUser(
        email=SYSTEM_ACTOR_EMAIL,
        password_hash=hash_password("seed-only-not-for-login-" + os.urandom(16).hex()),
        full_name=SYSTEM_ACTOR_NAME,
        active=False,
    )
    db.add(actor)
    db.commit()
    db.refresh(actor)
    return actor


# ── Managed seed ─────────────────────────────────────────────────────────────────────────────
# Reference seeders (ui strings, services, FAQs) re-run on every deploy, but admins edit the same
# rows in the panel. Every row the seeder writes carries seed_hash = fingerprint of the values it
# wrote. On the next run a row whose live values still match its seed_hash is unedited, so the
# seeder may bring it up to date; a mismatch means a human changed it — the row is kept as is.
# Rows written before seed_hash existed (NULL) fall back to the audit log: any entry by an actor
# other than the seed actor marks the row as customized.


def seed_fingerprint(values: dict) -> str:
    norm = {k: str(v.normalize()) if isinstance(v, Decimal) else v for k, v in values.items()}
    return hashlib.sha256(json.dumps(norm, sort_keys=True, ensure_ascii=False, default=str).encode()).hexdigest()


def human_edited_ids(db, table_name: str) -> set[str]:
    from app.Models.audit import AuditLog
    rows = db.query(AuditLog.record_id).filter(AuditLog.table_name == table_name, AuditLog.actor_email.is_distinct_from(SYSTEM_ACTOR_EMAIL)).distinct()
    return {record_id for (record_id,) in rows}


def is_unedited(row, fields, human_ids: set[str]) -> bool:
    if row.seed_hash is None:
        return str(row.id) not in human_ids
    return seed_fingerprint({k: getattr(row, k) for k in fields}) == row.seed_hash


def reconcile(row, values: dict, human_ids: set[str], actor) -> str:
    # "same": the row already holds the seed values · "update": unedited since seeding, safe to
    # overwrite (or revive, if the seeder itself deleted it) · "kept": customized or deleted by an admin.
    if row.is_deleted:
        return "update" if row.deleted_by == actor.id else "kept"
    if seed_fingerprint({k: getattr(row, k) for k in values}) == seed_fingerprint(values):
        return "same"
    return "update" if is_unedited(row, values, human_ids) else "kept"


def log_kept(label: str) -> None:
    log_action(label, "kept", "customized in admin — not overwritten")


def _safe_print(line: str) -> None:
    try:
        print(line)
    except UnicodeEncodeError:
        enc = getattr(sys.stdout, "encoding", None) or "ascii"
        print(line.encode(enc, errors="replace").decode(enc, errors="replace"))


def log_action(label: str, action: str, detail: str = "") -> None:
    _safe_print(f"  [{action}] {label}" + (f" — {detail}" if detail else ""))


def log_skip(label: str, detail: str = "") -> None:
    log_action(label, "skip", detail or "already seeded")


def log_create(label: str, detail: str = "") -> None:
    log_action(label, "create", detail)


def log_update(label: str, detail: str = "") -> None:
    log_action(label, "update", detail)


def log_section(name: str) -> None:
    print(f"\n=== {name} ===")
