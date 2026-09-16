from fastapi import APIRouter, HTTPException, Body

from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import get_user_by_id, update_user
from app.utils.exceptions import validate_object_id

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str):
    validate_object_id(user_id)

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


@router.put("/{user_id}", response_model=UserResponse)
def update_user_profile(user_id: str, user_update: UserUpdate):
    validate_object_id(user_id)

    update_data = user_update.model_dump(exclude_unset=True)

    updated_user = update_user(user_id, update_data)

    if updated_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "id": str(updated_user["_id"]),
        "name": updated_user["name"],
        "email": updated_user["email"],
        "education": updated_user["education"],
        "college": updated_user["college"],
        "course": updated_user["course"],
        "semester": updated_user["semester"],
        "goals": updated_user["goals"],
    }