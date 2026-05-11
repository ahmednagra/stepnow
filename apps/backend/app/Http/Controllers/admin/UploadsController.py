# apps/backend/app/Http/Controllers/admin/UploadsController.py
from fastapi import Request, UploadFile
from sqlalchemy.orm import Session

from app.Core.Exceptions import DomainError
from app.Models.admin import AdminUser
from app.Schemas.admin.uploads import UploadResponse
from app.Services.AuditService import AuditService
from app.Services.ImageValidation import validate_image
from app.Services.Storage import get_storage
from config.settings import settings


class UploadsController:

    @staticmethod
    async def upload_image(
        db: Session,
        file: UploadFile,
        actor: AdminUser,
        request: Request,
    ) -> UploadResponse:
        # Read the bytes once. UploadFile streams from disk in FastAPI's
        # SpooledTemporaryFile so this is fine for our 10MB cap.
        data = await file.read()

        # Hard cap before doing anything expensive
        if len(data) > settings.UPLOAD_MAX_SIZE_BYTES:
            mb = settings.UPLOAD_MAX_SIZE_BYTES // (1024 * 1024)
            raise DomainError(f"File too large. Maximum {mb} MB.")

        # Validate the bytes are a real image of an allowed type
        validated = validate_image(data)

        # Persist to storage
        storage = get_storage()
        stored = storage.save(
            data=data,
            original_filename=file.filename or "upload",
            content_type=validated.content_type,
            extension=validated.extension,
        )

        # Audit log entry. Uploads aren't tied to a specific table/record yet,
        # so we use 'uploads' as a synthetic table name and the storage_key
        # as the record id.
        AuditService.log(
            db,
            actor=actor,
            table_name="uploads",
            record_id=stored.storage_key,
            action="create",
            before=None,
            after={
                "url": stored.url,
                "size_bytes": stored.size_bytes,
                "content_type": stored.content_type,
                "dimensions": f"{validated.width}x{validated.height}",
                "original_filename": stored.original_filename,
            },
            request=request,
        )
        db.commit()

        return UploadResponse(
            url=stored.url,
            size_bytes=stored.size_bytes,
            content_type=stored.content_type,
            width=validated.width,
            height=validated.height,
            original_filename=stored.original_filename,
        )
