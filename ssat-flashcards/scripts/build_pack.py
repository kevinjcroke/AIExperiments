"""Build a private Upper Hand question pack from a practice test transcribed to JSON.

A pack is a single JSON file (figures inlined as data URIs) that the app imports into one
browser's local storage. Packs hold copyrighted practice-test questions, so they live in the
gitignored private/ folder and are never committed or deployed.

    python scripts/build_pack.py

Reads   moreanswers/ssat_upper_level_test_1.json (+ moreanswers/images/*.png)
        private/notes/ivy-test-1-math.json      (topic + explanation per math question)
        private/notes/ivy-test-1-reading.json   (passage labels/genres, skill + explanation per question)
Writes  private/upper-hand-pack-ivy-test-1.json
"""

from __future__ import annotations

import base64
import html
import json
import re
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "moreanswers" / "ssat_upper_level_test_1.json"
NOTES = ROOT / "private" / "notes"
OUT = ROOT / "private" / "upper-hand-pack-ivy-test-1.json"

PACK_ID = "ivy-ssat-upper-1"
PREFIX = "ivy1-"
PACK_NAME = "Ivy Global SSAT Upper Level Practice Test 1"
PACK_SHORT = "Ivy Global Test 1"

TOPICS = {"numbers", "algebra", "geometry", "measurement", "data"}
SKILLS = {"main-idea", "detail", "inference", "vocabulary", "craft", "tone"}
GENRES = {"fiction", "poetry", "drama", "nonfiction"}
KEYS = ["A", "B", "C", "D", "E"]


def esc(s: str) -> str:
    return html.escape(s, quote=False)


# ---------- typography ----------


def smart_quotes(s: str) -> str:
    """Straight quotes to curly ones. A quote after whitespace, an opening bracket or a dash opens."""
    out: list[str] = []
    for i, ch in enumerate(s):
        prev = s[i - 1] if i > 0 else " "
        opens = prev.isspace() or prev in "([{—–“‘"
        if ch == '"':
            out.append("“" if opens else "”")
        elif ch == "'":
            nxt = s[i + 1] if i + 1 < len(s) else " "
            out.append("‘" if opens and nxt.isalpha() else "’")
        else:
            out.append(ch)
    return "".join(out)


def prose(s: str) -> str:
    """Passage and reading text: dashes and quotes as printed in a book."""
    s = s.replace("--", "—")
    s = re.sub(r"(?<=\S) - (?=\S)", " – ", s)
    s = re.sub(r"(?<=\d)-(?=\d)", "–", s)
    # Word joiner: keep an em dash on the same screen line as the word before it.
    s = re.sub(r"(?<=\w)—", "⁠—", s)
    return smart_quotes(s)


# ---------- math text to HTML ----------

OPS = "=+−×÷<>♠≤≥"
VAR_TOKEN = re.compile(r"(?<![A-Za-z0-9'’.])(\d*)([A-Za-z])(?![A-Za-z'’])")


def find_vars(text: str) -> set[str]:
    """Single letters used as variables: next to an operator, or with a number in front (3x)."""
    found: set[str] = set()
    for m in VAR_TOKEN.finditer(text):
        coef, letter = m.group(1), m.group(2)
        before = text[: m.start()].rstrip()[-1:]
        after = text[m.end():].lstrip()[:1]
        if coef or (before and before in OPS) or (after and after in OPS) or after == "/" or before == "/":
            found.add(letter)
    # Named lines in a figure: "lines p and q".
    for m in re.finditer(r"\blines ([a-z]) and ([a-z])\b", text):
        found |= {m[1], m[2]}
    return found


def minus_signs(s: str) -> str:
    s = re.sub(r"(?<=\S) - (?=\S)", " − ", s)
    return re.sub(r"(?:(?<=^)|(?<=[\s(]))-(?=[\dA-Za-z])", "−", s)


