from pydantic import BaseModel, Field


class SubjectCreate(BaseModel):
    userId: str
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)


class SubjectResponse(BaseModel):
    id: str
    userId: str
    name: str
    description: str