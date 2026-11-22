from pydantic import BaseModel, Field


class RecommendationResponse(BaseModel):
    overallScore: int = Field(ge=0, le=100)
    summary: str
    priority: str
    recommendations: list[dict]
    generatedByAI: bool = False