def mtok(t: str) -> str:
    return f"<mi>{t}</mi>" if t.isalpha() else f"<mn>{t}</mn>"


def math_html(text: str, variables: set[str]) -> str:
    s = minus_signs(esc(smart_quotes(text)))
    held: list[str] = []

    def hold(markup: str) -> str:
        held.append(markup)
        return f"\x00{len(held) - 1}\x00"

    # Mixed numbers (6 1/3), then plain fractions (3/7, x/10, A/B). displaystyle keeps the
    # numerator and denominator at full size, as on the printed test.
    s = re.sub(
        r"(?<![\w/.])(\d+) (\d+)/(\d+)(?![\w/])",
        lambda m: hold(f'<math displaystyle="true"><mn>{m[1]}</mn><mfrac><mn>{m[2]}</mn><mn>{m[3]}</mn></mfrac></math>'),
        s,
    )
    s = re.sub(
        r"(?<![\w/.])([A-Za-z]|\d+)/([A-Za-z]|\d+)(?![\w/])",
        lambda m: hold(f'<math displaystyle="true"><mfrac>{mtok(m[1])}{mtok(m[2])}</mfrac></math>'),
        s,
    )
    if variables:
        s = VAR_TOKEN.sub(lambda m: m[1] + f"<var>{m[2]}</var>" if m[2] in variables else m[0], s)
        # A product of two variables written together, like xy.
        s = re.sub(
            r"(?<![A-Za-z'’&])([A-Za-z])([A-Za-z])(?![A-Za-z'’])",
            lambda m: f"<var>{m[1]}</var><var>{m[2]}</var>" if m[1] in variables and m[2] in variables else m[0],
            s,
        )
    return re.sub(r"\x00(\d+)\x00", lambda m: held[int(m[1])], s)


# ---------- figures ----------


def figure_html(rel: str, alt: str) -> str:
    path = (SRC.parent / rel).resolve()
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        sys.exit(f"{rel}: not a PNG")
    w, h = struct.unpack(">II", data[16:24])
    # Cropped at 200 dpi; show at about printed size.
    w, h = round(w / 2), round(h / 2)
    uri = "data:image/png;base64," + base64.b64encode(data).decode("ascii")
    return f'<div class="fig"><img src="{uri}" alt="{html.escape(alt)}" width="{w}" height="{h}"></div>'


# ---------- build ----------


def load(path: Path) -> dict:
    if not path.exists():
        sys.exit(f"Missing {path.relative_to(ROOT)}")
    return json.loads(path.read_text(encoding="utf-8"))


def choices_of(q: dict, render) -> list[dict]:
    keys = list(q["choices"].keys())
    if keys != KEYS:
        sys.exit(f"{q['id']}: expected choices A-E, got {keys}")
    return [{"key": k, "html": render(q["choices"][k])} for k in keys]


def build_math(src: dict, notes: dict) -> list[dict]:
    out = []
    for q in src["math"]["questions"]:
        note = notes.get(q["id"]) or sys.exit(f"No math note for {q['id']}")
        if note["topic"] not in TOPICS:
            sys.exit(f"{q['id']}: bad topic {note['topic']}")
        all_text = " ".join([q.get("shared_stimulus", ""), q["question"], *q["choices"].values()])
        variables = find_vars(all_text)
        render = lambda t: math_html(t, variables)  # noqa: E731
        parts = []
        if q.get("shared_stimulus"):
            parts.append(f'<div class="p lead">{render(q["shared_stimulus"])}</div>')
        parts.append(f'<div class="p">{render(q["question"])}</div>')
        if q.get("image"):
            parts.append(figure_html(q["image"], q.get("figure") or "Figure"))
        out.append(
            {
                "id": PREFIX + q["id"],
                "subject": "math",
                "topic": note["topic"],
                "stem": "".join(parts),
                "choices": choices_of(q, render),
                "answer": q["answer"],
                "difficulty": None,
                "source": {"test": "pack", "pack": PACK_ID, "name": PACK_NAME, "ref": f"Section {q['source_section']}, question {q['number']}"},
                "explanation": note["explanation"].strip(),
            }
        )
    return out


