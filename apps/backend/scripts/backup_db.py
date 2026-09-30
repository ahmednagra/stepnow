# apps/backend/scripts/backup_db.py
# Nightly database backup: pg_dump -> local file -> optional S3 upload -> prune by retention.
# Run manually with `python -m scripts.backup_db`, or from cron (see deploy/ for the unit).
# Exit code is non-zero on failure so cron/systemd surfaces it.

import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from config.settings import settings
from app.Utils.Logger import get_logger

logger = get_logger("backup")


def libpq_url(url: str) -> str:
    return re.sub(r"^postgresql\+\w+://", "postgresql://", url)


def backup_dir() -> Path:
    return Path(settings.BACKUP_DIR).resolve()


def dump(target: Path) -> Path:
    target.parent.mkdir(parents=True, exist_ok=True)
    cmd = [settings.PG_DUMP_PATH, "--format=custom", "--no-owner", "--no-privileges", "--file", str(target), libpq_url(settings.DATABASE_URL)]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
    except FileNotFoundError:
        raise RuntimeError(f"pg_dump not found at {settings.PG_DUMP_PATH!r} — install postgresql-client or set PG_DUMP_PATH")
    if result.returncode != 0:
        raise RuntimeError(f"pg_dump failed ({result.returncode}): {result.stderr.strip()[:500]}")
    if not target.exists() or target.stat().st_size == 0:
        raise RuntimeError("pg_dump produced an empty file")
    return target


def upload(path: Path) -> str | None:
    if not (settings.BACKUP_S3_BUCKET and settings.BACKUP_S3_ACCESS_KEY and settings.BACKUP_S3_SECRET_KEY):
        logger.warning("BACKUP_S3_* not configured — keeping the local dump only")
        return None
    import boto3

    client = boto3.client(
        "s3",
        endpoint_url=settings.BACKUP_S3_ENDPOINT or None,
        aws_access_key_id=settings.BACKUP_S3_ACCESS_KEY,
        aws_secret_access_key=settings.BACKUP_S3_SECRET_KEY,
    )
    key = f"stepnow/{path.name}"
    client.upload_file(str(path), settings.BACKUP_S3_BUCKET, key)
    return key


def prune_local(days: int) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    removed = 0
    for f in backup_dir().glob("stepnow_*.dump"):
        if datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc) < cutoff:
            f.unlink()
            removed += 1
    return removed


def run() -> int:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    target = backup_dir() / f"stepnow_{stamp}.dump"
    try:
        dump(target)
        size_mb = target.stat().st_size / 1_048_576
        key = upload(target)
        removed = prune_local(settings.BACKUP_RETENTION_DAYS)
        logger.info(f"[Backup] {target.name} ({size_mb:.1f} MB){f' -> s3://{settings.BACKUP_S3_BUCKET}/{key}' if key else ''}; pruned {removed} old dump(s)")
        return 0
    except Exception as e:
        logger.exception(f"[Backup] FAILED: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(run())
