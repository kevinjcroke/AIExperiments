import { useMemo, useRef, useState } from "react";
import { cardState, streak, type CardState, type Progress } from "../lib/progress";
import { eligible, genreGroup, passageMap, type DeckChoice, type GenreGroup, type Mode, type SessionConfig } from "../lib/session";
import type { Prefs } from "../lib/store";
import { GENRE_GROUP_LABEL, GENRE_GROUPS, GENRE_LABEL, TOPIC_LABEL, TOPICS } from "../lib/labels";
import { sourceKey, type Pack } from "../lib/packs";
import type { Deck, MathTopic, Question } from "../lib/types";
import { About } from "./About";
import { Packs } from "./Packs";
import { Brand } from "./Brand";
import { ArrowRight, Book, Flame, Info, Keyboard, Rotate, Shuffle, Sigma, Star, Target } from "./Icons";
import { FilterChip, Kbd, StackBar, Toggle, type Segment } from "./ui";

interface Props {
  deck: Deck;
  packs: Pack[];
  progress: Progress;
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  onStart: (cfg: SessionConfig) => void;
  onReset: () => void;
  onAddPack: (p: Pack) => void;
  onRemovePack: (id: string) => void;
}

type Counts = Record<CardState, number> & { total: number };

function count(qs: Question[], progress: Progress): Counts {
  const c: Counts = { new: 0, missed: 0, learning: 0, mastered: 0, total: qs.length };
  for (const q of qs) c[cardState(progress.cards[q.id])]++;
  return c;
}

function segments(c: Counts): Segment[] {
  return [
    { value: c.mastered, className: "bg-accent", label: "Mastered" },
    { value: c.learning, className: "bg-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-paper-2))]", label: "Learning" },
    { value: c.missed, className: "bg-bad/70", label: "Missed last time" },
  ];
}

