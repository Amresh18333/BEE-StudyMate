from fastapi import APIRouter, HTTPException
from bson import ObjectId

from app.schemas.study_plan import (
    StudyPlanGenerateRequest,
    StudyPlanResponse,
)
from app.services.study_plan_service import (
    generate_study_plan,
    create_study_plan,
    get_study_plans_by_user,
    get_study_plan_by_id,
    delete_study_plan,
)
from app.services.ai_service import get_subject
from app.models.study_plan import StudyPlan
from app.utils.exceptions import validate_object_id

router = APIRouter(
    prefix="/study-plan",
    tags=["Study Planner"]
)


def _format_plan_response(plan):
    return {
        "id": str(plan["_id"]),
        "userId": str(plan["userId"]),
        "subjectId": str(plan["subjectId"]) if plan.get("subjectId") else None,
        "title": plan["title"],
        "goal": plan["goal"],
        "hoursPerDay": plan.get("hoursPerDay", 2),
        "daysAvailable": plan.get("daysAvailable", 7),
        "examDate": plan.get("examDate"),
        "plan": plan["plan"],
        "createdAt": plan["createdAt"],
    }


@router.post("/generate", response_model=StudyPlanResponse, status_code=201)
def generate_and_save_plan(request: StudyPlanGenerateRequest):
    """Generate Plan -> [Study Planner Module] -> Gemini/OpenAI API -> MongoDB"""

    validate_object_id(request.userId)

    subject_name = None

    if request.subjectId:
        validate_object_id(request.subjectId)
        subject = get_subject(ObjectId(request.subjectId))
        if subject:
            subject_name = subject.get("name")

    try:
        plan_content = generate_study_plan(
            goal=request.goal,
            topics=request.topics,
            hours_per_day=request.hoursPerDay,
            days_available=request.daysAvailable,
            exam_date=request.examDate,
            subject_name=subject_name,
        )

        title = subject_name and f"{subject_name}: {request.goal}" or request.goal

        plan = StudyPlan(
            user_id=request.userId,
            subject_id=request.subjectId,
            title=title[:120],
            goal=request.goal,
            plan=plan_content,
            hours_per_day=request.hoursPerDay,
            days_available=request.daysAvailable,
            exam_date=request.examDate,
        )

        plan_id = create_study_plan(plan)
        created = get_study_plan_by_id(plan_id)

        return _format_plan_response(created)

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate study plan"
        )


@router.get("/user/{user_id}", response_model=list[StudyPlanResponse])
def list_user_plans(user_id: str, subject_id: str = None):
    validate_object_id(user_id)

    if subject_id:
        validate_object_id(subject_id)

    plans = get_study_plans_by_user(user_id, subject_id)

    return [_format_plan_response(plan) for plan in plans]


@router.get("/{plan_id}", response_model=StudyPlanResponse)
def get_plan(plan_id: str):
    validate_object_id(plan_id)

    plan = get_study_plan_by_id(plan_id)

    if plan is None:
        raise HTTPException(status_code=404, detail="Study plan not found")

    return _format_plan_response(plan)


@router.delete("/{plan_id}", status_code=204)
def remove_plan(plan_id: str):
    validate_object_id(plan_id)

    plan = get_study_plan_by_id(plan_id)

    if plan is None:
        raise HTTPException(status_code=404, detail="Study plan not found")

    delete_study_plan(plan_id)

    return None
