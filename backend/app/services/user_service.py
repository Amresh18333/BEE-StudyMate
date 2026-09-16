from app.database.connection import get_database
from app.models.user import User
from bson import ObjectId
from datetime import datetime


def create_user(user):
    database = get_database()

    user_data = user.to_dict()

    result = database.users.insert_one(user_data)

    return result.inserted_id


def email_exists(email):
    database = get_database()

    return database.users.find_one({"email": email.strip().lower()}) is not None


def get_user_by_email(email):
    database = get_database()

    user = database.users.find_one({"email": email})

    return user


def get_user_by_id(user_id):
    database = get_database()

    user = database.users.find_one({
        "_id": ObjectId(user_id)
    })

    return user


def update_user(user_id, update_data):
    database = get_database()

    allowed_fields = {"name", "education", "college", "course", "semester", "goals"}
    filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}

    if not filtered_data:
        return None

    filtered_data["updatedAt"] = datetime.utcnow()

    result = database.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": filtered_data}
    )

    if result.modified_count:
        return database.users.find_one({"_id": ObjectId(user_id)})

    return None
