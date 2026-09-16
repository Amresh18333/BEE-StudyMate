from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SummarySection(BaseModel):
    title: str
    body: str


class SummaryContent(BaseModel):
    overview: str
    keyPoints: list[str]
    sections: list[SummarySection]
    flashcards: list[dict] = []


class SummaryResponse(BaseModel):
    id: str
    userId: str
    subjectId: Optional[str] = None
    title: str
    fileName: str
    summary: SummaryContent
    sourceCharCount: int
    createdAt: datetime
