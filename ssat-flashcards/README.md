# Upper Hand: SSAT Upper Level flashcards

Flashcards for the **Upper Level SSAT** math (Quantitative) and Reading sections: **50 math and 60 reading cards**. Every card is a real, released question from an actual standardized test, copied word for word with its official answer key. Nothing was written from scratch except the explanations.

Pick Math, Reading or a mix, filter by topic or passage type, and study in sessions of 10, 20 or all. After each answer the card shows the right answer, a short explanation, how long you took against SSAT pace, and, for NAEP questions, the share of U.S. students who picked each choice. A card is **mastered** once it has been answered right two more times than wrong (the same rule as the DMV flashcards). Missed cards come back first next session, and a missed math card comes back once, a few cards later. Every session ends with an SSAT-style raw score (+1 right, −¼ wrong, 0 skipped). Progress is saved in the browser (localStorage).

**Stack:** Vite · React 19 · TypeScript (strict) · Tailwind v4 · vitest. The deck builder is Python 3 (standard library only).

## Scripts

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm test
npm run build
npm run deck       # rebuild src/data/deck.json and public/naep/ from data/ (downloads NAEP items once, then uses scripts/.cache)
```

## Where the questions come from

The SSAT's own practice questions are copyrighted (and mostly sold), and the free mini-test needs an account, so they can't be republished. Instead the deck uses released questions from two testing programs whose material may be reused, picked to match the Upper Level content (grades 8–11):

| Source | Cards | Reuse terms |
| --- | --- | --- |
| [NAEP Questions Tool](https://www.nationsreportcard.gov/nqt/) (National Assessment of Educational Progress), grades 8 and 12, 1990–2013 | 50 math, 16 reading | Public domain, except third-party material such as most reading passages. Only public-domain passages are used. The required acknowledgment is printed on every card. |
| [MCAS released items](https://www.doe.mass.edu/mcas/release.html) (Massachusetts), grade 10 ELA 2002–2007 and grades 8/10 ELA 2023–2025 | 44 reading | "Permission is hereby granted to copy for non-commercial educational purposes … with the exception of English Language Arts passages that are not designated as in the public domain." Only passages marked *In the public domain* are used. The 2002–2007 booklets were downloaded from the Pioneer Institute's MCAS archive. |

**Math (50):** NAEP multiple-choice items with five choices and **no calculator**, like the SSAT. Items that need rulers, cut-out shapes or other manipulatives were left out, and so were trigonometry and other pre-calculus. Mostly Medium/Hard by NAEP's national results. The mix is roughly the SSAT's: numbers & operations 14, algebra 15, geometry 8, measurement 6, data & probability 7.

**Reading (60):** 13 public-domain passages: fiction 29 (Saki, Hawthorne, Dickens, Austen, a James Baldwin myth retelling), poetry 17 (Frost, Teasdale, Whitman ×2), drama 4 (*As You Like It*), and nonfiction 10 (Theodore Roosevelt's 1905 inaugural, Twain, Caroline Henderson's Dust Bowl letters). Reading questions have four choices; the SSAT has five.

What was left out, and why:
- **Copyrighted passages.** Most NAEP passages and most modern MCAS passages are reprinted from magazines and books. Questions that need a copyrighted paired passage were skipped too.
- **Balance.** More public-domain poetry and Shakespeare was transcribed than the deck needed. *Sonnet 116*, Spenser's *Sonnet 26*, *Macbeth*, *Henry V*, "Count That Day Lost" and "The Rock and the Sea" are kept in `data/mcas/` with `"exclude": true` and a reason, so they're easy to switch back on.
- **Item types that don't fit a flashcard.** Open-response, essay, select-two/select-three and drag-and-drop items.
- One NAEP set (Frost's "The Death of the Hired Man") was released with only a description of the poem. The 1914 public-domain text comes from Project Gutenberg (`data/passages/`).

## Private question packs

A **question pack** adds extra questions, such as a practice test the family owns, to one browser. It's a single JSON file (figures inlined) that you add with "Add a question pack" on the home page. The app validates it, sanitizes its HTML (`src/lib/sanitize.ts`), and saves it in that browser's localStorage. Pack cards join the normal deck, get their own "Questions from" filter, and say where they came from on every card. Packs are never part of the repo or the deployed site, so add the file again on each device.

Packs can use what the built-in deck doesn't: five reading choices, and prose passages with printed line numbers (`"flow": true`). These reflow to fit the screen, with each line number in the margin where its printed line begins.

`moreanswers/` and `private/` are gitignored. To rebuild the Ivy Global practice-test pack:

```bash
python scripts/build_pack.py   # reads moreanswers/ + private/notes/, writes private/upper-hand-pack-ivy-test-1.json
```

`private/notes/` holds the explanations, topic and skill tags, and passage labels written for that test. They're kept private too, since they quote the test.

Not affiliated with the SSAT, E3n, NAEP, or the Massachusetts Department of Elementary and Secondary Education.

## Layout

| Path | What |
| --- | --- |
| `data/picks.json` | NAEP item IDs (NQT table IDs) for math, and the NAEP reading blocks with their passage metadata |
| `data/mcas/*.json` | MCAS public-domain passages and their multiple-choice questions, transcribed from the released PDFs (line numbers checked against the printed margins, keys against the printed answer marks) |
| `data/passages/*.json` | Public-domain passage text NAEP didn't reprint |
| `data/explanations*.json` | Explanations written for this app, keyed by question ID |
| `data/tags.json` | Reading skill tags (main idea, detail, inference, vocabulary, author's craft, tone) |
| `scripts/build_deck.py` | Downloads NAEP items, answer keys, national percentages and figures from the NQT API, sanitizes the HTML (MathML kept), merges MCAS and explanations, validates, and writes `src/data/deck.json` |
| `public/naep/` | Figures used by NAEP math questions |
| `scripts/build_pack.py` | Builds a private question pack from a transcribed practice test (see below) |
| `src/lib/packs.ts`, `src/lib/sanitize.ts` | Pack validation, merging and storage; allow-list HTML sanitizer for imported packs |
| `src/lib/progress.ts` | Card results, mastery rule, streak, defensive localStorage parsing |
| `src/lib/session.ts` | Session queue: filters, priority (missed → new → learning), whole reading passages, mixed interleaving, math retries, SSAT raw score |
| `src/lib/hints.ts`, `src/lib/highlight.ts` | Finds the lines, paragraphs and quoted words a reading question refers to and highlights them (CSS Custom Highlight API, so React's DOM isn't touched) |
| `src/components/` | Home, Study (split passage/question view, phone tabs), QuestionCard, Feedback, PassageView, Summary, About |

## Keyboard

`1`–`5` or `A`–`E` answer · `S` skip and show the answer · `Enter` or `→` next card · `P` passage/question on small screens · `Esc` end the session.
