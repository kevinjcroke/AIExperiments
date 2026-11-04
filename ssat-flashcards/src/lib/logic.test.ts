import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import deckJson from "../data/deck.json";
import { computeHints } from "./hints";
import { mergePacks, PackError, parsePack } from "./packs";
import { cardState, emptyProgress, isMastered, parseProgress, record, rightToMaster, streak, type Progress } from "./progress";
import { buildQueue, eligible, interleave, requeue, ssatRawScore, type SessionConfig } from "./session";
import type { Deck, Question } from "./types";

const deck = deckJson as unknown as Deck;
const math = deck.questions.filter((q) => q.subject === "math");
const reading = deck.questions.filter((q) => q.subject === "reading");

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const cfg = (over: Partial<SessionConfig> = {}): SessionConfig => ({ deck: "math", topics: [], genres: [], size: 10, mode: "practice", ...over });

describe("deck", () => {
  it("has 50 math and 60 reading questions with unique ids", () => {
    expect(math).toHaveLength(50);
    expect(reading).toHaveLength(60);
    expect(new Set(deck.questions.map((q) => q.id)).size).toBe(deck.questions.length);
  });

  it("every question has a valid key, distinct choices and an explanation", () => {
    for (const q of deck.questions) {
      const keys = q.choices.map((c) => c.key);
      expect(keys, q.id).toContain(q.answer);
      expect(new Set(keys).size, q.id).toBe(keys.length);
      expect(keys, q.id).toEqual(["A", "B", "C", "D", "E"].slice(0, keys.length));
      expect(q.choices.length, q.id).toBe(q.subject === "math" ? 5 : 4);
      expect(q.explanation?.length ?? 0, q.id).toBeGreaterThan(20);
      expect(q.stem, q.id).not.toMatch(/�|Â|â€/);
    }
  });

  it("national stats, where present, mark the keyed answer as one of the choices", () => {
    for (const q of math) {
      expect(q.stats, q.id).toBeDefined();
      expect(q.stats!.pct[q.answer], q.id).toBeGreaterThan(0);
    }
  });

  it("reading questions point at a passage and line references stay inside it", () => {
    const ids = new Set(deck.passages.map((p) => p.id));
    for (const q of reading) {
      expect(ids.has(q.passageId!), q.id).toBe(true);
      const p = deck.passages.find((x) => x.id === q.passageId)!;
      const h = computeHints(q, p);
      const max = p.format === "lines" ? p.lines.length : p.paragraphs.length;
      for (const n of [...h.lines, ...h.paragraphs]) expect(n, q.id).toBeLessThanOrEqual(max);
    }
  });
});

describe("progress", () => {
  it("masters a card at two more right than wrong", () => {
    let p = emptyProgress();
    p = record(p, "x", true, 0);
    expect(isMastered(p.cards.x)).toBe(false);
    expect(rightToMaster(p.cards.x)).toBe(1);
    p = record(p, "x", false, 1);
    expect(cardState(p.cards.x)).toBe("missed");
    expect(rightToMaster(p.cards.x)).toBe(2);
    p = record(record(p, "x", true, 2), "x", true, 3);
    expect(isMastered(p.cards.x)).toBe(true);
  });

  it("counts a streak through today or yesterday", () => {
    const day = 86_400_000;
    const now = new Date(2026, 10, 4, 12).getTime();
    let p: Progress = emptyProgress();
    for (const t of [now - 2 * day, now - day]) p = record(p, "a", true, t);
    expect(streak(p.days, now)).toBe(2);
    p = record(p, "a", true, now);
    expect(streak(p.days, now)).toBe(3);
    expect(streak(p.days, now + 3 * day)).toBe(0);
  });

  it("survives junk in storage", () => {
    expect(parseProgress("not json")).toEqual(emptyProgress());
    expect(parseProgress(JSON.stringify({ v: 2 }))).toEqual(emptyProgress());
    const p = parseProgress(JSON.stringify({ v: 1, cards: { ok: { right: 1, wrong: 0, last: "right", at: 5 }, bad: { right: -1 } }, days: ["2026-11-04", 7] }));
    expect(Object.keys(p.cards)).toEqual(["ok"]);
    expect(p.days).toEqual(["2026-11-04"]);
  });
});

