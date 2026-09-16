from datetime import datetime
from bson import ObjectId


class Summary:
    def __init__(
        self,
        user_id,
        title,
        file_name,
        summary,
        subject_id=None,
        source_char_count=0,
    ):
        self.user_id = ObjectId(user_id)
        self.subject_id = ObjectId(subject_id) if subject_id else None
        self.title = title
        self.file_name = file_name
        self.summary = summary
        self.source_char_count = source_char_count
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "userId": self.user_id,
            "subjectId": self.subject_id,
            "title": self.title,
            "fileName": self.file_name,
            "summary": self.summary,
            "sourceCharCount": self.source_char_count,
            "createdAt": self.created_at,
        }
