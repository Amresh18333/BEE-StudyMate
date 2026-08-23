from datetime import datetime

from bson import ObjectId

from app.database.connection import get_database
from app.models.progress import Progress


def create_progress(progress):
    database = get_database()

    progress_data = progress.to_dict()

    result = database.progress.insert_one(progress_data)

    return result.inserted_id


def get_progress_by_topic(user_id, topic_id):
    database = get_database()

    progress = database.progress.find_one({
        "userId": ObjectId(user_id),
        "topicId": ObjectId(topic_id)
    })

    return progress


def get_progress_by_user(user_id):
    database = get_database()

    progress_records = database.progress.find({
        "userId": ObjectId(user_id)
    })

    return list(progress_records)


def update_progress(
    user_id,
    topic_id,
    status=None,
    completion_percentage=None
):
    database = get_database()

    update_data = {}

    if status is not None:
        update_data["status"] = status

    if completion_percentage is not None:
        update_data["completionPercentage"] = completion_percentage

    update_data["updatedAt"] = datetime.utcnow()
    update_data["lastStudiedAt"] = datetime.utcnow()

    result = database.progress.update_one(
        {
            "userId": ObjectId(user_id),
            "topicId": ObjectId(topic_id)
        },
        {
            "$set": update_data
        }
    )

    return result.modified_count