# Adding the new PDF pipeline to StudyMate AI

This upgrades the existing Summarizer module only. Folder structure, endpoints and MongoDB collection stay the same.
No GPU, no new paid service: it uses your existing NVIDIA API client.

## What changes
| File (in your project) | Action |
|---|---|
| backend/app/services/pdf_pipeline/ (7 files) | NEW folder, copy as-is |
| backend/app/services/summarizer_service.py | REPLACE |
| backend/app/schemas/summarizer.py | REPLACE |
| backend/app/api/routes/summarizer.py | REPLACE |
| backend/requirements.txt | ADD one line: `pymupdf` |
| frontend/src/pages/Summarizer.jsx | REPLACE |

Old saved summaries keep working (new fields have defaults).

## Steps
1. **Rotate your keys first.** The .env you shared contains real MongoDB, OpenRouter, Gemini and NVIDIA keys. Create new ones and update your local .env. Never share .env again.
2. Back up (or commit) your project.
3. Copy the files from this zip over your project, using the table above.
4. In `backend/`: `pip install pymupdf` (and add `pymupdf` to requirements.txt).
5. Start the backend (`uvicorn app.main:app --reload`) and the frontend (`npm run dev`).
6. Open the Summarizer page, upload a text PDF, wait (a long PDF makes one AI call per section, so it can take a few minutes).
7. Check the result: sections with key points, definitions, exam tips and flashcards.

## Behaviour to know
- Definitions and flashcards that the PDF does not support are removed, and the page says how many.
- If the AI fails on one section, that section shows excerpts from your PDF, labelled. If the AI fails on every section you get a 503 ("try again later").
- Scanned/image-only PDFs return a clear 400 message (no OCR in this version).
- The model is `SUMMARIZER_MODEL` in summarizer_service.py (same as before: nemotron-3-nano-30b-a3b).

## Not verified
- I could not call the NVIDIA API from my sandbox. The pipeline was tested with mock model replies (good, garbage, API down) on 15 PDFs. The prompt was tuned on Qwen, so Nemotron's JSON compliance is untested: if you see many "taken directly from your PDF" labels, tell me and I'll adjust the prompt.
- Rate limits on free APIs may slow long PDFs.
- PyMuPDF is AGPL-licensed. Fine for a student/open-source project; check it if you ever make the app closed-source/commercial.
- The Qwen fine-tuning notebook is separate and needs a GPU; it is not part of this integration.
