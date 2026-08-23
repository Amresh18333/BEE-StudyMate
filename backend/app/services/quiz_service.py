from bson import ObjectId

from app.database.connection import get_database
from app.models.quiz import Quiz


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