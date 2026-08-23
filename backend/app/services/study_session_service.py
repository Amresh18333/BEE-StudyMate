from datetime import datetime

from bson import ObjectId

from app.database.connection import get_database
from app.models.study_session import StudySession


def create_study_session(session):
    database = get_database()

    session_data = session.to_dict()

    result = database.study_sessions.insert_one(session_data)

    return result.inserted_id


def get_study_sessions_by_user(user_id):
    database = get_database()

    sessions = database.study_sessions.find(
        {
            "userId": ObjectId(user_id)
        }
    ).sort("startedAt", -1)

    return list(sessions)


def end_study_session(session_id):
    database = get_database()

    session = database.study_sessions.find_one({
        "_id": ObjectId(session_id)
    })

    if session is None:
        return None

    if session["endedAt"] is not None:
        return session

    ended_at = datetime.utcnow()

    started_at = session["startedAt"]

    duration_seconds = (
        ended_at - started_at
    ).total_seconds()

    duration_minutes = max(
        1,
        round(duration_seconds / 60)
    )

    database.study_sessions.update_one(
        {
            "_id": ObjectId(session_id)
        },
        {
            "$set": {
                "endedAt": ended_at,
                "durationMinutes": duration_minutes
            }
        }
    )

    return database.study_sessions.find_one({
        "_id": ObjectId(session_id)
    })