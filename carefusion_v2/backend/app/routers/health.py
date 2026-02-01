from fastapi import APIRouter
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "debug": settings.DEBUG
    }
