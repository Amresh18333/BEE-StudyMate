from datetime import datetime

from bson import ObjectId


class Progress:
    def __init__(
        self,
        user_id,
        subject_id,
        topic_id,
        status="not_started",
        completion_percentage=0,
    ):
        self.user_id = ObjectId(user_id)
        self.subject_id = ObjectId(subject_id)
        self.topic_id = ObjectId(topic_id)
        self.status = status
        self.completion_percentage = completion_percentage
        self.last_studied_at = None
        self.updated_at = datetime.utcnow()

    def to_dict(self):
        return {
            "userId": self.user_id,
            "subjectId": self.subject_id,
            "topicId": self.topic_id,
            "status": self.status,
            "completionPercentage": self.completion_percentage,
            "lastStudiedAt": self.last_studied_at,
            "updatedAt": self.updated_at,
        }