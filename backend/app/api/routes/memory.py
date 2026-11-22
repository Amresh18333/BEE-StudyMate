from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services import memory_service as memory
from app.services.learner_type import classify
from app.utils.exceptions import validate_object_id

router = APIRouter(prefix="/memory", tags=["Memory"])


class SearchEvent(BaseModel):
    query: str
    kind: str | None = None      # "topic" or "subject"
    name: str | None = None


def _clean(entry):
    return {"kind": entry.get("k"), "text": entry.get("q"), "at": entry.get("t"),
            "extra": entry.get("x")}


@router.get("/{user_id}")
def get_memory(user_id: str, history_limit: int = Query(10, ge=0, le=50)):
    """Compact overview for the dashboard: learner type + a few recent items."""
    validate_object_id(user_id)
    profile = memory.get_profile(user_id) or {}
    recent_searches = sorted((profile.get("searches") or {}).values(),
                             key=lambda v: -v.get("c", 0))[:8]
    history = list(reversed(profile.get("history", [])))[:history_limit]
    return {
        "learner": classify(profile),
        "topSearches": [{"term": s.get("n"), "count": s.get("c", 0)} for s in recent_searches],
        "history": [_clean(h) for h in history],
        "recentScores": [r.get("p") for r in profile.get("recentQuiz", [])],
    }


@router.get("/{user_id}/history")
def get_history(user_id: str, kind: str | None = None, limit: int = Query(30, ge=1, le=50)):
    validate_object_id(user_id)
    return [_clean(h) for h in memory.get_history(user_id, kind, limit)]


@router.post("/{user_id}/search", status_code=204)
def save_search(user_id: str, event: SearchEvent):
    """Called when the student CLICKS a search result (not on every keystroke)."""
    validate_object_id(user_id)
    memory.record_search(user_id, event.query, event.kind, event.name)
    return None


@router.delete("/{user_id}/history", status_code=204)
def delete_history(user_id: str):
    validate_object_id(user_id)
    memory.clear_history(user_id)
    return None


@router.delete("/{user_id}", status_code=204)
def reset_everything(user_id: str):
    validate_object_id(user_id)
    memory.reset_memory(user_id)
    return None
