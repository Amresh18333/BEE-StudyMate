from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.topic_create import clamp_minutes, clean_difficulty


class LearningPathRequest(BaseModel):
    userId: Optional[str] = None
    subjectId: str
    goal: str = Field(default="", max_length=300)
    level: str = "beginner"
    numTopics: int = Field(default=8, ge=3, le=15)

    @field_validator("level")
    @classmethod
    def _level(cls, value: str) -> str:
        return clean_difficulty(value)

class LearningPathRequest(BaseModel):
    userId: str
    subjectId: str
    goal: str = Field(default="", max_length=300)
    level: str = "beginner"
    numTopics: int = Field(default=8, ge=3, le=15)

    @field_validator("level")
    @classmethod
    def _level(cls, value: str) -> str:
        return clean_difficulty(value)


class LearningPathStep(BaseModel):
    """One step of the AI roadmap. Lenient on purpose: AI output is
    cleaned (not rejected) so one odd field doesn't lose the whole path."""
    order: int = 0
    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    difficulty: str = "beginner"
    estimatedMinutes: int = 30
    outcome: str = ""

    @field_validator("name", mode="before")
    @classmethod
    def _name(cls, value):
        return str(value or "").strip()[:120]

    @field_validator("description", "outcome", mode="before")
    @classmethod
    def _text(cls, value):
        return str(value or "").strip()[:500]

    @field_validator("difficulty", mode="before")
    @classmethod
    def _difficulty(cls, value):
        return clean_difficulty(value)

    @field_validator("estimatedMinutes", mode="before")
    @classmethod
    def _minutes(cls, value):
        return clamp_minutes(value)


class LearningPathAI(BaseModel):
    """Shape we expect back from the model."""
    title: str = "Learning Path"
    summary: str = ""
    steps: list[LearningPathStep] = Field(min_length=1)


class LearningPathResponse(BaseModel):
    id: str
    subjectId: str
    goal: str
    level: str
    numTopics: int
    title: str
    summary: str
    totalMinutes: int
    steps: list[LearningPathStep]
    createdAt: str