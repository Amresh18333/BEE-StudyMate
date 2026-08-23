from fastapi import APIRouter, HTTPException

from app.schemas.subject import (
    SubjectCreate,
    SubjectResponse
)

from app.models.subject import Subject

from app.services.subject_service import (
    create_subject,
    get_subjects_by_user,
    get_subject_by_id
)

from app.utils.exceptions import validate_object_id


router = APIRouter(
    prefix="/subjects",
    tags=["Subjects"]
)


@router.post(
    "",
    response_model=SubjectResponse,
    status_code=201
)
def create_user_subject(subject_data: SubjectCreate):

    validate_object_id(subject_data.userId)

    subject = Subject(
        user_id=subject_data.userId,
        name=subject_data.name,
        description=subject_data.description
    )

    subject_id = create_subject(subject)

    return {
        "id": str(subject_id),
        "userId": subject_data.userId,
        "name": subject_data.name,
        "description": subject_data.description,
    }


@router.get(
    "/user/{user_id}",
    response_model=list[SubjectResponse]
)
def get_user_subjects(user_id: str):

    validate_object_id(user_id)

    subjects = get_subjects_by_user(user_id)

    return [
        {
            "id": str(subject["_id"]),
            "userId": str(subject["userId"]),
            "name": subject["name"],
            "description": subject["description"],
        }
        for subject in subjects
    ]


@router.get(
    "/{subject_id}",
    response_model=SubjectResponse
)
def get_subject(subject_id: str):

    validate_object_id(subject_id)

    subject = get_subject_by_id(subject_id)

    if subject is None:
        raise HTTPException(
            status_code=404,
            detail="Subject not found"
        )

    return {
        "id": str(subject["_id"]),
        "userId": str(subject["userId"]),
        "name": subject["name"],
        "description": subject["description"],
    }