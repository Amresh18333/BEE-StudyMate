from fastapi import APIRouter, HTTPException

from app.schemas.ai import GenerateTopicContentResponse
from app.services.ai_service import (
    generate_topic_content,
    get_existing_topic_content,
    save_topic_content
)
from app.utils.exceptions import validate_object_id


router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


@router.post(
    "/topics/{topic_id}/generate",
    response_model=GenerateTopicContentResponse
)
def generate_topic(topic_id: str):

    validate_object_id(topic_id)

    try:


        existing_content = get_existing_topic_content(
            topic_id
        )

        if existing_content is not None:

            return {
                "topicId": topic_id,
                "content": existing_content["content"],
                "difficulty": existing_content["difficulty"],
                "estimatedMinutes": (
                    existing_content["estimatedMinutes"]
                )
            }
        result = generate_topic_content(topic_id)
        save_topic_content(
            topic_id,
            result
        )
        return {
            "topicId": topic_id,
            "content": result["content"],
            "difficulty": result["difficulty"],
            "estimatedMinutes": result["estimatedMinutes"]
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception:

        raise HTTPException(
            status_code=500,
            detail="Failed to generate topic content"
        )