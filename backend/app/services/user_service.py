from app.database.connection import get_database
from app.models.user import User
from bson import ObjectId

def create_user(user):
    database = get_database()

    user_data = user.to_dict()

    result = database.users.insert_one(user_data)

    return result.inserted_id


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
