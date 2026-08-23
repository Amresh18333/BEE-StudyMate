from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.database.connection import get_database

app = FastAPI()
@app.exception_handler(Exception)
async def unexpected_error_handler(
    request: Request,
    exc: Exception
):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error"
        }
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router)


@app.get("/")
def home():
    return {"message": "StudyMate API is running"}


@app.get("/api/v1/test")
def test_connection():
    return {"message": "Frontend can connect to StudyMate backend"}


@app.get("/api/v1/database")
def test_database():
    database = get_database()

    database.command("ping")

    return {"message": "MongoDB connection successful"}