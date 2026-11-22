from typing import Optional

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
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
from app.services import chat_document
from app.services import memory_service as memory


router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


class ChatRequest(BaseModel):
    prompt: str
    userId: Optional[str] = None        # lets the tutor adapt to the student
    documentId: Optional[str] = None    # follow-up question about an uploaded document


class ChatResponse(BaseModel):
    response: str
    documentId: Optional[str] = None
    documentName: Optional[str] = None
    usedSections: list[str] = []
    sectionsNotUsed: int = 0


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


BASE_TUTOR_PROMPT = (
    "You are StudyMate's AI tutor. Provide clear, helpful, and encouraging "
    "explanations for students. Be educational and concise."
)

DOCUMENT_RULES = (
    " The student attached a document. Answer from the document excerpts provided. "
    "If the answer is not in the excerpts, say so plainly, and only then add general "
    "knowledge, clearly labelled as not from the document. Never invent facts about the document."
)


def _tutor_system_prompt(user_id):
    """Base prompt plus ONE short personalization sentence from the learner memory."""
    if not user_id:
        return BASE_TUTOR_PROMPT
    hints = memory.personalization_hints(user_id)
    extra = []
    if hints.get("pace") == "fast":
        extra.append("This student prefers short, direct answers.")
    elif hints.get("pace") == "slow":
        extra.append("This student prefers thorough, step-by-step explanations.")
    if hints.get("weak"):
        extra.append("They struggle with: " + ", ".join(hints["weak"][:3]) + ".")
    return BASE_TUTOR_PROMPT + (" " + " ".join(extra) if extra else "")


def _ask_model(system_prompt, user_prompt):
    from app.services.ai_service import client, NVIDIA_MODEL

    response = client.chat.completions.create(
        model=NVIDIA_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=2000,
    )
    return response.choices[0].message.content or ""


def _answer(prompt, user_id, doc_id=None):
    """Shared by the plain chat and the document chat."""
    system = _tutor_system_prompt(user_id)
    extra = {}
    user_prompt = prompt

    if doc_id:
        doc = chat_document.get_document(doc_id, user_id)
        context, used, not_used = chat_document.select_context(doc, prompt)
        system += DOCUMENT_RULES
        user_prompt = (
            f"DOCUMENT: {doc['name']}\n\nEXCERPTS:\n{context}\n\n"
            f"STUDENT QUESTION: {prompt}"
        )
        extra = {"documentId": doc_id, "documentName": doc["name"],
                 "usedSections": used, "sectionsNotUsed": not_used}

    answer = _ask_model(system, user_prompt)

    if user_id:
        memory.record_chat(user_id, prompt, with_document=bool(doc_id))

    return {"response": answer, **extra}


@router.post(
    "/chat",
    response_model=ChatResponse
)
def ai_chat(request: ChatRequest):

    if request.userId:
        validate_object_id(request.userId)

    try:
        return _answer(request.prompt, request.userId, request.documentId)

    except chat_document.DocumentProblem as error:
        raise HTTPException(status_code=400, detail=str(error))

    except Exception as error:
        print(f"CHAT ERROR: {error}")
        raise HTTPException(status_code=500, detail="Failed to process chat request")


@router.post(
    "/chat/document",
    response_model=ChatResponse
)
async def ai_chat_with_document(
    file: UploadFile = File(...),
    prompt: str = Form(...),
    userId: str = Form(None),
):
    """Attach a PDF/TXT/MD to the chat and ask about it."""

    if userId:
        validate_object_id(userId)

    if not prompt.strip():
        raise HTTPException(status_code=400, detail="Please type a question about the document")

    data = await file.read()

    try:
        doc_id = await run_in_threadpool(
            chat_document.load_document, file.filename, data, userId
        )
        return await run_in_threadpool(_answer, prompt, userId, doc_id)

    except chat_document.DocumentProblem as error:
        raise HTTPException(status_code=400, detail=str(error))

    except Exception as error:
        print(f"CHAT DOCUMENT ERROR: {error}")
        raise HTTPException(status_code=500, detail="Failed to process chat request")
