"""Turns the compact profile into a learner type. Pure functions, no database.

This is a transparent rule-based guess from the student's own activity, not a
psychological test. Every label comes with the evidence that produced it.
"""

MIN_EVENTS = 4          # below this we say "still learning about you"
FAST_SECONDS = 20       # average seconds per quiz question
SLOW_SECONDS = 45
LONG_SESSION = 25       # average study-session minutes
SHORT_SESSION = 12

TYPES = {
    "fast": ("Fast & responsive", "You answer quickly and study in short bursts.",
             ["Use short, frequent sessions and quick quizzes.",
              "Slow down on questions you got wrong: speed can hide small mistakes."]),
    "slow": ("Slow & informative", "You take your time and prefer to understand things in depth.",
             ["Read the detailed explanations and summaries fully.",
              "Use flashcards after reading to lock details in."]),
    "deep": ("Deep diver", "You study in long focused sessions.",
             ["Take a 5-minute break every 25-30 minutes.",
              "End each session with a quick quiz to check retention."]),
    "practice": ("Practice-driven", "You learn mainly by testing yourself.",
                 ["Review every wrong answer before the next quiz.",
                  "Mix in reading on your weakest topics."]),
    "explorer": ("Explorer", "You search, ask and summarize a lot before settling on a topic.",
                 ["Pick one topic from your searches and finish it before moving on.",
                  "Turn your summaries into quizzes."]),
    "steady": ("Steady all-rounder", "You balance reading, practice and pace.",
               ["Keep your routine going.", "Set a weekly target for sessions and quizzes."]),
    "new": ("Still learning about you", "Use StudyMate a bit more (quizzes, study sessions, searches) and your learner type will appear.", []),
}


def _g(d, *path, default=0):
    for p in path:
        if not isinstance(d, dict):
            return default
        d = d.get(p, default)
    return d if d is not None else default


def topic_stats(profile, limit=3):
    topics = []
    for v in (profile.get("topics") or {}).values():
        c = v.get("c", 0)
        if c:
            topics.append({"name": v.get("n", ""), "attempts": c, "avg": round(v.get("s", 0) / c)})
    weak = sorted([t for t in topics if t["avg"] < 60], key=lambda t: t["avg"])[:limit]
    strong = sorted([t for t in topics if t["avg"] >= 80], key=lambda t: -t["avg"])[:limit]
    return {"weak": weak, "strong": strong}


def classify(profile):
    q = _g(profile, "quiz", default={})
    attempts, questions = _g(q, "attempts"), _g(q, "questions")
    avg_seconds = round(_g(q, "seconds") / questions) if questions else None
    accuracy = round(_g(q, "pctSum") / attempts) if attempts else None

    st = _g(profile, "study", default={})
    sessions = _g(st, "sessions")
    avg_session = round(_g(st, "minutes") / sessions) if sessions else None

    counts = _g(profile, "counts", default={})
    reading = _g(counts, "search") + _g(counts, "summary") + _g(counts, "chat")
    events = _g(profile, "events")

    evidence = []
    if avg_seconds is not None:
        evidence.append(f"Average {avg_seconds}s per quiz question")
    if accuracy is not None:
        evidence.append(f"Average quiz score {accuracy}%")
    if avg_session is not None:
        evidence.append(f"Average study session {avg_session} min")
    if reading:
        evidence.append(f"{reading} searches/summaries/questions")

    fast = avg_seconds is not None and questions >= 5 and avg_seconds <= FAST_SECONDS
    slow = avg_seconds is not None and questions >= 5 and avg_seconds >= SLOW_SECONDS
    long_s = avg_session is not None and sessions >= 2 and avg_session >= LONG_SESSION
    short_s = avg_session is not None and sessions >= 2 and avg_session <= SHORT_SESSION

    if events < MIN_EVENTS:
        key = "new"
    elif fast and (short_s or avg_session is None):
        key = "fast"
    elif slow and (accuracy is None or accuracy >= 60 or long_s):
        key = "slow"
    elif long_s:
        key = "deep"
    elif attempts >= 3 and attempts >= 2 * max(sessions, 1) and attempts >= reading:
        key = "practice"
    elif reading >= 6 and reading >= 2 * max(attempts, 1):
        key = "explorer"
    elif fast:
        key = "fast"
    elif slow:
        key = "slow"
    else:
        key = "steady"

    name, description, tips = TYPES[key]

    # Time-of-day trait
    parts = {k: _g(st, k) for k in ("night", "morning", "afternoon", "evening")}
    total_parts = sum(parts.values())
    trait = None
    if total_parts >= 3:
        best = max(parts, key=parts.get)
        if parts[best] / total_parts >= 0.5:
            trait = {"night": "Night owl", "morning": "Early bird",
                     "afternoon": "Afternoon learner", "evening": "Evening learner"}[best]

    pace = "fast" if key == "fast" else "slow" if key in ("slow", "deep") else "balanced"
    stats = topic_stats(profile)
    return {
        "key": key, "name": name, "description": description, "tips": tips,
        "pace": pace, "trait": trait, "evidence": evidence,
        "confidence": round(min(1.0, events / 20), 2), "basedOnActivities": events,
        "avgSecondsPerQuestion": avg_seconds, "avgQuizScore": accuracy,
        "avgSessionMinutes": avg_session, "sessions": sessions, "quizAttempts": attempts,
        "activeDays": len(profile.get("days") or []),
        "weakTopics": stats["weak"], "strongTopics": stats["strong"],
    }
