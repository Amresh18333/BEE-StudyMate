from pydantic import BaseModel


class TopicSection(BaseModel):
    title: str
    body: str


class TopicContent(BaseModel):
    sections: list[TopicSection] = []
    keyPoints: list[str] = []
    examples: list[str] = []


class TopicResponse(BaseModel):
    id: str
    userId: str
    subjectId: str
    name: str
    description: str
    order: int

    content: TopicContent = TopicContent()

    difficulty: str = "beginner"
    estimatedMinutes: int = 30