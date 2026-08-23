from fastapi import APIRouter

from app.api.routes import users
from app.api.routes import subjects
from app.api.routes import topics
from app.api.routes import progress
from app.api.routes import quizzes
from app.api.routes import study_sessions
from app.api.routes import ai


api_router = APIRouter(
    prefix="/api/v1"
)


api_router.include_router(users.router)
api_router.include_router(subjects.router)
api_router.include_router(topics.router)
api_router.include_router(progress.router)
api_router.include_router(quizzes.router)
api_router.include_router(study_sessions.router)
api_router.include_router(ai.router)