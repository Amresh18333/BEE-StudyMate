from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StudyPlanGenerateRequest(BaseModel):
    userId: str
    subjectId: Optional[str] = None
    goal: str
    topics: Optional[str] = ""
    hoursPerDay: float = 2
    daysAvailable: int = 7
    examDate: Optional[str] = None


class PlanDayTask(BaseModel):
    task: str
    durationMinutes: int = 30
    completed: bool = False


class PlanDay(BaseModel):
    day: int
    label: str
    focus: str
    tasks: list[PlanDayTask]
    estimatedHours: float = 0


class PlanContent(BaseModel):
    durationDays: int
    summary: str
    schedule: list[PlanDay]
    tips: list[str] = []


class StudyPlanResponse(BaseModel):
    id: str
    userId: str
    subjectId: Optional[str] = None
    title: str
    goal: str
    hoursPerDay: float
    daysAvailable: int
    examDate: Optional[str] = None
    plan: PlanContent
    createdAt: datetime