def reading_stem(text: str) -> str:
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    head, rest = lines[0], lines[1:]
    parts = [f'<div class="p">{esc(prose(head))}</div>']
    for ln in rest:
        m = re.match(r"^([IVX]+)\.\s+(.*)$", ln)
        if m:
            parts.append(f'<div class="ri"><b>{m[1]}.</b> {esc(prose(m[2]))}</div>')
        else:
            parts.append(f'<div class="p">{esc(prose(ln))}</div>')
    return "".join(parts)


def build_reading(src: dict, notes: dict) -> tuple[list[dict], list[dict]]:
    pnotes, qnotes = notes["passages"], notes["questions"]
    passages = []
    for p in src["reading"]["passages"]:
        note = pnotes.get(p["id"]) or sys.exit(f"No passage note for {p['id']}")
        if note["genre"] not in GENRES:
            sys.exit(f"{p['id']}: bad genre {note['genre']}")
        starts = sorted(set(p["paragraph_starts"]))
        passages.append(
            {
                "id": PREFIX + p["id"],
                "format": "lines",
                "flow": p["format"] != "poem",
                "genre": note["genre"],
                "title": note["title"],
                "author": note.get("author"),
                "footnotes": [],
                "lines": [prose(line.rstrip()) for line in p["lines"]],
                "stanzaBreaksAfter": [n - 1 for n in starts if n > 1],
                "indent": {},
                "source": {"test": "pack", "pack": PACK_ID, "name": PACK_NAME, "ref": f"Section 2, passage {p['id'][1:]}"},
            }
        )
    known = {p["id"] for p in src["reading"]["passages"]}
    questions = []
    for q in src["reading"]["questions"]:
        note = qnotes.get(q["id"]) or sys.exit(f"No reading note for {q['id']}")
        if note["skill"] not in SKILLS:
            sys.exit(f"{q['id']}: bad skill {note['skill']}")
        if q["passage_id"] not in known:
            sys.exit(f"{q['id']}: unknown passage {q['passage_id']}")
        questions.append(
            {
                "id": PREFIX + q["id"],
                "subject": "reading",
                "passageId": PREFIX + q["passage_id"],
                "order": q["number"],
                "stem": reading_stem(q["question"]),
                "choices": choices_of(q, lambda t: esc(prose(t))),
                "answer": q["answer"],
                "difficulty": None,
                "skill": note["skill"],
                "source": {"test": "pack", "pack": PACK_ID, "name": PACK_NAME, "ref": f"Section 2, question {q['number']}"},
                "explanation": note["explanation"].strip(),
            }
        )
    return questions, passages


def main() -> None:
    src = load(SRC)
    math = build_math(src, load(NOTES / "ivy-test-1-math.json"))
    reading, passages = build_reading(src, load(NOTES / "ivy-test-1-reading.json"))
    questions = math + reading
    ids = [q["id"] for q in questions]
    assert len(ids) == len(set(ids)), "duplicate ids"
    for q in questions:
        assert q["answer"] in {c["key"] for c in q["choices"]}, q["id"]
        assert "\x00" not in q["stem"] and "\x01" not in q["stem"], q["id"]
    pack = {
        "format": "upper-hand-pack",
        "version": 1,
        "id": PACK_ID,
        "name": PACK_NAME,
        "short": PACK_SHORT,
        "publisher": "Ivy Global",
        "note": "Private copy for personal study. Not for distribution.",
        "questions": questions,
        "passages": passages,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(pack, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    kb = OUT.stat().st_size / 1024
    print(f"{len(math)} math, {len(reading)} reading, {len(passages)} passages -> {OUT.relative_to(ROOT)} ({kb:.0f} KB)")


if __name__ == "__main__":
    main()
