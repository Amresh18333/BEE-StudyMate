from datetime import datetime

from bson import ObjectId


class StudySession:
    def __init__(
        self,
        user_id,
        subject_id,
        topic_id,
        started_at=None,
        ended_at=None,
        duration_minutes=0,
    ):
        self.user_id = ObjectId(user_id)
        self.subject_id = ObjectId(subject_id)
        self.topic_id = ObjectId(topic_id)
        self.started_at = (
            started_at
            if started_at
            else datetime.utcnow()
        )
        self.ended_at = ended_at
        self.duration_minutes = duration_minutes
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "userId": self.user_id,
            "subjectId": self.subject_id,
            "topicId": self.topic_id,
            "startedAt": self.started_at,
            "endedAt": self.ended_at,
            "durationMinutes": self.duration_minutes,
            "createdAt": self.created_at,
        }