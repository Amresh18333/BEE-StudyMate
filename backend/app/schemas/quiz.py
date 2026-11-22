from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class QuizQuestionResponse(BaseModel):
    id: str
    question: str
    options: list[str]
    correctAnswer: int = 0


class QuizResponse(BaseModel):
    id: str
    userId: str
    subjectId: Optional[str] = None
    topicId: Optional[str] = None
    topicName: Optional[str] = None
    title: str
    questions: list[QuizQuestionResponse]
    difficulty: str
    source: str = "topic"
    createdAt: Optional[datetime] = None


class QuizCreate(BaseModel):
    userId: str
    subjectId: Optional[str] = None
    topicId: Optional[str] = None
    topicName: Optional[str] = None
    title: str
    questions: list[dict]
    difficulty: str = "medium"


class QuizGenerateRequest(BaseModel):
    """Request body for the standalone AI quiz generator
    (Generate Quiz -> Quiz Module -> AI -> MongoDB)."""
    userId: str
    subjectId: Optional[str] = None
    topicId: Optional[str] = None
    topicName: str
    description: Optional[str] = ""
    numQuestions: int = 5
    difficulty: str = "medium"


class QuizSubmit(BaseModel):
    answers: list[dict]
    timeSpentSeconds: int = Field(default=0, ge=0, le=86400)


class QuizQuestionSubmit(BaseModel):
    questionId: str
    selectedAnswer: int


class QuizAttemptResponse(BaseModel):
    id: str
    userId: str
    quizId: str
    answers: list[dict]
    score: int
    totalQuestions: int
    timeSpentSeconds: int = 0
    completedAt: datetime