describe("sessions", () => {
  it("builds a math queue of the requested size with no repeats", () => {
    const q = buildQueue(deck, emptyProgress(), cfg(), seeded(1));
    expect(q).toHaveLength(10);
    expect(new Set(q).size).toBe(10);
    expect(q.every((id) => id.startsWith("naep-m"))).toBe(true);
  });

  it("filters by topic and leaves out mastered cards", () => {
    const algebra = math.filter((q) => q.topic === "algebra");
    let p = emptyProgress();
    for (const q of algebra.slice(0, 3)) p = record(record(p, q.id, true, 0), q.id, true, 1);
    const queue = buildQueue(deck, p, cfg({ topics: ["algebra"], size: 0 }), seeded(2));
    expect(queue).toHaveLength(algebra.length - 3);
  });

  it("puts missed cards first", () => {
    const target = math[17]!;
    const p = record(emptyProgress(), target.id, false, 0);
    for (let s = 0; s < 5; s++) expect(buildQueue(deck, p, cfg(), seeded(s))[0]).toBe(target.id);
  });

  it("keeps reading passages whole and in order", () => {
    const queue = buildQueue(deck, emptyProgress(), cfg({ deck: "reading", size: 10 }), seeded(3));
    expect(queue.length).toBeGreaterThanOrEqual(10);
    const byId = new Map(deck.questions.map((q) => [q.id, q]));
    const seen: string[] = [];
    for (const id of queue) {
      const pid = byId.get(id)!.passageId!;
      if (seen[seen.length - 1] !== pid) {
        expect(seen, "a passage should not be split").not.toContain(pid);
        seen.push(pid);
      }
    }
    for (const pid of seen) {
      const orders = queue.map((id) => byId.get(id)!).filter((q) => q.passageId === pid).map((q) => q.order);
      expect(orders).toEqual([...orders].sort((a, b) => a! - b!));
      expect(orders).toHaveLength(reading.filter((q) => q.passageId === pid).length);
    }
  });

  it("mixes both subjects", () => {
    const queue = buildQueue(deck, emptyProgress(), cfg({ deck: "mixed", size: 20 }), seeded(4));
    const subjects = new Set(queue.map((id) => deck.questions.find((q) => q.id === id)!.subject));
    expect(subjects).toEqual(new Set(["math", "reading"]));
    expect(queue.length).toBeGreaterThanOrEqual(20);
  });

  it("review mode only returns cards whose last answer was wrong", () => {
    let p = emptyProgress();
    p = record(p, math[0]!.id, false, 0);
    p = record(p, math[1]!.id, true, 0);
    expect(eligible(deck, p, cfg({ mode: "missed" })).map((q: Question) => q.id)).toEqual([math[0]!.id]);
  });

  it("requeues a missed card a few places later, once", () => {
    const q = ["a", "b", "c", "d", "e", "f", "g"];
    expect(requeue(q, 0, "a", 4)).toEqual(["a", "b", "c", "d", "e", "a", "f", "g"]);
    expect(requeue(["a", "b"], 0, "a", 4)).toEqual(["a", "b", "a"]);
    const twice = requeue(q, 0, "a", 4);
    expect(requeue(twice, 0, "a", 4)).toEqual(twice);
  });

  it("interleaves reading sets between math cards", () => {
    expect(interleave(["m1", "m2", "m3", "m4"], [["r1", "r2"]])).toEqual(["m1", "m2", "r1", "r2", "m3", "m4"]);
    expect(interleave([], [["r1"]])).toEqual(["r1"]);
  });

  it("scores like the SSAT", () => {
    expect(ssatRawScore(8, 2)).toBe(7.5);
  });
});

describe("hints", () => {
  const byId = (id: string) => deck.questions.find((q) => q.id === id)!;
  const passageOf = (q: Question) => deck.passages.find((p) => p.id === q.passageId)!;

  it("finds line ranges and stanza references", () => {
    const linesQ = reading.find((q) => /lines 11–15/.test(q.stem));
    expect(linesQ).toBeDefined();
    expect(computeHints(linesQ!, passageOf(linesQ!)).lines).toEqual([11, 12, 13, 14, 15]);
    const stanza = reading.find((q) => /stanzas 1 and 2/.test(q.stem))!;
    const h = computeHints(stanza, passageOf(stanza));
    expect(h.lines[0]).toBe(1);
    expect(h.lines.length).toBeGreaterThan(6);
  });

  it("picks up quoted and bold words", () => {
    const q = byId("naep-r061902");
    expect(computeHints(q, passageOf(q)).phrases).toContain("self-possessed");
  });
});

