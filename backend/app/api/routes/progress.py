from fastapi import APIRouter, HTTPException

from app.schemas.progress import (
    ProgressCreate,
    ProgressUpdate,
    ProgressResponse
)

from app.models.progress import Progress

from app.services.progress_service import (
    create_progress,
    get_progress_by_topic,
    get_progress_by_user,
    update_progress
)

from app.utils.exceptions import validate_object_id


router = APIRouter(
    prefix="/progress",
    tags=["Progress"]
)


@router.post(
    "",
    response_model=ProgressResponse,
    status_code=201
)
def create_topic_progress(
    progress_data: ProgressCreate
):

    validate_object_id(progress_data.userId)
    validate_object_id(progress_data.subjectId)
    validate_object_id(progress_data.topicId)

    existing_progress = get_progress_by_topic(
        progress_data.userId,
        progress_data.topicId
    )

    if existing_progress is not None:
        raise HTTPException(
            status_code=409,
            detail="Progress already exists for this topic"
        )

    progress = Progress(
        user_id=progress_data.userId,
        subject_id=progress_data.subjectId,
        topic_id=progress_data.topicId,
        status=progress_data.status,
        completion_percentage=progress_data.completionPercentage
    )

    progress_id = create_progress(progress)

    return {
        "id": str(progress_id),
        "userId": progress_data.userId,
        "subjectId": progress_data.subjectId,
        "topicId": progress_data.topicId,
        "status": progress.status,
        "completionPercentage": progress.completion_percentage,
        "lastStudiedAt": progress.last_studied_at,
    }


@router.patch(
    "/user/{user_id}/topic/{topic_id}",
    response_model=ProgressResponse
)
def update_topic_progress(
    user_id: str,
    topic_id: str,
    progress_data: ProgressUpdate
):

    validate_object_id(user_id)
    validate_object_id(topic_id)

    progress = get_progress_by_topic(
        user_id,
        topic_id
    )

    if progress is None:
        raise HTTPException(
            status_code=404,
            detail="Progress not found"
        )

    update_progress(
        user_id=user_id,
        topic_id=topic_id,
        status=progress_data.status,
        completion_percentage=progress_data.completionPercentage
    )

    updated_progress = get_progress_by_topic(
        user_id,
        topic_id
    )

    return {
        "id": str(updated_progress["_id"]),
        "userId": str(updated_progress["userId"]),
        "subjectId": str(updated_progress["subjectId"]),
        "topicId": str(updated_progress["topicId"]),
        "status": updated_progress["status"],
        "completionPercentage": updated_progress["completionPercentage"],
        "lastStudiedAt": updated_progress["lastStudiedAt"],
    }


@router.get(
    "/user/{user_id}"
)
def get_user_progress(user_id: str):

    validate_object_id(user_id)

    progress_records = get_progress_by_user(user_id)

    return [
        {
            "id": str(progress["_id"]),
            "userId": str(progress["userId"]),
            "subjectId": str(progress["subjectId"]),
            "topicId": str(progress["topicId"]),
            "status": progress["status"],
            "completionPercentage": progress["completionPercentage"],
            "lastStudiedAt": progress["lastStudiedAt"],
        }
        for progress in progress_records
    ]


@router.get(
    "/user/{user_id}/topic/{topic_id}",
    response_model=ProgressResponse
)
def get_topic_progress(
    user_id: str,
    topic_id: str
):

    validate_object_id(user_id)
    validate_object_id(topic_id)

    progress = get_progress_by_topic(
        user_id,
        topic_id
    )

    if progress is None:
        raise HTTPException(
            status_code=404,
            detail="Progress not found"
        )

    return {
        "id": str(progress["_id"]),
        "userId": str(progress["userId"]),
        "subjectId": str(progress["subjectId"]),
        "topicId": str(progress["topicId"]),
        "status": progress["status"],
        "completionPercentage": progress["completionPercentage"],
        "lastStudiedAt": progress["lastStudiedAt"],
    }