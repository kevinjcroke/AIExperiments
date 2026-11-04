// Works out which parts of a passage a reading question points at, so the app can highlight them.

import type { Passage, Question } from "./types";

export interface Hints {
  lines: number[];
  paragraphs: number[];
  /** Words or phrases quoted or emphasized in the question, to find in the passage text. */
  phrases: string[];
}

const DASH = "(?:\\s*(?:-|–|—|to|through|and)\\s*)";

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function stripTags(html: string): string {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function ranges(text: string, word: string, max: number): number[] {
  const out = new Set<number>();
  const re = new RegExp(`\\b${word}s?\\s+(\\d+)(?:${DASH}(\\d+))?`, "gi");
  for (const m of text.matchAll(re)) {
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (!(a >= 1 && b >= a && b <= max && b - a <= 40)) continue;
    for (let n = a; n <= b; n++) out.add(n);
  }
  return [...out].sort((x, y) => x - y);
}

function stanzaLines(p: Passage, text: string): number[] {
  if (p.format !== "lines" || p.stanzaBreaksAfter.length === 0) return [];
  const ends = [...p.stanzaBreaksAfter, p.lines.length];
  const stanzas = ranges(text, "stanza", ends.length);
  const out: number[] = [];
  for (const s of stanzas) {
    const start = s === 1 ? 1 : ends[s - 2]! + 1;
    const end = ends[s - 1]!;
    for (let n = start; n <= end; n++) out.push(n);
  }
  return out;
}

export function computeHints(q: Question, p: Passage): Hints {
  // The boxed quotation is the student's reference, so only the question sentences are searched.
  const stemHtml = q.stem.replace(/<blockquote[\s\S]*?<\/blockquote>/g, " ");
  const text = stripTags(stemHtml);

  let lines: number[] = [];
  let paragraphs: number[] = [];
  if (p.format === "lines") {
    lines = [...new Set([...ranges(text, "line", p.lines.length), ...stanzaLines(p, text)])].sort((a, b) => a - b);
  } else {
    paragraphs = ranges(text, "paragraph", p.paragraphs.length);
  }

  const phrases = new Set<string>();
  // Bold or italic words in the question (NAEP marks vocabulary words this way).
  for (const m of stemHtml.matchAll(/<(strong|em|b|i)>([^<]{2,80})<\/\1>/g)) phrases.add(stripTags(m[2]!));
  // Quoted phrases.
  for (const m of text.matchAll(/[“"]([^”"]{2,90})[”"]/g)) phrases.add(m[1]!);
  // "the word fastidious", "the words pricketh and maketh"
  for (const m of text.matchAll(/\bthe words? ([A-Za-z’'-]+)(?: and ([A-Za-z’'-]+))?/g)) {
    for (const w of [m[1], m[2]]) if (w && !STOP.has(w.toLowerCase())) phrases.add(w);
  }

  const title = stripTags(p.title).replace(/^from\s+/i, "").replace(/[“”"]/g, "").toLowerCase();
  // Quoted titles ("Letters from the Dust Bowl") are not something to find in the text.
  const cleaned = [...phrases]
    .map((s) => s.replace(/^[\s,.;:!?]+|[\s,.;:!?]+$/g, ""))
    .filter((s) => s.length >= 2 && !(title.length > 0 && title.includes(s.toLowerCase()) && s.includes(" ")));
  return { lines, paragraphs, phrases: [...new Set(cleaned)] };
}

const STOP = new Set(["that", "this", "these", "those", "in", "used", "as", "best", "most", "which", "from", "is", "a", "an", "the"]);

/** Normalize text for matching: quotes, dashes, whitespace, case. */
export function norm(s: string): string {
  return s
    .replace(/[“”„"]/g, '"')
    .replace(/[‘’‚']/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase();
}