export function Home({ deck, packs, progress, prefs, setPrefs, onStart, onReset, onAddPack, onRemovePack }: Props) {
  const aboutRef = useRef<HTMLDialogElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const passages = useMemo(() => passageMap(deck), [deck]);
  const math = useMemo(() => deck.questions.filter((q) => q.subject === "math"), [deck]);
  const reading = useMemo(() => deck.questions.filter((q) => q.subject === "reading"), [deck]);
  const packQs = deck.questions.filter((q) => q.source.test === "pack").length;

  // Source filter ("released" or a pack id); ignore packs that have since been removed.
  const sources = prefs.sources.filter((k) => k === "released" || packs.some((p) => p.id === k));
  const inSources = (q: Question) => sources.length === 0 || sources.includes(sourceKey(q));
  const mathIn = math.filter(inSources);
  const readingIn = reading.filter(inSources);
  const toggleSource = (k: string) => setPrefs({ ...prefs, sources: sources.includes(k) ? sources.filter((x) => x !== k) : [...sources, k] });
  const inDeck = (q: Question) => prefs.deck === "mixed" || q.subject === prefs.deck;

  const all = count(deck.questions, progress);
  const answered = Object.values(progress.cards).reduce(
    (a, s) => ({ right: a.right + s.right, wrong: a.wrong + s.wrong }),
    { right: 0, wrong: 0 },
  );
  const accuracy = answered.right + answered.wrong > 0 ? Math.round((100 * answered.right) / (answered.right + answered.wrong)) : null;
  const days = streak(progress.days, Date.now());

  const cfgFor = (mode: Mode, p: Prefs = prefs): SessionConfig => ({ deck: p.deck, topics: p.topics, genres: p.genres, sources, size: p.size, mode });
  const ready = eligible(deck, progress, cfgFor("practice")).length;
  const missed = eligible(deck, progress, cfgFor("missed")).length;
  const inFilter = eligible(deck, progress, cfgFor("everything")).length;

  const setDeck = (d: DeckChoice) => setPrefs({ ...prefs, deck: d });
  const toggleTopic = (t: MathTopic) =>
    setPrefs({ ...prefs, topics: prefs.topics.includes(t) ? prefs.topics.filter((x) => x !== t) : [...prefs.topics, t] });
  const toggleGenre = (g: GenreGroup) =>
    setPrefs({ ...prefs, genres: prefs.genres.includes(g) ? prefs.genres.filter((x) => x !== g) : [...prefs.genres, g] });

  const deckWord = prefs.deck === "math" ? "math" : prefs.deck === "reading" ? "reading" : "mixed";
  const sessionCount = prefs.size === 0 ? ready : Math.min(prefs.size, ready);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-5">
        <Brand />
        <div className="flex items-center gap-2">
          {days > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-semibold text-ink" title="Days in a row with practice">
              <Flame size={16} className="text-accent" />
              {days}-day streak
            </span>
          )}
          <button
            type="button"
            onClick={() => aboutRef.current?.showModal()}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-sm font-semibold text-ink-2 hover:text-ink"
          >
            <Info size={16} />
            <span>About</span>
          </button>
        </div>
      </header>

      <main className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <section className="anim-fade-up pt-2 lg:pt-8">
          <h1 className="font-display text-[2.4rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-[3.2rem]">
            Real test questions. <span className="text-accent">One card at a time.</span>
          </h1>
          <p className="mt-4 max-w-[52ch] text-[1.05rem] leading-relaxed text-ink-2">
            {packQs === 0 ? (
              <>
                {math.length} math and {reading.length} reading flashcards, all real questions from past standardized tests, picked to match the SSAT Upper Level.
              </>
            ) : (
              <>
                {math.length} math and {reading.length} reading flashcards, all real test questions: {deck.questions.length - packQs} released from past standardized tests,
                plus {packQs} from {packs.length === 1 ? `your ${packs[0]!.short} pack` : "your private packs"}.
              </>
            )}{" "}
            Answer, see why, and keep going until every card is mastered.
          </p>
          <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-ink-3">
            The SSAT is the same everywhere, so it doesn't matter where a question came from. {packQs > 0 ? "The built-in ones" : "These"} come from NAEP (the national
            test) and Massachusetts' state test, two of the few programs that let anyone reuse their released questions. The SSAT's own practice questions are
            copyrighted{packQs > 0 ? ", which is why your pack stays private to this browser" : ""}.{" "}
            <button type="button" className="font-semibold text-ink-2 underline underline-offset-2" onClick={() => aboutRef.current?.showModal()}>
              More about the sources
            </button>
          </p>

          <div className="mt-7 rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold text-ink-2">Your progress</h2>
              <span className="tabular text-sm text-ink-3">
                <b className="font-display text-2xl font-semibold text-ink">{all.mastered}</b> / {all.total} mastered
              </span>
            </div>
            <StackBar segments={segments(all)} total={all.total} className="mt-3 h-3" />
            <Legend c={all} />
            <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
              <Stat label="Answered" value={answered.right + answered.wrong} />
              <Stat label="Accuracy" value={accuracy === null ? "—" : `${accuracy}%`} />
              <Stat label="Day streak" value={days} />
            </dl>
          </div>
        </section>

        <section aria-labelledby="start-h" className="anim-fade-up rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-lift)] sm:p-6 lg:mt-8">
          <h2 id="start-h" className="font-display text-2xl font-semibold">
            Start a session
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Deck">
            <DeckButton on={prefs.deck === "math"} onClick={() => setDeck("math")} icon={<Sigma size={20} />} label="Math" sub={`${mathIn.length} cards`} tone="math" />
            <DeckButton on={prefs.deck === "reading"} onClick={() => setDeck("reading")} icon={<Book size={20} />} label="Reading" sub={`${readingIn.length} cards`} tone="reading" />
            <DeckButton on={prefs.deck === "mixed"} onClick={() => setDeck("mixed")} icon={<Shuffle size={20} />} label="Mix" sub="both" tone="neutral" />
          </div>

          {packs.length > 0 && (
            <fieldset className="mt-5">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Questions from</legend>
              <div className="flex flex-wrap gap-2">
                <FilterChip tone="neutral" on={sources.length === 0} onClick={() => setPrefs({ ...prefs, sources: [] })}>
                  All
                </FilterChip>
                {packs.map((p) => (
                  <FilterChip
                    key={p.id}
                    tone="neutral"
                    on={sources.includes(p.id)}
                    onClick={() => toggleSource(p.id)}
                    count={deck.questions.filter((q) => inDeck(q) && sourceKey(q) === p.id).length}
                  >
                    {p.short}
                  </FilterChip>
                ))}
                <FilterChip
                  tone="neutral"
                  on={sources.includes("released")}
                  onClick={() => toggleSource("released")}
                  count={deck.questions.filter((q) => inDeck(q) && sourceKey(q) === "released").length}
                >
                  NAEP &amp; MCAS
                </FilterChip>
              </div>
            </fieldset>
          )}
          {prefs.deck !== "reading" && (
            <fieldset className="mt-5">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Math topics</legend>
              <div className="flex flex-wrap gap-2">
                <FilterChip tone="math" on={prefs.topics.length === 0} onClick={() => setPrefs({ ...prefs, topics: [] })}>
                  All
                </FilterChip>
                {TOPICS.map((t) => (
                  <FilterChip key={t} tone="math" on={prefs.topics.includes(t)} onClick={() => toggleTopic(t)} count={mathIn.filter((q) => q.topic === t).length}>
                    {TOPIC_LABEL[t]}
                  </FilterChip>
                ))}
              </div>
            </fieldset>
          )}
          {prefs.deck !== "math" && (
            <fieldset className="mt-5">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Reading passages</legend>
              <div className="flex flex-wrap gap-2">
                <FilterChip tone="reading" on={prefs.genres.length === 0} onClick={() => setPrefs({ ...prefs, genres: [] })}>
                  All
                </FilterChip>
                {GENRE_GROUPS.map((g) => (
                  <FilterChip
                    key={g}
                    tone="reading"
                    on={prefs.genres.includes(g)}
                    onClick={() => toggleGenre(g)}
                    count={readingIn.filter((q) => q.passageId && genreGroup(passages.get(q.passageId)!.genre) === g).length}
                  >
                    {GENRE_GROUP_LABEL[g]}
                  </FilterChip>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Session length</span>
            <Toggle
              label="Session length"
              value={prefs.size}
              onChange={(size) => setPrefs({ ...prefs, size })}
              options={[
                { value: 10, label: "10" },
                { value: 20, label: "20" },
                { value: 0, label: "All", sub: ready },
              ]}
            />
          </div>
          {prefs.deck !== "math" && prefs.size > 0 && (
            <p className="mt-2 text-xs text-ink-3">Reading passages are kept whole, so a session can run a card or two long.</p>
          )}

          <div className="mt-6 grid gap-2.5">
            {ready > 0 ? (
              <button
                type="button"
                onClick={() => onStart(cfgFor("practice"))}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-4 text-base font-semibold text-brand-ink shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Start {sessionCount} {deckWord} {sessionCount === 1 ? "card" : "cards"}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <div className="rounded-2xl border border-dashed border-accent bg-accent-soft/60 p-4 text-center">
                <Star size={22} className="mx-auto text-accent" />
                <p className="mt-1 font-semibold">Everything here is mastered.</p>
                <p className="text-sm text-ink-2">Pick another deck or topic, or run through these again for review.</p>
                {inFilter > 0 && (
                  <button
                    type="button"
                    onClick={() => onStart(cfgFor("everything"))}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink"
                  >
                    <Rotate size={16} /> Review mastered cards
                  </button>
                )}
              </div>
            )}
            {missed > 0 && (
              <button
                type="button"
                onClick={() => onStart(cfgFor("missed"))}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-bad/40 bg-bad-soft px-5 py-3 text-sm font-semibold text-bad transition-colors hover:border-bad"
              >
                <Target size={17} /> Retry the {missed} {missed === 1 ? "card" : "cards"} you missed
              </button>
            )}
          </div>
          <p className="mt-4 hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3 sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <Keyboard size={15} /> <Kbd>1</Kbd>–<Kbd>5</Kbd> answer
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd>S</Kbd> skip
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd>Enter</Kbd> next card
            </span>
          </p>
        </section>
      </main>

      <section className="mt-12 grid gap-6 md:grid-cols-2" aria-label="Decks">
        <MathOverview
          qs={math}
          sub={packQs > 0 ? "NAEP grades 8 and 12, plus your packs · five choices, no calculator" : "NAEP grades 8 and 12 · five answer choices, no calculator"}
          progress={progress}
          onPlay={(t) => onStart({ deck: "math", topics: [t], genres: [], size: 0, mode: "practice" })} />
        <ReadingOverview deck={deck} qs={reading} progress={progress} onPlay={(ids) => onStart({ deck: "reading", topics: [], genres: [], size: 0, mode: "everything", only: ids })} />
      </section>

      <Packs packs={packs} onAdd={onAddPack} onRemove={onRemovePack} />

      <section className="mt-12" aria-labelledby="how-h">
        <h2 id="how-h" className="font-display text-2xl font-semibold">
          How it works
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Tip title="Master each card" icon={<Star size={18} />}>
            A card is mastered when you've answered it right <b>two more times than wrong</b>. Missed cards come back first next time, and a missed math card shows up
            again a few cards later.
          </Tip>
          <Tip title="Think like the SSAT" icon={<Target size={18} />}>
            On the SSAT a right answer is +1, a wrong answer is <b>−¼</b>, and a skip is 0. Guess when you can rule out at least one choice; otherwise skip. Every
            session ends with an SSAT-style raw score.
          </Tip>
          <Tip title="Mind the clock" icon={<Flame size={18} />}>
            The Upper Level gives about <b>72 seconds per math question</b> (no calculator) and about a minute per reading question. Each card shows how long you
            took.
          </Tip>
        </div>
      </section>

      <footer className="mt-14 flex flex-col gap-4 border-t border-line pt-6 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[70ch]">
          Questions: National Assessment of Educational Progress (public domain) and Massachusetts MCAS (copied with permission for non-commercial education). Not
          affiliated with the SSAT or E3n.{" "}
          <button type="button" className="font-semibold text-ink-2 underline underline-offset-2" onClick={() => aboutRef.current?.showModal()}>
            Sources &amp; details
          </button>
        </p>
        {confirmReset ? (
          <span className="inline-flex items-center gap-2">
            <span>Erase all progress?</span>
            <button
              type="button"
              className="rounded-full bg-bad px-3 py-1.5 font-semibold text-white"
              onClick={() => {
                onReset();
                setConfirmReset(false);
              }}
            >
              Erase
            </button>
            <button type="button" className="rounded-full border border-line px-3 py-1.5 font-semibold text-ink-2" onClick={() => setConfirmReset(false)}>
              Keep
            </button>
          </span>
        ) : (
          <button type="button" className="self-start font-semibold text-ink-2 underline underline-offset-2 sm:self-auto" onClick={() => setConfirmReset(true)}>
            Reset progress
          </button>
        )}
      </footer>

      <About ref={aboutRef} deck={deck} packs={packs} />
    </div>
  );
}

function Legend({ c }: { c: Counts }) {
  const items = [
    { label: "Mastered", n: c.mastered, cls: "bg-accent" },
    { label: "Learning", n: c.learning, cls: "bg-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-paper-2))]" },
    { label: "Missed", n: c.missed, cls: "bg-bad/70" },
    { label: "New", n: c.new, cls: "bg-paper-2 border border-line-2" },
  ];
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3">
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${i.cls}`} aria-hidden />
          {i.label} <span className="tabular font-semibold text-ink-2">{i.n}</span>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-3">{label}</dt>
      <dd className="tabular mt-1 font-display text-2xl font-semibold">{value}</dd>
    </div>
  );
}

function DeckButton({ on, onClick, icon, label, sub, tone }: { on: boolean; onClick: () => void; icon: React.ReactNode; label: string; sub: string; tone: "math" | "reading" | "neutral" }) {
  const ring = tone === "math" ? "border-math bg-math-soft text-math" : tone === "reading" ? "border-reading bg-reading-soft text-reading" : "border-ink-2 bg-paper-2 text-ink";
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.98] ${
        on ? ring : "border-line bg-card text-ink-2 hover:border-line-2"
      }`}
    >
      {icon}
      <span className={`font-semibold ${on ? "" : "text-ink"}`}>{label}</span>
      <span className="text-xs text-ink-3">{sub}</span>
    </button>
  );
}

function Tip({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-card p-5">
      <div className="flex items-center gap-2 font-semibold">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-accent">{icon}</span>
        {title}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{children}</p>
    </div>
  );
}

function MathOverview({ qs, sub, progress, onPlay }: { qs: Question[]; sub: string; progress: Progress; onPlay: (t: MathTopic) => void }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-math-soft text-math">
          <Sigma size={20} />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold">Math</h2>
          <p className="text-xs text-ink-3">{sub}</p>
        </div>
      </div>
      <ul className="mt-4 divide-y divide-line">
        {TOPICS.map((t) => {
          const c = count(
            qs.filter((q) => q.topic === t),
            progress,
          );
          return (
            <li key={t}>
              <button type="button" onClick={() => onPlay(t)} className="group grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 py-3 text-left">
                <span className="font-semibold">{TOPIC_LABEL[t]}</span>
                <span className="tabular text-sm text-ink-3">
                  {c.mastered}/{c.total}
                  <ArrowRight size={15} className="ml-1.5 inline text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-math" />
                </span>
                <StackBar segments={segments(c)} total={c.total} className="col-span-2 h-1.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReadingOverview({ deck, qs, progress, onPlay }: { deck: Deck; qs: Question[]; progress: Progress; onPlay: (ids: string[]) => void }) {
  const dot: Record<CardState, string> = {
    mastered: "bg-accent",
    learning: "bg-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-paper-2))]",
    missed: "bg-bad/70",
    new: "border border-line-2",
  };
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-reading-soft text-reading">
          <Book size={20} />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold">Reading</h2>
          <p className="text-xs text-ink-3">
            {deck.passages.length} {deck.passages.some((p) => p.source.test === "pack") ? "" : "public-domain "}passages · tap one to practice just that passage
          </p>
        </div>
      </div>
      <ul className="mt-4 divide-y divide-line">
        {deck.passages.map((p) => {
          const pq = qs.filter((q) => q.passageId === p.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          return (
            <li key={p.id}>
              <button type="button" onClick={() => onPlay(pq.map((q) => q.id))} className="group flex w-full items-center gap-3 py-2.5 text-left">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.title}</span>
                  <span className="block truncate text-xs text-ink-3">
                    {[p.author?.split(",")[0], p.source.test === "pack" ? p.source.short : null, GENRE_LABEL[p.genre]].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="flex shrink-0 gap-1" aria-label={`${pq.filter((q) => cardState(progress.cards[q.id]) === "mastered").length} of ${pq.length} mastered`}>
                  {pq.map((q) => (
                    <span key={q.id} className={`h-2.5 w-2.5 rounded-full ${dot[cardState(progress.cards[q.id])]}`} />
                  ))}
                </span>
                <ArrowRight size={15} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-reading" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
