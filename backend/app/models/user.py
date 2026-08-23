from datetime import datetime


class User:
    def __init__(
        self,
        name,
        email,
        password="",
        education="",
        college="",
        course="",
        semester=None,
        goals=None,
    ):
        self.name = name
        self.email = email
        self.password = password
        self.education = education
        self.college = college
        self.course = course
        self.semester = semester
        self.goals = goals if goals is not None else []
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def to_dict(self):
        return {
            "name": self.name,
            "email": self.email,
            "password": self.password,
            "education": self.education,
            "college": self.college,
            "course": self.course,
            "semester": self.semester,
            "goals": self.goals,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }