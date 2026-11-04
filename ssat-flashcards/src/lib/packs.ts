// Private question packs: extra questions (e.g. a practice test the family owns) imported from a
// file into this browser's storage. Packs are never part of the deployed site. Build one with
// scripts/build_pack.py.

import type { ChoiceKey, Deck, Difficulty, Genre, MathTopic, Passage, Question, Skill, Source } from "./types";

export const PACK_FORMAT = "upper-hand-pack";
export const PACKS_KEY = "upper-hand/packs/v1";

export interface Pack {
  format: typeof PACK_FORMAT;
  version: 1;
  id: string;
  name: string;
  short: string;
  publisher?: string;
  note?: string;
  questions: Question[];
  passages: Passage[];
}

export class PackError extends Error {}

const KEYS: ChoiceKey[] = ["A", "B", "C", "D", "E"];
const TOPICS: MathTopic[] = ["numbers", "algebra", "geometry", "measurement", "data"];
const GENRES: Genre[] = ["fiction", "poetry", "drama", "nonfiction"];
const SKILLS: Skill[] = ["main-idea", "detail", "inference", "vocabulary", "craft", "tone"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 20000): v is string => typeof v === "string" && v.length <= max;
const optStr = (v: unknown, max = 2000): string | null => (str(v, max) && v.trim() ? v : null);

function fail(msg: string): never {
  throw new PackError(msg);
}

function passageOf(raw: unknown, i: number, source: Source, clean: (html: string) => string): Passage {
  if (!isObj(raw)) fail(`Passage ${i + 1} is not an object.`);
  const id = raw.id;
  if (!str(id, 80) || !id) fail(`Passage ${i + 1} has no id.`);
  if (!GENRES.includes(raw.genre as Genre)) fail(`Passage ${id} has an unknown genre.`);
  if (!str(raw.title, 200) || !raw.title.trim()) fail(`Passage ${id} has no title.`);
  const base = {
    id,
    genre: raw.genre as Genre,
    title: raw.title,
    author: optStr(raw.author, 200),
    byline: optStr(raw.byline, 200),
    intro: optStr(raw.intro),
    credit: optStr(raw.credit),
    footnotes: Array.isArray(raw.footnotes)
      ? raw.footnotes.filter(isObj).flatMap((f) => (str(f.mark, 8) && str(f.text, 2000) ? [{ mark: f.mark, text: f.text }] : []))
      : [],
    source,
  };
  if (raw.format === "lines") {
    if (!Array.isArray(raw.lines) || raw.lines.length === 0 || !raw.lines.every((l) => str(l, 2000))) fail(`Passage ${id} has no lines.`);
    const nums = (v: unknown) => (Array.isArray(v) ? v.filter((n): n is number => Number.isInteger(n) && n > 0) : []);
    const indent: Record<string, number> = {};
    if (isObj(raw.indent)) for (const [k, v] of Object.entries(raw.indent)) if (typeof v === "number" && v >= 0 && v <= 8) indent[k] = v;
    return { ...base, format: "lines", lines: raw.lines as string[], stanzaBreaksAfter: nums(raw.stanzaBreaksAfter), indent, flow: raw.flow === true };
  }
  if (raw.format === "paragraphs") {
    if (!Array.isArray(raw.paragraphs) || raw.paragraphs.length === 0 || !raw.paragraphs.every((p) => str(p))) fail(`Passage ${id} has no paragraphs.`);
    return { ...base, format: "paragraphs", paragraphs: (raw.paragraphs as string[]).map(clean), paragraphNumbered: raw.paragraphNumbered === true };
  }
  return fail(`Passage ${id} has an unknown format.`);
}

