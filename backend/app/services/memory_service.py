"""Learner memory.

ONE small document per student in the `learner_profiles` collection.
It holds counters (not full records) and a few short, capped lists, so:
  * every event is a single atomic update (one round trip),
  * reading the profile is a single indexed lookup (userId),
  * the document can never grow past a few KB.

Memory is best-effort: if saving fails, the real feature (quiz, search,
summary, chat) must still work. So every record_* function swallows errors.
"""
import re
from datetime import datetime

from bson import ObjectId

from app.database.connection import get_database

COLLECTION = "learner_profiles"

HISTORY_LIMIT = 50          # newest N history entries kept
MAX_TEXT = 120              # characters kept of any question/search/title
MAX_RECENT_QUIZZES = 10
MAX_TOPICS = 40             # tracked topics (lowest-count ones are pruned)
MAX_SEARCHES = 40
MAX_DAYS = 30               # distinct active days kept

_index_ready = False


def _profiles():
    global _index_ready
    collection = get_database()[COLLECTION]
    if not _index_ready:
        try:
            collection.create_index("userId", unique=True)
        except Exception:
            pass
        _index_ready = True
    return collection


def _short(text, limit=MAX_TEXT):
    text = re.sub(r"\s+", " ", str(text or "")).strip()
    return text[:limit]


def _slug(text):
    """Safe MongoDB key: no dots, no $, bounded length."""
    return re.sub(r"[^a-z0-9]+", "_", str(text).lower()).strip("_")[:40] or "x"


def _uid(user_id):
    return ObjectId(user_id)


def _history_entry(kind, text, extra=None):
    entry = {"k": kind, "q": _short(text), "t": datetime.utcnow()}
    if extra:
        entry["x"] = extra
    return entry


def _apply(user_id, inc=None, set_=None, history=None, add_day=True, prune=("topics", "searches")):
    """One upsert: counters, optional history entry, optional active day."""
    update = {"$setOnInsert": {"createdAt": datetime.utcnow()},
              "$set": {"updatedAt": datetime.utcnow(), **(set_ or {})}}
    inc = dict(inc or {})
    inc["events"] = inc.get("events", 0) + 1
    update["$inc"] = inc
    if history is not None:
        update["$push"] = {"history": {"$each": [history], "$slice": -HISTORY_LIMIT}}
    if add_day:
        update["$addToSet"] = {"days": datetime.utcnow().strftime("%Y-%m-%d")}
    doc = _profiles().find_one_and_update(
        {"userId": _uid(user_id)}, update, upsert=True, return_document=True,
        projection={"topics": 1, "searches": 1, "days": 1},
    )
    _prune(user_id, doc or {})


def _prune(user_id, doc):
    """Keep dictionaries/lists bounded. Only touches the DB when a cap is exceeded."""
    unset, set_ = {}, {}
    for field, cap in (("topics", MAX_TOPICS), ("searches", MAX_SEARCHES)):
        items = doc.get(field) or {}
        if len(items) > cap:
            ranked = sorted(items.items(), key=lambda kv: kv[1].get("c", 0))
            for key, _ in ranked[: len(items) - cap]:
                unset[f"{field}.{key}"] = ""
    days = doc.get("days") or []
    if len(days) > MAX_DAYS:
        set_["days"] = sorted(days)[-MAX_DAYS:]
    ops = {}
    if unset:
        ops["$unset"] = unset
    if set_:
        ops["$set"] = set_
    if ops:
        _profiles().update_one({"userId": _uid(user_id)}, ops)


