import json
import re
from datetime import datetime, timezone

from bson import ObjectId

from app.database.connection import get_database
from app.schemas.learning_path import LearningPathAI
from app.services.ai_service import NVIDIA_MODEL, client
from app.services.topic_service import get_topics_by_subject


def _extract_json(raw: str):
    """Parse JSON even if the model wrapped it in ```json fences
    or added a sentence before/after it."""
    text = (raw or "").strip()

    if not text:
        raise ValueError("AI returned an empty response")

    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.I)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    start, end = text.find("{"), text.rfind("}")

    if start != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    raise ValueError("AI returned invalid JSON")


def _normalize(parsed) -> dict:
    """Accept the common 'almost right' shapes models return:
    a bare list of steps, steps under another key, or the whole
    roadmap nested one level down."""
    if isinstance(parsed, list):
        return {"steps": parsed}

    if not isinstance(parsed, dict):
        raise ValueError("AI returned an unexpected format")

    for key in ("learning_path", "learningPath", "roadmap", "data", "result"):
        if isinstance(parsed.get(key), dict):
            parsed = parsed[key]
            break

    if "steps" not in parsed:
        for key in ("topics", "modules", "items", "roadmap", "path"):
            if isinstance(parsed.get(key), list):
                parsed = {**parsed, "steps": parsed[key]}
                break

    if "steps" not in parsed:
        raise ValueError("AI returned an incomplete roadmap")

    return parsed


def _build_prompt(subject, goal, level, num_topics, existing) -> str:
    return f"""
Design a structured learning path (roadmap) for a B.Tech CSE student.

SUBJECT: {subject["name"]}
SUBJECT DESCRIPTION: {subject.get("description") or "None"}
STUDENT LEVEL: {level}
STUDENT GOAL: {goal or "Learn the subject thoroughly for exams and interviews"}
TOPICS ALREADY IN THE SUBJECT (do not repeat): {existing or "none"}

Create exactly {num_topics} topics, ordered from fundamentals to advanced,
so each topic builds on the previous one. Every topic must be specific
and studyable in one sitting (not a whole chapter).

Return ONE JSON object (not a list, not a single topic) with exactly
this structure. The "steps" array must contain ALL {num_topics} topics:

{{
    "title": "Short roadmap title",
    "summary": "2 sentences describing the journey",
    "steps": [
        {{
            "order": 1,
            "name": "Topic name (max 8 words)",
            "description": "One or two sentences on what is covered",
            "difficulty": "beginner",
            "estimatedMinutes": 30,
            "outcome": "What the student can do after this topic"
        }}
    ]
}}

Rules:
- difficulty must be one of: beginner, intermediate, advanced.
- estimatedMinutes between 15 and 90.
- Stay strictly inside the subject "{subject["name"]}".
- No markdown, no text outside the JSON.
"""


def generate_learning_path(
    subject,
    goal: str,
    level: str,
    num_topics: int,
    user_id: str = None
) -> dict:

    existing = [
        topic["name"]
        for topic in get_topics_by_subject(str(subject["_id"]))
    ]

    prompt = _build_prompt(subject, goal, level, num_topics, existing)

    from app.services import memory_service
    prompt += memory_service.personalization_note(user_id, "path")

    path = None
    last_error = None

    # models occasionally return a malformed shape: retry once
    for attempt in (1, 2):

        response = client.chat.completions.create(
            model=NVIDIA_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are StudyMate's curriculum designer. "
                        "You return only one valid JSON object."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=4500
        )

        raw = response.choices[0].message.content

        try:
            path = LearningPathAI.model_validate(
                _normalize(_extract_json(raw))
            )
            break

        except ValueError as error:
            last_error = error
            print(
                f"[learning-path] attempt {attempt} failed: {error}\n"
                f"RAW (first 600 chars): {(raw or '')[:600]!r}"
            )

    if path is None:
        raise ValueError(
            "The AI returned an unusable roadmap. Please try again."
        ) from last_error

    steps = []
    for position, step in enumerate(path.steps[:num_topics], start=1):
        data = step.model_dump()
        data["order"] = position
        steps.append(data)

    return {
        "title": path.title.strip() or f"{subject['name']} Roadmap",
        "summary": path.summary.strip(),
        "steps": steps,
        "totalMinutes": sum(s["estimatedMinutes"] for s in steps)
    }


def save_learning_path(user_id, subject_id, goal, level, num_topics, path):
    """One saved path per subject: generating again replaces it."""
    database = get_database()

    document = {
        "userId": ObjectId(user_id),
        "subjectId": ObjectId(subject_id),
        "goal": goal,
        "level": level,
        "numTopics": num_topics,
        "title": path["title"],
        "summary": path["summary"],
        "totalMinutes": path["totalMinutes"],
        "steps": path["steps"],
        "createdAt": datetime.now(timezone.utc)
    }

    database.learning_paths.replace_one(
        {
            "userId": document["userId"],
            "subjectId": document["subjectId"]
        },
        document,
        upsert=True
    )

    return database.learning_paths.find_one({
        "userId": document["userId"],
        "subjectId": document["subjectId"]
    })


def get_saved_learning_path(user_id, subject_id):
    database = get_database()

    return database.learning_paths.find_one({
        "userId": ObjectId(user_id),
        "subjectId": ObjectId(subject_id)
    })


def format_learning_path(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "subjectId": str(doc["subjectId"]),
        "goal": doc.get("goal", ""),
        "level": doc.get("level", "beginner"),
        "numTopics": doc.get("numTopics", len(doc.get("steps", []))),
        "title": doc.get("title", "Learning Path"),
        "summary": doc.get("summary", ""),
        "totalMinutes": doc.get("totalMinutes", 0),
        "steps": doc.get("steps", []),
        "createdAt": doc["createdAt"].isoformat()
        if hasattr(doc.get("createdAt"), "isoformat")
        else str(doc.get("createdAt", ""))
    }


def get_saved_learning_path_for_subject(subject_id):
    database = get_database()

    return database.learning_paths.find_one(
        {"subjectId": ObjectId(subject_id)}
    )