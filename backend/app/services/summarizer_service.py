import io
import os
import logging
import re
import time
import tempfile

from bson import ObjectId

from app.database.connection import get_database
from app.models.summary import Summary
from app.config import settings
from app.services.ai_service import NVIDIA_MODEL, client as nvidia_client
from app.services.pdf_pipeline.summarizer import summarize_pdf

logger = logging.getLogger("uvicorn.error")   # shows up in the backend terminal

_ollama_client = None


def get_summarizer_backend():
    """Pick the model that writes the summaries, from SUMMARIZER_PROVIDER in .env.

    NVIDIA       -> hosted API (default, fast, needs the NVIDIA key)
    OLLAMA_QWEN  -> Qwen served by a local Ollama (free, offline, slower on CPU).
                    OLLAMA_MODEL can be the base model or your fine-tuned one.

    Returns (client, model_name, provider). Both clients speak the same
    OpenAI-style API, so the rest of the pipeline does not change.
    """
    global _ollama_client

    if settings.summarizer_provider == "OLLAMA_QWEN":
        if _ollama_client is None:
            from openai import OpenAI
            _ollama_client = OpenAI(
                base_url=settings.ollama_base_url,
                api_key="ollama",   # Ollama ignores the key but the client needs one
                timeout=settings.ollama_timeout_seconds,
                max_retries=0,
            )
        return _ollama_client, settings.ollama_model, "OLLAMA_QWEN"

    return nvidia_client, NVIDIA_MODEL, "NVIDIA"


class PdfProblem(ValueError):
    """A PDF we cannot summarize (scanned, empty, corrupted). The message is safe to show the student."""


class AiUnavailable(RuntimeError):
    """The AI API failed for every section (outage, bad key, rate limit)."""


def _make_generate(errors):
    """Return generate(messages) -> text, backed by the model chosen in .env."""
    client, model_name, provider = get_summarizer_backend()
    logger.info("PDF summarizer using %s (%s)", provider, model_name)

    def generate(messages):
        started = time.time()
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.1,
                max_tokens=1800,
            )
        except Exception as error:
            # One failed call must not crash the upload: that section falls back to
            # source excerpts (labelled). If every call fails we report it below.
            errors.append(str(error)[:200])
            logger.warning("Summarizer call FAILED (%s): %s", provider, str(error)[:300])
            return ""
        text = response.choices[0].message.content or ""
        logger.info(
            "Summarizer call OK (%s) %.1fs, %d chars, starts: %r",
            provider, time.time() - started, len(text), text[:150],
        )
        # Some models add <think> blocks; the pipeline expects bare JSON.
        return re.sub(r"<think>.*?</think>", "", text, flags=re.S | re.I).strip()

    return generate


def _first_sentence(text):
    match = re.match(r"(.+?[.!?])(\s|$)", text.strip(), flags=re.S)
    return match.group(1) if match else text.strip()


def _to_response_shape(result, title_hint, model_label=""):
    """Map the pipeline output onto the structure the frontend already shows.

    Nothing is dropped: every section keeps its own summary, key points,
    definitions, exam tips and flashcards. The top-level lists are quick views.
    """
    sections, flashcards, definitions, exam_tips, quick_points = [], [], [], [], []
    fallback_sections = 0

    for record in result["records"]:
        out = record["output"]
        source = record["output_source"]
        if source == "extractive_fallback":
            fallback_sections += 1

        sections.append({
            "title": out["title"] or "Section",
            "body": out["summary"],
            "keyPoints": out["key_points"],
            "definitions": out["definitions"],
            "examTips": out["exam_tips"],
            "source": source,
        })
        flashcards += [{"question": c["q"], "answer": c["a"]} for c in out["flashcards"]]
        definitions += out["definitions"]
        exam_tips += out["exam_tips"]
        if out["key_points"]:
            quick_points.append(out["key_points"][0])

    overview = " ".join(_first_sentence(s["body"]) for s in sections[:4] if s["body"])
    removed = sum(
        len((r["grounding"] or {}).get("dropped", [])) for r in result["records"]
    )

    return {
        "title": title_hint or "Untitled Summary",
        "summary": {
            "overview": overview,
            "keyPoints": quick_points[:8],
            "sections": sections,
            "flashcards": flashcards,
            "definitions": definitions,
            "examTips": exam_tips,
            "quality": {
                "status": result["status"],
                "sectionsFromSourceExcerpts": fallback_sections,
                "itemsRemovedAsUnsupported": removed,
                "warnings": result.get("warnings", []),
                "model": model_label,
            },
        },
    }


