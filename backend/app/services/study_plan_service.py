import json

from bson import ObjectId

from app.database.connection import get_database
from app.services.ai_service import client
from app.schemas.study_plan import PlanContent
from app.models.study_plan import StudyPlan


def generate_study_plan(
    goal: str,
    topics: str = "",
    hours_per_day: float = 2,
    days_available: int = 7,
    exam_date: str = None,
    subject_name: str = None,
):
    """Generate Plan -> [Study Planner Module] -> Gemini/OpenAI API"""

    if not goal or not goal.strip():
        raise ValueError("A study goal is required")

    days_available = max(1, min(int(days_available or 7), 60))
    hours_per_day = max(0.5, min(float(hours_per_day or 2), 12))

    prompt = f"""
You are an expert academic study planner helping a student prepare
efficiently for their goal.

GOAL:
{goal}

SUBJECT (if any):
{subject_name or "General / not specified"}

TOPICS OR SYLLABUS TO COVER (if provided):
{topics or "Not provided - infer reasonable topics from the goal."}

CONSTRAINTS:
- The student has {days_available} day(s) available.
- The student can study about {hours_per_day} hour(s) per day.
- Exam / deadline date: {exam_date or "Not specified"}

Create a realistic, day-by-day study plan.

Return ONLY valid JSON with exactly this structure:

{{
    "durationDays": {days_available},
    "summary": "A short 1-3 sentence summary of the overall strategy",
    "schedule": [
        {{
            "day": 1,
            "label": "Day 1",
            "focus": "Main focus area for this day",
            "tasks": [
                {{"task": "Specific, actionable study task", "durationMinutes": 45, "completed": false}}
            ],
            "estimatedHours": 2
        }}
    ],
    "tips": ["Practical study tip"]
}}

Requirements:

- Include exactly {days_available} entries in "schedule", one per day, in order.
- Each day must have 2 to 5 concrete, specific tasks (not vague like "study").
- Daily estimatedHours should be close to {hours_per_day} but never exceed it by more than 20%.
- Build up difficulty gradually and include revision/practice days near the end
  (e.g. practice questions, mock tests, review) especially if an exam date is given.
- Include 3 to 6 practical study tips relevant to the goal.
- Do not include markdown outside the JSON.
- Return only JSON.
"""

    response = client.chat.completions.create(
        model="nvidia/nemotron-3-nano-30b-a3b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are StudyMate's study planner. You always "
                    "return only the requested JSON structure with "
                    "realistic, well-paced day-by-day plans."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3,
        max_tokens=3500
    )

    raw_content = response.choices[0].message.content

    if not raw_content:
        raise ValueError("AI returned an empty response")

    try:
        parsed = json.loads(raw_content)

    except json.JSONDecodeError as error:
        raise ValueError("AI returned invalid JSON") from error

    if "schedule" not in parsed or not parsed["schedule"]:
        raise ValueError("AI response is missing a schedule")

    plan_content = PlanContent.model_validate({
        "durationDays": parsed.get("durationDays", days_available),
        "summary": parsed.get("summary", ""),
        "schedule": parsed["schedule"],
        "tips": parsed.get("tips", []),
    })

    return plan_content.model_dump()


def create_study_plan(plan: StudyPlan):
    database = get_database()

    result = database.study_plans.insert_one(plan.to_dict())

    return result.inserted_id


def get_study_plans_by_user(user_id, subject_id=None):
    database = get_database()

    query = {"userId": ObjectId(user_id)}

    if subject_id:
        query["subjectId"] = ObjectId(subject_id)

    plans = database.study_plans.find(query).sort("createdAt", -1)

    return list(plans)


def get_study_plan_by_id(plan_id):
    database = get_database()

    return database.study_plans.find_one({"_id": ObjectId(plan_id)})


def delete_study_plan(plan_id):
    database = get_database()

    result = database.study_plans.delete_one({"_id": ObjectId(plan_id)})

    return result.deleted_count
