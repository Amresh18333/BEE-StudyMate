from fastapi import APIRouter, HTTPException, Response

from app.schemas.topic import TopicResponse
from app.schemas.topic_create import TopicBulkCreate, TopicCreate

from app.services.topic_service import (
    create_topic_for_subject,
    create_topics_bulk,
    delete_topic_cascade,
    get_owned_subject,
    get_topic_by_id,
    get_topics_by_subject,
    get_topics_by_user,
    renumber_topics
)

from app.utils.exceptions import validate_object_id


router = APIRouter(
    prefix="/topics",
    tags=["Topics"]
)


def format_topic(topic):
    """One place that turns a Mongo topic document into the API shape."""
    return {
        "id": str(topic["_id"]),
        "userId": str(topic["userId"]),
        "subjectId": str(topic["subjectId"]),
        "name": topic["name"],
        "description": topic.get("description", ""),
        "order": topic.get("order", 0),
        "content": topic.get(
            "content",
            {
                "sections": [],
                "keyPoints": [],
                "examples": []
            }
        ) or {
            "sections": [],
            "keyPoints": [],
            "examples": []
        },
        "difficulty": topic.get("difficulty", "beginner"),
        "estimatedMinutes": topic.get("estimatedMinutes", 30)
    }


# ---------- CREATE ----------

@router.post(
    "",
    response_model=TopicResponse,
    status_code=201
)
def add_topic(payload: TopicCreate):

    validate_object_id(payload.userId)
    validate_object_id(payload.subjectId)

    if get_owned_subject(payload.subjectId, payload.userId) is None:
        raise HTTPException(
            status_code=404,
            detail="Subject not found"
        )

    duplicate = any(
        topic["name"].strip().lower() == payload.name.lower()
        for topic in get_topics_by_subject(payload.subjectId)
    )

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="This subject already has a topic with that name"
        )

    topic = create_topic_for_subject(
        user_id=payload.userId,
        subject_id=payload.subjectId,
        name=payload.name,
        description=payload.description,
        difficulty=payload.difficulty,
        estimated_minutes=payload.estimatedMinutes
    )

    return format_topic(topic)


@router.post(
    "/bulk",
    response_model=list[TopicResponse],
    status_code=201
)
def add_topics_bulk(payload: TopicBulkCreate):

    validate_object_id(payload.userId)
    validate_object_id(payload.subjectId)

    if get_owned_subject(payload.subjectId, payload.userId) is None:
        raise HTTPException(
            status_code=404,
            detail="Subject not found"
        )

    created = create_topics_bulk(
        payload.userId,
        payload.subjectId,
        payload.topics
    )

    return [format_topic(topic) for topic in created]


# ---------- READ ----------

@router.get(
    "/subject/{subject_id}",
    response_model=list[TopicResponse]
)
def get_subject_topics(subject_id: str):

    validate_object_id(subject_id)

    return [
        format_topic(topic)
        for topic in get_topics_by_subject(subject_id)
    ]


@router.get(
    "/user/{user_id}",
    response_model=list[TopicResponse]
)
def get_user_topics(user_id: str):

    validate_object_id(user_id)

    return [
        format_topic(topic)
        for topic in get_topics_by_user(user_id)
    ]


@router.get(
    "/{topic_id}",
    response_model=TopicResponse
)
def get_topic(topic_id: str):

    validate_object_id(topic_id)

    topic = get_topic_by_id(topic_id)

    if topic is None:
        raise HTTPException(
            status_code=404,
            detail="Topic not found"
        )

    return format_topic(topic)


# ---------- DELETE ----------

@router.delete(
    "/{topic_id}",
    status_code=204
)
def remove_topic(topic_id: str):

    validate_object_id(topic_id)

    topic = get_topic_by_id(topic_id)

    if topic is None:
        raise HTTPException(
            status_code=404,
            detail="Topic not found"
        )

    delete_topic_cascade(topic_id)
    renumber_topics(str(topic["subjectId"]))

    return Response(status_code=204)