import json

from bson import ObjectId
from pypdf import PdfReader
import io

from app.database.connection import get_database
from app.services.ai_service import client
from app.schemas.summarizer import SummaryContent
from app.models.summary import Summary


MAX_CHARS_SENT_TO_AI = 18000


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract raw text from an uploaded PDF file."""

    try:
        reader = PdfReader(io.BytesIO(file_bytes))

    except Exception as error:
        raise ValueError("Could not read this PDF file") from error

    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception as error:
            raise ValueError(
                "This PDF is password protected"
            ) from error

    text_parts = []

    for page in reader.pages:
        try:
            page_text = page.extract_text() or ""
        except Exception:
            page_text = ""

        if page_text.strip():
            text_parts.append(page_text)

    full_text = "\n\n".join(text_parts).strip()

    if not full_text:
        raise ValueError(
            "No readable text found in this PDF. "
            "It may be a scanned/image-only document."
        )

    return full_text


def summarize_text(text: str, title_hint: str = ""):
    """Send extracted document text to the AI model and return a
    structured summary (overview, key points, sections, flashcards).
    """

    truncated = text[:MAX_CHARS_SENT_TO_AI]
    was_truncated = len(text) > MAX_CHARS_SENT_TO_AI

    prompt = f"""
You are an expert study assistant. A student uploaded a document
and needs a clear, well-organized summary they can study from.

DOCUMENT TITLE HINT:
{title_hint or "Not provided - infer a good title from the content."}

DOCUMENT TEXT{" (truncated, summarize what is shown)" if was_truncated else ""}:
\"\"\"
{truncated}
\"\"\"

Return ONLY valid JSON with exactly this structure:

{{
    "title": "A short descriptive title for this document",
    "overview": "A 2-4 sentence high-level summary of the document",
    "keyPoints": ["Important point 1", "Important point 2"],
    "sections": [
        {{"title": "Section title", "body": "Concise explanation of this section's content"}}
    ],
    "flashcards": [
        {{"question": "A study question", "answer": "The answer"}}
    ]
}}

Requirements:

- Include 4 to 8 key points.
- Include 2 to 6 sections that logically break down the document.
- Include 4 to 8 flashcards useful for exam revision.
- Keep language clear and student-friendly.
- Base everything strictly on the provided text; do not invent facts.
- Do not include markdown outside the JSON.
- Return only JSON.
"""

    response = client.chat.completions.create(
        model="nvidia/nemotron-3-nano-30b-a3b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are StudyMate's document summarizer. You "
                    "always return only the requested JSON structure "
                    "with accurate, faithful summaries of the source "
                    "text."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
        max_tokens=3000
    )

    raw_content = response.choices[0].message.content

    if not raw_content:
        raise ValueError("AI returned an empty response")

    try:
        parsed = json.loads(raw_content)

    except json.JSONDecodeError as error:
        raise ValueError("AI returned invalid JSON") from error

    summary_content = SummaryContent.model_validate({
        "overview": parsed.get("overview", ""),
        "keyPoints": parsed.get("keyPoints", []),
        "sections": parsed.get("sections", []),
        "flashcards": parsed.get("flashcards", []),
    })

    return {
        "title": parsed.get("title") or title_hint or "Untitled Summary",
        "summary": summary_content.model_dump(),
    }


def create_summary(summary: Summary):
    database = get_database()

    result = database.summaries.insert_one(summary.to_dict())

    return result.inserted_id


def get_summaries_by_user(user_id, subject_id=None):
    database = get_database()

    query = {"userId": ObjectId(user_id)}

    if subject_id:
        query["subjectId"] = ObjectId(subject_id)

    summaries = database.summaries.find(query).sort("createdAt", -1)

    return list(summaries)


def get_summary_by_id(summary_id):
    database = get_database()

    return database.summaries.find_one({"_id": ObjectId(summary_id)})


def delete_summary(summary_id):
    database = get_database()

    result = database.summaries.delete_one({"_id": ObjectId(summary_id)})

    return result.deleted_count
