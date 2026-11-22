from pydantic import BaseModel, Field, field_validator

VALID_DIFFICULTIES = ("beginner", "intermediate", "advanced")


def clean_difficulty(value) -> str:
    """Lower-case a difficulty value and fall back to 'beginner'."""
    value = str(value or "").strip().lower()
    return value if value in VALID_DIFFICULTIES else "beginner"


def clamp_minutes(value, default: int = 30) -> int:
    try:
        minutes = int(value)
    except (TypeError, ValueError):
        return default
    return max(5, min(minutes, 600))


class TopicCreate(BaseModel):
    userId: str
    subjectId: str
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=500)
    difficulty: str = "beginner"
    estimatedMinutes: int = 30

    @field_validator("name", "description")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("name")
    @classmethod
    def _name_not_blank(cls, value: str) -> str:
        if not value:
            raise ValueError("Topic name cannot be empty")
        return value

    @field_validator("difficulty")
    @classmethod
    def _difficulty(cls, value: str) -> str:
        return clean_difficulty(value)

    @field_validator("estimatedMinutes")
    @classmethod
    def _minutes(cls, value: int) -> int:
        return clamp_minutes(value)


class TopicBulkItem(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=500)
    difficulty: str = "beginner"
    estimatedMinutes: int = 30

    @field_validator("name", "description")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("difficulty")
    @classmethod
    def _difficulty(cls, value: str) -> str:
        return clean_difficulty(value)

    @field_validator("estimatedMinutes")
    @classmethod
    def _minutes(cls, value: int) -> int:
        return clamp_minutes(value)


class TopicBulkCreate(BaseModel):
    userId: str
    subjectId: str
    topics: list[TopicBulkItem] = Field(min_length=1, max_length=30)