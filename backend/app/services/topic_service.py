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


# ---------------------------------------------------------------
# NEW: create / bulk-create / delete
# ---------------------------------------------------------------

def get_owned_subject(subject_id, user_id):
    """Return the subject only if it belongs to this user, else None."""
    database = get_database()

    subject = database.subjects.find_one({
        "_id": ObjectId(subject_id)
    })

    if subject is None:
        return None

    if str(subject.get("userId")) != str(user_id):
        return None

    return subject


def get_next_order(subject_id):
    """Next free position (1-based) in a subject's topic list."""
    database = get_database()

    last = database.topics.find_one(
        {"subjectId": ObjectId(subject_id)},
        sort=[("order", -1)]
    )

    if last is None:
        return 1

    return int(last.get("order", 0)) + 1


def create_topic_for_subject(
    user_id,
    subject_id,
    name,
    description="",
    difficulty="beginner",
    estimated_minutes=30
):
    topic = Topic(
        user_id=ObjectId(user_id),
        subject_id=ObjectId(subject_id),
        name=name,
        description=description,
        order=get_next_order(subject_id),
        difficulty=difficulty,
        estimated_minutes=estimated_minutes
    )

    topic_id = create_topic(topic)

    return get_topic_by_id(str(topic_id))


def create_topics_bulk(user_id, subject_id, items):
    """Insert many topics at the end of the subject's list.

    Topics whose name already exists in the subject are skipped, so
    pressing "Add all" twice never creates duplicates.
    """
    database = get_database()

    existing_names = {
        topic["name"].strip().lower()
        for topic in get_topics_by_subject(subject_id)
    }

    next_order = get_next_order(subject_id)
    documents = []

    for item in items:
        key = item.name.strip().lower()

        if key in existing_names:
            continue

        existing_names.add(key)

        topic = Topic(
            user_id=ObjectId(user_id),
            subject_id=ObjectId(subject_id),
            name=item.name,
            description=item.description,
            order=next_order,
            difficulty=item.difficulty,
            estimated_minutes=item.estimatedMinutes
        )

        documents.append(topic.to_dict())
        next_order += 1

    if not documents:
        return []

    database.topics.insert_many(documents)

    return get_topics_by_subject(subject_id)[-len(documents):]


def _id_variants(values):
    """IDs may be stored as ObjectId or string; match both."""
    variants = []
    for value in values:
        variants.append(value)
        variants.append(str(value))
    return variants


def delete_topic_cascade(topic_id):
    """Delete a topic plus everything that hangs off it."""
    database = get_database()

    topic_oid = ObjectId(topic_id)
    topic_ids = _id_variants([topic_oid])

    quiz_ids = [
        quiz["_id"]
        for quiz in database.quizzes.find(
            {"topicId": {"$in": topic_ids}},
            {"_id": 1}
        )
    ]

    if quiz_ids:
        database.quiz_attempts.delete_many({
            "quizId": {"$in": _id_variants(quiz_ids)}
        })
        database.quizzes.delete_many({"_id": {"$in": quiz_ids}})

    database.progress.delete_many({"topicId": {"$in": topic_ids}})
    database.study_sessions.delete_many({"topicId": {"$in": topic_ids}})

    result = database.topics.delete_one({"_id": topic_oid})

    return result.deleted_count


def renumber_topics(subject_id):
    """Close gaps in `order` after a delete (1, 2, 3, ...)."""
    database = get_database()

    for position, topic in enumerate(
        get_topics_by_subject(subject_id),
        start=1
    ):
        if topic.get("order") != position:
            database.topics.update_one(
                {"_id": topic["_id"]},
                {"$set": {"order": position}}
            )