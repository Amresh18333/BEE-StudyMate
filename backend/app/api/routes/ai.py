from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.schemas.ai import (
    GenerateTopicContentResponse,
    GenerateQuizResponse
)
from app.services.ai_service import (
    generate_topic_content,
    generate_quiz,
    get_existing_topic_content,
    save_topic_content
)
from app.utils.exceptions import validate_object_id


router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


class ChatRequest(BaseModel):
    prompt: str


class ChatResponse(BaseModel):
    response: str


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


@router.post(
    "/topics/{topic_id}/quiz",
    response_model=GenerateQuizResponse
)
def generate_topic_quiz(
    topic_id: str,
    num_questions: int = Query(5, ge=3, le=10)
):
    validate_object_id(topic_id)

    try:

        result = generate_quiz(topic_id, num_questions)

        return {
            "topicId": topic_id,
            "title": result["title"],
            "questions": result["questions"],
            "difficulty": result["difficulty"],
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception:

        raise HTTPException(
            status_code=500,
            detail="Failed to generate quiz"
        )


@router.post(
    "/chat",
    response_model=ChatResponse
)
def ai_chat(request: ChatRequest):

    try:

        from openai import OpenAI
        from app.config import settings

        client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=settings.nvidia_api_key
        )

        response = client.chat.completions.create(
            model="nvidia/nemotron-3-nano-30b-a3b",
            messages=[
                {
                    "role": "system",
                    "content": "You are StudyMate's AI tutor. Provide clear, helpful, and encouraging explanations for students. Be educational and concise."
                },
                {
                    "role": "user",
                    "content": request.prompt
                }
            ],
            temperature=0.3,
            max_tokens=2000
        )

        return {
            "response": response.choices[0].message.content
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail="Failed to process chat request"
        )