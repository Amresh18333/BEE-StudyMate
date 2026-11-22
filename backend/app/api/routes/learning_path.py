from typing import Optional

from fastapi import APIRouter, HTTPException

from app.schemas.learning_path import (
    LearningPathRequest,
    LearningPathResponse
)
from app.services.learning_path_service import (
    format_learning_path,
    generate_learning_path,
    get_saved_learning_path,
    get_saved_learning_path_for_subject,
    save_learning_path
)
from app.database.connection import get_database
from app.utils.exceptions import validate_object_id
from bson import ObjectId


router = APIRouter(
    prefix="/learning-path",
    tags=["Learning Path"]
)


@router.post(
    "/generate",
    response_model=LearningPathResponse
)
def generate_path(payload: LearningPathRequest):

    validate_object_id(payload.subjectId)

    subject = get_database().subjects.find_one({
        "_id": ObjectId(payload.subjectId)
    })

    if subject is None:
        raise HTTPException(
            status_code=404,
            detail="Subject not found"
        )

    # the subject itself knows its owner, so a missing/odd userId
    # from the browser can never break generation
    owner_id = str(subject["userId"])

    try:
        path = generate_learning_path(
            subject,
            payload.goal,
            payload.level,
            payload.numTopics,
            owner_id
        )

    except ValueError as error:
        print(f"[/learning-path/generate] ValueError: {error}")
        raise HTTPException(status_code=502, detail=str(error))

    except Exception as error:
        print(
            f"[/learning-path/generate] "
            f"{type(error).__name__}: {error}"
        )
        raise HTTPException(
            status_code=500,
            detail="Could not generate a learning path right now."
        )

    saved = save_learning_path(
        owner_id,
        payload.subjectId,
        payload.goal,
        payload.level,
        payload.numTopics,
        path
    )

    return format_learning_path(saved)


@router.get(
    "/subject/{subject_id}/user/{user_id}",
    response_model=Optional[LearningPathResponse]
)
def get_path(subject_id: str, user_id: str):

    validate_object_id(subject_id)
    validate_object_id(user_id)

    saved = get_saved_learning_path(user_id, subject_id)

    return format_learning_path(saved) if saved else None


@router.get(
    "/{subject_id}",
    response_model=Optional[LearningPathResponse]
)
def get_path_for_subject(subject_id: str):
    """Saved roadmap for a subject (null when none yet - not a 404)."""

    validate_object_id(subject_id)

    saved = get_saved_learning_path_for_subject(subject_id)

    return format_learning_path(saved) if saved else None