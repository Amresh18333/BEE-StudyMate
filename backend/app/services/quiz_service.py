from bson import ObjectId

from app.database.connection import get_database
from app.models.quiz import Quiz, QuizAttempt


def create_quiz(quiz):
    database = get_database()

    quiz_data = quiz.to_dict()

    result = database.quizzes.insert_one(quiz_data)

    return result.inserted_id


def get_quizzes_by_topic(user_id, topic_id):
    database = get_database()

    quizzes = database.quizzes.find({
        "userId": ObjectId(user_id),
        "topicId": ObjectId(topic_id)
    })

    return list(quizzes)


def get_quizzes_by_user(user_id):
    database = get_database()

    quizzes = database.quizzes.find({
        "userId": ObjectId(user_id)
    }).sort("createdAt", -1)

    return list(quizzes)


def get_quiz_by_id(quiz_id):
    database = get_database()

    return database.quizzes.find_one({"_id": ObjectId(quiz_id)})


def create_quiz_attempt(attempt):
    database = get_database()

    attempt_data = attempt.to_dict()

    result = database.quiz_attempts.insert_one(attempt_data)

    return result.inserted_id


def get_quiz_attempts_by_user(user_id, quiz_id=None):
    database = get_database()

    query = {"userId": ObjectId(user_id)}

    if quiz_id:
        query["quizId"] = ObjectId(quiz_id)

    attempts = database.quiz_attempts.find(query).sort("completedAt", -1)

    return list(attempts)


def get_quiz_attempt_by_id(attempt_id):
    database = get_database()

    return database.quiz_attempts.find_one({"_id": ObjectId(attempt_id)})