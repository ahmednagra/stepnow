# apps/backend/routes/api/v0/admin/uploads.py
from fastapi import APIRouter, Depends, File, Request, UploadFile
from sqlalchemy.orm import Session

from app.Http.Controllers.admin.UploadsController import UploadsController
from app.Models.admin import AdminUser
from app.Schemas.admin.uploads import UploadResponse
from app.Utils.Helpers import get_current_admin
from config.database import get_db

router = APIRouter(prefix="/admin/uploads", tags=["admin: uploads"])


@router.post("", response_model=UploadResponse, status_code=201)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    actor: AdminUser = Depends(get_current_admin),
) -> UploadResponse:
    return await UploadsController.upload_image(db, file, actor, request)