def _safe(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as error:      # memory must never break a real feature
            print(f"MEMORY (ignored): {func.__name__}: {error}")
            return None
    wrapper.__name__ = func.__name__
    return wrapper


# ---------------------------------------------------------------- recording

@_safe
def record_quiz(user_id, topic_name, score, total, seconds):
    if not total:
        return
    percent = round(100 * score / total)
    inc = {"quiz.attempts": 1, "quiz.questions": total, "quiz.seconds": max(0, int(seconds or 0)),
           "quiz.pctSum": percent}
    set_ = {}
    if topic_name:
        key = f"topics.{_slug(topic_name)}"
        inc[key + ".c"] = 1
        inc[key + ".s"] = percent
        set_[key + ".n"] = _short(topic_name, 60)
    _apply(user_id, inc=inc, set_=set_,
           history=_history_entry("quiz", f"{topic_name or 'Quiz'} - {percent}%", {"p": percent}))
    # Recent scores for the trend: a separate capped push (tiny)
    _profiles().update_one({"userId": _uid(user_id)}, {"$push": {"recentQuiz": {
        "$each": [{"p": percent, "t": datetime.utcnow()}], "$slice": -MAX_RECENT_QUIZZES}}})


@_safe
def record_study(user_id, minutes):
    minutes = max(0, int(minutes or 0))
    hour = datetime.utcnow().hour
    bucket = "night" if hour < 6 else "morning" if hour < 12 else "afternoon" if hour < 18 else "evening"
    _apply(user_id, inc={"study.sessions": 1, "study.minutes": minutes, f"study.{bucket}": 1})


@_safe
def record_search(user_id, term, kind=None, name=None):
    term = _short(term, 60)
    if len(term) < 2:
        return
    key = f"searches.{_slug(term)}"
    _apply(user_id, inc={key + ".c": 1, "counts.search": 1}, set_={key + ".n": term},
           history=_history_entry("search", name or term, {"kind": kind} if kind else None))


@_safe
def record_summary(user_id, title, pages_sections=0):
    _apply(user_id, inc={"counts.summary": 1}, history=_history_entry("summary", title))


@_safe
def record_chat(user_id, question, with_document=False):
    _apply(user_id, inc={"counts.chat": 1},
           history=_history_entry("chat", question, {"doc": True} if with_document else None))


# ------------------------------------------------------------------ reading

def get_profile(user_id):
    """The whole compact document (or None). One indexed read."""
    return _profiles().find_one({"userId": _uid(user_id)}, {"_id": 0})


def get_history(user_id, kind=None, limit=20):
    doc = _profiles().find_one({"userId": _uid(user_id)}, {"history": 1, "_id": 0}) or {}
    items = list(reversed(doc.get("history", [])))
    if kind:
        items = [h for h in items if h.get("k") == kind]
    return items[:limit]


def clear_history(user_id):
    _profiles().update_one({"userId": _uid(user_id)}, {"$set": {"history": [], "searches": {}}})


def reset_memory(user_id):
    return _profiles().delete_one({"userId": _uid(user_id)}).deleted_count


def personalization_hints(user_id):
    """Small dict used to personalize search, summaries and chat. Never raises."""
    try:
        from app.services.learner_type import classify, topic_stats
        profile = get_profile(user_id)
        if not profile:
            return {}
        info = classify(profile)
        stats = topic_stats(profile)
        return {
            "type": info["key"],
            "pace": info["pace"],
            "weak": [t["name"] for t in stats["weak"]],
            "strong": [t["name"] for t in stats["strong"]],
            "searched": [v.get("n", "") for v in (profile.get("searches") or {}).values()],
            "score": info["avgQuizScore"],
            "trait": info["trait"],
            "typeName": info["name"],
            "confident": info["key"] != "new",
        }
    except Exception as error:
        print(f"MEMORY hints (ignored): {error}")
        return {}


def _clean_for_prompt(text, limit=50):
    """Names come from the student's own data: keep them plain so they cannot act as instructions."""
    return re.sub(r"[^A-Za-z0-9 +#.,&()/-]", "", str(text))[:limit].strip()


def personalization_note(user_id, purpose="general", topic_name=None):
    """Short text appended to an AI prompt so the answer fits THIS student.

    purpose: lesson | quiz | plan | path | summary | coach | general
    Returns "" when there is no memory yet (the feature then behaves as before).
    """
    if not user_id:
        return ""
    hints = personalization_hints(user_id)
    if not hints or not hints.get("confident"):
        weak = hints.get("weak", []) if hints else []
        if not weak:
            return ""
    lines = []
    pace = hints.get("pace")
    weak = [_clean_for_prompt(w) for w in hints.get("weak", [])[:3] if w]
    strong = [_clean_for_prompt(w) for w in hints.get("strong", [])[:3] if w]
    score = hints.get("score")

    if hints.get("typeName") and hints.get("confident"):
        lines.append(f"Learner type: {hints['typeName']}.")
    if weak:
        lines.append("Struggles with: " + ", ".join(weak) + ".")
    if strong:
        lines.append("Strong at: " + ", ".join(strong) + ".")
    if score is not None:
        lines.append(f"Average quiz score: {score}%.")

    topic_is_weak = bool(topic_name) and any(
        w and (w.lower() in topic_name.lower() or topic_name.lower() in w.lower()) for w in weak)

    if purpose == "lesson":
        if pace == "fast":
            lines.append("Keep the lesson concise: short sections, direct explanations.")
        elif pace == "slow":
            lines.append("Explain in depth, step by step, with a worked example.")
        if topic_is_weak:
            lines.append("The student has struggled with this topic: start from the fundamentals.")
    elif purpose == "quiz":
        if score is not None and score >= 85:
            lines.append("They score high: make the questions a little more challenging.")
        elif score is not None and score < 55:
            lines.append("They score low: include foundational questions and clear wording.")
        if topic_is_weak:
            lines.append("They have struggled with this topic: cover its core ideas.")
    elif purpose == "plan":
        if pace == "slow":
            lines.append("Use shorter study blocks with a review step each day.")
        elif pace == "fast":
            lines.append("They learn quickly: the plan can be denser, with quick self-tests.")
        if weak:
            lines.append("Give extra time to their weak topics.")
        if hints.get("trait"):
            lines.append(f"They are a '{hints['trait']}': schedule hard topics at that time of day.")
    elif purpose == "path":
        if weak:
            lines.append("Include prerequisite reinforcement for their weak areas.")
        if pace == "slow":
            lines.append("Prefer smaller steps.")
    elif purpose == "summary":
        pass
    elif purpose == "coach":
        pass

    if not lines:
        return ""
    return ("\nSTUDENT PROFILE (built from this student's own study history). Use it silently to adapt "
            "depth, pacing and emphasis. Do not mention the profile, and do not change the required JSON format:\n"
            + " ".join(lines) + "\n")
