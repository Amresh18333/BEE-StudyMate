from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.schemas.summarizer import SummaryResponse
from app.services.summarizer_service import (
    extract_text_from_pdf,
    summarize_text,
    create_summary,
    get_summaries_by_user,
    get_summary_by_id,
    delete_summary,
)
from app.models.summary import Summary
from app.utils.exceptions import validate_object_id

router = APIRouter(
    prefix="/summarizer",
    tags=["Summarizer"]
)

MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


def _format_summary_response(summary):
    return {
        "id": str(summary["_id"]),
        "userId": str(summary["userId"]),
        "subjectId": str(summary["subjectId"]) if summary.get("subjectId") else None,
        "title": summary["title"],
        "fileName": summary["fileName"],
        "summary": summary["summary"],
        "sourceCharCount": summary.get("sourceCharCount", 0),
        "createdAt": summary["createdAt"],
    }


@router.post("/upload", response_model=SummaryResponse, status_code=201)
async def upload_and_summarize(
    file: UploadFile = File(...),
    userId: str = Form(...),
    subjectId: str = Form(None),
    title: str = Form(None),
):
    """Upload PDF -> [Summarizer Module] -> Gemini/OpenAI API -> MongoDB"""

    validate_object_id(userId)

    if subjectId:
        validate_object_id(subjectId)

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="File is too large. Maximum size is 20MB."
        )

    try:
        extracted_text = extract_text_from_pdf(file_bytes)

        result = summarize_text(
            extracted_text,
            title_hint=title or file.filename
        )

        summary = Summary(
            user_id=userId,
            subject_id=subjectId,
            title=result["title"],
            file_name=file.filename,
            summary=result["summary"],
            source_char_count=len(extracted_text),
        )

        summary_id = create_summary(summary)
        created = get_summary_by_id(summary_id)

        return _format_summary_response(created)

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to summarize document"
        )


@router.get("/user/{user_id}", response_model=list[SummaryResponse])
def list_user_summaries(user_id: str, subject_id: str = None):
    validate_object_id(user_id)

    if subject_id:
        validate_object_id(subject_id)

    summaries = get_summaries_by_user(user_id, subject_id)

    return [_format_summary_response(item) for item in summaries]


@router.get("/{summary_id}", response_model=SummaryResponse)
def get_summary(summary_id: str):
    validate_object_id(summary_id)

    summary = get_summary_by_id(summary_id)

    if summary is None:
        raise HTTPException(status_code=404, detail="Summary not found")

    return _format_summary_response(summary)


@router.delete("/{summary_id}", status_code=204)
def remove_summary(summary_id: str):
    validate_object_id(summary_id)

    summary = get_summary_by_id(summary_id)

    if summary is None:
        raise HTTPException(status_code=404, detail="Summary not found")

    delete_summary(summary_id)

    return None
