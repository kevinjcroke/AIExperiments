"""Build src/data/deck.json from released NAEP and MCAS test items.

Python 3, standard library only. Run from the project folder:

    python scripts/build_deck.py            # uses the download cache when present
    python scripts/build_deck.py --refresh  # re-download NAEP items

Inputs
  data/picks.json        NAEP item IDs (math) and NAEP reading blocks
  data/mcas/*.json       MCAS public-domain passages and their questions, transcribed from the
                         released test PDFs (see README for the license)
  data/passages/*.json   Public-domain passage text that NAEP did not reprint
  data/explanations*.json Explanations written for this app, keyed by question ID
  data/tags.json         Reading skill tags, keyed by question ID

Outputs
  src/data/deck.json     Questions and passages for the app
  public/naep/*          Figures used by NAEP questions

NAEP material is in the public domain (NAEP Questions Tool copyright policy). Third-party
passages are excluded by hand in data/picks.json; only public-domain passages are used.
"""

from __future__ import annotations

import html
import json
import re
import sys
import time
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CACHE = ROOT / "scripts" / ".cache"
OUT_JSON = ROOT / "src" / "data" / "deck.json"
OUT_IMG = ROOT / "public" / "naep"
NQT = "https://www.nationsreportcard.gov/nqt/"
UA = {"User-Agent": "upper-hand-flashcards-build/1.0"}
REFRESH = "--refresh" in sys.argv

MATH_TOPICS = {
    "Number Properties and Operations": "numbers",
    "Algebra": "algebra",
    "Geometry": "geometry",
    "Measurement": "measurement",
    "Data Analysis, Statistics, and Probability": "data",
}


# --------------------------------------------------------------------------- fetching

def _get(path: str, body: dict | None = None) -> bytes:
    data = json.dumps(body).encode() if body is not None else None
    headers = dict(UA)
    if body is not None:
        headers["Content-Type"] = "application/json"
    last: Exception | None = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(NQT + path, data=data, headers=headers)
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception as e:  # network hiccup: back off and retry
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"NQT request failed: {path}: {last}")


def cached(name: str, fetch) -> bytes:
    p = CACHE / name
    if p.exists() and not REFRESH:
        return p.read_bytes()
    b = fetch()
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(b)
    return b


def naep_item(table_id: str) -> dict:
    item = json.loads(cached(f"item-{table_id}.json", lambda: _get(f"api/queryresults/GetItem?tableID={table_id}")))
    key = cached(f"key-{table_id}.html", lambda: _get(f"api/queryresults/GetItemScoreGuide?tableID={table_id}")).decode("utf-8")
    return {"item": item, "key": key}


def naep_perf(table_id: str, subject: str) -> dict | None:
    body = {"itemTableID": int(table_id), "ndeSystemId": "1", "subjectCode": subject, "jurisdictionsSelected": "NP",
            "output": 0, "showStandardError": False, "statistics": ["MN", "RP"], "variablesSelected": "TOTAL"}
    try:
        raw = cached(f"perf-{table_id}.json", lambda: _get("api/queryresults/GetItemPerformanceData", body))
    except RuntimeError:
        return None
    d = json.loads(raw)
    res = d.get("result") or {}
    series = res.get("series") or []
    if not series:
        return None
    pct: dict[str, float] = {}
    omitted = 0.0
    correct = None
    for p in series[0].get("dataPoints", []):
        label = p["AxisLabel"].strip()
        val = p["YValues"][0]
        if label.startswith("Omitted"):
            omitted = val
            continue
        letter = label[0]
        if letter in "ABCDE":
            pct[letter] = val
            if "*" in label:
                correct = letter
    return {"pct": pct, "omitted": omitted, "markedCorrect": correct}


def naep_resource(guid: str) -> str:
    """Download an NQT figure once; return its public path."""
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    for ext in ("png", "gif", "jpg", "svg"):
        p = OUT_IMG / f"{guid.lower()}.{ext}"
        if p.exists():
            return f"naep/{p.name}"
    req = urllib.request.Request(NQT + f"api/QueryResults/GetItemResource?TableID={guid}", headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        b = r.read()
        ctype = r.headers.get("Content-Type", "")
    if b[:8] == b"\x89PNG\r\n\x1a\n":
        ext = "png"
    elif b[:4] == b"GIF8":
        ext = "gif"
    elif b[:3] == b"\xff\xd8\xff":
        ext = "jpg"
    elif b"<svg" in b[:512]:
        ext = "svg"
    else:
        raise RuntimeError(f"unknown image type for {guid}: {ctype}")
    p = OUT_IMG / f"{guid.lower()}.{ext}"
    p.write_bytes(b)
    return f"naep/{p.name}"


# --------------------------------------------------------------------------- HTML cleanup

def fix_text(s: str) -> str:
    """Repair the double-encoded UTF-8 that NQT returns for some characters."""
    s = s.replace("Â ", " ")
    if re.search(r"[ÂÃâ][\u0080-¿‘-›Œ-Ÿˆ˜€™]", s):
        try:
            s = s.encode("cp1252").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
    # Characters lost upstream show as U+FFFD: a dash between numbers is an en dash, otherwise an em dash.
    s = re.sub(r"(?<=\d)�(?=\d)", "–", s)
    s = s.replace("�", "—")
    return s


MATHML = {"math", "mrow", "mi", "mn", "mo", "mfrac", "msup", "msub", "msubsup", "msqrt", "mroot", "mtext", "mspace",
          "mstyle", "mtable", "mtr", "mtd", "mover", "munder", "munderover", "menclose", "mfenced", "mpadded",
          "mphantom", "semantics"}
MATH_ATTRS = {"mathvariant", "linethickness", "display", "stretchy", "fence", "separator", "lspace", "rspace",
              "columnalign", "notation", "open", "close", "separators", "width", "accent", "accentunder",
              "displaystyle", "scriptlevel", "form", "largeop", "movablelimits", "symmetric", "minsize", "maxsize",
              "bevelled"}
VOID = {"br", "img", "hr", "mspace"}


class Clean(HTMLParser):
    """Whitelist sanitizer that maps NQT classes onto a small set of semantic tags."""

    def __init__(self, image_cb, layout_tables: bool = False):
        super().__init__(convert_charrefs=True)
        self.layout_tables = layout_tables
        self.out: list[str] = []
        self.stack: list[str | None] = []  # emitted tag per open source tag (None = dropped)
        self.image_cb = image_cb

    def emit_open(self, tag: str, attrs: str = "") -> None:
        self.out.append(f"<{tag}{attrs}>")

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        cls = a.get("class", "")
        t: str | None = None
        attr = ""
        if tag in MATHML:
            t = tag
            kept = [(k, v) for k, v in a.items() if k in MATH_ATTRS]
            attr = "".join(f' {k}="{html.escape(v, quote=True)}"' for k, v in kept)
        elif tag == "div":
            # Everything block-level becomes a div: NQT nests "paragraph" divs, which <p> cannot hold.
            if "stdaln_stmt" in cls:
                t, attr = "div", ' class="stmt"'
            elif "stdaln_img" in cls:
                t, attr = "div", ' class="fig"'
            elif "attrib" in cls:
                t, attr = "div", ' class="attrib"'
            elif cls in ("paragraph", "") or "paragraph" in cls:
                style = a.get("style", "")
                t, attr = "div", ' class="p"'
                if "center" in style:
                    attr = ' class="p center"'
            else:
                t = None
        elif tag == "span":
            if "inline_variable" in cls or "inline-variable" in cls:
                t = "var"
            elif "stressed_text_1" in cls or "stressed_text_3" in cls:
                t = "strong"
            elif "stressed_text_2" in cls:
                t = "em"
            else:
                t = None
        elif tag in ("b", "strong"):
            t = "strong"
        elif tag in ("i", "em"):
            t = "em"
        elif self.layout_tables and tag in ("table", "thead", "tbody", "tr", "td", "th"):
            t = "div" if tag in ("td", "th") else None
        elif tag in ("u", "sup", "sub", "ul", "ol", "li", "table", "thead", "tbody", "tr", "br"):
            t = tag
            if tag == "table":
                attr = ' class="data"'
        elif tag in ("td", "th"):
            t = tag
            for k in ("colspan", "rowspan"):
                if a.get(k):
                    attr += f' {k}="{int(a[k])}"'
            if a.get("scope"):
                attr += f' scope="{html.escape(a["scope"])}"'
        elif tag == "img":
            m = re.search(r"TableID=([0-9a-fA-F-]{36})", a.get("src", ""))
            alt = fix_text(a.get("alt", ""))
            if m and self.layout_tables and re.search(r"ornament|decorative|photograph|photo of", alt, re.I):
                return  # passage decorations and third-party photos are left out
            if m:
                src = self.image_cb(m.group(1))
                w, h = a.get("width", ""), a.get("height", "")
                dims = (f' width="{int(float(w))}"' if w else "") + (f' height="{int(float(h))}"' if h else "")
                self.out.append(f'<img src="{src}" alt="{html.escape(alt, quote=True)}"{dims} decoding="async">')
            return
        if tag in VOID:
            if t:
                self.emit_open(t, attr)
            return
        self.stack.append(t)
        if t:
            self.emit_open(t, attr)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and self.stack:
            t = self.stack.pop()
            if t:
                self.out.append(f"</{t}>")

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            return
        t = self.stack.pop()
        if t:
            self.out.append(f"</{t}>")

    def handle_data(self, data):
        self.out.append(html.escape(fix_text(data), quote=False))


def clean_html(fragment: str, image_cb, layout_tables: bool = False) -> str:
    c = Clean(image_cb, layout_tables)
    c.feed(fragment)
    c.close()
    s = "".join(c.out)
    s = s.replace(" ", " ")
    s = re.sub(r"[ \t\r\n]+", " ", s)
    for _ in range(3):
        s = re.sub(r"<div( class=\"[^\"]*\")?>\s*</div>", "", s)
    s = re.sub(r"\s+(</(div|li|td|th)>)", r"\1", s)
    s = re.sub(r"(<(div|li|td|th)( [^>]*)?>)\s+", r"\1", s)
    # NQT pads "inline" variables and choices with stray spaces.
    s = s.replace(" </var>", "</var> ").replace("<var> ", " <var>")
    s = re.sub(r"  +", " ", s)
    # NQT leaves a space before closing punctuation ("= 12 ." / "of k ?").
    s = re.sub(r"(?<=[\w>)])\s+([.,?;:!])(?=\s|<|$)", r"\1", s)
    # Typographic minus signs: MathML operators and negative numbers ("-1" in tables and choices).
    s = s.replace("<mo>-</mo>", "<mo>−</mo>")
    s = re.sub(r"(?:(?<=^)|(?<=[>\s(]))-(?=\d)", "−", s)
    return s.strip()


class Split(HTMLParser):
    """Split an NQT item into stimulus (passage), stem and choice fragments (raw HTML)."""

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.parts: dict[str, list[str]] = {"stim": [], "stem": []}
        self.choices: list[list[str]] = []
        self.mode: str | None = None
        self.depth = 0
        self.zone: str | None = None  # 'question' | 'distractors'
        self.zdepth = 0

    def _raw(self, s: str) -> None:
        if self.zone == "question":
            self.parts["stim" if self.mode == "stim" else "stem"].append(s)
        elif self.zone == "distractors" and self.choices:
            self.choices[-1].append(s)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = (a.get("class") or "").strip()
        raw = self.get_starttag_text()
        if self.zone is None and tag == "div" and cls == "question":
            self.zone, self.zdepth = "question", 0
            return
        if self.zone is None and tag == "div" and "distractors" in cls:
            self.zone, self.zdepth = "distractors", 0
            return
        if self.zone is None:
            return
        if tag in VOID or tag == "img":
            self._raw(raw)
            return
        self.zdepth += 1
        if self.zone == "question" and tag == "div" and "stimulus" in cls and self.mode is None:
            self.mode, self.depth = "stim", self.zdepth
            return
        if self.zone == "question" and self.mode == "stim" and tag == "div" and cls in ("stimlabel", "stimleadin"):
            self.mode, self.depth2 = "skip", self.zdepth
            return
        if self.zone == "distractors" and self.zdepth == 1 and tag == "div":
            self.choices.append([])
            return
        if self.mode == "skip":
            return
        self._raw(raw)

    def handle_startendtag(self, tag, attrs):
        if self.zone:
            self._raw(self.get_starttag_text())

    def handle_endtag(self, tag):
        if self.zone is None or tag in VOID or tag == "img":
            return
        if self.zdepth == 0:
            self.zone = None
            return
        if self.mode == "skip" and self.zdepth == getattr(self, "depth2", -1):
            self.mode = "stim"
            self.zdepth -= 1
            return
        if self.mode == "stim" and self.zdepth == self.depth:
            self.mode = None
            self.zdepth -= 1
            return
        if self.zone == "distractors" and self.zdepth == 1 and tag == "div":
            self.zdepth -= 1
            return
        self.zdepth -= 1
        if self.mode != "skip":
            self._raw(f"</{tag}>")

    def handle_data(self, data):
        if self.zone and self.mode != "skip":
            self._raw(data)

    def handle_entityref(self, name):
        self.handle_data(f"&{name};")

    def handle_charref(self, name):
        self.handle_data(f"&#{name};")


def split_item(item_html: str):
    sp = Split()
    sp.feed(item_html)
    choices = []
    for c in sp.choices:
        raw = "".join(c).strip()
        m = re.match(r"^\s*([A-E])\.\s*(.*)$", raw, re.S)
        if not m:
            raise ValueError(f"unparsed choice: {raw[:80]}")
        choices.append((m.group(1), m.group(2)))
    return "".join(sp.parts["stim"]), "".join(sp.parts["stem"]), choices


def strip_tags(s: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


# --------------------------------------------------------------------------- deck assembly

def grade_label(g: int) -> str:
    return {8: "8th graders", 12: "12th graders"}.get(g, f"grade {g} students")


def naep_question(table_id: str, subject_code: str):
    d = naep_item(table_id)
    item = d["item"]
    stim, stem, choices = split_item(item["itemHTML"])
    km = re.search(r"correct answer is:\s*<div[^>]*>\s*([A-E])\.", d["key"])
    if not km:
        raise ValueError(f"no key for {table_id}")
    t1, t2, qid = item["titleLine1"], item.get("titleLine2", ""), item["questionID"]
    year = int(re.search(r"Year: (\d{4})", t1).group(1))
    grade = int(re.search(r"Grade: (\d+)", t1).group(1))
    diff = re.search(r"Difficulty: (\w+)", t2)
    m = re.search(r"Question ID:\s*(\S+)\s+#(\d+)\s+(\S+)", qid)
    block, num, naep_id = m.group(1), int(m.group(2)), m.group(3)
    perf = naep_perf(table_id, subject_code)
    if perf and perf["markedCorrect"] and perf["markedCorrect"] != km.group(1):
        raise ValueError(f"key mismatch for {table_id}: {perf['markedCorrect']} vs {km.group(1)}")
    stem_html = clean_html(stem, naep_resource)
    stem_html = re.sub(r"Question refers to the (following|graph|table|spreadsheet)[^.<]*\.\s*", "", stem_html)
    stem_html = re.sub(r'^<div class="p">\s*</div>', "", stem_html)
    q = {
        "id": f"naep-{naep_id.lower()}",
        "stem": stem_html,
        "choices": [{"key": k, "html": clean_html(v, naep_resource)} for k, v in choices],
        "answer": km.group(1),
        "difficulty": diff.group(1).lower() if diff and diff.group(1) in ("Easy", "Medium", "Hard") else None,
        "source": {
            "test": "NAEP",
            "year": year,
            "grade": grade,
            "ref": f"{block} #{num} · {naep_id}",
            "nqtTableId": int(table_id),
        },
    }
    if perf and perf["pct"]:
        q["stats"] = {"pct": perf["pct"], "omitted": perf["omitted"], "who": f"U.S. public school {grade_label(grade)}"}
    return q, stim, item


def build_math(picks, explanations):
    out = []
    seen_stems = set()
    for tid in picks["math"]:
        q, _stim, item = naep_question(tid, "MAT")
        area = re.search(r"Content Classifications: ([^,]+(?:, Statistics, and Probability)?)", item.get("titleLine2", ""))
        cached_row = None
        topic = MATH_TOPICS.get(area.group(1).strip() if area else "", None)
        if topic is None:
            raise ValueError(f"no topic for {tid}: {item.get('titleLine2')}")
        key = strip_tags(q["stem"])
        if key in seen_stems:
            raise ValueError(f"duplicate math stem: {tid}")
        seen_stems.add(key)
        q.update({"subject": "math", "topic": topic})
        if len(q["choices"]) != 5:
            raise ValueError(f"{tid}: expected 5 choices")
        out.append(q)
    return out


def naep_passage_paragraphs(stim: str, drop: list[str]) -> list[str]:
    """Flatten an NQT stimulus (layout tables and nested divs) into a list of paragraph HTML strings."""
    h = clean_html(stim, naep_resource, layout_tables=True)
    h = re.sub(r"<div[^>]*>|</div>", "\u0000", h)
    paras = []
    for part in h.split("\u0000"):
        part = re.sub(r"\s+", " ", part).strip()
        if not part or re.fullmatch(r"Page \d+", part) or "<img" in part:
            continue
        if strip_tags(part) in drop:
            continue
        paras.append(part)
    return paras


def build_naep_reading(picks):
    questions, passages = [], []
    for blk in picks["reading"]:
        pid = blk["passageId"]
        stim_html = None
        meta = None
        for n, tid in enumerate(blk["items"]):
            q, stim, item = naep_question(tid, "RED")
            if n == 0:
                stim_html = stim
                meta = q["source"]
            q.update({"subject": "reading", "passageId": pid, "order": n})
            if len(q["choices"]) != 4:
                raise ValueError(f"{tid}: expected 4 choices")
            questions.append(q)
        if blk.get("passageFile"):
            p = json.loads((DATA / blk["passageFile"]).read_text(encoding="utf-8"))
            p.update({"id": pid, "genre": blk["genre"], "source": {"test": "NAEP", "year": meta["year"], "grade": meta["grade"]}})
            passages.append(p)
        else:
            # Title, byline and credit lines come from picks.json and are dropped from the body.
            paras = naep_passage_paragraphs(stim_html, blk.get("drop", []))
            intro = None
            if blk.get("introFromFirst"):
                intro = strip_tags(paras.pop(0))
            passages.append({
                "id": pid,
                "genre": blk["genre"],
                "format": "paragraphs",
                "paragraphs": paras,
                "paragraphNumbered": False,
                "footnotes": [],
                "intro": intro,
                "source": {"test": "NAEP", "year": meta["year"], "grade": meta["grade"]},
            })
        for k in ("title", "author", "credit", "intro", "headnote"):
            if blk.get(k):
                passages[-1][k] = blk[k]
    return questions, passages


def mcas_paragraph_html(d: dict) -> list[str]:
    """Escape MCAS paragraphs and restore the italic words the transcription lists separately."""
    paras = [html.escape(p, quote=False) for p in d["paragraphs"]]
    for it in d.get("italics") or []:
        i = it["paragraph"] - 1
        word = html.escape(it["text"], quote=False)
        n = it.get("occurrence", 1)
        pos = -1
        for _ in range(n):
            pos = paras[i].find(word, pos + 1)
            while pos >= 0 and not _word_bounded(paras[i], pos, len(word)):
                pos = paras[i].find(word, pos + 1)
        if pos < 0:
            raise ValueError(f"{d['id']}: italic '{it['text']}' not found in paragraph {it['paragraph']}")
        paras[i] = paras[i][:pos] + f"<em>{word}</em>" + paras[i][pos + len(word):]
    return paras


WORD_REF = re.compile(r"\b(the words?|word) ([A-Za-z][A-Za-z’'-]*)(?: and ([A-Za-z][A-Za-z’'-]*))?")
WORD_REF_SKIP = {"that", "this", "which", "used", "best", "most", "in", "as", "from", "is", "a", "an", "the", "could"}


def italicize_word_refs(stem: str) -> str:
    """The printed MCAS booklets italicize the word a question asks about ("the word edifice")."""
    def sub(m: re.Match) -> str:
        words = [w for w in (m.group(2), m.group(3)) if w]
        if any(w.lower() in WORD_REF_SKIP for w in words):
            return m.group(0)
        out = f"{m.group(1)} <em>{m.group(2)}</em>"
        if m.group(3):
            out += f" and <em>{m.group(3)}</em>"
        return out
    return WORD_REF.sub(sub, stem)


def _word_bounded(s: str, pos: int, n: int) -> bool:
    before = s[pos - 1] if pos > 0 else " "
    after = s[pos + n] if pos + n < len(s) else " "
    return not before.isalnum() and not after.isalnum()


def build_mcas():
    questions, passages = [], []
    files = sorted((DATA / "mcas").glob("*.json"))
    for f in files:
        d = json.loads(f.read_text(encoding="utf-8"))
        if d.get("exclude"):
            continue
        pid = d["id"]
        p = {
            "id": pid,
            "genre": d["genre"],
            "title": d["title"],
            "author": d.get("author"),
            "byline": d.get("byline"),
            "intro": d.get("intro"),
            "credit": d.get("credit"),
            "footnotes": d.get("footnotes") or [],
            "source": {"test": "MCAS", "year": d["year"], "grade": d["grade"]},
        }
        if d.get("lineNumbered"):
            p.update({"format": "lines", "lines": d["lines"], "stanzaBreaksAfter": d.get("stanzaBreaksAfter") or [],
                      "indent": {str(k): v for k, v in (d.get("indent") or {}).items()}})
        else:
            p.update({"format": "paragraphs", "paragraphs": mcas_paragraph_html(d),
                      "paragraphNumbered": bool(d.get("paragraphNumbered", True))})
        passages.append(p)
        order = 0
        for q in d["questions"]:
            if q.get("exclude"):
                continue
            esc = lambda x: html.escape(x, quote=False)
            parts = []
            stem_text, lead_in = q["stem"], q.get("leadIn")
            if not lead_in and "\n" in stem_text:
                # Some transcriptions keep "Read the ... in the box." on the first line of the stem.
                lead_in, stem_text = (x.strip() for x in stem_text.split("\n", 1))
            q = {**q, "stem": stem_text}
            if lead_in:
                parts.append(f'<div class="p">{esc(lead_in)}</div>')
            if q.get("boxed"):
                boxed_lines = q["boxed"].splitlines()
                parts.append('<blockquote class="boxed">' + "<br>".join(esc(x) for x in boxed_lines) + "</blockquote>")
            parts.append(f'<div class="p">{italicize_word_refs(esc(q["stem"]))}</div>')
            questions.append({
                "id": f"mcas-{d['year']}-g{d['grade']}-q{q['num']}",
                "subject": "reading",
                "passageId": pid,
                "order": order,
                "stem": "".join(parts),
                "choices": [{"key": k, "html": esc(v)} for k, v in q["choices"].items()],
                "answer": q["answer"],
                "difficulty": None,
                "source": {"test": "MCAS", "year": d["year"], "grade": d["grade"],
                           "ref": f"Question {q['num']}" + (f" · item {q['itemCode']}" if q.get("itemCode") else "")},
            })
            order += 1
    return questions, passages


def main() -> None:
    picks = json.loads((DATA / "picks.json").read_text(encoding="utf-8"))
    explanations: dict[str, str] = {}
    for f in sorted(DATA.glob("explanations*.json")):
        explanations.update({k: v for k, v in json.loads(f.read_text(encoding="utf-8")).items() if not k.startswith("_")})
    tags = json.loads((DATA / "tags.json").read_text(encoding="utf-8")) if (DATA / "tags.json").exists() else {}
    math = build_math(picks, explanations)
    rq, rp = build_naep_reading(picks)
    mq, mp = build_mcas()
    questions = math + rq + mq
    passages = rp + mp
    missing = []
    for q in questions:
        e = explanations.get(q["id"])
        if e:
            q["explanation"] = e
        else:
            missing.append(q["id"])
        if q["subject"] == "reading":
            q["skill"] = tags.get(q["id"])
    ids = [q["id"] for q in questions]
    assert len(ids) == len(set(ids)), "duplicate question ids"
    pids = {p["id"] for p in passages}
    for q in questions:
        assert q["answer"] in [c["key"] for c in q["choices"]], q["id"]
        assert q["subject"] == "math" or q["passageId"] in pids, q["id"]
    deck = {
        "version": 1,
        "questions": questions,
        "passages": passages,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(deck, ensure_ascii=False, indent=1), encoding="utf-8")
    n_math = sum(1 for q in questions if q["subject"] == "math")
    n_read = len(questions) - n_math
    print(f"wrote {OUT_JSON.relative_to(ROOT)}: {n_math} math, {n_read} reading, {len(passages)} passages")
    if missing:
        print(f"missing explanations ({len(missing)}): {', '.join(missing[:12])}{' ...' if len(missing) > 12 else ''}")


if __name__ == "__main__":
    main()
