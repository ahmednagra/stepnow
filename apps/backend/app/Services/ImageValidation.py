# apps/backend/app/Services/ImageValidation.py
# Validate that an uploaded byte stream is actually one of the allowed image
# types. We don't modify the bytes — store-original-only by design (Phase 6a).
#
# Two-layer validation:
#   1. MIME sniff from the actual bytes (don't trust client Content-Type).
#   2. Pillow open + verify + size read to confirm it's a real image and
#      check dimension bounds.
#
# Defence against decompression bombs: Pillow has MAX_IMAGE_PIXELS at
# import time; we tighten it explicitly to settings.UPLOAD_MAX_DIMENSION**2.

from __future__ import annotations

import io
from dataclasses import dataclass

from PIL import Image, UnidentifiedImageError

from app.Core.Exceptions import DomainError
from config.settings import settings


# Map sniffed magic numbers to canonical extensions + MIME types.
# Order matters for matchability — longest, most specific first.
_SIGNATURES: list[tuple[bytes, str, str]] = [
    (b"\xff\xd8\xff", "jpg", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", "png", "image/png"),
    (b"RIFF", "webp", "image/webp"),  # WebP also has WEBP at offset 8; we verify with Pillow
    (b"\x00\x00\x00\x20ftypavif", "avif", "image/avif"),  # offset 0 of AVIF header
    (b"\x00\x00\x00\x18ftypavif", "avif", "image/avif"),
    (b"\x00\x00\x00\x1cftypavif", "avif", "image/avif"),
]


# Tighten Pillow's pixel cap defensively. Note: Pillow checks total pixels,
# so a max dimension of 8000 means up to 64 million pixels.
_MAX_PIXELS = settings.UPLOAD_MAX_DIMENSION * settings.UPLOAD_MAX_DIMENSION
Image.MAX_IMAGE_PIXELS = _MAX_PIXELS


@dataclass(frozen=True)
class ValidatedImage:
    extension: str
    content_type: str
    width: int
    height: int


def sniff_signature(data: bytes) -> tuple[str, str] | None:
    """Return (extension, content_type) by sniffing the leading bytes.
    Returns None if no recognised signature matched."""
    for sig, ext, mime in _SIGNATURES:
        # AVIF signatures start at offset 0 with leading box length bytes;
        # we already encoded that into _SIGNATURES.
        if data.startswith(sig):
            return ext, mime
        # WebP: 'RIFF....WEBP'
        if sig == b"RIFF" and len(data) >= 12 and data[8:12] == b"WEBP":
            return "webp", "image/webp"
    return None


def validate_image(data: bytes) -> ValidatedImage:
    """
    Validate that `data` is a real image of an allowed type and dimension.
    Raises DomainError with a localizable message on failure.
    """
    if not data:
        raise DomainError("Upload is empty.")
    if len(data) > settings.UPLOAD_MAX_SIZE_BYTES:
        mb = settings.UPLOAD_MAX_SIZE_BYTES // (1024 * 1024)
        raise DomainError(f"File too large. Maximum {mb} MB.")

    sniffed = sniff_signature(data)
    if not sniffed:
        raise DomainError("Unsupported file type. Use JPEG, PNG, WebP, or AVIF.")
    extension, content_type = sniffed

    # Pillow open + verify. verify() can only be called once on a fresh open;
    # we re-open afterwards to read dimensions.
    try:
        with Image.open(io.BytesIO(data)) as img_check:
            img_check.verify()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise DomainError("Could not read image. File may be corrupt.") from exc

    try:
        with Image.open(io.BytesIO(data)) as img:
            width, height = img.size
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise DomainError("Could not read image dimensions.") from exc

    min_dim = settings.UPLOAD_MIN_DIMENSION
    max_dim = settings.UPLOAD_MAX_DIMENSION
    if width < min_dim or height < min_dim:
        raise DomainError(f"Image too small. Minimum {min_dim}×{min_dim}px.")
    if width > max_dim or height > max_dim:
        raise DomainError(f"Image too large. Maximum {max_dim}×{max_dim}px.")

    return ValidatedImage(
        extension=extension,
        content_type=content_type,
        width=width,
        height=height,
    )
