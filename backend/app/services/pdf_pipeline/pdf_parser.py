import re
import json
import os
from collections import Counter, defaultdict
from datetime import datetime, timezone

import pymupdf

# --------------------------------------------------------------------------
# 1. PDF triage (is there a text layer at all?)
# --------------------------------------------------------------------------

class NeedsOCRError(RuntimeError):
    """The PDF has no usable text layer. Re-run with ocr=True (needs Tesseract)."""


def find_tessdata():
    """Locate Tesseract language data (apt: tesseract-ocr; Colab: !apt install tesseract-ocr)."""
    cands = [os.environ.get("TESSDATA_PREFIX"), "/usr/share/tesseract-ocr/5/tessdata",
             "/usr/share/tesseract-ocr/4.00/tessdata", "/usr/share/tessdata",
             "/usr/local/share/tessdata"]
    for c in cands:
        if c and os.path.exists(os.path.join(c, "eng.traineddata")):
            return c
    raise RuntimeError("Tesseract English data not found. In Colab run: "
                       "!apt-get install -y tesseract-ocr")


def triage_pdf(pdf_path, min_chars=25):
    """Classify every page as text / image-only / blank and decide what to do.

    verdict: 'text'    every page has a text layer
             'mixed'   some pages are image-only (their content will be MISSING)
             'scanned' no page has a text layer -> OCR required
    """
    doc = pymupdf.open(pdf_path)
    if doc.needs_pass:
        doc.close()
        raise ValueError("The PDF is password protected.")
    pages = []
    for i, page in enumerate(doc, start=1):
        chars = len(page.get_text("text").strip())
        images = len(page.get_images(full=True))
        kind = "text" if chars >= min_chars else ("image_only" if images else "blank")
        pages.append({"page": i, "chars": chars, "images": images, "kind": kind})
    doc.close()

    n_text = sum(p["kind"] == "text" for p in pages)
    image_only = [p["page"] for p in pages if p["kind"] == "image_only"]
    blank = [p["page"] for p in pages if p["kind"] == "blank"]
    if n_text == 0 and image_only:
        verdict = "scanned"
    elif n_text == 0:
        verdict = "empty"
    elif image_only:
        verdict = "mixed"
    else:
        verdict = "text"
    return {"verdict": verdict, "n_pages": len(pages), "text_pages": n_text,
            "image_only_pages": image_only, "blank_pages": blank, "pages": pages}


# --------------------------------------------------------------------------
# 2. Low level line extraction
# --------------------------------------------------------------------------

BOLD_RE = re.compile(r"bold|black|heavy|semibold|demi|cmbx", re.I)
MONO_RE = re.compile(r"courier|mono|consolas|menlo|cmtt|typewriter|lucida\s*console|"
                     r"source\s*code|fira\s*code|inconsolata|cousine", re.I)
MATH_RE = re.compile(r"cmmi|cmsy|cmex|msbm|stix|cambria\s*math|latinmodernmath|lmmath|"
                     r"xits|euler|txmi|txsy", re.I)

# PyMuPDF span flags: 8 = monospaced, 16 = bold
def _bold(s):
    return bool(s["flags"] & 16) or bool(BOLD_RE.search(s["font"]))


def _mono(s):
    return bool(s["flags"] & 8) or bool(MONO_RE.search(s["font"]))


def _math(s):
    return bool(MATH_RE.search(s["font"]))


def extract_lines(pdf_path, ocr_pages=()):
    """Return every text line with font metadata.

    Code lines also carry the x position of every character, so indentation and
    spacing can be rebuilt from geometry instead of from PyMuPDF's text assembly.
    """
    doc = pymupdf.open(pdf_path)
    lines = []
    for page_no, page in enumerate(doc, start=1):
        page_h, page_w = page.rect.height, page.rect.width
        is_ocr = page_no in ocr_pages
        if is_ocr:
            # OCR text layer. `tp` and `page` must stay referenced while spans are read.
            tp = page.get_textpage_ocr(language="eng", dpi=200, full=True, tessdata=find_tessdata())
            blocks = page.get_text("dict", textpage=tp)["blocks"]
            raw_blocks = []
        else:
            blocks = page.get_text("dict")["blocks"]
            raw_blocks = page.get_text("rawdict")["blocks"]
        for bi, block in enumerate(blocks):
            if "lines" not in block:
                continue
            rblock = raw_blocks[bi] if bi < len(raw_blocks) and "lines" in raw_blocks[bi] else None
            for li, ln in enumerate(block["lines"]):
                rline = rblock["lines"][li] if rblock and li < len(rblock["lines"]) else None
                if rline is not None and len(rline["spans"]) != len(ln["spans"]):
                    rline = None
                pairs = [(s, rline["spans"][k] if rline else None)
                         for k, s in enumerate(ln["spans"]) if s["text"] != ""]
                spans = [p[0] for p in pairs]
                raw = "".join(s["text"] for s in spans)
                core = [s for s in spans if s["text"].strip()]
                if not core:
                    continue

                # OCR pseudo-font reports 'monospaced' flags: never trust font facts there
                is_code = (not is_ocr) and all(_mono(s) for s in core)
                is_bold_all = (not is_ocr) and all(_bold(s) for s in core)
                lead_text = ""
                if (not is_ocr) and _bold(core[0]) and not is_bold_all:
                    for s in spans:
                        if _bold(s) or not s["text"].strip():
                            lead_text += s["text"]
                        else:
                            break

                n_total = sum(len(s["text"].replace(" ", "")) for s in core)
                n_math = 0 if is_ocr else sum(len(s["text"].replace(" ", "")) for s in core if _math(s))

                marker = ""
                if len(core) >= 2 and not is_ocr:
                    t = core[0]["text"].strip()
                    if (len(t) == 1 and not t.isalnum() and t not in "([{\"'“‘$&@#%<~"
                            and core[0]["font"] != core[1]["font"]):
                        marker = t

                chars = None
                if is_code and rline is not None:
                    chars = [(ch["c"], ch["origin"][0])
                             for _, rs in pairs for ch in rs.get("chars", [])]

                lines.append({
                    "page": page_no,
                    "text": raw.rstrip() if is_code else raw.strip(),
                    "size": round(max(s["size"] for s in core), 1),
                    "is_code": is_code,
                    "is_bold": is_bold_all,
                    "lead_bold": lead_text.strip(),
                    "math_frac": (n_math / n_total) if n_total else 0.0,
                    "marker": marker,
                    "chars": chars,
                    "ocr": is_ocr,
                    "x0": ln["bbox"][0], "y0": ln["bbox"][1],
                    "x1": ln["bbox"][2], "y1": ln["bbox"][3],
                    "page_h": page_h, "page_w": page_w,
                })
    n_pages = len(doc)
    doc.close()
    return lines, n_pages


def normalise_for_repeat(text):
    return re.sub(r"\d+", "#", text.strip().lower())


PAGENUM_RE = re.compile(r"^(?:page\s*)?(\d{1,4})(?:\s*(?:of|/)\s*\d{1,4})?$", re.I)
BARE_NUM_RE = re.compile(r"^\d{1,4}$")


