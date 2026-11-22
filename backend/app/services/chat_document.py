"""Documents uploaded to the AI chat.

The text is extracted once (PDF, TXT or MD), cached in memory for an hour so follow-up
questions do not need a re-upload, and for each question only the most relevant pieces
are sent to the model. Nothing is cut silently: the reply says which sections were used
and how many were not.
"""
import os
import tempfile
import time
import uuid
from collections import OrderedDict

from app.services.pdf_pipeline import pdf_parser as P
from app.services.pdf_pipeline.contract import plan_chunks
from app.services.pdf_pipeline.grounding import tokens

MAX_FILE_BYTES = 20 * 1024 * 1024
CONTEXT_CHARS = 12000        # how much document text goes into one model call
CACHE_SIZE = 8
CACHE_SECONDS = 3600
_CACHE = OrderedDict()       # id -> {"name", "pieces", "chars", "t", "user"}


class DocumentProblem(ValueError):
    """Message is safe to show to the student."""


def _count(text):
    return len(text) // 4


def _pieces_from_pdf(data):
    folder = tempfile.mkdtemp()
    path = os.path.join(folder, "chat.pdf")
    try:
        with open(path, "wb") as f:
            f.write(data)
        try:
            doc = P.enrich(P.build_document(path)[0])
        except P.NeedsOCRError:
            raise DocumentProblem("This looks like a scanned/image-only PDF. Text-based PDFs only for now.")
        except Exception:
            raise DocumentProblem("Could not read this PDF. It may be corrupted or password protected.")
        units = [u for u in P.make_llm_units(doc) if len(u["text"].split()) >= 5]
    finally:
        try:
            os.remove(path)
            os.rmdir(folder)
        except OSError:
            pass
    pieces = []
    for u in units:
        for chunk in plan_chunks(u["text"], _count):
            pieces.append({"title": u.get("section_title") or "Document", "text": chunk})
    return pieces


def _pieces_from_text(data):
    text = data.decode("utf-8", errors="replace").strip()
    return [{"title": "Document", "text": c} for c in plan_chunks(text, _count)] if text else []


def load_document(filename, data, user_id=None):
    """-> document id. Raises DocumentProblem."""
    if not data:
        raise DocumentProblem("Uploaded file is empty.")
    if len(data) > MAX_FILE_BYTES:
        raise DocumentProblem("File is too large. Maximum size is 20MB.")
    name = (filename or "document").lower()
    if name.endswith(".pdf"):
        pieces = _pieces_from_pdf(data)
    elif name.endswith((".txt", ".md")):
        pieces = _pieces_from_text(data)
    else:
        raise DocumentProblem("Supported files: PDF, TXT, MD.")
    if not pieces:
        raise DocumentProblem("No readable text was found in this file.")
    _evict()
    doc_id = uuid.uuid4().hex
    _CACHE[doc_id] = {"name": filename, "pieces": pieces, "user": user_id, "t": time.time(),
                      "chars": sum(len(p["text"]) for p in pieces)}
    while len(_CACHE) > CACHE_SIZE:
        _CACHE.popitem(last=False)
    return doc_id


def _evict():
    now = time.time()
    for key in [k for k, v in _CACHE.items() if now - v["t"] > CACHE_SECONDS]:
        _CACHE.pop(key, None)


def get_document(doc_id, user_id=None):
    _evict()
    doc = _CACHE.get(doc_id)
    if doc is None:
        raise DocumentProblem("This document expired. Please attach it again.")
    if doc["user"] and user_id and doc["user"] != user_id:
        raise DocumentProblem("This document belongs to another account.")
    return doc


def select_context(doc, question, budget=CONTEXT_CHARS):
    """Choose the pieces most relevant to the question, within the budget.
    -> (text, used_titles, not_used_count)"""
    pieces = doc["pieces"]
    if doc["chars"] <= budget:
        chosen = list(range(len(pieces)))
    else:
        q = set(tokens(question))
        scored = []
        for i, p in enumerate(pieces):
            words = tokens(p["text"])
            hit = sum(1 for w in words if w in q)
            scored.append((hit / (len(words) ** 0.5 + 1), -i, i))      # relevance, then earlier first
        chosen, used = [], 0
        for _, _, i in sorted(scored, reverse=True):
            size = len(pieces[i]["text"])
            if used + size > budget and chosen:
                continue
            chosen.append(i)
            used += size
        chosen.sort()
    text = "\n\n".join(f"[{pieces[i]['title']}]\n{pieces[i]['text']}" for i in chosen)
    titles = []
    for i in chosen:
        if pieces[i]["title"] not in titles:
            titles.append(pieces[i]["title"])
    return text, titles, len(pieces) - len(chosen)
