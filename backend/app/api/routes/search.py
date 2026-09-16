from fastapi import APIRouter, Query

from app.utils.exceptions import validate_object_id
from app.database.connection import get_database
from bson import ObjectId

router = APIRouter(
    prefix="/search",
    tags=["Search"]
)


@router.get("")
def search_all(
    q: str = Query(..., min_length=1),
    user_id: str = Query(None)
):
    if not q or not q.strip():
        return {"subjects": [], "topics": []}

    query = q.strip()
    database = get_database()

    results = {"subjects": [], "topics": []}

    subject_filter = {"name": {"$regex": query, "$options": "i"}}
    if user_id:
        validate_object_id(user_id)
        subject_filter["userId"] = ObjectId(user_id)

    subjects = database.subjects.find(subject_filter).limit(10)

    for subject in subjects:
        results["subjects"].append({
            "id": str(subject["_id"]),
            "name": subject["name"],
            "description": subject["description"],
        })

    topic_filter = {"name": {"$regex": query, "$options": "i"}}
    if user_id:
        topic_filter["userId"] = ObjectId(user_id)

    topics = database.topics.find(topic_filter).limit(10)

    for topic in topics:
        results["topics"].append({
            "id": str(topic["_id"]),
            "subjectId": str(topic["subjectId"]),
            "name": topic["name"],
            "description": topic["description"],
        })

    return results