# apps/backend/app/Utils/pdf.py
# Shared helpers for the reportlab renderers. Paragraph text is XML-ish markup, so every
# user-controlled value must be escaped before it is interpolated — an unescaped `<` or `&` in a
# customer name either crashes the render or injects markup (<img>, <link>, </para>).
import os
import re
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from uuid import uuid4
from xml.sax.saxutils import escape

_UNSAFE_FILENAME = re.compile(r"[^A-Za-z0-9_-]+")


def esc(value: object) -> str:
    return escape("" if value is None else str(value))


def esc_lines(value: object) -> str:
    """Escape, THEN turn the user's line breaks into <br/> — the only markup allowed through."""
    return esc(value).replace("\r\n", "\n").replace("\n", "<br/>")


def safe_filename(value: str | None, fallback: str = "file") -> str:
    return _UNSAFE_FILENAME.sub("_", value or "").strip("_")[:80] or fallback


@contextmanager
def atomic_output(out: Path) -> Iterator[Path]:
    """Yield a sibling temp path to render into, then os.replace it over `out` — a reader never
    sees a half-written PDF, and two concurrent renders never interleave into one file."""
    tmp = out.with_name(f".{out.name}.{uuid4().hex}.tmp")
    try:
        yield tmp
        os.replace(tmp, out)
    finally:
        tmp.unlink(missing_ok=True)
