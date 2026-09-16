from fastapi import APIRouter, HTTPException

from app.schemas.auth import SignupRequest, LoginRequest, AuthUserResponse
from app.services.user_service import (
    create_user,
    get_user_by_email,
    email_exists,
)
from app.models.user import User
from app.utils.security import hash_password, verify_password

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


def _format_user_response(user):
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "education": user.get("education", ""),
        "college": user.get("college", ""),
        "course": user.get("course", ""),
        "semester": user.get("semester"),
        "goals": user.get("goals", []),
    }


@router.post("/signup", response_model=AuthUserResponse, status_code=201)
def signup(request: SignupRequest):
    if email_exists(request.email):
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists"
        )

    user = User(
        name=request.name.strip(),
        email=request.email,
        password=hash_password(request.password),
    )

    user_id = create_user(user)
    created = get_user_by_email(request.email)

    if created is None:
        raise HTTPException(
            status_code=500,
            detail="Failed to create account"
        )

    return _format_user_response(created)


@router.post("/login", response_model=AuthUserResponse)
def login(request: LoginRequest):
    user = get_user_by_email(request.email)

    if user is None or not verify_password(
        request.password, user.get("password", "")
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    return _format_user_response(user)
