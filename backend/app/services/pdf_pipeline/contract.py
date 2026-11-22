"""Output contract, strict validation, JSON parsing, chunking. Carried over unchanged from the audited v6.1/v6.3 code
(see the audit report); parse success, schema validity and factual support are kept separate."""
import re, json

SCHEMA_VERSION = "1.0"
MAX_INPUT_TOKENS = 1500      # per call; longer units are CHUNKED, never truncated

TARGET_SCHEMA = {
    "title": "short section title",
    "summary": "3-5 sentence explanation of the section in plain English",
    "key_points": ["concise bullet", "..."],
    "definitions": [{"term": "", "meaning": ""}],
    "exam_tips": ["..."],
    "flashcards": [{"q": "", "a": ""}],
}

# The declared output contract. Everything the model returns is validated against it.
CONTRACT = {"type": "object", "additional": False, "fields": {
    "title": {"type": "str", "min_len": 1, "max_len": 200},
    "summary": {"type": "str", "min_len": 1, "max_len": 2500},
    "key_points": {"type": "list", "max_items": 25, "item": {"type": "str", "min_len": 1, "max_len": 600}},
    "definitions": {"type": "list", "max_items": 25, "item": {"type": "object", "additional": False, "fields": {
        "term": {"type": "str", "min_len": 1, "max_len": 120},
        "meaning": {"type": "str", "min_len": 1, "max_len": 800}}}},
    "exam_tips": {"type": "list", "max_items": 25, "item": {"type": "str", "min_len": 1, "max_len": 600}},
    "flashcards": {"type": "list", "max_items": 25, "item": {"type": "object", "additional": False, "fields": {
        "q": {"type": "str", "min_len": 1, "max_len": 400},
        "a": {"type": "str", "min_len": 1, "max_len": 800}}}},
}}

REF_TOKEN_RE = re.compile(r"\b(?:CODE|MATH)[_\-]\w*")
REF_OK_RE = re.compile(r"^(?:CODE|MATH)_\d+$")


def _validate_node(node, spec, path, errors):
    t = spec["type"]
    if t == "object":
        if not isinstance(node, dict):
            errors.append(f"{path}: expected object, got {type(node).__name__}"); return
        for k, sub in spec["fields"].items():
            if k not in node:
                errors.append(f"{path}.{k}: missing required field")
            else:
                _validate_node(node[k], sub, f"{path}.{k}", errors)
        if not spec.get("additional", False):
            for k in node:
                if k not in spec["fields"]:
                    errors.append(f"{path}.{k}: unexpected field")
    elif t == "list":
        if not isinstance(node, list):
            errors.append(f"{path}: expected array, got {type(node).__name__}"); return
        if len(node) > spec.get("max_items", 10**9):
            errors.append(f"{path}: more than {spec['max_items']} items")
        for i, x in enumerate(node):
            _validate_node(x, spec["item"], f"{path}[{i}]", errors)
    elif t == "str":
        if not isinstance(node, str):
            errors.append(f"{path}: expected string, got {type(node).__name__}"); return
        if len(node.strip()) < spec.get("min_len", 0):
            errors.append(f"{path}: empty string")
        if len(node) > spec.get("max_len", 10**9):
            errors.append(f"{path}: longer than {spec['max_len']} characters")
        if "enum" in spec and node not in spec["enum"]:
            errors.append(f"{path}: {node!r} is not one of {spec['enum']}")
    else:
        raise ValueError(f"unknown spec type {t}")


def _all_strings(node):
    if isinstance(node, str):
        yield node
    elif isinstance(node, dict):
        for v in node.values():
            yield from _all_strings(v)
    elif isinstance(node, list):
        for v in node:
            yield from _all_strings(v)


