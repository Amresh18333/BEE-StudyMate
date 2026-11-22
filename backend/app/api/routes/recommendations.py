from fastapi import APIRouter

from app.schemas.recommendation import RecommendationResponse
from app.services.recommendation_service import get_recommendations
from app.utils.exceptions import validate_object_id


router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"],
)


@router.get(
    "/user/{user_id}",
    response_model=RecommendationResponse,
)
def get_user_recommendations(user_id: str):
    validate_object_id(user_id)
    return get_recommendations(user_id)
