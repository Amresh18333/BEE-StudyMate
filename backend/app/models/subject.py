from datetime import datetime

from bson import ObjectId


class Subject:
    def __init__(
        self,
        user_id,
        name,
        description="",
    ):
        self.user_id = ObjectId(user_id)
        self.name = name
        self.description = description
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def to_dict(self):
        return {
            "userId": self.user_id,
            "name": self.name,
            "description": self.description,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }