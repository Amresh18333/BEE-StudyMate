"""Backend tests for learner memory + personalization. No network, no real MongoDB.
Usage: python test_memory_backend.py <path to backend folder that contains app/>"""
import io, json, os, re, sys
os.environ.update(MONGODB_URI="mongodb://localhost:1", DATABASE_NAME="t", SECRET_KEY="t", NVIDIA_API_KEY="dummy")
sys.path.insert(0, sys.argv[1])

import mongomock
from bson import ObjectId
import app.database.connection as conn
DB = mongomock.MongoClient()["t"]
conn.get_database = lambda: DB          # every module imports this name later, so they all get the fake DB

from fastapi.testclient import TestClient
from app.main import app
import app.services.ai_service as AI
from app.services import memory_service as M
from app.services.learner_type import classify

PROMPTS = []     # every prompt sent to the "AI"


class FakeMsg:
    def __init__(self, c): self.content = c
class FakeChoice:
    def __init__(self, c): self.message = FakeMsg(c)
class FakeResp:
    def __init__(self, c): self.choices = [FakeChoice(c)]

QUIZ = {"title": "Quiz", "difficulty": "medium", "questions": [
    {"question": f"Q{i}?", "options": ["a", "b", "c", "d"], "correctAnswer": 0} for i in range(5)]}
LESSON = {"content": {"sections": [{"title": "Intro", "body": "Body"}], "keyPoints": ["k"], "examples": ["e"]},
          "difficulty": "beginner", "estimatedMinutes": 20}
PLAN = {"title": "Plan", "durationDays": 3, "summary": "s", "schedule": [{"day": i, "label": f"Day {i}", "focus": "f", "tasks": [{"task": "t1", "durationMinutes": 30}, {"task": "t2", "durationMinutes": 30}], "estimatedHours": 2} for i in range(1, 4)],
        "tips": ["tip"]}
PATH = {"title": "Path", "summary": "s", "steps": [{"order": i, "name": f"S{i}", "description": "d", "difficulty": "beginner", "estimatedMinutes": 30, "outcome": "o"} for i in range(1, 4)]}


def fake_create(**kw):
    msgs = kw["messages"]
    text = "\n".join(m["content"] for m in msgs)
    PROMPTS.append(text)
    if "learning path" in text.lower() or "roadmap" in text.lower():
        return FakeResp(json.dumps(PATH))
    if "study planner" in text.lower():
        return FakeResp(json.dumps(PLAN))
    if "adaptive learning coach" in text:
        return FakeResp('{"summary": "Good work.", "nextStep": "Review Stack."}')
    if "quiz" in text.lower() and "multiple-choice" in text.lower() or "practice quiz" in text.lower():
        return FakeResp(json.dumps(QUIZ))
    if "learning lesson" in text.lower() or "content generator" in text.lower():
        return FakeResp(json.dumps(LESSON))
    if "document summarizer" in text.lower() or "summar" in text.lower() and "json" in text.lower():
        return FakeResp("not json")      # summarizer falls back to extractive: still must work
    return FakeResp("Here is the answer.")

class FakeClient:
    class chat:
        class completions:
            create = staticmethod(fake_create)

AI.client = FakeClient
for mod in ("study_plan_service", "learning_path_service", "recommendation_service"):
    m = __import__(f"app.services.{mod}", fromlist=["x"])
    m.client = FakeClient

http = TestClient(app, raise_server_exceptions=False)
CHECKS = []
def ok(msg): CHECKS.append(msg); print("PASS", msg)

UID = str(ObjectId())
def mk_user_data():
    subj = DB.subjects.insert_one({"userId": ObjectId(UID), "name": "Data Structures", "description": "DS"}).inserted_id
    t1 = DB.topics.insert_one({"userId": ObjectId(UID), "subjectId": subj, "name": "Stack", "description": "LIFO", "difficulty": "beginner"}).inserted_id
    t2 = DB.topics.insert_one({"userId": ObjectId(UID), "subjectId": subj, "name": "Queue", "description": "FIFO", "difficulty": "beginner"}).inserted_id
    t3 = DB.topics.insert_one({"userId": ObjectId(UID), "subjectId": subj, "name": "Arrays", "description": "arrays", "difficulty": "beginner"}).inserted_id
    return str(subj), str(t1), str(t2), str(t3)
SUBJ, T_STACK, T_QUEUE, T_ARR = mk_user_data()

