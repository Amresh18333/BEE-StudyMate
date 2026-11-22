"""PDF -> grounded study material. Works with any generate(messages)->str (real model or a test double)."""
import re, json, time, os, csv
from . import pdf_parser as P
from .contract import validate_schema, parse_json_text, plan_chunks, merge_chunk_outputs, MAX_INPUT_TOKENS, SCHEMA_VERSION
from .prompts import build_messages, PROMPT_VERSION
from .grounding import ground_output, support, source_index, numbers
from . import extractive as X

MIN_CARDS = 2          # when grounding leaves fewer flashcards, grounded extractive ones top the list up
MIN_SUMMARY_SUPPORT = 0.35


def _ids(text):
    return re.findall(r"\[((?:CODE|MATH)_\d+):", text)


def summarize_unit(unit, generate, count_tokens=lambda t: len(t) // 4, max_retries=1, fill=True):
    """-> record. Never raises on model output: a unit the model cannot answer validly falls back to the extractive
    version and says so (`output_source`)."""
    chunks = plan_chunks(unit["text"], count_tokens)
    attempts, objs, raws, errs = [], [], [], []
    for ch in chunks:
        ids, reason, ok_obj = _ids(ch), None, None
        for attempt in range(1 + max_retries):
            t0 = time.time()
            raw = generate(build_messages(ch, reason))
            obj, perr = parse_json_text(raw)
            serr = validate_schema(obj, ids) if obj is not None else []
            attempts.append({"attempt": attempt + 1, "latency_s": round(time.time() - t0, 3), "parse_ok": perr is None,
                             "schema_ok": perr is None and not serr, "errors": ([perr] if perr else []) + serr[:5]})
            raws.append(raw)
            if perr is None and not serr:
                ok_obj = obj
                break
            reason = (perr or "; ".join(serr[:3]))[:300]
        if ok_obj is None:
            errs.append(attempts[-1]["errors"])
        else:
            objs.append(ok_obj)
    rec = {"unit_id": unit["unit_id"], "section_title": unit.get("section_title"), "n_chunks": len(chunks),
           "n_attempts": len(attempts), "retried": len(attempts) > len(chunks), "schema_ok": len(objs) == len(chunks),
           "errors": errs, "attempts": attempts, "raw": raws, "grounding": None, "fill": []}
    ext = X.extract(unit)
    if not rec["schema_ok"]:
        rec["output"], rec["output_source"] = ext, "extractive_fallback"
        return rec
    merged = merge_chunk_outputs(objs)
    clean, rep = ground_output(merged, unit["text"])
    clean["title"] = unit.get("section_title") or clean["title"]     # the PDF's own heading, not a paraphrase
    idx = source_index(unit["text"])
    if rep["summary_number_bad"] or support(clean["summary"], idx) < MIN_SUMMARY_SUPPORT:
        rep["dropped"].append({"field": "summary", "item": clean["summary"], "reason": "unsupported summary replaced by lead sentences of the source"})
        clean["summary"] = ext["summary"]; rec["fill"].append("summary")
    if fill:
        if not clean["exam_tips"] and ext["exam_tips"]:
            clean["exam_tips"] = ext["exam_tips"]; rec["fill"].append("exam_tips")
        if len(clean["flashcards"]) < MIN_CARDS and ext["flashcards"]:
            have = {c["a"] for c in clean["flashcards"]}
            clean["flashcards"] += [c for c in ext["flashcards"] if c["a"] not in have][: MIN_CARDS + 1 - len(clean["flashcards"])]
            rec["fill"].append("flashcards")
        if not clean["key_points"]:
            clean["key_points"] = ext["key_points"]; rec["fill"].append("key_points")
    rec["grounding"] = rep
    rec["output"] = clean
    rec["output_source"] = "model+extractive_fill" if rec["fill"] else "model"
    return rec


def check_pdf(path):
    """Cheap pre-flight: what kind of PDF is this and what will happen."""
    t = P.triage_pdf(path)
    return t


def summarize_pdf(path, generate, count_tokens=lambda t: len(t) // 4, ocr=False, fill=True, max_retries=1, progress=None):
    """-> {"doc": ..., "records": [...], "status": ..., "warnings": [...]}"""
    try:
        doc = P.enrich(P.build_document(path, ocr=ocr)[0])
    except P.NeedsOCRError as e:
        return {"status": "needs_ocr", "message": str(e) + " (re-run with ocr=True; OCR gives plain text only)", "doc": None, "records": []}
    except Exception as e:      # corrupted, encrypted, truncated or otherwise unreadable PDF: report, never crash a batch
        return {"status": "unreadable", "message": f"{type(e).__name__}: {str(e)[:200]}", "doc": None, "records": []}
    all_units = P.make_llm_units(doc)
    units = [u for u in all_units if len(u["text"].split()) >= 5]       # title-only / empty sections carry nothing to summarise
    skipped_empty = len(all_units) - len(units)
    if not units:
        return {"status": "no_text", "message": "No usable text was found in this PDF.", "doc": doc, "records": []}
    records = []
    for i, u in enumerate(units):
        records.append(summarize_unit(u, generate, count_tokens, max_retries=max_retries, fill=fill))
        if progress:
            progress(i + 1, len(units), u.get("section_title"))
    n_bad = sum(not r["schema_ok"] for r in records)
    warns = [w["code"] for w in doc["meta"].get("warnings", [])]
    return {"status": "ok" if not n_bad else "ok_with_fallbacks", "doc": doc, "units": units, "records": records, "warnings": warns,
            "stats": {"units": len(units), "empty_units_skipped": skipped_empty, "schema_valid_first_try": sum(r["schema_ok"] and not r["retried"] for r in records),
                      "retried": sum(r["retried"] for r in records), "extractive_fallback": n_bad,
                      "filled": sum(bool(r["fill"]) for r in records)}}


def _expand(text, doc):
    """Replace CODE_n placeholders by the verbatim code block (never rewritten)."""
    def rep(m):
        cb = (doc.get("code_blocks") or {}).get(m.group(1))
        return "\n```\n" + cb["code"] + "\n```\n" if cb else m.group(0)
    return re.sub(r"\[((?:CODE)_\d+):[^\]]*\]", rep, text)


def render_markdown(result, source_name=""):
    doc = result["doc"]; L = [f"# {doc.get('title') or source_name}", f"*Study guide generated from `{source_name}`. Every item is checked against the source text; see the JSON for the audit trail.*", ""]
    for u, r in zip(result["units"], result["records"]):
        o = r["output"]
        L += [f"## {o['title']}", "", o["summary"], ""]
        if o["key_points"]:
            L += ["**Key points**", ""] + [f"- {x}" for x in o["key_points"]] + [""]
        if o["definitions"]:
            L += ["**Definitions**", ""] + [f"- **{d['term']}**: {d['meaning']}" for d in o["definitions"]] + [""]
        if o["exam_tips"]:
            L += ["**Exam tips**", ""] + [f"- {x}" for x in o["exam_tips"]] + [""]
        if o["flashcards"]:
            L += ["**Flashcards**", ""] + [f"- Q: {c['q']}  \n  A: {c['a']}" for c in o["flashcards"]] + [""]
        for cid in u.get("code_ids", []):
            cb = (doc.get("code_blocks") or {}).get(cid)
            if cb:
                L += [f"*Code ({cid}), verbatim from the PDF:*", "```", cb["code"], "```", ""]
        if r["output_source"] != "model":
            L += [f"*Note: this section's output source is `{r['output_source']}`.*", ""]
    return "\n".join(L)


def export_results(result, out_dir, stem, source_name=""):
    os.makedirs(out_dir, exist_ok=True)
    doc = result["doc"]
    payload = {"source_pdf": source_name, "status": result["status"], "prompt_version": PROMPT_VERSION, "schema_version": SCHEMA_VERSION,
               "stats": result.get("stats"), "warnings": result.get("warnings"),
               "sections": [{"unit_id": r["unit_id"], "output_source": r["output_source"], "output": r["output"],
                             "grounding": r["grounding"], "fill": r["fill"], "model_raw": r["raw"], "attempts": r["attempts"]}
                            for r in result["records"]]}
    json.dump(payload, open(os.path.join(out_dir, f"{stem}_study.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    json.dump(doc, open(os.path.join(out_dir, f"{stem}_document_structure.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    open(os.path.join(out_dir, f"{stem}_study_guide.md"), "w", encoding="utf-8").write(render_markdown(result, source_name))
    with open(os.path.join(out_dir, f"{stem}_flashcards.tsv"), "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t")
        for r in result["records"]:
            for c in r["output"]["flashcards"]:
                w.writerow([c["q"], c["a"], r["output"]["title"]])
    return payload
