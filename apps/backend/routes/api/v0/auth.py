# apps/backend/routes/api/v0/auth.py
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login() -> None:
    raise HTTPException(status_code=501, detail="Auth not yet implemented (Phase B)")


@router.post("/refresh")
async def refresh() -> None:
    raise HTTPException(status_code=501, detail="Auth not yet implemented (Phase B)")


@router.post("/logout")
async def logout() -> None:
    raise HTTPException(status_code=501, detail="Auth not yet implemented (Phase B)")