# ---- 0. empty memory: everything works exactly as before, no profile text
r = http.get(f"/api/v1/memory/{UID}"); assert r.status_code == 200 and r.json()["learner"]["key"] == "new", r.text
assert M.personalization_note(UID, "quiz") == ""
r = http.post("/api/v1/ai/chat", json={"prompt": "What is a stack?"}); assert r.status_code == 200 and r.json()["response"]
ok("new student: memory endpoint works, no personalization text, plain chat works")

# ---- 1. record real events through the real routes
def make_quiz(topic_id, name):
    q = DB.quizzes.insert_one({"userId": ObjectId(UID), "title": name + " quiz", "topicName": name, "topicId": ObjectId(topic_id),
                               "questions": QUIZ["questions"], "difficulty": "medium", "source": "topic", "createdAt": None}).inserted_id
    return str(q)
def submit(quiz_id, n_correct, seconds):
    answers = [{"questionId": i, "selectedAnswer": 0 if i < n_correct else 1} for i in range(5)]
    r = http.post(f"/api/v1/quizzes/{quiz_id}/submit", json={"answers": answers, "timeSpentSeconds": seconds}); assert r.status_code == 200, r.text
qs, qq = make_quiz(T_STACK, "Stack"), make_quiz(T_QUEUE, "Queue")
for _ in range(2): submit(qs, 1, 400)     # weak at Stack (20%), slow: 80s/question
for _ in range(2): submit(qq, 5, 400)     # strong at Queue
p = M.get_profile(UID)
assert p["quiz"]["attempts"] == 4 and p["quiz"]["questions"] == 20 and p["quiz"]["seconds"] == 1600
assert p["topics"]["stack"]["c"] == 2 and p["topics"]["stack"]["s"] == 40 and p["topics"]["queue"]["s"] == 200
ok("quiz submissions update counters and per-topic scores in ONE profile document")

sess = DB.study_sessions.insert_one({"userId": ObjectId(UID), "subjectId": ObjectId(SUBJ), "topicId": ObjectId(T_STACK),
                                     "startedAt": __import__("datetime").datetime(2026, 1, 1, 10, 0), "endedAt": None, "durationMinutes": None}).inserted_id
for _ in range(2): assert http.patch(f"/api/v1/study-sessions/{sess}").status_code == 200   # ended twice
assert M.get_profile(UID)["study"]["sessions"] == 1
ok("ending a study session twice is counted once")

# ---- 2. learner type
info = classify(M.get_profile(UID))
assert info["key"] == "slow" and info["name"].startswith("Slow") and info["weakTopics"][0]["name"] == "Stack", info
assert info["strongTopics"][0]["name"] == "Queue" and info["evidence"]
ok(f"learner type from real activity: '{info['name']}', weak=Stack, strong=Queue, with evidence")
fast = {"events": 20, "quiz": {"attempts": 5, "questions": 50, "seconds": 600, "pctSum": 400}, "study": {"sessions": 6, "minutes": 60, "night": 5}}
assert classify(fast)["key"] == "fast" and classify(fast)["trait"] == "Night owl"
ok("fast learner (12s/question, 10-minute sessions) is classified 'Fast & responsive' + 'Night owl'")
assert classify({"events": 2})["key"] == "new"
ok("too little data -> 'Still learning about you' (no guessing)")

# ---- 3. memory API
r = http.get(f"/api/v1/memory/{UID}").json(); assert r["learner"]["name"] and isinstance(r["history"], list) and r["recentScores"] == [20, 20, 100, 100], r["recentScores"]
ok("GET /memory returns learner type, recent scores, history")

# ---- 4. search: personalized ranking + recording + injection-safe
r = http.get(f"/api/v1/search?q=(&user_id={UID}"); assert r.status_code == 200
r = http.get(f"/api/v1/search?q=s&user_id={UID}").json()
names = [t["name"] for t in r["topics"]]
assert names[0] == "Stack" and r["topics"][0]["needsPractice"] and r["personalized"], r
ok("search puts the student's weak topic first and flags it; '(' no longer crashes the search")
assert http.post(f"/api/v1/memory/{UID}/search", json={"query": "stack", "kind": "topic", "name": "Stack"}).status_code == 204
http.post(f"/api/v1/memory/{UID}/search", json={"query": "stack", "kind": "topic", "name": "Stack"})
assert http.get(f"/api/v1/search?q=sta&user_id={UID}").json()["suggestions"] == ["stack"]
assert http.get(f"/api/v1/memory/{UID}").json()["topSearches"][0] == {"term": "stack", "count": 2}
ok("clicked searches are remembered, counted, and offered back as suggestions")

