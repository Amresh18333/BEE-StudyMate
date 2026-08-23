from fastapi import APIRouter, HTTPException

from app.schemas.topic import TopicResponse

from app.services.topic_service import (
    get_topics_by_subject,
    get_topic_by_id
)

from app.utils.exceptions import validate_object_id


router = APIRouter(
    prefix="/topics",
    tags=["Topics"]
)


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

    return {
        "id": str(topic["_id"]),
        "userId": str(topic["userId"]),
        "subjectId": str(topic["subjectId"]),
        "name": topic["name"],
        "description": topic["description"],
        "order": topic["order"],
        "content": topic.get(
            "content",
            {
                "sections": [],
                "keyPoints": [],
                "examples": []
            }
        ),
        "difficulty": topic.get(
            "difficulty",
            "beginner"
        ),
        "estimatedMinutes": topic.get(
            "estimatedMinutes",
            30
        )
    }


@router.get(
    "/subject/{subject_id}",
    response_model=list[TopicResponse]
)
def get_subject_topics(subject_id: str):

    validate_object_id(subject_id)

    topics = get_topics_by_subject(subject_id)

    return [
        {
            "id": str(topic["_id"]),
            "userId": str(topic["userId"]),
            "subjectId": str(topic["subjectId"]),
            "name": topic["name"],
            "description": topic["description"],
            "order": topic["order"],
            "content": topic.get(
                "content",
                {
                    "sections": [],
                    "keyPoints": [],
                    "examples": []
                }
            ),
            "difficulty": topic.get(
                "difficulty",
                "beginner"
            ),
            "estimatedMinutes": topic.get(
                "estimatedMinutes",
                30
            )
        }
        for topic in topics
    ]