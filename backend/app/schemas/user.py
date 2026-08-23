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