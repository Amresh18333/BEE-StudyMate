from fastapi import APIRouter, HTTPException

from app.utils.exceptions import validate_object_id

from app.schemas.study_session import (
    StudySessionCreate,
    StudySessionResponse
)

from app.models.study_session import StudySession

from app.services.study_session_service import (
    create_study_session,
    get_study_sessions_by_user,
    end_study_session
)


router = APIRouter(
    prefix="/study-sessions",
    tags=["Study Sessions"]
)


@router.post(
    "",
    response_model=StudySessionResponse,
    status_code=201
)
def start_study_session(
    session_data: StudySessionCreate
):

    validate_object_id(session_data.userId)
    validate_object_id(session_data.subjectId)
    validate_object_id(session_data.topicId)

    session = StudySession(
        user_id=session_data.userId,
        subject_id=session_data.subjectId,
        topic_id=session_data.topicId
    )

    session_id = create_study_session(session)

    return {
        "id": str(session_id),
        "userId": session_data.userId,
        "subjectId": session_data.subjectId,
        "topicId": session_data.topicId,
        "startedAt": session.started_at,
        "endedAt": session.ended_at,
        "durationMinutes": session.duration_minutes,
    }


@router.patch(
    "/{session_id}",
    response_model=StudySessionResponse
)
def finish_study_session(session_id: str):

    validate_object_id(session_id)

    session = end_study_session(session_id)

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Study session not found"
        )

    return {
        "id": str(session["_id"]),
        "userId": str(session["userId"]),
        "subjectId": str(session["subjectId"]),
        "topicId": str(session["topicId"]),
        "startedAt": session["startedAt"],
        "endedAt": session["endedAt"],
        "durationMinutes": session["durationMinutes"],
    }


@router.get(
    "/user/{user_id}",
    response_model=list[StudySessionResponse]
)
def get_user_study_sessions(user_id: str):

    validate_object_id(user_id)

    sessions = get_study_sessions_by_user(user_id)

    return [
        {
            "id": str(session["_id"]),
            "userId": str(session["userId"]),
            "subjectId": str(session["subjectId"]),
            "topicId": str(session["topicId"]),
            "startedAt": session["startedAt"],
            "endedAt": session["endedAt"],
            "durationMinutes": session["durationMinutes"],
        }
        for session in sessions
    ]