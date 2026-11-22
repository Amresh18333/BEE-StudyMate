"""Rule-based, fully extractive study material. Every item is a verbatim excerpt of the source unit, so it is
supported by construction. Used (a) as the training target for fine-tuning ("silver" data), and (b) as the
fallback when a model reply cannot be validated or a field comes back empty after grounding."""
import re

_PLACEHOLDER = re.compile(r"^\[(?:CODE|MATH)_\d+:.*\]$")
_BULLET = re.compile(r"^\s*(?:[-•*▪●◦]|\d+[.)])\s+(.*\S)\s*$")
_SENT_SPLIT = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9\"'(\[])")
_TIP_RE = re.compile(r"\b(avoid|do not|don't|never|always|must|should|ensure|remember|make sure|prefer|"
                     r"mistake|bug|careful|pitfall|edge case)\b", re.I)
_TIP_HEAD = re.compile(r"(mistake|avoid|bug|pitfall|barrier|limitation|edge case|common|warning|debug|tips?|checklist|"
                       r"before sending|do not|trade-?offs?)", re.I)
_DEF_RE = re.compile(
    r"^(?:(?:A|An|The)\s+)?(?P<term>[A-Za-z][A-Za-z0-9\-/'’() ]{1,48}?)\s+"
    r"(?:(?:is|are)\s+(?:an?|the)\s+|means\s+|refers to\s+|is defined as\s+|are defined as\s+)(?P<rest>.{12,})$")
_TERM_REJECT = {"how", "why", "what", "that", "which", "when", "where", "if", "because", "not", "do", "does", "can",
                "may", "will", "should", "must", "then", "than", "while", "also", "only"}
_BAD_TERM_START = re.compile(r"^(?:it|this|that|these|those|there|here|which|who|what|when|where|how|why|if|each|every|some|"
                             r"all|most|many|they|we|you|he|she|i)\b", re.I)


def parse_unit(text):
    """-> list of (kind, content, heading) with kind in heading|bullet|prose|placeholder."""
    out, head = [], ""
    for raw in text.split("\n"):
        line = raw.rstrip()
        if not line.strip():
            continue
        if line.lstrip().startswith("#"):
            head = line.lstrip("# ").strip(); out.append(("heading", head, head)); continue
        if _PLACEHOLDER.match(line.strip()):
            out.append(("placeholder", line.strip(), head)); continue
        m = _BULLET.match(line)
        if m and not re.match(r"^\d+[.)]\s", line.strip()) or (m and line.strip()[0] in "-•*▪●◦"):
            out.append(("bullet", m.group(1).strip(), head)); continue
        out.append(("prose", line.strip(), head))
    return out


def sentences(text):
    parts = _SENT_SPLIT.split(text.strip())
    return [p.strip() for p in parts if len(p.split()) >= 3]


def _clean_term(term):
    t = re.sub(r"^(?:A|An|The)\s+", "", term.strip())
    return t[:1].upper() + t[1:] if t else t


def extract(unit, max_points=8, max_tips=5, max_cards=6, max_defs=6):
    """Build the full output object (same contract as the model output) from one llm unit."""
    items = parse_unit(unit["text"])
    prose = [c for k, c, h in items if k == "prose"]
    bullets = [(c, h) for k, c, h in items if k == "bullet"]
    prose_sents = [s for p in prose for s in sentences(p) if not s.endswith("?")]
    title = unit.get("section_title") or "Section"
    # summary: lead prose sentences; if the unit is bullets only, the first bullets
    lead = prose_sents[:3]
    if not lead:
        lead = [b for b, _ in bullets[:3]]
    if not lead:
        lead = [c for k, c, h in items if k != "heading"][:2] or [title]
    summary = " ".join(x.rstrip() for x in lead)
    # key points: bullets, topped up with prose sentences after the lead
    kps = [b for b, _ in bullets if not b.endswith("?")][:max_points]
    for s in prose_sents[len(lead):]:
        if len(kps) >= min(max_points, 5):
            break
        kps.append(s)
    if not kps:
        kps = prose_sents[:3] or [summary]
    # definitions: "X is/are/means ..." statements
    defs, seen = [], set()
    for s in prose_sents + [b for b, _ in bullets]:
        m = _DEF_RE.match(s)
        if not m:
            continue
        term = m.group("term").strip()
        if _BAD_TERM_START.match(term) or len(term.split()) > 6 or term.lower() in seen or re.search(r"\b(and|or|but)\b", term) or {w.lower() for w in term.split()} & _TERM_REJECT:
            continue
        seen.add(term.lower()); defs.append({"term": _clean_term(term), "meaning": s})
        if len(defs) >= max_defs:
            break
    # exam tips: statements that give advice/warnings, plus every bullet under a warning-like heading
    tips = []
    for k, c, h in items:
        if k in ("bullet", "prose") and not c.endswith("?") and (_TIP_RE.search(c) or (k == "bullet" and _TIP_HEAD.search(h))):
            for s in ([c] if k == "bullet" else sentences(c)):
                if (_TIP_RE.search(s) or k == "bullet") and s not in tips and s not in kps[:0]:
                    tips.append(s)
    tips = tips[:max_tips]
    # flashcards: definitions, then "Label: text" bullets
    cards = [{"q": f"What does the term '{d['term']}' mean?", "a": d["meaning"]} for d in defs]
    for b, _ in bullets:
        m = re.match(r"^([A-Z][A-Za-z0-9 /\-]{1,40}):\s+(.{8,})$", b)
        if m and len(cards) < max_cards:
            cards.append({"q": f"Explain '{m.group(1)}'.", "a": b})
    return {"title": title, "summary": summary, "key_points": kps[:max_points], "definitions": defs,
            "exam_tips": tips, "flashcards": cards[:max_cards]}