def _varying_band_lines(lines, n_pages, in_margin):
    """Running headers whose WORDS change (e.g. 'Chapter 1: ...', 'Chapter 2: ...') are
    not caught by the repeated-text rule. They are caught by position: a short,
    body-size-or-smaller, non-bold-heading line sitting at the same height in the
    top/bottom margin on at least max(3, half the) pages, once per page."""
    if n_pages < 3:
        return set()
    body = body_font_size(lines)
    bands = defaultdict(list)
    for l in lines:
        if (in_margin(l) and not l["is_code"] and l["size"] <= body + 0.1
                and len(l["text"].split()) <= 12 and not BARE_NUM_RE.match(l["text"].strip())):
            zone = "top" if l["y0"] < l["page_h"] / 2 else "bottom"
            bands[(zone, round(l["y0"] / 4))].append(l)
    need = max(3, -(-n_pages // 2))
    ids = set()
    for ls in bands.values():
        pages = Counter(l["page"] for l in ls)
        if len(pages) >= need and max(pages.values()) == 1:
            ids.update(id(l) for l in ls)
    return ids


def remove_headers_footers(lines, n_pages, margin=0.08, min_ratio=0.5):
    """Drop (a) lines with words that repeat on many pages inside the top/bottom
    margin ('Study Notes | Page 3') and (b) page numbers: a margin line such as '7',
    'Page 7' or '7 of 12' whose number follows the page numbering. A bare number that
    does not follow the numbering (a section number such as '6' at the top of a page)
    is content and is kept."""
    def in_margin(l):
        return l["y0"] < l["page_h"] * margin or l["y1"] > l["page_h"] * (1 - margin)

    counts, offsets = Counter(), Counter()
    for l in lines:
        if in_margin(l) and not l["is_code"]:
            t = l["text"].strip()
            if BARE_NUM_RE.match(t):
                offsets[int(t) - l["page"]] += 1
            else:
                counts[normalise_for_repeat(t)] += 1
    repeated = {k for k, v in counts.items() if v >= max(2, n_pages * min_ratio)}
    page_offsets = {o for o, c in offsets.items() if c >= 2}

    band_ids = _varying_band_lines(lines, n_pages, in_margin)

    kept, removed = [], []
    for l in lines:
        drop = id(l) in band_ids
        if not drop and in_margin(l) and not l["is_code"]:
            t = l["text"].strip()
            if BARE_NUM_RE.match(t):
                off = int(t) - l["page"]
                drop = off == 0 or off in page_offsets
            else:
                m = PAGENUM_RE.match(t)
                drop = normalise_for_repeat(t) in repeated or bool(m and int(m.group(1)) == l["page"])
        (removed if drop else kept).append(l)
    return kept, removed


def body_font_size(lines):
    weight = Counter()
    for l in lines:
        if not l["is_code"]:
            weight[l["size"]] += len(l["text"])
    if not weight:
        raise ValueError("No non-code text found.")
    return weight.most_common(1)[0][0]


NUMLABEL_ONLY_RE = re.compile(r"^\d+(?:\.\d+)*\.?$")


BULLET_GLYPHS = set("\u2022\u25e6\u25aa\u25a0\u25cf\u25cb\u00b7\u2023\u2043*")


def attach_bullet_markers(lines):
    """Word puts the bullet glyph (a Symbol-font private-use char such as U+F0B7) on its
    own line next to the item text (sort order may put the text first). Fuse it into
    the item as its marker, otherwise the pair looks like a two-cell table row."""
    lines = sorted(lines, key=lambda l: (l["page"], round(l["y0"], 1), l["x0"]))
    skip, fused = set(), {}
    for i, l in enumerate(lines):
        t = l["text"].strip()
        if not (len(t) == 1 and (0xE000 <= ord(t) <= 0xF8FF or t in BULLET_GLYPHS)):
            continue
        for j in (i - 1, i + 1, i + 2, i - 2):
            if 0 <= j < len(lines) and j not in fused.values() and j != i:
                n = lines[j]
                if (n["page"] == l["page"] and abs(n["y0"] - l["y0"]) <= 3.0 and not n["is_code"]
                        and 0 <= n["x0"] - l["x1"] <= 30 and len(n["text"].strip()) > 1):
                    skip.add(i); fused[i] = j
                    break
    by_target = {j: i for i, j in fused.items()}
    out = []
    for k, l in enumerate(lines):
        if k in skip:
            continue
        if k in by_target:
            g = lines[by_target[k]]
            l = dict(l)
            l["marker"] = g["text"].strip()
            l["text"] = l["marker"] + " " + l["text"]
            l["x0"] = g["x0"]
        out.append(l)
    return out


def merge_number_fragments(lines, body):
    """Word/LaTeX often emit the section number ('1.2') and the heading text as two
    separate lines on the same baseline. Join them: '1.2 Common operations'."""
    lines = sorted(lines, key=lambda l: (l["page"], round(l["y0"], 1), l["x0"]))
    out, i = [], 0
    while i < len(lines):
        l = lines[i]
        nxt = lines[i + 1] if i + 1 < len(lines) else None
        if (nxt and NUMLABEL_ONLY_RE.match(l["text"]) and not l["is_code"] and not nxt["is_code"]
                and (l["is_bold"] or l["size"] >= body * 1.25)
                and nxt["page"] == l["page"] and abs(nxt["y0"] - l["y0"]) <= 2.5
                and 0 <= nxt["x0"] - l["x1"] <= 40 and abs(nxt["size"] - l["size"]) <= 0.6):
            merged = dict(nxt)
            merged["text"] = f"{l['text']} {nxt['text']}"
            merged["x0"] = l["x0"]
            merged["is_bold"] = l["is_bold"] and nxt["is_bold"]
            out.append(merged)
            i += 2
        else:
            out.append(l)
            i += 1
    return out


# --------------------------------------------------------------------------
# 3. Columns and reading order
# --------------------------------------------------------------------------

def detect_gutter(page_lines, page_w, min_side=8):
    """x position of a vertical gutter between two text columns, or None.

    A gutter must be a free band (>= 8pt wide) in the middle of the page that
    (almost) no prose line crosses, with plenty of prose on both sides."""
    prose = [l for l in page_lines if not l["is_code"] and len(l["text"]) >= 30]
    if len(prose) < 2 * min_side:
        return None
    thr = max(2, int(0.1 * len(prose)))
    lo, hi = int(page_w * 0.30), int(page_w * 0.70)
    free = [x for x in range(lo, hi + 1)
            if sum(1 for l in prose if l["x0"] < x < l["x1"]) <= thr]
    if not free:
        return None
    bands, start, prev = [], free[0], free[0]
    for x in free[1:]:
        if x != prev + 1:
            bands.append((start, prev))
            start = x
        prev = x
    bands.append((start, prev))
    a, b = max(bands, key=lambda t: t[1] - t[0])
    if b - a < 8:
        return None
    gx = (a + b) / 2
    left = [l for l in prose if l["x1"] <= gx]
    right = [l for l in prose if l["x0"] >= gx]
    if len(left) < min_side or len(right) < min_side:
        return None
    return gx


def _gutter_is_free(page_lines, gx, min_side=3):
    """Is the band around gx free of prose lines, with prose on both sides?"""
    prose = [l for l in page_lines if not l["is_code"] and len(l["text"]) >= 30]
    crossing = sum(1 for l in prose if l["x0"] < gx + 4 and l["x1"] > gx - 4)
    left = sum(1 for l in prose if l["x1"] <= gx)
    right = sum(1 for l in prose if l["x0"] >= gx)
    return crossing <= 2 and left >= min_side and right >= min_side


def order_lines(lines):
    """Sort lines into reading order and annotate each with seg / col.

    One column: top to bottom. Two columns: lines that span the gutter (titles)
    split the page into bands; inside a band the left column is read before the
    right one. A gutter found on enough pages is also tried on the remaining
    pages, so a short last page of a two-column paper is not read as one column."""
    by_page = defaultdict(list)
    for l in lines:
        by_page[l["page"]].append(l)

    gutters = {pg: detect_gutter(pl, pl[0]["page_w"]) for pg, pl in by_page.items()}
    found = sorted(g for g in gutters.values() if g is not None)
    if found and len(found) >= max(1, len(by_page) // 2):
        doc_gx = found[len(found) // 2]
        for pg, g in gutters.items():
            if g is None and _gutter_is_free(by_page[pg], doc_gx):
                gutters[pg] = doc_gx

    ordered, layout = [], {}
    for pg in sorted(by_page):
        pl = by_page[pg]
        gx = gutters[pg]
        if gx is None:
            for l in pl:
                l["seg"], l["col"] = 0, None
            pl.sort(key=lambda l: (round(l["y0"], 1), l["x0"]))
            layout[pg] = 1
        else:
            full = sorted([l for l in pl if l["x0"] < gx - 1 and l["x1"] > gx + 1],
                          key=lambda l: l["y0"])
            full_ids = {id(l): j for j, l in enumerate(full)}

            def key(l):
                if id(l) in full_ids:
                    j = full_ids[id(l)]
                    l["seg"], l["col"] = j, None
                    return (j, 2, round(l["y0"], 1), l["x0"])
                above = sum(1 for f in full if f["y0"] < l["y0"])
                l["seg"] = above
                l["col"] = 0 if (l["x0"] + l["x1"]) / 2 < gx else 1
                return (above, l["col"], round(l["y0"], 1), l["x0"])
            pl.sort(key=key)
            layout[pg] = 2
        ordered.extend(pl)
    for i, l in enumerate(ordered):
        l["ord"] = i
    _annotate_regions(ordered)
    return ordered, layout


def _annotate_regions(lines):
    """Left / right edge of the text measure of each (page, band, column) region."""
    regions = defaultdict(list)
    for l in lines:
        regions[(l["page"], l["seg"], l["col"])].append(l)
    for ls in regions.values():
        prose = [l for l in ls if not l["is_code"] and len(l["text"]) >= 30] or ls
        rx0, rx1 = min(l["x0"] for l in prose), max(l["x1"] for l in prose)
        for l in ls:
            l["rx0"], l["rx1"] = rx0, rx1


def merge_same_baseline(lines, table_ids):
    """PyMuPDF splits justified lines at stretched or sentence-end spaces. Re-join
    fragments that share a baseline and are only a word space apart. Table cells and
    code are never merged (their gaps are wider or handled separately)."""
    out = []
    for l in lines:
        p = out[-1] if out else None
        if (p and not l["is_code"] and not p["is_code"] and id(l) not in table_ids
                and id(p) not in table_ids and p["page"] == l["page"] and p["seg"] == l["seg"]
                and p["col"] == l["col"] and abs(p["y0"] - l["y0"]) <= 2.0
                and 0 <= l["x0"] - p["x1"] <= 1.05 * l["size"]
                and abs(p["size"] - l["size"]) <= 0.3 and p["is_bold"] == l["is_bold"]
                and not l["marker"] and not l["lead_bold"]):
            m = dict(p)
            m["text"] = p["text"] + " " + l["text"]
            m["x1"] = max(p["x1"], l["x1"])
            m["y1"] = max(p["y1"], l["y1"])
            m["math_frac"] = max(p["math_frac"], l["math_frac"])
            out[-1] = m
        else:
            out.append(l)
    return out


# --------------------------------------------------------------------------
# 4. Tables
# --------------------------------------------------------------------------

def group_rows(cells, tol=2.5):
    cells = sorted(cells, key=lambda c: (c["y0"], c["x0"]))
    rows = []
    for c in cells:
        if not rows or abs(rows[-1]["y"] - c["y0"]) > tol:
            rows.append({"y": c["y0"], "cells": [c]})
        else:
            rows[-1]["cells"].append(c)
    for r in rows:
        r["cells"].sort(key=lambda c: c["x0"])
    return rows


def _is_text_fragment_row(prev, row, measure):
    """Justified text is sometimes split into several 'lines' on one baseline.
    Such a row spans the whole column and either (a) sits directly under another
    full-width body line at normal line pitch, or (b) has only narrow, word-space
    sized gaps between its pieces. A real table has wider column gaps and is
    separated from the text above it."""
    r0, r1 = row["cells"][0], row["cells"][-1]
    if (r1["x1"] - r0["x0"]) < 0.92 * measure:
        return False
    gaps = [b["x0"] - a["x1"] for a, b in zip(row["cells"], row["cells"][1:])]
    if gaps and max(gaps) < 1.05 * r0["size"]:
        return True
    if prev is None:
        return False
    p0, p1 = prev["cells"][0], prev["cells"][-1]
    line_h = max(c["y1"] - c["y0"] for c in row["cells"])
    return ((row["y"] - prev["y"]) <= 1.35 * line_h
            and abs(p0["size"] - r0["size"]) <= 0.6
            and (p1["x1"] - p0["x0"]) >= 0.92 * measure)


def _aligned(a, b, tol=12):
    return (abs(a["x0"] - b["x0"]) <= tol or abs(a["x1"] - b["x1"]) <= tol
            or abs((a["x0"] + a["x1"]) / 2 - (b["x0"] + b["x1"]) / 2) <= tol)


def _map_to_columns(row_cells, hdr_cells):
    """Place each cell under its header column (so an empty cell does not shift
    the others). Falls back to left-to-right order if the mapping is ambiguous."""
    idx = []
    for c in row_cells:
        best = min(range(len(hdr_cells)),
                   key=lambda k: min(abs(c["x0"] - hdr_cells[k]["x0"]),
                                     abs(c["x1"] - hdr_cells[k]["x1"]),
                                     abs((c["x0"] + c["x1"]) / 2 - (hdr_cells[k]["x0"] + hdr_cells[k]["x1"]) / 2)))
        idx.append(best)
    if len(set(idx)) == len(idx):
        out = [""] * len(hdr_cells)
        for c, k in zip(row_cells, idx):
            out[k] = c["text"]
        return out
    out = [c["text"] for c in row_cells]
    return out + [""] * (len(hdr_cells) - len(out))


def _cols_of(row_cells, hdr_cells):
    return [min(range(len(hdr_cells)),
                key=lambda k: min(abs(c["x0"] - hdr_cells[k]["x0"]),
                                  abs(c["x1"] - hdr_cells[k]["x1"]),
                                  abs((c["x0"] + c["x1"]) / 2 - (hdr_cells[k]["x0"] + hdr_cells[k]["x1"]) / 2)))
            for c in row_cells]


def detect_tables(lines):
    """A table is a run of >= 2 consecutive rows that each have >= 2 cells on one
    baseline, with the cells lined up under the first row (the header).
    Works per column region, and does not need bold headers or small fonts."""
    regions = defaultdict(list)
    for l in lines:
        if l["is_code"] or l["math_frac"] > 0.5 or l.get("ocr"):
            continue   # OCR output has no reliable column geometry: no tables from OCR
        regions[(l["page"], l["seg"], l["col"] if l["col"] is not None else -1)].append(l)

    tables, used = [], set()
    for key in sorted(regions):
        rows = group_rows(regions[key])
        prose = [l for l in regions[key] if len(l["text"]) >= 30]
        measure = (max(l["x1"] for l in prose) - min(l["x0"] for l in prose)) if prose else None
        i = 0
        while i < len(rows):
            hdr = rows[i]
            if len(hdr["cells"]) < 2:
                i += 1
                continue
            if measure and _is_text_fragment_row(rows[i - 1] if i > 0 else None, hdr, measure):
                i += 1
                continue
            body_rows, prev_y, j = [], hdr["y"], i + 1
            out_rows, all_cells = [], list(hdr["cells"])
            hx0 = hdr["cells"][0]["x0"]
            uncertain = False
            hdr_cells = [dict(c) for c in hdr["cells"]]
            # wrapped bold header: next row is all-bold, same cell count, one cell under each header cell
            if all(c.get("is_bold") for c in hdr_cells) and j < len(rows):
                r = rows[j]
                lh = max(c["y1"] - c["y0"] for c in r["cells"])
                if 0 < r["y"] - prev_y <= 1.7 * lh and all(c.get("is_bold") for c in r["cells"]):
                    ks = _cols_of(r["cells"], hdr["cells"])
                    if len(r["cells"]) == len(hdr["cells"]) and len(set(ks)) == len(ks):
                        for c, k in zip(r["cells"], ks):
                            hdr_cells[k]["text"] = (hdr_cells[k]["text"] + " " + c["text"]).strip()
                        all_cells.extend(r["cells"]); prev_y = r["y"]; j += 1
                    else:
                        uncertain = True   # merged / spanning header: keep content, flag structure
            body0 = None
            order_mode = False
            last_c0 = None
            while j < len(rows):
                r = rows[j]
                gap = r["y"] - prev_y
                line_h = max(c["y1"] - c["y0"] for c in r["cells"])
                if gap <= 0 or gap > 24:
                    break
                # continuation of a wrapped cell: no cell in the first column, every cell
                # lined up under a header column, directly below the previous line
                is_cont = (bool(out_rows) and gap <= 1.7 * line_h
                           and all(c["x0"] > hx0 + 4 for c in r["cells"])
                           and all(any(_aligned(c, h, tol=4) for h in hdr["cells"][1:]) for c in r["cells"]))
                # first-column wrap: a lowercase-led first cell directly under a row whose first cell
                # started uppercase/digit (so the table's col-0 entries are capitalised)
                first_wrap = (bool(out_rows) and body0 is not None and gap <= 1.7 * line_h
                              and (body0[:1].isupper() or body0[:1].isdigit())
                              and abs(r["cells"][0]["x0"] - hx0) <= 4
                              and r["cells"][0]["text"][:1].islower()
                              and last_c0 is not None and not last_c0["text"].rstrip().endswith(TERMINAL))
                if first_wrap and all(any(_aligned(c, h, tol=4) for h in hdr["cells"]) for c in r["cells"]):
                    for c, k in zip(r["cells"], _cols_of(r["cells"], hdr["cells"])):
                        out_rows[-1][k] = (out_rows[-1][k] + " " + c["text"]).strip()
                    last_c0 = r["cells"][0]
                    all_cells.extend(r["cells"]); prev_y = r["y"]; j += 1
                    continue
                if is_cont:
                    for c, k in zip(r["cells"], _cols_of(r["cells"], hdr["cells"])):
                        out_rows[-1][k] = (out_rows[-1][k] + " " + c["text"]).strip()
                    all_cells.extend(r["cells"])
                    prev_y = r["y"]
                    j += 1
                    continue
                if len(r["cells"]) < 2:
                    break
                n_ok = sum(any(_aligned(c, h) for h in hdr["cells"]) for c in r["cells"])
                # centred bold header over left/right-aligned data: accept the first body row by
                # column order when the cell counts match (the geometry alone cannot map them)
                by_order = ((not out_rows or order_mode) and len(r["cells"]) == len(hdr_cells) and len(hdr_cells) >= 2
                            and all(c.get("is_bold") for c in hdr_cells)
                            and not any(c.get("is_bold") for c in r["cells"]))
                if n_ok < min(2, len(hdr["cells"])) and not by_order:
                    break
                if by_order and n_ok < min(2, len(hdr["cells"])):
                    out_rows.append([c["text"] for c in r["cells"]])
                    order_mode = True
                    if body0 is None:
                        body0 = out_rows[0][0]
                    all_cells.extend(r["cells"]); prev_y = r["y"]; j += 1
                    continue
                out_rows.append(_map_to_columns(r["cells"], hdr["cells"]))
                last_c0 = r["cells"][0] if abs(r["cells"][0]["x0"] - hx0) <= 4 else None
                if body0 is None:
                    body0 = out_rows[0][0] if out_rows[0] else ""
                all_cells.extend(r["cells"])
                prev_y = r["y"]
                j += 1
            header_above = None
            if out_rows and i > 0 and all(c.get("is_bold") for c in hdr_cells):
                ra = rows[i - 1]
                lh0 = max(c["y1"] - c["y0"] for c in ra["cells"])
                if (0 < hdr["y"] - ra["y"] <= 1.6 * lh0 and all(c.get("is_bold") for c in ra["cells"])
                        and all(abs(c["size"] - hdr["cells"][0]["size"]) <= 0.3 and c["x0"] > hdr["cells"][0]["x0"] + 4 for c in ra["cells"])
                        and len(ra["cells"]) < len(hdr_cells)
                        and all(hdr["cells"][0]["x0"] - 4 <= c["x0"] and c["x1"] <= hdr["cells"][-1]["x1"] + 4
                                for c in ra["cells"])):
                    header_above = " ".join(c["text"] for c in ra["cells"])   # spanning header cell
                    uncertain = True
                    all_cells.extend(ra["cells"])
            if out_rows:
                for c in all_cells:
                    used.add(id(c))
                tables.append({
                    "page": key[0],
                    "y0": hdr["y"], "y1": prev_y,
                    "ord": min(c["ord"] for c in all_cells),
                    "columns": [c["text"] for c in hdr_cells],
                    "rows": out_rows,
                    **({"structure_uncertain": True} if uncertain else {}),
                    **({"header_above": header_above} if header_above else {}),
                })
                i = j
            else:
                i += 1
    tables.sort(key=lambda t: t["ord"])
    return tables, used


def table_to_sentences(table):
    """Deterministic 'Header: value; Header: value' serialisation (no information loss)."""
    cols = table["columns"]
    out = []
    for row in table["rows"]:
        pairs = []
        for k, cell in enumerate(row):
            head = cols[k] if k < len(cols) else f"col{k+1}"
            pairs.append(f"{head}: {cell.rstrip('. ')}")
        out.append("; ".join(pairs) + ".")
    return out


def table_to_markdown(table):
    cols = table["columns"]
    esc = lambda s: s.replace("|", "\\|")
    md = ["| " + " | ".join(esc(c) for c in cols) + " |", "|" + "---|" * len(cols)]
    for row in table["rows"]:
        row = row + [""] * (len(cols) - len(row))
        md.append("| " + " | ".join(esc(c) for c in row) + " |")
    if table.get("header_above"):
        md.insert(0, "Spanning header (column mapping uncertain): " + table["header_above"] + "\n")
    return "\n".join(md)


# --------------------------------------------------------------------------
# 5. Items (paragraph / bullet / callout / code / formula / table / heading)
# --------------------------------------------------------------------------

TERMINAL = (".", "!", "?", ":")
BULLET_RE = re.compile(r"^(?:[•▪▶►◦‣⁃]\s*|[\-\*–—]\s+)")
TAG_RE = re.compile(r"^\(\d+\)$")


def reconstruct_code(code_lines):
    """Rebuild a code block from character positions.

    Fragments that share a baseline are merged into one row. Every glyph is placed
    at column round((x - left) / char_width), which restores indentation and drops
    the spaces PyMuPDF invents between kerned glyphs (real gaps become spaces).
    If the geometry is ambiguous, fall back to the extracted text."""
    rows = []
    for l in sorted(code_lines, key=lambda l: (l["y0"], l["x0"])):
        if rows and abs(rows[-1]["y0"] - l["y0"]) <= 2.0:
            rows[-1]["lines"].append(l)
        else:
            rows.append({"y0": l["y0"], "lines": [l]})
    for r in rows:
        r["lines"].sort(key=lambda l: l["x0"])
        r["text"] = " ".join(l["text"].strip() if len(r["lines"]) > 1 else l["text"] for l in r["lines"])

    if all(l.get("chars") for l in code_lines):
        diffs = []
        for r in rows:
            chars = sorted([c for l in r["lines"] for c in l["chars"] if c[0] != " "], key=lambda c: c[1])
            for (_, xa), (_, xb) in zip(chars, chars[1:]):
                if 0 < xb - xa < 25:
                    diffs.append(xb - xa)
        if len(diffs) >= 3:
            mode = Counter(round(d, 1) for d in diffs).most_common(1)[0][0]
            near = [d for d in diffs if abs(d - mode) <= 0.35]
            cw = sum(near) / len(near)
            base = min(x for l in code_lines for _, x in l["chars"])
            rebuilt, ok = [], True
            for r in rows:
                chars = sorted([c for l in r["lines"] for c in l["chars"] if c[0] != " "],
                               key=lambda c: c[1])
                grid, prev_col, prev_x = {}, None, None
                for c, x in chars:
                    if prev_col is None:
                        col = int(round((x - base) / cw))
                    else:
                        col = prev_col + max(1, int(round((x - prev_x) / cw)))
                    if col in grid:
                        ok = False
                    grid[col] = c
                    prev_col, prev_x = col, x
                width = max(grid) + 1 if grid else 0
                rebuilt.append("".join(grid.get(k, " ") for k in range(width)).rstrip())
            if ok:
                return "\n".join(rebuilt)

    texts = [r["text"] for r in rows]
    if any(t.startswith(" ") for t in texts):
        return "\n".join(texts)
    base = min(l["x0"] for l in code_lines)
    char_w = max(1.0, code_lines[0]["size"] * 0.6)
    return "\n".join(" " * int(round((r["lines"][0]["x0"] - base) / char_w)) + r["text"] for r in rows)


EQ_TAG_END_RE = re.compile(r"\((\d+(?:\.\d+)?)\)$")
PROSE_RE = re.compile(r"[A-Za-z]{3,}\s+[A-Za-z]{3,}")


def group_display_equations(lines, table_line_ids):
    """A typeset display equation is many small fragments (sum limits, fraction parts, the
    equation number) on several baselines. v6 turned them into a mix of formula items and
    stray paragraphs. Group every fragment that surrounds an equation-number tag, "(n)", at the
    margin into ONE synthetic line, so the item is one formula whose text keeps every fragment
    (main baseline first, then the stacked parts) and whose bbox covers the whole equation."""
    by_page = defaultdict(list)
    for i, l in enumerate(lines):
        by_page[l["page"]].append(i)
    used, merged_at = set(), {}
    for pg, idxs in by_page.items():
        for i in idxs:
            t = lines[i]
            if (i in used or t["is_code"] or id(t) in table_line_ids or len(t["text"]) > 40
                    or not EQ_TAG_END_RE.search(t["text"]) or PROSE_RE.search(t["text"])):
                continue
            if t["x1"] < 0.55 * t["page_w"] and not t["text"].startswith("("):
                continue
            cluster = [i]
            changed = True
            while changed:
                changed = False
                y0 = min(lines[j]["y0"] for j in cluster); y1 = max(lines[j]["y1"] for j in cluster)
                for j in idxs:
                    c = lines[j]
                    if (j in cluster or j in used or c["is_code"] or id(c) in table_line_ids or len(c["text"]) > 40
                            or PROSE_RE.search(c["text"]) or re.fullmatch(r"[a-z]{2,}[.,;:]?", c["text"].strip())
                            or c["size"] > t["size"] * 1.3):
                        continue
                    if c["y1"] >= y0 - 16 and c["y0"] <= y1 + 16 and c["y0"] - t["y1"] < 60 and t["y0"] - c["y1"] < 60:
                        cluster.append(j); changed = True
            if len(cluster) < 2 and not t["math_frac"] > 0:
                continue
            main_y = (t["y0"] + t["y1"]) / 2
            parts = [lines[j] for j in cluster]
            main = sorted([c for c in parts if abs((c["y0"] + c["y1"]) / 2 - main_y) <= 6 and c is not t], key=lambda c: c["x0"])
            rest = sorted([c for c in parts if c is not t and c not in main], key=lambda c: (c["y0"], c["x0"]))
            tag = EQ_TAG_END_RE.search(t["text"]).group(0)
            tail = t["text"][: -len(tag)].strip()
            text = "\n".join(x for x in [" ".join(c["text"] for c in main) + (" " + tail if tail else "")] + [c["text"] for c in rest] + [tag] if x.strip())
            first = min(cluster)
            g = dict(lines[first])
            g.update(text=text, math_frac=1.0, equation=True, tag=tag, is_code=False, marker="", lead_bold="",
                     x0=min(c["x0"] for c in parts), y0=min(c["y0"] for c in parts),
                     x1=max(c["x1"] for c in parts), y1=max(c["y1"] for c in parts))
            g["ord"] = min(lines[j].get("ord", 0) for j in cluster)
            merged_at[first] = g
            used.update(cluster)
    out = []
    for i, l in enumerate(lines):
        if i in merged_at:
            out.append(merged_at[i])
        elif i not in used:
            out.append(l)
    return out


def build_items(lines, table_line_ids, tables, sub_ids):
    """Turn a flat list of lines (reading order) into typed items."""
    lines = group_display_equations(lines, table_line_ids)
    items = []
    code_buf, math_buf, para_buf = [], [], None
    pending = sorted(tables, key=lambda t: t["ord"])
    tbl_idx = 0

    def flush_code():
        nonlocal code_buf
        if code_buf:
            items.append({"type": "code", "page": code_buf[0]["page"], "col": code_buf[0]["col"],
                          "text": reconstruct_code(code_buf)})
            code_buf = []

    def flush_math():
        nonlocal math_buf
        if math_buf:
            items.append({"type": "formula", "page": math_buf[0]["page"], "col": math_buf[0]["col"],
                          "text": "\n".join(l["text"] for l in math_buf),
                          **({"tag": math_buf[0]["tag"]} if math_buf[0].get("tag") else {}),
                          "bbox": [min(l["x0"] for l in math_buf), min(l["y0"] for l in math_buf),
                                   max(l["x1"] for l in math_buf), max(l["y1"] for l in math_buf)]})
            math_buf = []

    def flush_para():
        nonlocal para_buf
        if para_buf:
            items.append({k: v for k, v in para_buf.items() if not k.startswith("last_")})
            para_buf = None

    def flush_all():
        flush_code(); flush_math(); flush_para()

    for l in lines:
        while tbl_idx < len(pending) and pending[tbl_idx]["ord"] <= l["ord"]:
            flush_all()
            t = pending[tbl_idx]
            items.append({"type": "table", "page": t["page"], "col": None, "table": t})
            tbl_idx += 1
        if id(l) in table_line_ids:
            continue

        if l["is_code"]:
            flush_math(); flush_para()
            if code_buf and code_buf[-1]["page"] != l["page"]:
                flush_code()
            code_buf.append(l)
            continue
        flush_code()

        is_formula = l.get("equation") or (l["math_frac"] >= 0.5 and len(l["text"]) <= 80)
        if is_formula or (math_buf and TAG_RE.match(l["text"])):
            flush_para()
            math_buf.append(l)
            continue
        flush_math()

        if id(l) in sub_ids:
            flush_para()
            items.append({"type": "heading", "page": l["page"], "col": l["col"], "text": l["text"]})
            continue

        text = l["text"]

        # bullet start (marker may be a glyph from a symbol font)
        is_bullet, btext = False, text
        if l["marker"] and text.startswith(l["marker"]):
            is_bullet, btext = True, text[len(l["marker"]):].strip()
        elif BULLET_RE.match(text):
            is_bullet, btext = True, BULLET_RE.sub("", text, count=1)
        if is_bullet:
            flush_para()
            para_buf = {"type": "bullet", "page": l["page"], "col": l["col"],
                        "text": btext, "last_y1": l["y1"], "last_x1": l["x1"], "last_x0": l["x0"], "last_page": l["page"], "last_col": l["col"]}
            continue

        # callout: bold lead like "Exam definition:" / "Design rule:"
        if l["lead_bold"].endswith(":"):
            flush_para()
            label = l["lead_bold"].rstrip(":").strip()
            rest = text[len(l["lead_bold"]):].strip()
            para_buf = {"type": "callout", "page": l["page"], "col": l["col"], "label": label,
                        "text": rest, "last_y1": l["y1"], "last_x1": l["x1"], "last_x0": l["x0"], "last_page": l["page"], "last_col": l["col"]}
            continue

        # continuation across a column or page break: the paragraph was cut by the layout, not
        # finished. Joined only when ALL hold: it ended mid-sentence (no terminal punctuation),
        # it ended in the lower part of its column/page, the new line is in the upper part of the
        # next column/page and continues in lower case or after a hyphen. Anything else stays split.
        if (para_buf is not None and para_buf["type"] in ("paragraph", "bullet", "callout")
                and (l["page"] != para_buf["last_page"] or l["col"] != para_buf["last_col"])
                and l["page"] - para_buf["last_page"] in (0, 1)
                and not para_buf["text"].endswith(TERMINAL)
                and para_buf["last_y1"] >= 0.62 * l["page_h"] and l["y0"] <= 0.38 * l["page_h"]
                and (text[:1].islower() or para_buf["text"].endswith("-"))):
            para_buf["text"] = para_buf["text"] + " " + text
            para_buf["last_y1"] = l["y1"]
            para_buf["last_x1"], para_buf["last_x0"] = l["x1"], l["x0"]
            if l["page"] != para_buf["page"]:
                para_buf["end_page"] = l["page"]
            para_buf["last_page"], para_buf["last_col"] = l["page"], l["col"]
            para_buf["spans_break"] = True
            continue

        # continuation of the previous paragraph / bullet / callout
        if (para_buf is not None and l["page"] == para_buf["last_page"] and l["col"] == para_buf["last_col"]):
            gap = l["y0"] - para_buf["last_y1"]
            prev = para_buf["text"]
            # a line that ends a sentence starts a new paragraph unless the next line
            # continues in lower case (conservative: never glues separate paragraphs)
            cont = gap < 3.5 and (not prev.endswith(TERMINAL) or text[:1].islower())
            if cont:
                para_buf["text"] = prev + " " + text
                para_buf["last_y1"] = l["y1"]
                para_buf["last_x1"], para_buf["last_x0"] = l["x1"], l["x0"]
                if l["math_frac"] > 0:
                    para_buf["has_math"] = True
                continue

        flush_para()
        para_buf = {"type": "paragraph", "page": l["page"], "col": l["col"],
                    "text": text, "last_y1": l["y1"], "last_x1": l["x1"], "last_x0": l["x0"], "last_page": l["page"], "last_col": l["col"]}
        if l["math_frac"] > 0:
            para_buf["has_math"] = True

    flush_all()
    while tbl_idx < len(pending):
        t = pending[tbl_idx]
        items.append({"type": "table", "page": t["page"], "col": None, "table": t})
        tbl_idx += 1
    return items


# --------------------------------------------------------------------------
# 6. Document tree
# --------------------------------------------------------------------------

NUM_LABEL_RE = re.compile(r"^(\d{1,2}(?:\.\d{1,2})*)\.?\s+(\S.*)$")


def find_headings(lines, body, table_ids):
    """Heading levels come from font size rank, not from fixed ratios or numbering.

    A heading candidate is a short line that is bold and a little larger than the
    body text, or clearly larger even when not bold. Distinct sizes are ranked:
    an optional document title (largest size, first page only), then sections
    (next size), then subsections (everything smaller)."""
    cands = []
    all_ocr = all(l.get("ocr") for l in lines)
    for l in lines:
        if l["is_code"] or l["math_frac"] > 0.5 or id(l) in table_ids:
            continue
        t = l["text"]
        if len(t) > 100 or len(t.split()) > 14 or t[-1] in ".,;":
            continue
        if l.get("ocr"):
            # OCR gives no font facts and a noisy size (line height). Use it only as a
            # headline when clearly larger, and never in a document that has real text.
            if not all_ocr or l["size"] < body * 1.4:
                continue
            cands.append(l)
        elif (l["is_bold"] and l["size"] >= body * 1.05) or l["size"] >= body * 1.25:
            cands.append(l)

    groups = defaultdict(list)
    for l in cands:
        groups[round(l["size"] * 2) / 2].append(l)
    sizes = sorted(groups, reverse=True)

    title_lines = []
    if len(sizes) >= 2:
        top = groups[sizes[0]]
        if (len(top) <= 3 and all(l["page"] == 1 and l["y0"] < 0.5 * l["page_h"] for l in top)
                and sizes[0] >= sizes[1] * 1.1):
            title_lines = top
            sizes = sizes[1:]

    sections = groups[sizes[0]] if sizes else []
    subs = [l for s in sizes[1:] for l in groups[s]]
    return title_lines, sections, subs


def build_document(pdf_path, ocr=False):
    triage = triage_pdf(pdf_path)
    if triage["verdict"] == "scanned" and not ocr:
        raise NeedsOCRError(
            f"{os.path.basename(pdf_path)}: none of the {triage['n_pages']} pages has a text layer "
            "(scanned or image-only PDF). Re-run with ocr=True to OCR it (Tesseract required).")
    if triage["verdict"] == "empty":
        raise ValueError(f"{os.path.basename(pdf_path)}: the PDF has no text and no images.")

    warnings = []
    ocr_pages = tuple(triage["image_only_pages"]) if ocr else ()
    if triage["verdict"] in ("mixed", "scanned") and ocr:
        warnings.append({"code": "ocr_used",
                         "message": f"Pages {list(ocr_pages)} were read by OCR (Tesseract). Text may "
                                    "contain recognition errors; code, tables, bold and formulas on "
                                    "those pages are NOT detected."})
    elif triage["verdict"] == "mixed":
        warnings.append({"code": "image_only_pages",
                         "message": f"Pages {triage['image_only_pages']} have no text layer; "
                                    "their content is NOT in the output (run with ocr=True)."})

    lines, n_pages = extract_lines(pdf_path, ocr_pages)
    lines, removed = remove_headers_footers(lines, n_pages)
    body = body_font_size(lines)
    lines = merge_number_fragments(lines, body)
    lines = attach_bullet_markers(lines)
    lines, layout = order_lines(lines)

    tables, table_ids = detect_tables(lines)
    for t in tables:
        if t.get("structure_uncertain"):
            warnings.append({"code": "table_structure_uncertain", "page": t["page"],
                             "message": "A table has a merged or multi-row header whose column spans could not be "
                                        "resolved. All cell text is preserved in reading order but header-to-cell "
                                        "mapping needs human review."})
    lines = merge_same_baseline(lines, table_ids)
    title_lines, head_lines, sub_lines = find_headings(lines, body, table_ids)
    title = " ".join(l["text"] for l in title_lines)
    title_ids = {id(l) for l in title_lines}
    head_ids = {id(h) for h in head_lines}
    sub_ids = {id(h) for h in sub_lines}

    sections, front, current = [], [], None
    if not head_lines:
        warnings.append({"code": "no_headings_detected",
                         "message": "No section headings were found. All content is placed in one "
                                    "fallback section. Headings may be the same size as body text."})
        current = {"label": "", "title": title or "Document", "start_page": 1, "end_page": 1,
                   "lines": [], "head_ord": -1, "synthetic": True}
        sections.append(current)
    for l in lines:
        if id(l) in head_ids:
            m = NUM_LABEL_RE.match(l["text"])
            current = {"label": m.group(1) if m else "",
                       "title": (m.group(2) if m else l["text"]).strip(),
                       "start_page": l["page"], "end_page": l["page"], "lines": [],
                       "head_ord": l["ord"]}
            sections.append(current)
        elif id(l) in title_ids:
            continue
        elif current is None:
            front.append(l)
        else:
            current["lines"].append(l)
            current["end_page"] = max(current["end_page"], l["page"])

    n_two_col = sum(1 for v in layout.values() if v == 2)
    if n_two_col:
        warnings.append({"code": "multi_column",
                         "message": f"{n_two_col} page(s) use two columns; reading order is "
                                    "left column then right column."})

    bounds = [s["head_ord"] for s in sections]

    def tables_between(lo, hi):
        return [t for t in tables if (lo is None or t["ord"] >= lo) and (hi is None or t["ord"] < hi)]

    front_items = build_items(front, table_ids, tables_between(None, bounds[0] if bounds[0] >= 0 else 0),
                              sub_ids) if front else []

    out_sections, code_counter, math_counter = [], 0, 0
    for idx, sec in enumerate(sections):
        lo = sec["head_ord"] if sec["head_ord"] >= 0 else None
        hi = bounds[idx + 1] if idx + 1 < len(bounds) else None
        items = build_items(sec["lines"], table_ids, tables_between(lo, hi), sub_ids)

        subs, cur = [], {"title": "Overview", "items": [], "synthetic": True}
        for it in items:
            if it["type"] == "heading":
                if cur["items"]:
                    subs.append(cur)
                m = NUM_LABEL_RE.match(it["text"])
                cur = {"title": (m.group(2) if m else it["text"]).strip(), "items": []}
                if m:
                    cur["number"] = m.group(1)
            else:
                cur["items"].append(it)
        subs.append(cur)
        subs = [s for s in subs if s["items"]]

        for s in subs:
            for it in s["items"]:
                if it["type"] == "code":
                    code_counter += 1
                    it["id"] = f"CODE_{code_counter}"
                elif it["type"] == "formula":
                    math_counter += 1
                    it["id"] = f"MATH_{math_counter}"
                elif it["type"] == "table":
                    it["markdown"] = table_to_markdown(it["table"])
                    it["sentences"] = table_to_sentences(it["table"])

        pages = [it["page"] for s in subs for it in s["items"]]
        out_sections.append({
            "section_number": idx + 1,
            "label": sec["label"],
            "title": sec["title"],
            "start_page": sec["start_page"] if not sec.get("synthetic") else (min(pages) if pages else 1),
            "end_page": sec["end_page"] if not sec.get("synthetic") else (max(pages) if pages else 1),
            "subsections": subs,
        })

    for it in front_items:
        if it["type"] == "table":
            it["markdown"] = table_to_markdown(it["table"])
            it["sentences"] = table_to_sentences(it["table"])

    return {
        "meta": {
            "n_pages": n_pages, "body_font_size": body,
            "removed_header_footer_lines": len(removed),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "columns_per_page": layout,
            "triage": {k: v for k, v in triage.items() if k != "pages"},
            "warnings": warnings,
        },
        "title": title,
        "front_matter": front_items,
        "sections": out_sections,
    }, lines, removed


# --------------------------------------------------------------------------
# 7. Enrichment: key points, definitions, exam tips, practice Q&A, LLM text
# --------------------------------------------------------------------------

NUM_RE = re.compile(r"^(\d+)\.\s+(.*)$", re.S)
TIP_WORDS = ("exam", "trap", "technique", "rule", "decision", "limitation")
HYPHEN_BREAK_RE = re.compile(r"([a-z]{2,})- ([a-z]{2,})")


def dehyphenate(text):
    """Join words that were split by a line-break hyphen ('mea- sures'). Only used for
    the model input; the canonical structure keeps the text exactly as extracted."""
    return HYPHEN_BREAK_RE.sub(r"\1\2", text)


def _is_practice(title):
    return title.lower().startswith("practice")


def _is_answers(title):
    return title.lower().strip() == "answers"


def enrich(doc):
    code_blocks, formulas = {}, {}
    for sec in doc["sections"]:
        key_points, definitions, tips, notes = [], [], [], []
        questions, answers = {}, {}
        llm_parts, last_q = [], None
        n_tables = 0
        for sub in sec["subsections"]:
            practice, ans = _is_practice(sub["title"]), _is_answers(sub["title"])
            if not (practice or ans):
                llm_parts.append(f"## {sub['title']}")
            for it in sub["items"]:
                t = it["type"]
                if t == "code":
                    code_blocks[it["id"]] = {"section": sec["section_number"], "subsection": sub["title"],
                                             "page": it["page"], "code": it["text"]}
                    if practice and last_q is not None:
                        questions[last_q]["code_ids"].append(it["id"])
                    elif not (practice or ans):
                        llm_parts.append(f"[{it['id']}: code example, shown to the student verbatim]")
                    continue
                if t == "formula":
                    formulas[it["id"]] = {"section": sec["section_number"], "subsection": sub["title"],
                                          "page": it["page"], "text": it["text"]}
                    if not (practice or ans):
                        llm_parts.append(f"[{it['id']}: formula, extracted as plain text, shown to the student verbatim]")
                    continue
                if practice and t == "paragraph":
                    m = NUM_RE.match(it["text"])
                    if m:
                        last_q = int(m.group(1))
                        questions[last_q] = {"number": last_q, "question": m.group(2).strip(), "code_ids": []}
                    continue
                if ans and t == "bullet":
                    m = NUM_RE.match(it["text"])
                    if m:
                        answers[int(m.group(1))] = m.group(2).strip()
                        continue
                if t == "bullet":
                    key_points.append(it["text"])
                    llm_parts.append(f"- {dehyphenate(it['text'])}")
                elif t == "callout":
                    label = it["label"]
                    entry = {"label": label, "text": it["text"]}
                    low = label.lower()
                    if "definition" in low:
                        definitions.append(entry)
                    elif any(w in low for w in TIP_WORDS):
                        tips.append(entry)
                    else:
                        notes.append(entry)
                    if not (practice or ans):
                        llm_parts.append(f"{label}: {dehyphenate(it['text'])}")
                elif t == "table":
                    n_tables += 1
                    llm_parts.append("Table: " + " ".join(it["sentences"]))
                elif t == "paragraph" and not (practice or ans):
                    llm_parts.append(dehyphenate(it["text"]))
        qa = [{**questions[n], "answer": answers.get(n)} for n in sorted(questions)]
        sec["key_points"] = key_points
        sec["definitions"] = definitions
        sec["exam_tips"] = tips
        sec["notes"] = notes
        sec["practice"] = qa
        sec["llm_text"] = "\n".join(llm_parts)
        count = lambda kind: sum(1 for s in sec["subsections"] for i in s["items"] if i["type"] == kind)
        sec["stats"] = {
            "chars": len(sec["llm_text"]),
            "approx_tokens": len(sec["llm_text"]) // 4,
            "code_blocks": count("code"),
            "formulas": count("formula"),
            "tables": n_tables,
            "practice_questions": len(qa),
        }
    doc["code_blocks"] = code_blocks
    doc["formulas"] = formulas
    return doc


# --------------------------------------------------------------------------
# 8. Units for the summariser (next stage)
# --------------------------------------------------------------------------

TARGET_SCHEMA = {
    "title": "short section title",
    "summary": "3-5 sentence explanation of the section in plain English",
    "key_points": ["concise bullet", "..."],
    "definitions": [{"term": "", "meaning": ""}],
    "exam_tips": ["..."],
    "flashcards": [{"q": "", "a": ""}],
}


def make_llm_units(doc, max_tokens=1800):
    """One unit per section. Code and formulas are replaced by [CODE_n] / [MATH_n]
    placeholders and kept verbatim in doc['code_blocks'] / doc['formulas']. A section
    longer than max_tokens is split on subsection headings, never truncated."""
    units = []
    for s in doc["sections"]:
        text = s["llm_text"]
        if s["stats"]["approx_tokens"] > max_tokens:
            chunks, cur = [], ""
            for part in text.split("\n## "):
                part = part if part.startswith("## ") else "## " + part
                if cur and (len(cur) + len(part)) // 4 > max_tokens:
                    chunks.append(cur)
                    cur = ""
                cur += part + "\n"
            if cur:
                chunks.append(cur)
        else:
            chunks = [text]
        for k, chunk in enumerate(chunks, start=1):
            units.append({
                "unit_id": f"S{s['section_number']}" + (f".{k}" if len(chunks) > 1 else ""),
                "section_number": s["section_number"],
                "section_title": s["title"],
                "pages": [s["start_page"], s["end_page"]],
                "text": chunk.strip(),
                "code_ids": re.findall(r"\[(CODE_\d+):", chunk),
                "math_ids": re.findall(r"\[(MATH_\d+):", chunk),
            })
    return units


# --------------------------------------------------------------------------
# 9. Formula images (faithful visual copy of every formula)
# --------------------------------------------------------------------------

def render_formula_images(pdf_path, doc, out_dir, dpi=200, pad=3):
    """Text extracted from typeset maths can lose structure (fractions, roots, scripts).
    Save a PNG crop of the original rendering of every formula item next to the text, so
    the original is never replaced by a lossy reading. Sets item['image'] to the file."""
    os.makedirs(out_dir, exist_ok=True)
    pdf = pymupdf.open(pdf_path)
    n = 0
    for sec in doc["sections"] + [{"subsections": [{"items": doc.get("front_matter", [])}]}]:
        for sub in sec["subsections"]:
            for it in sub["items"]:
                if it["type"] != "formula" or "bbox" not in it:
                    continue
                x0, y0, x1, y1 = it["bbox"]
                clip = pymupdf.Rect(x0 - pad, y0 - pad, x1 + pad, y1 + pad) & pdf[it["page"] - 1].rect
                name = f"{it.get('id', 'MATH_x')}_p{it['page']}.png"
                pdf[it["page"] - 1].get_pixmap(clip=clip, dpi=dpi).save(os.path.join(out_dir, name))
                it["image"] = name
                n += 1
    pdf.close()
    return n
