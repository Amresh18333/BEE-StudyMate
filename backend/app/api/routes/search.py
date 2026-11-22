import re

from fastapi import APIRouter, Query
from bson import ObjectId

from app.utils.exceptions import validate_object_id
from app.database.connection import get_database
from app.services import memory_service as memory

router = APIRouter(
    prefix="/search",
    tags=["Search"]
)

CANDIDATES = 30     # fetched from MongoDB, then ranked; the best 10 are returned
RESULTS = 10
_indexes_ready = False


def _make_indexes(database):
    """Lets MongoDB find a student's topics/subjects without scanning everything."""
    global _indexes_ready
    if _indexes_ready:
        return
    try:
        database.topics.create_index([("userId", 1), ("name", 1)])
        database.subjects.create_index([("userId", 1), ("name", 1)])
    except Exception:
        pass
    _indexes_ready = True


def _rank(name, query, weak, searched):
    """Higher = shown first. Uses what the student has done before."""
    lowered = name.lower()
    score = 0.0
    if lowered == query:
        score += 3
    elif lowered.startswith(query):
        score += 2
    if any(w.lower() in lowered or lowered in w.lower() for w in weak):
        score += 1.5            # a topic they are weak at
    if any(lowered == s.lower() for s in searched):
        score += 1              # something they looked up before
    return score


@router.get("")
def search_all(
    q: str = Query(..., min_length=1),
    user_id: str = Query(None)
):
    if not q or not q.strip():
        return {"subjects": [], "topics": [], "suggestions": [], "personalized": False}

    query = q.strip()
    pattern = {"$regex": re.escape(query), "$options": "i"}     # escape: "(" must not crash the search
    database = get_database()
    _make_indexes(database)

    hints = {}
    if user_id:
        validate_object_id(user_id)
        hints = memory.personalization_hints(user_id)      # ONE small read
    weak, searched = hints.get("weak", []), hints.get("searched", [])
    q_low = query.lower()

    subject_filter = {"name": pattern}
    topic_filter = {"name": pattern}
    if user_id:
        subject_filter["userId"] = ObjectId(user_id)
        topic_filter["userId"] = ObjectId(user_id)

    subjects = list(database.subjects.find(subject_filter).limit(CANDIDATES))
    topics = list(database.topics.find(topic_filter).limit(CANDIDATES))

    subjects.sort(key=lambda s: -_rank(s["name"], q_low, weak, searched))
    topics.sort(key=lambda t: -_rank(t["name"], q_low, weak, searched))

    results = {"subjects": [], "topics": []}

    for subject in subjects[:RESULTS]:
        results["subjects"].append({
            "id": str(subject["_id"]),
            "name": subject["name"],
            "description": subject.get("description", ""),
        })

    for topic in topics[:RESULTS]:
        results["topics"].append({
            "id": str(topic["_id"]),
            "subjectId": str(topic["subjectId"]),
            "name": topic["name"],
            "description": topic.get("description", ""),
            "needsPractice": any(w.lower() in topic["name"].lower() for w in weak),
        })

    results["suggestions"] = [s for s in searched if s and s.lower().startswith(q_low)
                              and s.lower() != q_low][:5]
    results["personalized"] = bool(hints)
    return results
