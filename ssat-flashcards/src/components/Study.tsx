import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isMastered, type Progress } from "../lib/progress";
import { buildQueue, passageMap, requeue, type SessionConfig } from "../lib/session";
import type { ChoiceKey, Deck } from "../lib/types";
import type { Outcome } from "./Feedback";
import { ArrowLeft, ArrowRight, Book, Check, Cross } from "./Icons";
import { PassageView } from "./PassageView";
import { QuestionCard } from "./QuestionCard";

export interface AnswerRecord {
  id: string;
  outcome: Outcome;
  picked: ChoiceKey | null;
  seconds: number;
}

export interface SessionResult {
  answers: AnswerRecord[];
  /** Cards that were already mastered when the session began. */
  masteredBefore: string[];
}

interface Props {
  deck: Deck;
  progress: Progress;
  cfg: SessionConfig;
  onAnswer: (id: string, correct: boolean) => void;
  onExit: () => void;
  onDone: (r: SessionResult) => void;
}

function useMediaQuery(query: string): boolean {
  const [on, setOn] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const f = () => setOn(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, [query]);
  return on;
}

export function Study({ deck, progress, cfg, onAnswer, onExit, onDone }: Props) {
  const byId = useMemo(() => new Map(deck.questions.map((q) => [q.id, q])), [deck]);
  const passages = useMemo(() => passageMap(deck), [deck]);
  const [queue, setQueue] = useState<string[]>(() => buildQueue(deck, progress, cfg));
  const [masteredBefore] = useState(() => deck.questions.filter((q) => isMastered(progress.cards[q.id])).map((q) => q.id));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<ChoiceKey | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const retried = useRef(new Set<string>());
  const startedAt = useRef(performance.now());
  const panelRef = useRef<HTMLElement>(null);

  const id = queue[index];
  const q = id ? byId.get(id) : undefined;
  const passage = q?.passageId ? passages.get(q.passageId) : undefined;
  const prevPassageId = index > 0 ? byId.get(queue[index - 1]!)?.passageId : undefined;
  const firstOfPassage = !!passage && prevPassageId !== passage.id;
  const [tab, setTab] = useState<"passage" | "question">(firstOfPassage ? "passage" : "question");

  const right = answers.filter((a) => a.outcome === "right").length;
  const wrong = answers.length - right;
  // Answers before this card was shown (the current answer, once given, is the last entry).
  const isRetry = !!q && answers.slice(0, outcome ? -1 : undefined).some((a) => a.id === q.id);

  const setLabel = useMemo(() => {
    if (!q || !passage) return undefined;
    const ids = queue.filter((x) => byId.get(x)?.passageId === passage.id);
    const uniq = [...new Set(ids)];
    const pos = uniq.indexOf(q.id) + 1;
    return uniq.length > 1 ? `Question ${pos} of ${uniq.length} on this passage` : undefined;
  }, [q, passage, queue, byId]);

  const answer = useCallback(
    (key: ChoiceKey | null) => {
      if (!q || outcome) return;
      const result: Outcome = key === null ? "skipped" : key === q.answer ? "right" : "wrong";
      const secs = Math.round((performance.now() - startedAt.current) / 1000);
      setPicked(key);
      setOutcome(result);
      setSeconds(secs);
      onAnswer(q.id, result === "right");
      setAnswers((a) => [...a, { id: q.id, outcome: result, picked: key, seconds: secs }]);
      if (result !== "right" && q.subject === "math" && !retried.current.has(q.id)) {
        retried.current.add(q.id);
        setQueue((qq) => requeue(qq, index, q.id));
      }
      if (tab === "passage") setTab("question");
    },
    [q, outcome, onAnswer, index, tab],
  );

  const finish = useCallback(() => onDone({ answers, masteredBefore }), [answers, masteredBefore, onDone]);

  const next = useCallback(() => {
    if (!outcome) return;
    if (index + 1 >= queue.length) {
      finish();
      return;
    }
    const nextQ = byId.get(queue[index + 1]!);
    const newPassage = !!nextQ?.passageId && nextQ.passageId !== q?.passageId;
    setIndex(index + 1);
    setPicked(null);
    setOutcome(null);
    setSeconds(0);
    setTab(newPassage ? "passage" : "question");
    startedAt.current = performance.now();
    if (newPassage) panelRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [outcome, index, queue, byId, q, finish]);

  // Keyboard: 1–5 / A–E answer, S skip, Enter / → next, P switches passage/question on small screens, Esc ends.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (!q) return;
      const k = e.key.toLowerCase();
      if (!outcome) {
        const n = "12345".indexOf(k) >= 0 ? "12345".indexOf(k) : "abcde".indexOf(k);
        if (n >= 0 && n < q.choices.length) {
          e.preventDefault();
          answer(q.choices[n]!.key);
          return;
        }
        if (k === "s") {
          e.preventDefault();
          answer(null);
          return;
        }
      } else if (k === "enter" || k === "arrowright") {
        if (t?.tagName === "BUTTON" && k === "enter") return; // the focused button handles it
        e.preventDefault();
        next();
        return;
      }
      if (k === "p" && passage) setTab((x) => (x === "passage" ? "question" : "passage"));
      if (k === "escape") (answers.length ? finish : onExit)();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, outcome, answer, next, passage, answers.length, finish, onExit]);

  const getPanel = useCallback(() => panelRef.current, []);
  const wide = useMediaQuery("(min-width: 1024px)");

  if (!q) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-ink-2">There are no cards to study with these settings.</p>
        <button type="button" onClick={onExit} className="mt-4 rounded-xl bg-brand px-4 py-2.5 font-semibold text-brand-ink">
          Back
        </button>
      </div>
    );
  }

  const done = index + (outcome ? 1 : 0);
  return (
    <div className="min-h-dvh pb-16">
      <div className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className={`mx-auto flex items-center gap-3 px-4 py-3 sm:px-6 ${passage ? "max-w-7xl" : "max-w-3xl"}`}>
          <button
            type="button"
            onClick={answers.length ? finish : onExit}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink"
            aria-label={answers.length ? "End session and see results" : "Back to home"}
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">{answers.length ? "End" : "Back"}</span>
          </button>
          <div className="min-w-0 flex-1">
            <div
              className="h-2 overflow-hidden rounded-full bg-paper-2"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={queue.length}
              aria-valuenow={done}
              aria-label="Session progress"
            >
              <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(100 * done) / queue.length}%` }} />
            </div>
          </div>
          <span className="tabular text-sm font-semibold text-ink-2">
            {Math.min(index + 1, queue.length)}
            <span className="font-normal text-ink-3"> / {queue.length}</span>
          </span>
          <span className="tabular hidden items-center gap-2 text-sm sm:inline-flex" aria-label={`${right} right, ${wrong} not right`}>
            <span className="inline-flex items-center gap-0.5 text-good">
              <Check size={15} />
              {right}
            </span>
            <span className="inline-flex items-center gap-0.5 text-bad">
              <Cross size={15} />
              {wrong}
            </span>
          </span>
        </div>
      </div>

      {passage ? (
        <div className="mx-auto max-w-7xl px-3 pt-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-7 lg:pt-6">
          <div className="sticky top-[57px] z-10 -mx-3 mb-3 bg-paper/90 px-3 py-2 backdrop-blur-md lg:hidden" role="tablist" aria-label="Passage or question">
            <div className="grid grid-cols-2 rounded-full border border-line bg-paper-2 p-1">
              {(["passage", "question"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`rounded-full py-2 text-sm font-semibold transition-colors ${tab === t ? "bg-card text-ink shadow-[var(--shadow-card)] ring-1 ring-line-2" : "text-ink-3"}`}
                >
                  {t === "passage" ? "Passage" : outcome ? "Question ✓" : "Question"}
                </button>
              ))}
            </div>
          </div>

          <aside
            ref={panelRef}
            className={`scroll-quiet rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-card)] sm:p-7 lg:sticky lg:top-[76px] lg:block lg:max-h-[calc(100dvh-96px)] lg:overflow-y-auto ${
              tab === "passage" ? "block" : "hidden"
            }`}
          >
            <PassageView passage={passage} question={q} active={wide || tab === "passage"} scrollParent={getPanel} />
            <button
              type="button"
              onClick={() => setTab("question")}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3.5 font-semibold text-brand-ink lg:hidden"
            >
              {outcome ? "Back to the question" : "Answer the question"} <ArrowRight size={18} />
            </button>
          </aside>

          <section className={`${tab === "question" ? "block" : "hidden"} lg:block`}>
            {tab === "question" && (
              <button
                type="button"
                onClick={() => setTab("passage")}
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-sm font-semibold text-reading lg:hidden"
              >
                <Book size={16} /> Reread “{passage.title.replace(/^from /, "")}”
              </button>
            )}
            <QuestionCard
              key={`${index}-${q.id}`}
              q={q}
              stat={progress.cards[q.id]}
              outcome={outcome}
              picked={picked}
              seconds={seconds}
              isRetry={isRetry}
              setLabel={setLabel}
              isLast={index + 1 >= queue.length}
              onPick={(k) => answer(k)}
              onSkip={() => answer(null)}
              onNext={next}
            />
          </section>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl px-3 pt-5 sm:px-6 sm:pt-8">
          <QuestionCard
            key={`${index}-${q.id}`}
            q={q}
            stat={progress.cards[q.id]}
            outcome={outcome}
            picked={picked}
            seconds={seconds}
            isRetry={isRetry}
            isLast={index + 1 >= queue.length}
            onPick={(k) => answer(k)}
            onSkip={() => answer(null)}
            onNext={next}
          />
        </div>
      )}
    </div>
  );
}
