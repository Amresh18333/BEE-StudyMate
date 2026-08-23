from bson import ObjectId

from app.database.connection import get_database
from app.models.subject import Subject


def create_subject(subject):
    database = get_database()

    subject_data = subject.to_dict()

    result = database.subjects.insert_one(subject_data)

    return result.inserted_id


def get_subjects_by_user(user_id):
    database = get_database()

    subjects = database.subjects.find({
        "userId": ObjectId(user_id)
    })

    return list(subjects)

def get_subject_by_id(subject_id):
    database = get_database()

    subject = database.subjects.find_one({
        "_id": ObjectId(subject_id)
    })

    return subject