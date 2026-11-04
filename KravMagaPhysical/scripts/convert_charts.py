"""Convert the school's scoring spreadsheets (requirements/*.xlsx) into src/data/charts.json.

Run from the KravMagaPhysical folder:

    python scripts/convert_charts.py

Standard library only (no openpyxl needed). The script reads each sheet's raw cells,
normalises every chart to "points -> threshold" arrays, validates them, and prints a
short summary so a changed spreadsheet is easy to spot.

Spreadsheet quirks this handles:
  * Mile and plank times are typed as h:mm (Excel number format 20) but mean m:ss,
    so "6:40" is stored as 6 h 40 min. Those cells are converted with x1440.
  * Age headers are "<25" / "26-30" and "<30" / "31-35"; the first column has no stated
    lower bound and leaves the edge age (25 or 30) ambiguous. "<N" is read as "N and under".
  * Push-up/squat charts run into negative rep counts for older brackets; those are kept
    as-is (the app clamps to 0 reps, so 0 reps still earns the chart's points).
  * The plank chart stops at 0:00 = 48 points; lower points have no time and are stored as null.
"""

from __future__ import annotations

import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REQUIREMENTS = ROOT / "requirements"
OUTPUT = ROOT / "src" / "data" / "charts.json"

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
T = "{%s}t" % NS["m"]

# Excel built-in number formats.
FMT_H_MM = 20  # h:mm, used by the school to mean m:ss
REAL_TIME_FORMATS = {21, 45, 46, 47}  # h:mm:ss, mm:ss, [h]:mm:ss, mmss.0

# event, gender, kind ("time" | "reps"), better ("lower" | "higher")
SOURCES = [
    ("Male-1-Mile.xlsx", "mile", "male", "time", "lower"),
    ("Female-1-Mile.xlsx", "mile", "female", "time", "lower"),
    ("Male-Push-Ups.xlsx", "pushups", "male", "reps", "higher"),
    ("Female-Push-Ups.xlsx", "pushups", "female", "reps", "higher"),
    ("Squats-.xlsx", "squats", "all", "reps", "higher"),
    ("Plank.xlsx", "plank", "all", "time", "higher"),
]

EVENT_META = {
    "mile": {"name": "One-mile run", "unit": "seconds", "better": "lower", "scoredBy": "age and gender"},
    "pushups": {"name": "Push-ups", "unit": "reps", "better": "higher", "scoredBy": "age and gender"},
    "squats": {"name": "Squats", "unit": "reps", "better": "higher", "scoredBy": "age"},
    "plank": {"name": "Plank", "unit": "seconds", "better": "higher", "scoredBy": "one standard for everyone"},
}


class ChartError(Exception):
    pass


def col_index(ref: str) -> int:
    letters = re.match(r"[A-Z]+", ref)
    if not letters:
        raise ChartError(f"bad cell reference {ref!r}")
    n = 0
    for ch in letters.group(0):
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def read_sheet(path: Path) -> list[list[tuple[str, int] | None]]:
    """Return rows of (raw value, numFmtId) cells, padded with None for blanks."""
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        shared: list[str] = []
        if "xl/sharedStrings.xml" in names:
            for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS):
                shared.append("".join(t.text or "" for t in si.iter(T)))

        styles = ET.fromstring(z.read("xl/styles.xml"))
        xfs = styles.find("m:cellXfs", NS)
        num_fmts = [int(xf.attrib.get("numFmtId", "0")) for xf in (xfs if xfs is not None else [])]

        sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))

    rows: list[list[tuple[str, int] | None]] = []
    for row in sheet.iter("{%s}row" % NS["m"]):
        out: list[tuple[str, int] | None] = []
        for c in row.findall("m:c", NS):
            v = c.find("m:v", NS)
            kind = c.attrib.get("t")
            if kind == "inlineStr":
                text = "".join(t.text or "" for t in c.iter(T))
            elif v is None or v.text is None:
                continue
            elif kind == "s":
                text = shared[int(v.text)]
            else:
                text = v.text
            idx = col_index(c.attrib["r"])
            while len(out) < idx:
                out.append(None)
            style = int(c.attrib.get("s", "0"))
            out.append((text.strip(), num_fmts[style] if style < len(num_fmts) else 0))
        rows.append(out)
    return rows


def parse_bracket(label: str) -> dict:
    """'<25' -> up to 25, '26-30' -> 26..30, '51+' -> 51 and up, 'Time' -> everyone."""
    label = label.strip()
    if m := re.fullmatch(r"<\s*(\d+)", label):
        return {"label": label, "minAge": None, "maxAge": int(m.group(1))}
    if m := re.fullmatch(r"(\d+)\s*[-–]\s*(\d+)", label):
        return {"label": label, "minAge": int(m.group(1)), "maxAge": int(m.group(2))}
    if m := re.fullmatch(r"(\d+)\s*\+", label):
        return {"label": label, "minAge": int(m.group(1)), "maxAge": None}
    if label.lower() == "time":
        return {"label": "All ages", "minAge": None, "maxAge": None}
    raise ChartError(f"unrecognised age header {label!r}")