describe("question packs", () => {
  const same = (h: string) => h;
  const tiny = () => ({
    format: "upper-hand-pack",
    version: 1,
    id: "test-pack",
    name: "Test Pack One",
    short: "Test 1",
    passages: [{ id: "tp-P1", format: "lines", flow: true, genre: "fiction", title: "A story", lines: ["One two", "three four", "five six"], stanzaBreaksAfter: [1] }],
    questions: [
      { id: "tp-m1", subject: "math", topic: "numbers", stem: "1 + 1 =", choices: ["1", "2", "3", "4", "5"].map((h, i) => ({ key: "ABCDE"[i], html: h })), answer: "B" },
      {
        id: "tp-r1",
        subject: "reading",
        passageId: "tp-P1",
        order: 1,
        skill: "detail",
        stem: "What happens in lines 2–3?",
        choices: ["a", "b", "c", "d", "e"].map((h, i) => ({ key: "ABCDE"[i], html: h })),
        answer: "E",
        source: { test: "NAEP", ref: "Section 2, question 1" },
      },
    ],
  });

  it("rejects files that aren't packs", () => {
    expect(() => parsePack({ hello: 1 }, same)).toThrow(PackError);
    expect(() => parsePack({ ...tiny(), questions: [{ ...tiny().questions[0], answer: "F" }] }, same)).toThrow(/answer/);
    expect(() => parsePack({ ...tiny(), passages: [] }, same)).toThrow(/missing passage/);
  });

  it("parses a pack and stamps every item with the pack as its source", () => {
    const pack = parsePack(tiny(), same);
    expect(pack.questions).toHaveLength(2);
    for (const q of pack.questions) expect(q.source).toMatchObject({ test: "pack", pack: "test-pack", name: "Test Pack One", short: "Test 1" });
    expect(pack.questions[1]!.source).toMatchObject({ ref: "Section 2, question 1" });
    expect(pack.passages[0]).toMatchObject({ format: "lines", flow: true, stanzaBreaksAfter: [1] });
  });

  it("merges packs into the deck and filters by source", () => {
    const pack = parsePack(tiny(), same);
    const clash = parsePack({ ...tiny(), id: "other", questions: [{ ...tiny().questions[0], id: math[0]!.id }], passages: [] }, same);
    const merged = mergePacks(deck, [pack, clash]);
    expect(merged.questions).toHaveLength(deck.questions.length + 2);
    expect(eligible(merged, emptyProgress(), cfg({ deck: "mixed", size: 0, sources: ["test-pack"] })).map((q) => q.id)).toEqual(["tp-m1", "tp-r1"]);
    expect(eligible(merged, emptyProgress(), cfg({ deck: "math", size: 0, sources: ["released"] }))).toHaveLength(50);
    expect(computeHints(pack.questions[1]!, pack.passages[0]!).lines).toEqual([2, 3]);
  });

  const built = fileURLToPath(new URL("../../private/upper-hand-pack-ivy-test-1.json", import.meta.url));
  it.skipIf(!existsSync(built))("the private Ivy Global pack (when built) is valid", () => {
    const pack = parsePack(JSON.parse(readFileSync(built, "utf-8")), same);
    expect(pack.questions.filter((q) => q.subject === "math")).toHaveLength(50);
    expect(pack.questions.filter((q) => q.subject === "reading")).toHaveLength(40);
    for (const q of pack.questions) {
      expect(q.explanation?.length ?? 0, q.id).toBeGreaterThan(20);
      expect(q.choices, q.id).toHaveLength(5);
    }
    const merged = mergePacks(deck, [pack]);
    for (const q of pack.questions.filter((x) => /\blines? \d/.test(x.stem))) {
      const p = merged.passages.find((x) => x.id === q.passageId)!;
      expect(computeHints(q, p).lines.length, q.id).toBeGreaterThan(0);
    }
  });
});