# ---- 5. every AI feature receives the student's profile
def last_prompt(): return PROMPTS[-1]
before = len(PROMPTS)
r = http.post(f"/api/v1/ai/topics/{T_STACK}/generate"); assert r.status_code == 200, r.text
assert "STUDENT PROFILE" in last_prompt() and "Stack" in last_prompt() and "fundamentals" in last_prompt() and "in depth" in last_prompt()
ok("topic lesson prompt carries profile (slow learner -> in-depth, weak topic -> fundamentals)")
r = http.post(f"/api/v1/ai/topics/{T_QUEUE}/quiz?num_questions=5"); assert r.status_code == 200, r.text
assert "STUDENT PROFILE" in last_prompt()
ok("topic quiz prompt carries profile")
r = http.post("/api/v1/quizzes/generate", json={"userId": UID, "topicName": "Graphs", "numQuestions": 5, "difficulty": "medium"}); assert r.status_code == 201, r.text
assert "STUDENT PROFILE" in last_prompt() and "Struggles with: Stack" in last_prompt()
ok("standalone quiz generator prompt carries profile (names the weak topic)")
r = http.post("/api/v1/study-plan/generate", json={"userId": UID, "goal": "Pass DSA", "hoursPerDay": 2, "daysAvailable": 3}); assert r.status_code == 201, r.text
assert "STUDENT PROFILE" in last_prompt() and "shorter study blocks" in last_prompt()
ok("study plan prompt carries profile (slow learner -> shorter blocks, extra time for weak topics)")
r = http.post("/api/v1/learning-path/generate", json={"userId": UID, "subjectId": SUBJ, "goal": "Master DS", "level": "beginner", "numTopics": 3}); assert r.status_code in (200, 201), r.text
assert "STUDENT PROFILE" in last_prompt() and "prerequisite" in last_prompt()
ok("learning path prompt carries profile")
r = http.get(f"/api/v1/recommendations/user/{UID}"); assert r.status_code == 200, r.text
assert "STUDENT PROFILE" in last_prompt()
ok("recommendation coach prompt carries profile")
r = http.post("/api/v1/ai/chat", json={"prompt": "Explain stacks", "userId": UID}); assert r.status_code == 200
assert "thorough, step-by-step" in last_prompt() and "Stack" in last_prompt()
ok("chat system prompt adapts (slow learner -> thorough, weak topic named)")
assert M.personalization_note(str(ObjectId()), "quiz") == "" and M.personalization_note(None, "plan") == ""
ok("a different student with no history gets no profile text")

# ---- 6. chat with a document
import pymupdf as fitz
def pdf_bytes(pages):
    d = fitz.open()
    for t in pages:
        pg = d.new_page(); pg.insert_textbox((50, 50, 540, 780), t, fontsize=11)
    return d.tobytes()
doc = pdf_bytes(["Chapter 1 Stacks\n\nA stack is a LIFO structure. Push adds an item. Pop removes the top item.\n\nChapter 2 Queues\n\nA queue is a FIFO structure. Enqueue adds at the rear."])
r = http.post("/api/v1/ai/chat/document", files={"file": ("notes.pdf", doc, "application/pdf")}, data={"prompt": "What is a stack?", "userId": UID})
assert r.status_code == 200, r.text
j = r.json(); assert j["documentId"] and j["documentName"] == "notes.pdf" and j["usedSections"] and j["sectionsNotUsed"] == 0
assert "A stack is a LIFO" in last_prompt() and "Never invent facts about the document" in last_prompt()
ok("chat with an attached PDF: excerpts reach the model, reply names the sections used")
r2 = http.post("/api/v1/ai/chat", json={"prompt": "And a queue?", "userId": UID, "documentId": j["documentId"]}); assert r2.status_code == 200 and r2.json()["documentName"] == "notes.pdf"
assert "FIFO" in last_prompt()
ok("follow-up question reuses the cached document (no re-upload)")
big = pdf_bytes([("Topic%d heading\n\n" % i) + ("filler words about nothing. " * 120) + (" The secret answer is zebra%d." % i if i == 7 else "") for i in range(40)])
r = http.post("/api/v1/ai/chat/document", files={"file": ("big.pdf", big, "application/pdf")}, data={"prompt": "What is the secret answer?", "userId": UID}); assert r.status_code == 200, r.text
assert r.json()["sectionsNotUsed"] > 0 and "zebra7" in last_prompt()
ok("large document: most relevant sections are chosen, and the reply says how many were NOT used")
r = http.post("/api/v1/ai/chat/document", files={"file": ("x.exe", b"abc", "application/octet-stream")}, data={"prompt": "hi"}); assert r.status_code == 400
r = http.post("/api/v1/ai/chat/document", files={"file": ("e.pdf", b"", "application/pdf")}, data={"prompt": "hi"}); assert r.status_code == 400
r = http.post("/api/v1/ai/chat/document", files={"file": ("t.txt", b"Python lists are mutable sequences.", "text/plain")}, data={"prompt": "Are lists mutable?"}); assert r.status_code == 200
r = http.post("/api/v1/ai/chat", json={"prompt": "x", "documentId": "nope"}); assert r.status_code == 400
other = http.post("/api/v1/ai/chat/document", files={"file": ("n.pdf", doc, "application/pdf")}, data={"prompt": "hi", "userId": UID}).json()["documentId"]
r = http.post("/api/v1/ai/chat", json={"prompt": "x", "userId": str(ObjectId()), "documentId": other}); assert r.status_code == 400
ok("bad type / empty file / expired id / someone else's document are refused with clear messages; TXT works")

