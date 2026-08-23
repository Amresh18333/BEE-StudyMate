from datetime import datetime

from pydantic import BaseModel


class StudySessionCreate(BaseModel):
    userId: str
    subjectId: str
    topicId: str


class StudySessionResponse(BaseModel):
    id: str
    userId: str
    subjectId: str
    topicId: str
    startedAt: datetime
    endedAt: datetime | None
    durationMinutes: int