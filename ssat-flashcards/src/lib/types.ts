// Shape of src/data/deck.json, produced by scripts/build_deck.py.

export type Subject = "math" | "reading";
export type ChoiceKey = "A" | "B" | "C" | "D" | "E";
export type MathTopic = "numbers" | "algebra" | "geometry" | "measurement" | "data";
export type Genre = "fiction" | "poetry" | "drama" | "nonfiction";
export type Difficulty = "easy" | "medium" | "hard";
export type Skill = "main-idea" | "detail" | "inference" | "vocabulary" | "craft" | "tone";

export interface Choice {
  key: ChoiceKey;
  /** Sanitized HTML (may contain MathML or a figure). */
  html: string;
}

/** A released question from a public test program. */
export interface ReleasedSource {
  test: "NAEP" | "MCAS";
  year: number;
  grade: number;
  ref?: string;
  nqtTableId?: number;
}

/** A question from a private pack imported into this browser (see lib/packs.ts). */
export interface PackSource {
  test: "pack";
  /** Pack id. */
  pack: string;
  /** Full pack name, e.g. "Ivy Global SSAT Upper Level Practice Test 1". */
  name: string;
  /** Short pack name for chips and lists. */
  short: string;
  /** Where in the test, e.g. "Section 1, question 5". */
  ref?: string;
}

export type Source = ReleasedSource | PackSource;

export interface Stats {
  /** Percent of students nationally who picked each choice. */
  pct: Partial<Record<ChoiceKey, number>>;
  omitted: number;
  who: string;
}

export interface Question {
  id: string;
  subject: Subject;
  topic?: MathTopic;
  passageId?: string;
  /** Position within its passage set (reading only). */
  order?: number;
  stem: string;
  choices: Choice[];
  answer: ChoiceKey;
  difficulty: Difficulty | null;
  source: Source;
  stats?: Stats;
  explanation?: string;
  skill?: Skill | null;
}

export interface Footnote {
  mark: string;
  text: string;
}

interface PassageBase {
  id: string;
  genre: Genre;
  title: string;
  author?: string | null;
  byline?: string | null;
  intro?: string | null;
  credit?: string | null;
  footnotes: Footnote[];
  source: Source;
}

export interface LinesPassage extends PassageBase {
  format: "lines";
  /** lines[n - 1] is printed line n (plain text). */
  lines: string[];
  stanzaBreaksAfter: number[];
  indent: Record<string, number>;
  /**
   * Prose printed with numbered lines (SSAT style). The text reflows to fit the screen: each
   * stanzaBreaksAfter entry ends a paragraph, and line numbers sit where each printed line begins.
   */
  flow?: boolean;
}

export interface ParagraphPassage extends PassageBase {
  format: "paragraphs";
  /** paragraphs[n - 1] is paragraph n (sanitized HTML). */
  paragraphs: string[];
  paragraphNumbered: boolean;
}

export type Passage = LinesPassage | ParagraphPassage;

export interface Deck {
  version: 1;
  questions: Question[];
  passages: Passage[];
}
