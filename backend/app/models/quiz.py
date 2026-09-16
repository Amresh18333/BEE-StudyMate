from datetime import datetime
from bson import ObjectId


class Quiz:
    def __init__(
        self,
        user_id,
        title,
        subject_id=None,
        topic_id=None,
        topic_name=None,
        questions=None,
        difficulty="medium",
        source="topic",
    ):
        self.user_id = ObjectId(user_id)
        self.subject_id = ObjectId(subject_id) if subject_id else None
        self.topic_id = ObjectId(topic_id) if topic_id else None
        self.topic_name = topic_name
        self.title = title
        self.questions = questions if questions is not None else []
        self.difficulty = difficulty
        # "topic" = generated for an existing subject/topic record
        # "custom" = standalone quiz generated from a free-text prompt
        self.source = source
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "userId": self.user_id,
            "subjectId": self.subject_id,
            "topicId": self.topic_id,
            "topicName": self.topic_name,
            "title": self.title,
            "questions": self.questions,
            "difficulty": self.difficulty,
            "source": self.source,
            "createdAt": self.created_at,
        }


class QuizAttempt:
    def __init__(
        self,
        user_id,
        quiz_id,
        answers=None,
        score=0,
        total_questions=0,
    ):
        self.user_id = ObjectId(user_id)
        self.quiz_id = ObjectId(quiz_id)
        self.answers = answers if answers is not None else []
        self.score = score
        self.total_questions = total_questions
        self.completed_at = datetime.utcnow()

    def to_dict(self):
        return {
            "userId": self.user_id,
            "quizId": self.quiz_id,
            "answers": self.answers,
            "score": self.score,
            "totalQuestions": self.total_questions,
            "completedAt": self.completed_at,
        }
    