# apps/backend/app/Schemas/admin/uploads.py
from pydantic import BaseModel, ConfigDict


class UploadResponse(BaseModel):
    """Response from POST /admin/uploads."""
    model_config = ConfigDict(from_attributes=True)
    url: str
    size_bytes: int
    content_type: str
    width: int
    height: int
    original_filename: str
