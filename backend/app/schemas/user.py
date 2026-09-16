from pydantic import BaseModel


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    education: str
    college: str
    course: str
    semester: int | None
    goals: list


class UserUpdate(BaseModel):
    name: str | None = None
    education: str | None = None
    college: str | None = None
    course: str | None = None
    semester: int | None = None
    goals: list[str] | None = None