from fastapi import APIRouter

from app.schemas.quiz import QuizResponse
from app.services.quiz_service import get_quizzes_by_topic
from app.utils.exceptions import validate_object_id

router = APIRouter(
    prefix="/quizzes",
    tags=["Quizzes"]
)


@router.get(
    "/user/{user_id}/topic/{topic_id}",
    response_model=list[QuizResponse]
)
def get_topic_quizzes(user_id: str, topic_id: str):
    validate_object_id(user_id)
    validate_object_id(topic_id)

    quizzes = get_quizzes_by_topic(user_id, topic_id)

    response = []

    for quiz in quizzes:
        questions = []

        for index, question in enumerate(quiz["questions"]):
            questions.append({
                "id": str(index),
                "question": question["question"],
                "options": question["options"],
            })

        response.append({
            "id": str(quiz["_id"]),
            "userId": str(quiz["userId"]),
            "subjectId": str(quiz["subjectId"]),
            "topicId": str(quiz["topicId"]),
            "title": quiz["title"],
            "questions": questions,
            "difficulty": quiz["difficulty"],
        })

    return response