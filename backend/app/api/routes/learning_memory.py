from fastapi import APIRouter, HTTPException

from app.services.learning_memory_service import get_learning_profile
from app.utils.exceptions import validate_object_id

router = APIRouter(prefix="/learning-memory", tags=["Learning Memory"])


@router.get("/user/{user_id}")
def learning_profile(user_id: str):
    validate_object_id(user_id)
    try:
        return get_learning_profile(user_id)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to load learning profile")
