from datetime import datetime


class Quiz:
    def __init__(
        self,
        user_id,
        subject_id,
        topic_id,
        title,
        questions=None,
        difficulty="medium",
    ):
        self.user_id = user_id
        self.subject_id = subject_id
        self.topic_id = topic_id
        self.title = title
        self.questions = questions if questions is not None else []
        self.difficulty = difficulty
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "userId": self.user_id,
            "subjectId": self.subject_id,
            "topicId": self.topic_id,
            "title": self.title,
            "questions": self.questions,
            "difficulty": self.difficulty,
            "createdAt": self.created_at,
        }
    