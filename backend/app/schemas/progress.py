from datetime import datetime

from pydantic import BaseModel, Field


class ProgressCreate(BaseModel):
    userId: str
    subjectId: str
    topicId: str
    status: str = "in_progress"
    completionPercentage: int = Field(
        default=0,
        ge=0,
        le=100
    )


class ProgressUpdate(BaseModel):
    status: str | None = None
    completionPercentage: int | None = Field(
        default=None,
        ge=0,
        le=100
    )


class ProgressResponse(BaseModel):
    id: str
    userId: str
    subjectId: str
    topicId: str
    status: str
    completionPercentage: int
    lastStudiedAt: datetime | None