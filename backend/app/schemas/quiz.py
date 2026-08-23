from pydantic import BaseModel


class QuizQuestionResponse(BaseModel):
    id: str
    question: str
    options: list[str]


class QuizResponse(BaseModel):
    id: str
    userId: str
    subjectId: str
    topicId: str
    title: str
    questions: list[QuizQuestionResponse]
    difficulty: str