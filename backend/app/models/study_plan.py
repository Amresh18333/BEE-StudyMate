from datetime import datetime
from bson import ObjectId


class StudyPlan:
    def __init__(
        self,
        user_id,
        title,
        goal,
        plan,
        subject_id=None,
        hours_per_day=2,
        days_available=7,
        exam_date=None,
    ):
        self.user_id = ObjectId(user_id)
        self.subject_id = ObjectId(subject_id) if subject_id else None
        self.title = title
        self.goal = goal
        self.hours_per_day = hours_per_day
        self.days_available = days_available
        self.exam_date = exam_date
        self.plan = plan
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "userId": self.user_id,
            "subjectId": self.subject_id,
            "title": self.title,
            "goal": self.goal,
            "hoursPerDay": self.hours_per_day,
            "daysAvailable": self.days_available,
            "examDate": self.exam_date,
            "plan": self.plan,
            "createdAt": self.created_at,
        }
