# apps/backend/app/Services/Storage.py
# Storage abstraction. Today: local filesystem. Tomorrow: swap in S3-compatible
# without touching callers by implementing the StorageBackend Protocol.
#
# Files are stored under UPLOAD_DIR with random UUID-based names. The original
# filename is preserved as metadata (in the response payload) for logging /
# admin display purposes only — clients never use it for retrieval.

from __future__ import annotations

import os
import secrets
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Protocol
from uuid import uuid4

from config.settings import settings


# ---------------------------------------------------------------------------
# Public types
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class StoredFile:
    """The result of a successful upload."""
    url: str               # Public URL (e.g. "/uploads/2026/05/abc-def.jpg")
    storage_key: str       # Backend-internal key (e.g. "2026/05/abc-def.jpg")
    size_bytes: int
    content_type: str
    original_filename: str


# ---------------------------------------------------------------------------
# Backend protocol
# ---------------------------------------------------------------------------

class StorageBackend(Protocol):
    def save(self, data: bytes, original_filename: str, content_type: str, extension: str) -> StoredFile:
        ...

    def delete(self, storage_key: str) -> None:
        ...


# ---------------------------------------------------------------------------
# Local filesystem implementation
# ---------------------------------------------------------------------------

class LocalFilesystemStorage:
    """
    Writes files under `root_dir`. Files are organised by upload date
    (YYYY/MM/) to keep directories small.
    Public URLs are of the form `{public_url_prefix}/YYYY/MM/{uuid}.{ext}`.
    In dev FastAPI serves /uploads directly; in prod nginx aliases the path
    to the same directory with cache headers.
    """
    def __init__(self, root_dir: str, public_url_prefix: str):
        self.root_dir = Path(root_dir).resolve()
        self.public_url_prefix = public_url_prefix.rstrip("/")
        self.root_dir.mkdir(parents=True, exist_ok=True)

    def save(self, data: bytes, original_filename: str, content_type: str, extension: str) -> StoredFile:
        now = datetime.now(timezone.utc)
        subdir = f"{now:%Y/%m}"
        random_name = f"{uuid4().hex}{secrets.token_hex(4)}.{extension}"
        rel_path = f"{subdir}/{random_name}"
        abs_path = self.root_dir / rel_path

        abs_path.parent.mkdir(parents=True, exist_ok=True)
        # Atomic-ish: write to a temp file then rename. Same dir = same FS so rename is atomic.
        tmp_path = abs_path.with_suffix(abs_path.suffix + ".tmp")
        with open(tmp_path, "wb") as fh:
            fh.write(data)
        os.replace(tmp_path, abs_path)

        return StoredFile(
            url=f"{self.public_url_prefix}/{rel_path}",
            storage_key=rel_path,
            size_bytes=len(data),
            content_type=content_type,
            original_filename=original_filename,
        )

    def delete(self, storage_key: str) -> None:
        # Refuse anything that tries to escape root_dir
        abs_path = (self.root_dir / storage_key).resolve()
        if self.root_dir not in abs_path.parents and abs_path != self.root_dir:
            # storage_key tried to traverse upward; ignore.
            return
        if abs_path.exists() and abs_path.is_file():
            abs_path.unlink()


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_storage: StorageBackend | None = None


def get_storage() -> StorageBackend:
    """
    Return the configured storage backend. Currently always LocalFilesystemStorage,
    but the Protocol leaves room for future S3-compatible implementations
    selected by an env var (e.g. UPLOAD_STORAGE=local|s3).
    """
    global _storage
    if _storage is None:
        _storage = LocalFilesystemStorage(
            root_dir=settings.UPLOAD_DIR,
            public_url_prefix=settings.UPLOAD_PUBLIC_URL_PREFIX,
        )
    return _storage