function questionOf(raw: unknown, i: number, source: Source, passageIds: Set<string>, clean: (html: string) => string): Question {
  if (!isObj(raw)) fail(`Question ${i + 1} is not an object.`);
  const id = raw.id;
  if (!str(id, 80) || !id) fail(`Question ${i + 1} has no id.`);
  if (raw.subject !== "math" && raw.subject !== "reading") fail(`Question ${id} has no subject.`);
  if (!str(raw.stem, 2_000_000) || !raw.stem.trim()) fail(`Question ${id} has no question text.`);
  if (!Array.isArray(raw.choices) || raw.choices.length < 2 || raw.choices.length > 5) fail(`Question ${id} needs 2 to 5 choices.`);
  const choices = raw.choices.map((c, j) => {
    if (!isObj(c) || c.key !== KEYS[j] || !str(c.html, 2_000_000)) fail(`Question ${id} has a bad choice ${j + 1}.`);
    return { key: c.key as ChoiceKey, html: clean(c.html) };
  });
  if (!choices.some((c) => c.key === raw.answer)) fail(`Question ${id}'s answer isn't one of its choices.`);
  const q: Question = {
    id,
    subject: raw.subject,
    stem: clean(raw.stem),
    choices,
    answer: raw.answer as ChoiceKey,
    difficulty: DIFFICULTIES.includes(raw.difficulty as Difficulty) ? (raw.difficulty as Difficulty) : null,
    source: { ...source, ...(str(raw.source && (raw.source as Obj).ref, 200) ? { ref: (raw.source as Obj).ref as string } : {}) },
  };
  if (str(raw.explanation, 5000) && raw.explanation.trim()) q.explanation = raw.explanation.trim();
  if (q.subject === "math") {
    if (!TOPICS.includes(raw.topic as MathTopic)) fail(`Math question ${id} needs a topic.`);
    q.topic = raw.topic as MathTopic;
  } else {
    if (!str(raw.passageId, 80) || !passageIds.has(raw.passageId)) fail(`Reading question ${id} points at a missing passage.`);
    q.passageId = raw.passageId;
    if (Number.isInteger(raw.order)) q.order = raw.order as number;
    q.skill = SKILLS.includes(raw.skill as Skill) ? (raw.skill as Skill) : null;
  }
  return q;
}

/**
 * Check a parsed pack file and return a clean copy. Throws PackError with a message fit to show.
 * `clean` sanitizes HTML fields (sanitizeHtml in the browser).
 */
export function parsePack(raw: unknown, clean: (html: string) => string): Pack {
  if (!isObj(raw) || raw.format !== PACK_FORMAT) fail("That file isn't an Upper Hand question pack.");
  if (raw.version !== 1) fail("This pack was made for a newer version of Upper Hand.");
  if (!str(raw.id, 60) || !/^[a-z0-9][a-z0-9-]*$/.test(raw.id)) fail("The pack has no valid id.");
  if (!str(raw.name, 200) || !raw.name.trim()) fail("The pack has no name.");
  const id = raw.id;
  const name = raw.name.trim();
  const short = str(raw.short, 60) && raw.short.trim() ? raw.short.trim() : name;
  const source: Source = { test: "pack", pack: id, name, short };
  if (!Array.isArray(raw.passages) || !Array.isArray(raw.questions)) fail("The pack has no questions.");
  const passages = raw.passages.map((p, i) => passageOf(p, i, source, clean));
  const passageIds = new Set(passages.map((p) => p.id));
  if (passageIds.size !== passages.length) fail("The pack has two passages with the same id.");
  const questions = raw.questions.map((q, i) => questionOf(q, i, source, passageIds, clean));
  if (questions.length === 0) fail("The pack has no questions.");
  if (new Set(questions.map((q) => q.id)).size !== questions.length) fail("The pack has two questions with the same id.");
  return {
    format: PACK_FORMAT,
    version: 1,
    id,
    name,
    short,
    publisher: optStr(raw.publisher, 200) ?? undefined,
    note: optStr(raw.note, 500) ?? undefined,
    questions,
    passages,
  };
}

/** The deck plus every pack. Pack items whose ids clash with the deck (or an earlier pack) are left out. */
export function mergePacks(deck: Deck, packs: Pack[]): Deck {
  if (packs.length === 0) return deck;
  const qIds = new Set(deck.questions.map((q) => q.id));
  const pIds = new Set(deck.passages.map((p) => p.id));
  const questions = [...deck.questions];
  const passages = [...deck.passages];
  for (const pack of packs) {
    for (const p of pack.passages) {
      if (pIds.has(p.id)) continue;
      pIds.add(p.id);
      passages.push(p);
    }
    for (const q of pack.questions) {
      if (qIds.has(q.id) || (q.passageId && !passages.some((p) => p.id === q.passageId && p.source.test === "pack"))) continue;
      qIds.add(q.id);
      questions.push(q);
    }
  }
  return { ...deck, questions, passages };
}

/** Which source filter a question belongs to: "released" (NAEP/MCAS) or its pack id. */
export const sourceKey = (q: Question): string => (q.source.test === "pack" ? q.source.pack : "released");

export function loadPacks(storage: Storage | undefined, clean: (html: string) => string): Pack[] {
  try {
    const raw = storage?.getItem(PACKS_KEY);
    if (!raw) return [];
    const list: unknown = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.flatMap((p) => {
      try {
        return [parsePack(p, clean)];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

/** Throws PackError if the browser has no room left. */
export function savePacks(storage: Storage | undefined, packs: Pack[]): void {
  if (!storage) throw new PackError("This browser isn't letting the app save anything (private browsing?).");
  try {
    if (packs.length === 0) storage.removeItem(PACKS_KEY);
    else storage.setItem(PACKS_KEY, JSON.stringify(packs));
  } catch {
    throw new PackError("This browser is out of room for saved questions. Remove another pack and try again.");
  }
}