# ---- 7. summarizer: personalization + history
sd = pdf_bytes(["Stack basics\n\nA stack is a LIFO data structure used for undo. Push and pop run in constant time. Stacks are used in recursion and expression evaluation.\n\nHashing\n\nA hash table maps keys to values using a hash function and handles collisions by chaining."])
r = http.post("/api/v1/summarizer/upload", files={"file": ("s.pdf", sd, "application/pdf")}, data={"userId": UID}); assert r.status_code == 201, r.text
sm = r.json()["summary"]; assert sm["personalization"]["view"] == "detailed" and "Stack" in sm["personalization"]["weakTopics"]
assert any(s["focus"] for s in sm["sections"]) and sm["sections"][0]["title"]
ok("summary is personalized: sections about weak topics flagged, detailed view for a slow learner, nothing removed")
kinds = [h["kind"] for h in http.get(f"/api/v1/memory/{UID}/history?limit=50").json()]
assert {"quiz", "search", "chat", "summary"} <= set(kinds), kinds
ok("history contains quizzes, searches, chats and summaries")

# ---- 8. bounded size / load
for i in range(120): M.record_chat(UID, "question number %d " % i + "x" * 500)
for i in range(80): M.record_search(UID, f"term {i}")
for i in range(60): M.record_quiz(UID, f"Topic {i}", 3, 5, 100)
doc_ = DB.learner_profiles.find_one({"userId": ObjectId(UID)})
size = len(json.dumps(doc_, default=str))
assert len(doc_["history"]) == 50 and len(doc_["topics"]) <= 40 and len(doc_["searches"]) <= 40 and len(doc_["recentQuiz"]) <= 10, (len(doc_["history"]), len(doc_["topics"]))
assert all(len(h["q"]) <= 120 for h in doc_["history"]) and size < 30000, size
assert DB.learner_profiles.count_documents({"userId": ObjectId(UID)}) == 1
ok(f"after 260 extra events the profile is still ONE document of {size//1024} KB: history 50, topics<=40, searches<=40, text<=120 chars")
idx = [i["key"] for i in DB.learner_profiles.index_information().values()]
assert [("userId", 1)] in idx
ok("unique index on userId (single indexed lookup per read)")

# ---- 9. memory failure never breaks a feature
orig = M._profiles
M._profiles = lambda: (_ for _ in ()).throw(RuntimeError("db down"))
submit(qs, 5, 100)
assert http.post("/api/v1/ai/chat", json={"prompt": "hi", "userId": UID}).status_code == 200
M._profiles = orig
ok("if the memory database fails, quizzes and chat still work")

# ---- 10. privacy
assert http.delete(f"/api/v1/memory/{UID}/history").status_code == 204
assert http.get(f"/api/v1/memory/{UID}").json()["history"] == []
assert http.delete(f"/api/v1/memory/{UID}").status_code == 204
assert http.get(f"/api/v1/memory/{UID}").json()["learner"]["key"] == "new"
ok("student can clear history and reset all memory")
print(f"\nmemory backend: {len(CHECKS)} checks passed")