def _personalize(summary, user_id):
    """Use the learner memory to shape how the summary is PRESENTED. Nothing is removed.

    - sections about topics the student is weak at get focus=True (shown first by the frontend)
    - flashcards about those topics come first
    - view = "quick" for fast learners, "detailed" for slow ones
    """
    if not user_id:
        return
    from app.services import memory_service
    hints = memory_service.personalization_hints(user_id)
    if not hints:
        return
    weak = [w.lower() for w in hints.get("weak", [])]

    def mentions_weak(text):
        text = text.lower()
        return any(w and (w in text) for w in weak)

    for section in summary["sections"]:
        blob = section["title"] + " " + section["body"]
        section["focus"] = mentions_weak(blob)
    summary["flashcards"].sort(
        key=lambda c: 0 if mentions_weak(c.get("question", "") + " " + c.get("answer", "")) else 1
    )
    summary["personalization"] = {
        "view": {"fast": "quick", "slow": "detailed"}.get(hints.get("pace"), "balanced"),
        "weakTopics": hints.get("weak", []),
        "focusSections": sum(1 for s in summary["sections"] if s.get("focus")),
    }


def summarize_pdf_bytes(file_bytes: bytes, title_hint: str = "", generate=None, user_id=None):
    """PDF bytes -> {"title", "summary", "char_count"}.

    Raises PdfProblem for scanned/empty/unreadable PDFs.
    """
    api_errors = []
    generate = generate or _make_generate(api_errors)

    folder = tempfile.mkdtemp()
    path = os.path.join(folder, "upload.pdf")
    try:
        with open(path, "wb") as f:
            f.write(file_bytes)
        result = summarize_pdf(path, generate)
    finally:
        try:
            os.remove(path)
            os.rmdir(folder)
        except OSError:
            pass

    if result["status"] == "needs_ocr":
        raise PdfProblem(
            "This looks like a scanned/image-only PDF. Text-based PDFs only for now."
        )
    if result["status"] in ("no_text", "unreadable"):
        raise PdfProblem(
            "Could not read usable text from this PDF. "
            "It may be empty, corrupted or password protected."
        )

    if api_errors and result["stats"]["extractive_fallback"] == result["stats"]["units"]:
        if get_summarizer_backend()[2] == "OLLAMA_QWEN":
            raise AiUnavailable(
                "The local Qwen model is not responding. Check that Ollama is running "
                "and that the model named in OLLAMA_MODEL exists (run: ollama list)."
            )
        raise AiUnavailable("The AI service is not responding right now. Please try again later.")

    _client, model_name, provider = get_summarizer_backend()
    shaped = _to_response_shape(result, title_hint, f"{provider}: {model_name}")
    _personalize(shaped["summary"], user_id)
    shaped["char_count"] = sum(len(u["text"]) for u in result["units"])
    return shaped


def create_summary(summary: Summary):
    database = get_database()
    result = database.summaries.insert_one(summary.to_dict())
    return result.inserted_id


def get_summaries_by_user(user_id, subject_id=None):
    database = get_database()
    query = {"userId": ObjectId(user_id)}
    if subject_id:
        query["subjectId"] = ObjectId(subject_id)
    return list(database.summaries.find(query).sort("createdAt", -1))


def get_summary_by_id(summary_id):
    database = get_database()
    return database.summaries.find_one({"_id": ObjectId(summary_id)})


def delete_summary(summary_id):
    database = get_database()
    result = database.summaries.delete_one({"_id": ObjectId(summary_id)})
    return result.deleted_count