def to_value(cell: tuple[str, int], kind: str, where: str) -> int:
    raw, fmt = cell
    number = float(raw)
    if kind == "reps":
        if number != int(number):
            raise ChartError(f"{where}: expected whole reps, got {raw}")
        return int(number)
    if fmt == FMT_H_MM:
        seconds = number * 24 * 60  # h:mm that really means m:ss
    elif fmt in REAL_TIME_FORMATS:
        seconds = number * 24 * 60 * 60
    else:
        raise ChartError(f"{where}: time cell has unexpected number format {fmt}")
    rounded = round(seconds)
    if abs(seconds - rounded) > 0.01:
        raise ChartError(f"{where}: {raw} is not a whole number of seconds ({seconds:.3f})")
    return rounded


def convert(filename: str, event: str, kind: str, better: str) -> list[dict]:
    path = REQUIREMENTS / filename
    rows = read_sheet(path)
    if not rows or not rows[0] or rows[0][0] is None or rows[0][0][0].lower() != "points":
        raise ChartError(f"{filename}: first header cell should be 'Points'")

    header = [c[0] if c else "" for c in rows[0][1:]]
    brackets = [parse_bracket(h) for h in header]
    for b in brackets:
        b["values"] = [None] * 101

    seen_points: set[int] = set()
    for r, row in enumerate(rows[1:], start=2):
        if not row or row[0] is None:
            continue
        points_f = float(row[0][0])
        points = int(points_f)
        if points != points_f or not 0 <= points <= 100:
            raise ChartError(f"{filename} row {r}: points {row[0][0]} out of range")
        if points in seen_points:
            raise ChartError(f"{filename} row {r}: duplicate points {points}")
        seen_points.add(points)
        for i, b in enumerate(brackets):
            cell = row[i + 1] if i + 1 < len(row) else None
            if cell is not None and cell[0] != "":
                b["values"][points] = to_value(cell, kind, f"{filename} row {r} col {i + 2}")

    if seen_points != set(range(101)):
        missing = sorted(set(range(101)) - seen_points)
        raise ChartError(f"{filename}: missing points rows {missing}")

    for b in brackets:
        validate(filename, b, kind, better)
    return brackets


def validate(filename: str, bracket: dict, kind: str, better: str) -> None:
    values = bracket["values"]
    present = [(p, v) for p, v in enumerate(values) if v is not None]
    if not present or present[-1][0] != 100:
        raise ChartError(f"{filename} {bracket['label']}: no value for 100 points")
    first = present[0][0]
    if any(v is None for v in values[first:]):
        raise ChartError(f"{filename} {bracket['label']}: gap in values above {first} points")
    for (p0, v0), (_, v1) in zip(present, present[1:]):
        ok = v1 < v0 if better == "lower" else v1 > v0
        if not ok:
            raise ChartError(
                f"{filename} {bracket['label']}: not strictly monotonic at {p0}->{p0 + 1} points ({v0} -> {v1})"
            )
    if kind == "time":
        top = values[100]
        if not 60 <= top <= 30 * 60:
            raise ChartError(f"{filename} {bracket['label']}: 100-point time {top}s looks wrong")


def fmt_time(seconds: int) -> str:
    return f"{seconds // 60}:{seconds % 60:02d}"


def summarise(event: str, gender: str, kind: str, brackets: list[dict]) -> str:
    lines = [f"{event}/{gender}:"]
    for b in brackets:
        vals = b["values"]
        present = [(p, v) for p, v in enumerate(vals) if v is not None]
        steps = sorted({abs(v1 - v0) for (_, v0), (_, v1) in zip(present, present[1:])})
        show = fmt_time if kind == "time" else str
        floor = present[0]
        lines.append(
            f"  {b['label']:>8}: 100pts={show(vals[100])}  {floor[0]}pts={show(floor[1])}"
            f"  step={'/'.join(map(str, steps))}{'s' if kind == 'time' else ' rep'} per point"
        )
    return "\n".join(lines)


def main() -> int:
    events: dict[str, dict] = {k: {**v, "charts": {}} for k, v in EVENT_META.items()}
    try:
        for filename, event, gender, kind, better in SOURCES:
            brackets = convert(filename, event, kind, better)
            events[event]["charts"][gender] = brackets
            print(summarise(event, gender, kind, brackets))
    except (ChartError, FileNotFoundError, KeyError, ValueError) as err:
        print(f"error: {err}", file=sys.stderr)
        return 1

    output = {
        "$comment": "Generated by scripts/convert_charts.py from requirements/*.xlsx. Do not edit by hand.",
        "generated": date.today().isoformat(),
        "sources": [s[0] for s in SOURCES],
        "events": events,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(output, indent=2)
    # Keep each 101-value array on one line so the file stays readable and diffable.
    text = re.sub(r"\[\s+((?:-?\d+|null)(?:,\s+(?:-?\d+|null))*)\s+\]", lambda m: "[" + re.sub(r",\s+", ", ", m.group(1)) + "]", text)
    OUTPUT.write_text(text + "\n", encoding="utf-8")
    print(f"\nwrote {OUTPUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
