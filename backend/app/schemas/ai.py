from pydantic import BaseModel


class TopicSection(BaseModel):
    title: str
    body: str


class TopicContent(BaseModel):
    sections: list[TopicSection]
    keyPoints: list[str]
    examples: list[str]


class GenerateTopicContentResponse(BaseModel):
    topicId: str
    content: TopicContent
    difficulty: str
    estimatedMinutes: int