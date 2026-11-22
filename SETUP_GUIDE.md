# StudyMate: use your own Qwen summarizer in the app

Two parts. Part 1 takes about 15 minutes and works today. Part 2 is the fine-tuning project.

---

## Part 1: the model switch (works now)

### 1. Copy the changed files into your project
| From this zip | To your project |
|---|---|
| `backend/app/config.py` | `app/config.py` (backend folder) |
| `backend/app/services/summarizer_service.py` | `app/services/summarizer_service.py` |
| `frontend/src/pages/Summarizer.jsx` | `frontend/src/pages/Summarizer.jsx` |

### 2. Add the settings to the backend `.env`
Copy the lines from `backend/.env.additions`. The default is `SUMMARIZER_PROVIDER=NVIDIA`, so nothing changes until you switch.

Also make sure PyMuPDF is installed in the backend: `pip install pymupdf`

### 3. Install Ollama and create the model (free, runs on your computer)
1. Install Ollama from ollama.com (Windows installer).
2. In a terminal, in the `ollama` folder of this zip:
   ```
   ollama pull qwen2.5:3b
   ollama create studymate-qwen -f Modelfile.base
   ```
3. Check: `ollama list` shows `studymate-qwen`.

### 4. Switch
In `.env`: `SUMMARIZER_PROVIDER=OLLAMA_QWEN`, then restart the backend (`uvicorn app.main:app --reload`).
Switch back any time by setting `SUMMARIZER_PROVIDER=NVIDIA`.

Every new summary now shows **"Summarized by: OLLAMA_QWEN: studymate-qwen"** (or NVIDIA) on the page, so you can prove in your demo which model produced it.

### What to expect
- Without an NVIDIA GPU, Qwen 3B runs on the CPU. Each section can take 30-90 seconds, so a 10-section PDF can take 5-15 minutes. The page already warns that large PDFs take a few minutes.
- If Ollama is not running, the page shows: "The local Qwen model is not responding. Check that Ollama is running..."
- Wrong value in `SUMMARIZER_PROVIDER`: the backend refuses to start and tells you the allowed values.
- A weak section falls back to the PDF's own sentences (labelled), same as before.

---

## Part 2: fine-tune your own model (the AI part of the project)

**Be clear about what this does.** The training data is built automatically from your PDFs: each target is an excerpt of the PDF itself. The model learns the exact JSON format and to stay close to the source wording. It does not learn new knowledge. The notebook only accepts the adapter if it beats the base model on PDFs it never saw. If it doesn't, keep the base model: that is a legitimate result and you can say so in the report.

### Step A: collect PDFs
- 10 or more English, text-based study PDFs (lecture notes, textbook chapters, slide exports). Scanned PDFs do not work well.
- Different subjects and layouts help. At least 8 are used for training and 3 are kept out for testing, split by whole PDF automatically.
- Do not use PDFs you are not allowed to copy. Your own notes and open course material are fine.

### Step B: train on Colab (free T4)
1. Open `StudyMate_FINAL.ipynb` (from your `studymate_final` folder) in Colab, set Runtime > T4 GPU.
2. Upload `studymate_final.zip`, run Part A once on a PDF to check everything works.
3. Run Part B with all your PDFs. Takes about 20-40 minutes.
4. Read the final printout:
   - `use_adapter: true` -> it downloads `studymate_adapter.zip`. Go to Step C.
   - `use_adapter: false` -> keep the base model (Part 1 already covers you).

### Step C: export to Ollama
1. Open `StudyMate_Export_to_Ollama.ipynb` in Colab (T4), upload `studymate_adapter.zip`, run all cells. It merges the adapter, converts to GGUF and saves to your Google Drive.
2. Download the `.gguf` to your computer, put it next to `ollama/Modelfile.tuned`.
3. ```
   ollama create studymate-qwen -f Modelfile.tuned
   ```
   This **replaces** the base `studymate-qwen`, so `.env` needs no change.
4. Restart the backend. The page now says "OLLAMA_QWEN: studymate-qwen" and it is your fine-tuned model.
   To go back to the base model: `ollama create studymate-qwen -f Modelfile.base`.

### What I could not test
- I tested the switch logic (default NVIDIA, OLLAMA_QWEN, bad value, Ollama down, `<think>` removal) with stand-ins for the AI libraries, and all checks passed. I could not run a real Ollama, a real PDF through Qwen, or Colab here (no network, no GPU).
- `StudyMate_Export_to_Ollama.ipynb` is written to the standard merge-then-convert recipe but has never been run. If a cell fails, send me the error text.
- Your project notes mention the arXiv dataset. The package you built trains on your own PDFs instead; arXiv papers are research papers, not study notes. If you want arXiv in the report, that is a separate step.
