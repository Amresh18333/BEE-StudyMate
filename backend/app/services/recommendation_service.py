from collections import defaultdict
import json

from bson import ObjectId
from openai import OpenAIError

from app.config import settings
from app.database.connection import get_database
from app.services.ai_service import NVIDIA_MODEL, client


DIFFICULTY_LEVELS = ("beginner", "intermediate", "advanced")


def _difficulty_rank(value):
    value = str(value or "beginner").lower()
    return DIFFICULTY_LEVELS.index(value) if value in DIFFICULTY_LEVELS else 0


def _next_difficulty(level):
    return DIFFICULTY_LEVELS[min(_difficulty_rank(level) + 1, 2)]


def _previous_difficulty(level):
    return DIFFICULTY_LEVELS[max(_difficulty_rank(level) - 1, 0)]


def _build_topic_metrics(user_id):
    database = get_database()
    user_oid = ObjectId(user_id)

    topics = list(database.topics.find({"userId": user_oid}))
    progress = {
        item["topicId"]: item
        for item in database.progress.find({"userId": user_oid})
    }
    sessions = defaultdict(list)
    for item in database.study_sessions.find({"userId": user_oid}):
        sessions[item["topicId"]].append(item)

    quizzes = list(database.quizzes.find({"userId": user_oid}))
    quiz_by_topic = defaultdict(list)
    quiz_ids = []
    for quiz in quizzes:
        if quiz.get("topicId"):
            quiz_by_topic[quiz["topicId"]].append(quiz)
            quiz_ids.append(quiz["_id"])

    attempts = defaultdict(list)
    if quiz_ids:
        for attempt in database.quiz_attempts.find({
            "userId": user_oid,
            "quizId": {"$in": quiz_ids}
        }):
            attempts[attempt["quizId"]].append(attempt)

    metrics = []
    for topic in topics:
        topic_id = topic["_id"]
        topic_quizzes = quiz_by_topic.get(topic_id, [])
        topic_attempts = [
            attempt
            for quiz in topic_quizzes
            for attempt in attempts.get(quiz["_id"], [])
        ]
        total_questions = sum(item.get("totalQuestions", 0) for item in topic_attempts)
        correct_answers = sum(item.get("score", 0) for item in topic_attempts)
        accuracy = (
            correct_answers / total_questions * 100
            if total_questions
            else None
        )
        topic_sessions = sessions.get(topic_id, [])
        completed_sessions = [
            item for item in topic_sessions
            if item.get("durationMinutes") is not None
        ]
        total_minutes = sum(
            item.get("durationMinutes", 0) or 0
            for item in completed_sessions
        )
        attempt_durations = [
            item.get("timeSpentSeconds", 0) / 60
            for item in topic_attempts
            if item.get("timeSpentSeconds")
        ]
        completion = progress.get(topic_id, {}).get("completionPercentage", 0)
        expected = topic.get("estimatedMinutes", 30) or 30
        average_minutes = (
            total_minutes / len(completed_sessions)
            if completed_sessions
            else 0
        )
        difficulty = topic.get("difficulty", "beginner")
        latest_attempt_difficulty = "beginner"
        if topic_quizzes:
            latest_attempt_difficulty = topic_quizzes[-1].get(
                "difficulty", "beginner"
            )

        if accuracy is None:
            mastery = round(completion * 0.7)
        else:
            time_factor = 0
            if average_minutes:
                time_factor = max(-10, min(
                    10,
                    round((expected - average_minutes) / expected * 10)
                ))
            mastery = round(
                accuracy * 0.65
                + completion * 0.25
                + (10 + time_factor)
            )
        mastery = max(0, min(100, mastery))

        metrics.append({
            "topicId": str(topic_id),
            "subjectId": str(topic.get("subjectId")),
            "topicName": topic.get("name", "Unknown topic"),
            "difficulty": difficulty,
            "mastery": mastery,
            "accuracy": round(accuracy) if accuracy is not None else None,
            "completionPercentage": completion,
            "quizAttempts": len(topic_attempts),
            "totalMinutes": total_minutes,
            "averageMinutes": round(average_minutes, 1),
            "expectedMinutes": expected,
            "averageQuizMinutes": round(
                sum(attempt_durations) / len(attempt_durations), 1
            ) if attempt_durations else 0,
            "lastQuizDifficulty": latest_attempt_difficulty,
        })
    return metrics