def validate_schema(obj, allowed_ref_ids, contract=CONTRACT):
    """Full nested validation + reference check. `allowed_ref_ids` are the CODE_n/MATH_n ids of
    the exact input unit; any other id, or a malformed one, is an error. Returns a list of errors."""
    errors = []
    _validate_node(obj, contract, "$", errors)
    if not errors or isinstance(obj, dict):
        allowed = set(allowed_ref_ids)
        for text in _all_strings(obj):
            for tok in REF_TOKEN_RE.findall(text):
                if not REF_OK_RE.match(tok):
                    errors.append(f"malformed reference {tok!r}")
                elif tok not in allowed:
                    errors.append(f"reference {tok} does not belong to this unit (allowed: {sorted(allowed)})")
    return errors




FENCE_RE = re.compile(r"^```(?:json)?\s*(\{.*\})\s*```$", re.S)


def parse_json_text(raw):
    """STAGE 1 - parsing only. The whole reply must be one JSON object (optionally in a code
    fence). Prose around the JSON is a parse failure, not silently repaired."""
    t = raw.strip()
    m = FENCE_RE.match(t)
    if m:
        t = m.group(1)
    if not t.startswith("{"):
        return None, "reply is not a bare JSON object (text before/around the JSON)"
    try:
        obj = json.loads(t)
    except json.JSONDecodeError as e:
        return None, f"invalid JSON: {e}"
    if not isinstance(obj, dict):
        return None, "JSON is not an object"
    return obj, None


def parse_model_json(raw, allowed_ref_ids=()):
    """Compatibility wrapper: parse then schema-validate. Returns (obj_or_None, error_or_None);
    obj is returned only when BOTH stages pass."""
    obj, err = parse_json_text(raw)
    if err:
        return None, err
    errs = validate_schema(obj, allowed_ref_ids)
    return (obj, None) if not errs else (None, "; ".join(errs[:5]))




def _split_oversize(para, count_tokens, budget):
    """A paragraph larger than the budget is split at sentence boundaries (then at word boundaries if one sentence is
    still too big). No character is dropped: the pieces joined with a space reproduce the paragraph's words."""
    sents = re.split(r"(?<=[.!?])\s+", para)
    pieces, cur = [], ""
    for s_ in sents:
        if count_tokens(s_) > budget:
            if cur:
                pieces.append(cur); cur = ""
            words, w_cur = s_.split(), ""
            for w in words:
                cand = (w_cur + " " + w).strip()
                if w_cur and count_tokens(cand) > budget:
                    pieces.append(w_cur); w_cur = w
                else:
                    w_cur = cand
            if w_cur:
                pieces.append(w_cur)
            continue
        cand = (cur + " " + s_).strip()
        if cur and count_tokens(cand) > budget:
            pieces.append(cur); cur = s_
        else:
            cur = cand
    if cur:
        pieces.append(cur)
    return pieces


def plan_chunks(text, count_tokens, budget=MAX_INPUT_TOKENS):
    """Split on paragraph boundaries so no chunk exceeds `budget` tokens. Oversized paragraphs are split at sentence
    (or, last resort, word) boundaries. Nothing is ever cut off: every word of `text` lands in exactly one chunk."""
    if count_tokens(text) <= budget:
        return [text]
    chunks, cur = [], ""
    paras = []
    for para in text.split("\n"):
        paras += _split_oversize(para, count_tokens, budget) if count_tokens(para) > budget else [para]
    for para in paras:
        cand = cur + ("\n" if cur else "") + para
        if cur and count_tokens(cand) > budget:
            chunks.append(cur)
            cur = para
        else:
            cur = cand
    if cur:
        chunks.append(cur)
    return chunks


def merge_chunk_outputs(objs):
    out = {"title": objs[0].get("title", ""), "summary": " ".join(o.get("summary", "") for o in objs),
           "key_points": [], "definitions": [], "exam_tips": [], "flashcards": []}
    for o in objs:
        for k in ("key_points", "definitions", "exam_tips", "flashcards"):
            out[k].extend(o.get(k, []))
    return out
