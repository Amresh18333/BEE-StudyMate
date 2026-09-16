from bson import ObjectId

from app.database.connection import get_database
from app.models.topic import Topic


def create_topic(topic):
    database = get_database()

    topic_data = topic.to_dict()

    result = database.topics.insert_one(topic_data)

    return result.inserted_id


def get_topics_by_subject(subject_id):
    database = get_database()

    topics = database.topics.find({
        "subjectId": ObjectId(subject_id)
    }).sort("order", 1)

    return list(topics)


def get_topics_by_user(user_id):
    database = get_database()

    topics = database.topics.find({
        "userId": ObjectId(user_id)
    }).sort("order", 1)

    return list(topics)


def get_topic_by_id(topic_id):
    database = get_database()

    topic = database.topics.find_one({
        "_id": ObjectId(topic_id)
    })

    return topic