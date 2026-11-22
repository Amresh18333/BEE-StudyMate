from datetime import datetime

from bson import ObjectId
from pymongo import ASCENDING

from app.database.connection import get_database

MAX_SEARCH_HISTORY = 30
MAX_TOPIC_HISTORY = 40
MAX_CHAT_HISTORY = 30
MAX_SUMMARY_HISTORY = 20


def _ensure_indexes():
    database = get_database()
    database.learning_profiles.create_index([("userId", ASCENDING)], unique=True)


def _base_profile(user_id: str):
    return {
        "userId": ObjectId(user_id),
        "learnerType": "Balanced Learner",
        "learnerDescription": "Build study and quiz activity to personalise your learning profile.",
        "quizStats": {"attempts": 0, "averagePercent": 0, "bestPercent": 0, "scoreSum": 0},
        "studyStats": {"sessions": 0, "totalMinutes": 0, "averageMinutes": 0},
        "searchHistory": [],
        "topicHistory": [],
        "chatHistory": [],
        "summaryHistory": [],
        "updatedAt": datetime.utcnow(),
    }


def _ensure_profile(user_id: str):
    database = get_database()
    database.learning_profiles.update_one(
        {"userId": ObjectId(user_id)},
        {"$setOnInsert": _base_profile(user_id)},
        upsert=True,
    )


def _reclassify(profile):
    quiz = profile.get("quizStats", {})
    study = profile.get("studyStats", {})
    average_quiz = quiz.get("averagePercent", 0)
    average_study = study.get("averageMinutes", 0)

    if study.get("sessions", 0) >= 3 and average_study >= 35 and average_quiz >= 70:
        learner_type = "Slow & Informative"
        description = "You prefer longer, detail-rich study sessions and retain information well."
    elif study.get("sessions", 0) >= 3 and average_study < 25:
        learner_type = "Fast & Responsive"
        description = "You learn efficiently in short sessions and respond well to quick practice."
    elif average_quiz >= 80:
        learner_type = "Accuracy-Driven"
        description = "You consistently aim for accuracy and perform strongly in knowledge checks."
    elif study.get("sessions", 0) > 0:
        learner_type = "Active Explorer"
        description = "You learn by exploring topics, searching concepts and trying varied activities."
    else:
        learner_type = "Balanced Learner"
        description = "Build study and quiz activity to personalise your learning profile."

    profile["learnerType"] = learner_type
    profile["learnerDescription"] = description
    return profile


def get_learning_profile(user_id: str):
    _ensure_indexes()
    database = get_database()
    profile = database.learning_profiles.find_one(
        {"userId": ObjectId(user_id)},
        {
            "_id": 0, "userId": 1, "learnerType": 1, "learnerDescription": 1,
            "quizStats": 1, "studyStats": 1, "searchHistory": 1,
            "topicHistory": 1, "chatHistory": 1, "summaryHistory": 1,
            "updatedAt": 1,
        },
    )
    if profile is None:
        return {
            "learnerType": "Balanced Learner",
            "learnerDescription": "Build study and quiz activity to personalise your learning profile.",
            "quizStats": {"attempts": 0, "averagePercent": 0, "bestPercent": 0},
            "studyStats": {"sessions": 0, "totalMinutes": 0, "averageMinutes": 0},
            "searchHistory": [], "topicHistory": [], "chatHistory": [], "summaryHistory": [],
        }
    profile["userId"] = str(profile["userId"])
    profile.setdefault("learnerType", "Balanced Learner")
    profile.setdefault("learnerDescription", "")
    profile.setdefault("quizStats", {})
    profile.setdefault("studyStats", {})
    profile.setdefault("searchHistory", [])
    profile.setdefault("topicHistory", [])
    profile.setdefault("chatHistory", [])
    profile.setdefault("summaryHistory", [])
    return profile


def record_search(user_id: str, query: str, result_count: int):
    if not user_id or not query.strip():
        return
    _ensure_profile(user_id)
    database = get_database()
    now = datetime.utcnow()
    entry = {"query": query.strip()[:100], "count": int(result_count), "at": now}
    database.learning_profiles.update_one(
        {"userId": ObjectId(user_id)},
        {
            "$push": {"searchHistory": {"$each": [entry], "$slice": -MAX_SEARCH_HISTORY}},
            "$set": {"updatedAt": now},
        },
    )


