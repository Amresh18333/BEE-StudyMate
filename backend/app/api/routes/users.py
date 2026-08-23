from fastapi import APIRouter, HTTPException

from app.schemas.user import UserResponse
from app.services.user_service import get_user_by_id
from app.utils.exceptions import validate_object_id

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str):
    validate_object_id(user_id)

    user = get_user_by_id(user_id)
    user = get_user_by_id(user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "education": user["education"],
        "college": user["college"],
        "course": user["course"],
        "semester": user["semester"],
        "goals": user["goals"],
    }