def _rule_based_recommendations(metrics):
    recommendations = []
    for item in sorted(metrics, key=lambda value: value["mastery"]):
        mastery = item["mastery"]
        accuracy = item["accuracy"]
        expected = item["expectedMinutes"]
        average = item["averageMinutes"]
        difficulty = item["difficulty"]

        if mastery < 45 or (accuracy is not None and accuracy < 55):
            action = "Review the basics, then complete guided beginner questions."
            target = "beginner"
            reason = "Your recent evidence shows this topic needs foundation work."
        elif accuracy is not None and accuracy < 75:
            action = "Practice intermediate questions and review every mistake."
            target = "intermediate"
            reason = "Your foundation is forming but accuracy is not consistent yet."
        elif accuracy is not None and accuracy >= 85:
            action = "Try advanced questions and apply the topic to a new problem."
            target = _next_difficulty(difficulty)
            reason = "Your accuracy shows you are ready for a challenge."
        else:
            action = "Continue with intermediate questions and a short review."
            target = "intermediate"
            reason = "Keep building consistency before increasing difficulty."

        if average > expected * 1.35:
            action = "Slow down for a concept review, then do extra step-by-step practice."
            reason += " Study time is significantly above the expected time."
        elif average and average < expected * 0.55 and accuracy is not None and accuracy < 70:
            action = "Revisit the explanation carefully before attempting harder questions."
            reason += " Fast completion with low accuracy suggests skipped foundations."

        if (
            item["lastQuizDifficulty"] == "advanced"
            and accuracy is not None
            and accuracy < 55
        ):
            target = _previous_difficulty("advanced")
            action = "Step back to intermediate questions, then retry advanced questions."
            reason = "Repeated difficulty at the advanced level indicates a need to consolidate prerequisites."

        recommendations.append({
            "topicId": item["topicId"],
            "topicName": item["topicName"],
            "mastery": mastery,
            "accuracy": accuracy,
            "recommendedDifficulty": target,
            "action": action,
            "reason": reason,
            "averageMinutes": item["averageMinutes"],
            "expectedMinutes": expected,
        })

    return recommendations[:5]


def _ai_summary(metrics, recommendations, user_id=None):
    prompt = f"""
You are an adaptive learning coach. Based only on this student data, write
one concise, encouraging summary and one next-step sentence as JSON:
{{"summary": "...", "nextStep": "..."}}

Topic metrics: {metrics}
Recommendations: {recommendations}
Do not invent scores or topics. Return JSON only.
"""
    from app.services import memory_service
    prompt += memory_service.personalization_note(user_id, "coach")
    response = client.chat.completions.create(
        model=NVIDIA_MODEL,
        messages=[
            {"role": "system", "content": "You are a precise educational coach."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=250,
    )
    content = response.choices[0].message.content or ""
    start, end = content.find("{"), content.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("AI returned invalid recommendation JSON")
    return json.loads(content[start:end + 1])


def get_recommendations(user_id):
    metrics = _build_topic_metrics(user_id)
    recommendations = _rule_based_recommendations(metrics)
    overall_score = round(
        sum(item["mastery"] for item in metrics) / len(metrics)
    ) if metrics else 0
    priority = recommendations[0]["topicName"] if recommendations else None
    summary = (
        f"Your current learning score is {overall_score}/100. "
        f"Focus next on {priority}."
        if priority
        else "Complete a topic and quiz so StudyMate can personalize your plan."
    )
    generated_by_ai = False
    try:
        if metrics and settings.nvidia_api_key:
            ai_result = _ai_summary(metrics, recommendations, user_id)
            summary = f"{ai_result['summary']} {ai_result['nextStep']}".strip()
            generated_by_ai = True
    except (OpenAIError, ValueError, KeyError, TypeError, json.JSONDecodeError):
        # The measurable rule-based recommendation remains available if AI output is unusable.
        pass

    return {
        "overallScore": overall_score,
        "summary": summary,
        "priority": priority or "Start learning",
        "recommendations": recommendations,
        "generatedByAI": generated_by_ai,
    }