def record_topic(user_id: str, topic_id: str, name: str = ""):
    if not user_id:
        return
    _ensure_profile(user_id)
    database = get_database()
    now = datetime.utcnow()
    entry = {"topicId": topic_id, "name": (name or "")[:100], "at": now}
    database.learning_profiles.update_one(
        {"userId": ObjectId(user_id)},
        {
            "$push": {"topicHistory": {"$each": [entry], "$slice": -MAX_TOPIC_HISTORY}},
            "$set": {"updatedAt": now},
        },
    )


def record_chat(user_id: str, prompt: str, kind: str = "chat"):
    if not user_id:
        return
    _ensure_profile(user_id)
    database = get_database()
    now = datetime.utcnow()
    entry = {"prompt": prompt.strip()[:300], "kind": kind, "at": now}
    database.learning_profiles.update_one(
        {"userId": ObjectId(user_id)},
        {
            "$push": {"chatHistory": {"$each": [entry], "$slice": -MAX_CHAT_HISTORY}},
            "$set": {"updatedAt": now},
        },
    )


def record_summary(user_id: str, title: str, summary_id: str):
    if not user_id:
        return
    _ensure_profile(user_id)
    database = get_database()
    now = datetime.utcnow()
    entry = {"summaryId": summary_id, "title": title[:120], "at": now}
    database.learning_profiles.update_one(
        {"userId": ObjectId(user_id)},
        {
            "$push": {"summaryHistory": {"$each": [entry], "$slice": -MAX_SUMMARY_HISTORY}},
            "$set": {"updatedAt": now},
        },
    )


def record_quiz_attempt(user_id: str, score: int, total: int):
    if not user_id or total <= 0:
        return
    _ensure_profile(user_id)
    database = get_database()
    percent = round((score / total) * 100)
    database.learning_profiles.update_one(
        {"userId": ObjectId(user_id)},
        {
            "$inc": {
                "quizStats.attempts": 1,
                "quizStats.scoreSum": percent,
            },
            "$max": {"quizStats.bestPercent": percent},
            "$set": {"updatedAt": datetime.utcnow()},
        },
    )
    profile = database.learning_profiles.find_one({"userId": ObjectId(user_id)})
    quiz = profile["quizStats"]
    attempts = quiz["attempts"]
    quiz["averagePercent"] = round(quiz.get("scoreSum", 0) / attempts) if attempts else 0
    quiz.pop("scoreSum", None)
    profile["quizStats"] = quiz
    profile = _reclassify(profile)
    database.learning_profiles.update_one(
        {"userId": ObjectId(user_id)},
        {
            "$set": {
                "quizStats": quiz,
                "learnerType": profile["learnerType"],
                "learnerDescription": profile["learnerDescription"],
                "updatedAt": datetime.utcnow(),
            }
        },
    )


def record_study_session(user_id: str, duration_minutes: int, topic_id: str = ""):
    if not user_id:
        return
    _ensure_profile(user_id)
    database = get_database()
    duration = max(0, duration_minutes)
    database.learning_profiles.update_one(
        {"userId": ObjectId(user_id)},
        {
            "$inc": {
                "studyStats.sessions": 1,
                "studyStats.totalMinutes": duration,
            },
            "$set": {"updatedAt": datetime.utcnow()},
        },
    )
    profile = database.learning_profiles.find_one({"userId": ObjectId(user_id)})
    study = profile["studyStats"]
    study["averageMinutes"] = round(
        study["totalMinutes"] / study["sessions"]
    ) if study["sessions"] else 0
    profile["studyStats"] = study
    if topic_id:
        database.learning_profiles.update_one(
            {"userId": ObjectId(user_id)},
            {
                "$push": {
                    "topicHistory": {
                        "$each": [{"topicId": topic_id, "name": "", "at": datetime.utcnow()}],
                        "$slice": -MAX_TOPIC_HISTORY,
                    }
                }
            },
        )
    profile = _reclassify(profile)
    database.learning_profiles.update_one(
        {"userId": ObjectId(user_id)},
        {
            "$set": {
                "studyStats": study,
                "learnerType": profile["learnerType"],
                "learnerDescription": profile["learnerDescription"],
                "updatedAt": datetime.utcnow(),
            }
        },
    )
