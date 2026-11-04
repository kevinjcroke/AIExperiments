// Highlights words in rendered passage text with the CSS Custom Highlight API, so React's DOM is never touched.
// Browsers without the API simply show no word highlight (line and paragraph highlights still work).

const HL = "hint";

type HighlightRegistry = Map<string, unknown>;
type HighlightCtor = new (...ranges: Range[]) => unknown;

function registry(): HighlightRegistry | null {
  const reg = (globalThis.CSS as unknown as { highlights?: HighlightRegistry } | undefined)?.highlights;
  const ctor = (globalThis as unknown as { Highlight?: HighlightCtor }).Highlight;
  return reg && ctor ? reg : null;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build a forgiving pattern: any quote style, any dash, any run of whitespace. */
export function phrasePattern(phrase: string): RegExp {
  const body = escapeRe(phrase.trim())
    .replace(/["“”]/g, "[\"“”]")
    .replace(/['‘’]/g, "['‘’]")
    .replace(/[-–—]/g, "[-–—]")
    .replace(/\s+/g, "\\s+");
  const wordy = /^[\w'’-]+$/.test(phrase.trim());
  return new RegExp(wordy ? `(?<![\\w’'])${body}(?![\\w’'])` : body, "i");
}

interface TextIndex {
  nodes: Text[];
  starts: number[];
  text: string;
}

function indexText(root: Element): TextIndex {
  const nodes: Text[] = [];
  const starts: number[] = [];
  let text = "";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode as Text;
    if (t.parentElement?.closest("[data-nohint]")) continue;
    starts.push(text.length);
    nodes.push(t);
    text += t.data;
  }
  return { nodes, starts, text };
}

function locate(ix: TextIndex, pos: number): [Text, number] {
  let lo = 0;
  let hi = ix.starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ix.starts[mid]! <= pos) lo = mid;
    else hi = mid - 1;
  }
  return [ix.nodes[lo]!, pos - ix.starts[lo]!];
}

function findRange(scope: Element, phrase: string): Range | null {
  const ix = indexText(scope);
  if (!ix.text) return null;
  const m = phrasePattern(phrase).exec(ix.text);
  if (!m) return null;
  const [sn, so] = locate(ix, m.index);
  const [en, eo] = locate(ix, m.index + m[0].length - 1);
  const r = document.createRange();
  r.setStart(sn, so);
  r.setEnd(en, eo + 1);
  return r;
}

/**
 * Highlight each phrase once. Phrases are looked for first inside `focus` elements (the lines or
 * paragraphs the question names), then anywhere in `root`. Returns the first range found.
 */
export function highlightPhrases(root: Element, phrases: string[], focus: Element[] = []): Range | null {
  const reg = registry();
  clearHighlights();
  if (!reg || phrases.length === 0) return null;
  const ranges: Range[] = [];
  for (const phrase of phrases) {
    let r: Range | null = null;
    for (const el of focus) {
      r = findRange(el, phrase);
      if (r) break;
    }
    r ??= findRange(root, phrase);
    if (r) ranges.push(r);
  }
  if (ranges.length === 0) return null;
  const Ctor = (globalThis as unknown as { Highlight: HighlightCtor }).Highlight;
  reg.set(HL, new Ctor(...ranges));
  return ranges[0]!;
}

export function clearHighlights(): void {
  registry()?.delete(HL);
}
