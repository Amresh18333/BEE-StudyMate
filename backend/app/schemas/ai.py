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


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correctAnswer: int


class GenerateQuizResponse(BaseModel):
    topicId: str
    title: str
    questions: list[QuizQuestion]
    difficulty: str