from fastapi import APIRouter, HTTPException, Query

from app.schemas.quiz import (
    QuizResponse,
    QuizCreate,
    QuizSubmit,
    QuizAttemptResponse,
    QuizGenerateRequest
)
from app.services.quiz_service import (
    get_quizzes_by_topic,
    get_quizzes_by_user,
    get_quiz_by_id,
    create_quiz,
    create_quiz_attempt,
    get_quiz_attempts_by_user,
    get_quiz_attempt_by_id
)
from app.services.ai_service import generate_quiz_standalone
from app.models.quiz import Quiz, QuizAttempt
from app.utils.exceptions import validate_object_id

router = APIRouter(
    prefix="/quizzes",
    tags=["Quizzes"]
)


def _format_quiz_response(quiz):
    questions = []

    for index, question in enumerate(quiz["questions"]):
        questions.append({
            "id": str(index),
            "question": question["question"],
            "options": question["options"],
            "correctAnswer": question.get("correctAnswer", 0),
        })

    return {
        "id": str(quiz["_id"]),
        "userId": str(quiz["userId"]),
        "subjectId": str(quiz["subjectId"]) if quiz.get("subjectId") else None,
        "topicId": str(quiz["topicId"]) if quiz.get("topicId") else None,
        "topicName": quiz.get("topicName"),
        "title": quiz["title"],
        "questions": questions,
        "difficulty": quiz["difficulty"],
        "source": quiz.get("source", "topic"),
        "createdAt": quiz.get("createdAt"),
    }


@router.get(
    "/user/{user_id}/topic/{topic_id}",
    response_model=list[QuizResponse]
)
def get_topic_quizzes(user_id: str, topic_id: str):
    validate_object_id(user_id)
    validate_object_id(topic_id)

    quizzes = get_quizzes_by_topic(user_id, topic_id)

    return [_format_quiz_response(quiz) for quiz in quizzes]


@router.get(
    "/user/{user_id}",
    response_model=list[QuizResponse]
)
def get_user_quizzes(user_id: str):
    """List every quiz belonging to a user, including standalone
    AI-generated quizzes that aren't tied to a subject/topic."""
    validate_object_id(user_id)

    quizzes = get_quizzes_by_user(user_id)

    return [_format_quiz_response(quiz) for quiz in quizzes]


@router.post("/generate", response_model=QuizResponse, status_code=201)
def generate_and_save_quiz(request: QuizGenerateRequest):
    """Generate Quiz -> Quiz Module -> Gemini/OpenAI API -> MongoDB.

    Standalone quiz generator: create a quiz from any topic/keywords
    the student types in, without needing an existing subject/topic
    record. The generated quiz is persisted immediately.
    """
    validate_object_id(request.userId)

    if request.subjectId:
        validate_object_id(request.subjectId)

    if request.topicId:
        validate_object_id(request.topicId)

    try:
        result = generate_quiz_standalone(
            topic_name=request.topicName,
            description=request.description or "",
            num_questions=request.numQuestions,
            difficulty=request.difficulty,
        )

        quiz = Quiz(
            user_id=request.userId,
            subject_id=request.subjectId,
            topic_id=request.topicId,
            topic_name=request.topicName,
            title=result["title"],
            questions=result["questions"],
            difficulty=result["difficulty"],
            source="topic" if request.topicId else "custom",
        )

        quiz_id = create_quiz(quiz)
        created_quiz = get_quiz_by_id(quiz_id)

        return _format_quiz_response(created_quiz)

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate quiz"
        )


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(quiz_id: str):
    validate_object_id(quiz_id)

    quiz = get_quiz_by_id(quiz_id)

    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")

    return _format_quiz_response(quiz)


@router.post("", response_model=QuizResponse, status_code=201)
def create_new_quiz(quiz_data: QuizCreate):
    validate_object_id(quiz_data.userId)

    if quiz_data.subjectId:
        validate_object_id(quiz_data.subjectId)

    if quiz_data.topicId:
        validate_object_id(quiz_data.topicId)

    quiz = Quiz(
        user_id=quiz_data.userId,
        subject_id=quiz_data.subjectId,
        topic_id=quiz_data.topicId,
        topic_name=quiz_data.topicName,
        title=quiz_data.title,
        questions=quiz_data.questions,
        difficulty=quiz_data.difficulty,
        source="topic" if quiz_data.topicId else "custom",
    )

    quiz_id = create_quiz(quiz)

    created_quiz = get_quiz_by_id(quiz_id)

    return _format_quiz_response(created_quiz)


@router.post("/{quiz_id}/submit", response_model=QuizAttemptResponse)
def submit_quiz(quiz_id: str, submit_data: QuizSubmit):
    validate_object_id(quiz_id)

    quiz = get_quiz_by_id(quiz_id)

    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")

    answers = submit_data.answers
    score = 0

    for answer in answers:
        question_index = answer.get("questionId")
        selected = answer.get("selectedAnswer")

        if question_index is not None and selected is not None:
            try:
                idx = int(question_index)
                if idx < len(quiz["questions"]):
                    correct = quiz["questions"][idx].get("correctAnswer", 0)
                    if selected == correct:
                        score += 1
            except (ValueError, TypeError):
                pass

    total_questions = len(quiz["questions"])

    attempt = QuizAttempt(
        user_id=str(quiz["userId"]),
        quiz_id=quiz_id,
        answers=answers,
        score=score,
        total_questions=total_questions,
    )

    attempt_id = create_quiz_attempt(attempt)

    created_attempt = get_quiz_attempt_by_id(attempt_id)

    return {
        "id": str(created_attempt["_id"]),
        "userId": str(created_attempt["userId"]),
        "quizId": str(created_attempt["quizId"]),
        "answers": created_attempt["answers"],
        "score": created_attempt["score"],
        "totalQuestions": created_attempt["totalQuestions"],
        "completedAt": created_attempt["completedAt"],
    }


@router.get("/user/{user_id}/attempts", response_model=list[QuizAttemptResponse])
def get_user_quiz_attempts(user_id: str, quiz_id: str = None):
    validate_object_id(user_id)

    if quiz_id:
        validate_object_id(quiz_id)

    attempts = get_quiz_attempts_by_user(user_id, quiz_id)

    return [
        {
            "id": str(attempt["_id"]),
            "userId": str(attempt["userId"]),
            "quizId": str(attempt["quizId"]),
            "answers": attempt["answers"],
            "score": attempt["score"],
            "totalQuestions": attempt["totalQuestions"],
            "completedAt": attempt["completedAt"],
        }
        for attempt in attempts
    ]


@router.get("/attempts/{attempt_id}", response_model=QuizAttemptResponse)
def get_quiz_attempt(attempt_id: str):
    validate_object_id(attempt_id)

    attempt = get_quiz_attempt_by_id(attempt_id)

    if attempt is None:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")

    return {
        "id": str(attempt["_id"]),
        "userId": str(attempt["userId"]),
        "quizId": str(attempt["quizId"]),
        "answers": attempt["answers"],
        "score": attempt["score"],
        "totalQuestions": attempt["totalQuestions"],
        "completedAt": attempt["completedAt"],
    }