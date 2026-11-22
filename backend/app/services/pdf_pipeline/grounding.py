"""Deterministic source-grounding checks. A generated claim is kept only if the source text
itself supports it. These checks never use a model, so they cannot hallucinate; they are
conservative filters, and everything they remove is reported (never silently dropped)."""
import re

_STOP = set("""a an the and or but if then else of to in on at by for with without from as is are was were be been being
it its this that these those there here which who whom whose what when where why how not no nor so than too very can could
should would will shall may might must do does did done have has had having also such into onto about over under up down
out off each any all both more most other some only own same just you your yours we our us they their them he she his her
i me my one two""".split())

_NUM_RE = re.compile(r"(?<![A-Za-z])[0-9][0-9,]*(?:\.[0-9]+)?")
_WORD_RE = re.compile(r"[A-Za-z][A-Za-z0-9_']*|[0-9][0-9,]*(?:\.[0-9]+)?")


def _stem(w):
    w = w.lower().replace("'", "")
    w = w.replace("ou", "o").replace("z", "s")      # behaviour/behavior, organise/organize
    for suf in ("ations", "ation", "ingly", "ing", "edly", "ed", "ies", "es", "ly", "s"):
        if len(w) > len(suf) + 2 and w.endswith(suf):
            w = w[: -len(suf)]
            if suf == "ies":
                w += "y"
            break
    return w


def tokens(text):
    return [_stem(w) for w in _WORD_RE.findall(text) if w.lower() not in _STOP]


def numbers(text):
    return {n.replace(",", "") for n in _NUM_RE.findall(text)}


def source_index(source):
    """Pre-compute what is needed to test many claims against one source unit."""
    toks = set(tokens(source))
    sents = [s for s in re.split(r"(?<=[.!?])\s+|\n+", source) if s.strip()]
    questions = [set(tokens(s)) for s in sents if s.strip().endswith("?")]
    return {"tokens": toks, "numbers": numbers(source), "sents": [(s, set(tokens(s))) for s in sents],
            "questions": questions, "text": source}


def support(claim, idx):
    """Fraction of the claim's content words found in the source (0..1). Numbers must all occur in the source."""
    ct = tokens(claim)
    if not ct:
        return 1.0
    nums = numbers(claim)
    if nums and not nums <= idx["numbers"]:
        return 0.0
    return sum(t in idx["tokens"] for t in ct) / len(ct)


def best_sentence_support(claim, idx):
    """Highest fraction of the claim's content words found inside ONE source sentence/line."""
    ct = set(tokens(claim))
    if not ct:
        return 1.0
    return max((len(ct & st) / len(ct) for _, st in idx["sents"]), default=0.0)


def is_source_question(question, idx, min_overlap=0.8):
    """True when the 'question' is just a question that the source itself poses (checklists, review questions)."""
    qt = set(tokens(question))
    if not qt:
        return False
    return any(len(qt & sq) / len(qt) >= min_overlap for sq in idx["questions"])


# ---------------------------------------------------------------------------------------------
# Policy (calibrated on 559 human-labelled claims from two real baseline runs, see calibration/):
#   definitions: support < 0.70 -> dropped   (caught 20/24 unsupported/wrong, lost 2/14 good)
#   flashcards : answer support < 0.60 -> dropped (caught 11/23, lost 14/79 good)
#   any field  : a number that is not in the source -> dropped
#   summary / key_points / exam_tips: NEVER dropped by word overlap (it removes too many good paraphrases);
#                                     items with support < LOW_SUPPORT are FLAGGED for review instead.
# ---------------------------------------------------------------------------------------------
DROP_DEFINITION_BELOW = 0.70
DROP_FLASHCARD_ANSWER_BELOW = 0.60
LOW_SUPPORT = 0.50
DROP_FLASHCARD_QUESTION_BELOW = 0.40
_SEQ_WORDS = {"after", "before", "next", "then", "first", "finally", "afterwards"}


def invented_sequence(question, source_text):
    """A question that asks what comes 'after/before/next' something, when the source never uses that word."""
    qw = {w.lower().strip("?.,;:'\"") for w in question.split()} & _SEQ_WORDS
    sw = {w.lower().strip("?.,;:'\"") for w in source_text.split()}
    return bool(qw) and not (qw & sw)


def ground_output(obj, source_text):
    """-> (clean_obj, report). Never edits kept text. `report` lists what was dropped and why, and which kept
    items have low support, so nothing disappears silently."""
    idx = source_index(source_text)
    rep = {"dropped": [], "flagged": [], "support": {}}
    out = {"title": obj["title"], "summary": obj["summary"], "key_points": [], "definitions": [], "exam_tips": [], "flashcards": []}

    def number_bad(text):
        n = numbers(text)
        return bool(n) and not n <= idx["numbers"]

    for k in ("key_points", "exam_tips"):
        for t in obj[k]:
            if number_bad(t):
                rep["dropped"].append({"field": k, "item": t, "reason": "number not in source"}); continue
            s = support(t, idx)
            out[k].append(t)
            if s < LOW_SUPPORT:
                rep["flagged"].append({"field": k, "item": t, "support": round(s, 2)})
    for d in obj["definitions"]:
        text = d["term"] + " " + d["meaning"]
        s = support(d["meaning"], idx)
        if number_bad(text):
            rep["dropped"].append({"field": "definitions", "item": d, "reason": "number not in source"})
        elif s < DROP_DEFINITION_BELOW:
            rep["dropped"].append({"field": "definitions", "item": d, "reason": f"meaning support {s:.2f} < {DROP_DEFINITION_BELOW}"})
        else:
            out["definitions"].append(d)
    for c in obj["flashcards"]:
        s = support(c["a"], idx)
        if number_bad(c["q"] + " " + c["a"]):
            rep["dropped"].append({"field": "flashcards", "item": c, "reason": "number not in source"})
        elif invented_sequence(c["q"], source_text):
            rep["dropped"].append({"field": "flashcards", "item": c, "reason": "asks for a sequence the source does not state"})
        elif support(c["q"], idx) < DROP_FLASHCARD_QUESTION_BELOW:
            rep["dropped"].append({"field": "flashcards", "item": c, "reason": f"question support {support(c['q'], idx):.2f} < {DROP_FLASHCARD_QUESTION_BELOW}"})
        elif s < DROP_FLASHCARD_ANSWER_BELOW:
            rep["dropped"].append({"field": "flashcards", "item": c, "reason": f"answer support {s:.2f} < {DROP_FLASHCARD_ANSWER_BELOW}"})
        else:
            out["flashcards"].append(c)
    # summary: flag unsupported sentences (not dropped); a summary with an invented number is replaced by the caller
    sents = [s for s in re.split(r"(?<=[.!?])\s+", obj["summary"]) if s.strip()]
    low = [s for s in sents if support(s, idx) < LOW_SUPPORT]
    for s in low:
        rep["flagged"].append({"field": "summary", "item": s, "support": round(support(s, idx), 2)})
    rep["summary_number_bad"] = number_bad(obj["summary"])
    rep["support"] = {"summary": round(support(obj["summary"], idx), 3),
                      "key_points": round(sum(support(t, idx) for t in out["key_points"]) / max(1, len(out["key_points"])), 3)}
    return out, rep
