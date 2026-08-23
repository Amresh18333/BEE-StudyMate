from datetime import datetime

from bson import ObjectId


class Topic:

    def __init__(
        self,
        user_id,
        subject_id,
        name,
        description="",
        order=0,
        content=None,
        difficulty="beginner",
        estimated_minutes=30,
    ):
        self.user_id = ObjectId(user_id)
        self.subject_id = ObjectId(subject_id)
        self.name = name
        self.description = description
        self.order = order

        self.content = content or {
            "sections": [],
            "keyPoints": [],
            "examples": []
        }

        self.difficulty = difficulty
        self.estimated_minutes = estimated_minutes

        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()


    def to_dict(self):

        return {
            "userId": self.user_id,
            "subjectId": self.subject_id,

            "name": self.name,
            "description": self.description,
            "order": self.order,

            "content": self.content,

            "difficulty": self.difficulty,
            "estimatedMinutes": self.estimated_minutes,

            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }