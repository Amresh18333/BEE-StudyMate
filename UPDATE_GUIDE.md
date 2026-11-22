# StudyMate AI update: learner memory, personalization, chat upload, dashboard fix

Built on the code you uploaded. Stack unchanged (React, FastAPI, MongoDB). No new paid service.

## 1. Install (5 steps)
1. Rotate the API keys that were in the .env you shared (MongoDB, OpenRouter, Gemini, NVIDIA).
2. Back up / commit your project.
3. Copy `backend/app/...` over your `backend/app/...` and `frontend/src/...` over your `frontend/src/...`
   (every file in this zip is either NEW or a full REPLACEMENT of the file you uploaded).
4. Backend, inside your venv: `pip install pymupdf` (add `pymupdf` to requirements.txt). python-multipart is already in your requirements.
5. Run `uvicorn app.main:app --reload` and `npm run dev`. MongoDB creates the new `learner_profiles` collection and its index by itself.

## 2. What was added
| Feature | Where |
|---|---|
| Learner memory: ONE small document per student (`learner_profiles`) | backend/app/services/memory_service.py |
| Learner type (Fast & responsive, Slow & informative, Deep diver, Practice-driven, Explorer, Steady all-rounder) + evidence | backend/app/services/learner_type.py, dashboard card |
| History (searches, quizzes, questions, summaries) | /history page, `GET /api/v1/memory/{userId}/history` |
| Chat document upload (PDF, TXT, MD) in Ask AI and the topic AI Tutor | /ai/chat/document, chat_document.py, DocumentAttach.jsx |
| Better PDF summarizer (grounding checks, fallbacks) | backend/app/services/pdf_pipeline/ |
| Dashboard border fix | frontend/src/components/dashboard/DashboardLayout.css |

## 3. What is stored (kept small on purpose)
- One document per student, upserted with a single atomic update per event, read with one indexed lookup (unique index on userId).
- Counters (quiz attempts, questions, seconds, score sums; study sessions, minutes, time-of-day), per-topic score sums (max 40 topics), search counts (max 40), last 10 quiz scores, last 30 active days, and the latest 50 history lines of at most 120 characters.
- NOT stored: documents, PDF text, chat answers, quiz questions. Test: after 260 extra events the document is still about 8 KB.
- Student controls: History page > "Clear history" and "Reset learning profile".
- If saving memory fails, quizzes/search/chat/summaries still work (memory is best-effort).

## 4. How every AI feature uses it
| Feature | What changes for the student |
|---|---|
| Topic lesson | Slow learner: deeper, step by step. Fast: concise. Weak topic: starts from fundamentals |
| Topic quiz and Quiz Generator | Names weak topics; high scorers get harder questions, low scorers more foundational ones |
| Study Planner | Slow: shorter blocks with daily review. Fast: denser. Extra time for weak topics; hard topics at their best time of day |
| Learning Path | Adds prerequisite reinforcement for weak areas |
| Dashboard coach (recommendations) | Summary uses the learner profile |
| AI chat (Ask AI and Tutor) | Short answers for fast learners, thorough for slow; knows weak topics |
| PDF Summarizer | Sections on weak topics are flagged and shown first; flashcards on them first. Nothing is removed |
| Search | Weak topics ranked first and tagged "Needs practice"; "You searched before" suggestions; searches are saved only when you click a result; typing is debounced (300 ms) |
| Resources (notes/videos) | Searches enter the history (results themselves are unchanged web results) |

The profile is added to the AI prompt as one short block. With no history yet, behaviour is exactly as before.

## 5. How the learner type works (honest)
Rule-based, from the student's own numbers: average seconds per quiz question (<=20s fast, >=45s slow), average study session (>=25 min long, <=12 min short), counts of quizzes vs searches/summaries/questions. Needs at least 4 activities, otherwise it says "Still learning about you". It shows its evidence and a confidence level. It is a study-habit guide, not a psychological test.

## 6. What was tested here, and what was not
Tested (fake database + fake AI, in this environment): 27 backend checks (memory counters, no double counting, learner types, search ranking, every AI prompt receiving the profile, chat document upload/follow-up/large-document selection/bad files/other-user document, summarizer personalization, size caps, memory failure, privacy) and 18 browser checks (dashboard, history, chat upload, debounced search, graceful failure, no console errors). Dashboard screenshots at 400-1920 px show no overflow and even gaps.
NOT tested: real calls to NVIDIA/Nemotron (prompts were verified, not the model's replies), your real MongoDB Atlas, and your exact data. Please click through once: take a quiz, finish a study session, search a topic, ask a question, attach a PDF in Ask AI, then open the dashboard.

## 7. Limits
- An attached document stays in server memory for 1 hour (max 8 documents); after a server restart or timeout the chat re-uploads it automatically.
- For long documents only the most relevant sections are sent for each question; the reply says which sections were used and how many were not.
- Scanned (image-only) PDFs are refused with a clear message. No OCR.
- Learner type needs a few quizzes and study sessions to appear. Study sessions only count when they are ended.
- PyMuPDF is AGPL-licensed: fine for a student/open-source project, check before commercial use.
- The learner profile follows the Nemotron model's behaviour: personalization is a hint to the model, not a guarantee.

## 8. Run the tests yourself
- Backend: `pip install mongomock httpx pymupdf` then `python tests/test_memory_backend.py <path to your backend folder>`
- Browser: needs Playwright and `npm run build` + `npx vite preview --port 4173`, then `node tests/e2e_frontend.js`
