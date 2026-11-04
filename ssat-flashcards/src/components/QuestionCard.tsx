import { useEffect, useRef } from "react";
import { DIFFICULTY_LABEL, SKILL_LABEL, TOPIC_LABEL } from "../lib/labels";
import { isMastered, rightToMaster, MASTERY_MARGIN, type CardStat } from "../lib/progress";
import type { ChoiceKey, Question } from "../lib/types";
import { Feedback, type Outcome } from "./Feedback";
import { ArrowRight, Check, Cross } from "./Icons";
import { Chip, Kbd, MasteryDots } from "./ui";

interface Props {
  q: Question;
  stat: CardStat | undefined;
  outcome: Outcome | null;
  picked: ChoiceKey | null;
  seconds: number;
  isRetry: boolean;
  setLabel?: string;
  isLast: boolean;
  onPick: (k: ChoiceKey) => void;
  onSkip: () => void;
  onNext: () => void;
}

export function QuestionCard({ q, stat, outcome, picked, seconds, isRetry, setLabel, isLast, onPick, onSkip, onNext }: Props) {
  const nextRef = useRef<HTMLButtonElement>(null);
  const stemRef = useRef<HTMLDivElement>(null);
  const answered = outcome !== null;

  useEffect(() => {
    if (answered) nextRef.current?.focus({ preventScroll: true });
  }, [answered]);
  useEffect(() => {
    stemRef.current?.focus({ preventScroll: true });
  }, [q.id]);

  const earned = Math.max(0, Math.min(MASTERY_MARGIN, (stat?.right ?? 0) - (stat?.wrong ?? 0)));
  const masteryLabel = isMastered(stat) ? "Mastered" : `${rightToMaster(stat)} more right to master`;
  const tone = q.subject === "math" ? "math" : "reading";

  return (
    <article
      key={q.id}
      className="anim-card-in rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-lift)] sm:p-7"
      aria-labelledby={`stem-${q.id}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Chip tone={tone}>{q.subject === "math" ? TOPIC_LABEL[q.topic!] : q.skill ? SKILL_LABEL[q.skill] : "Reading"}</Chip>
        {q.difficulty && (
          <Chip tone="neutral" className={q.difficulty === "hard" ? "!bg-accent-soft" : ""}>
            {DIFFICULTY_LABEL[q.difficulty]}
          </Chip>
        )}
        {isRetry && <Chip tone="bad">Second try</Chip>}
        {setLabel && <span className="text-xs font-medium text-ink-3">{setLabel}</span>}
        <span className="ml-auto">
          <MasteryDots earned={earned} total={MASTERY_MARGIN} label={masteryLabel} />
        </span>
      </div>

      <div
        id={`stem-${q.id}`}
        ref={stemRef}
        tabIndex={-1}
        className={`rich outline-none ${q.subject === "math" ? "text-[1.14rem] leading-relaxed" : "text-[1.08rem] leading-relaxed"} text-ink`}
        dangerouslySetInnerHTML={{ __html: q.stem }}
      />
      {q.subject === "reading" && /\bpages? \d/i.test(q.stem) && (
        <p className="mt-2 text-xs text-ink-3">Page numbers are from the printed test booklet. The words in quotes are highlighted in the passage.</p>
      )}

      <ol className="mt-5 grid gap-2.5" aria-label="Answer choices">
        {q.choices.map((c, i) => {
          const isAnswer = c.key === q.answer;
          const isPick = c.key === picked;
          let cls = "border-line bg-card hover:border-ink-3 hover:bg-paper/60";
          let badge = "border-line-2 text-ink-2";
          let mark: React.ReactNode = null;
          if (answered) {
            if (isAnswer) {
              cls = `border-good bg-good-soft ${isPick ? "anim-pop" : ""}`;
              badge = "border-good bg-good text-white dark:text-[var(--color-paper)]";
              mark = <Check size={18} className="text-good" />;
            } else if (isPick) {
              cls = "border-bad bg-bad-soft anim-shake";
              badge = "border-bad bg-bad text-white dark:text-[var(--color-paper)]";
              mark = <Cross size={18} className="text-bad" />;
            } else {
              cls = "border-line bg-card opacity-55";
            }
          }
          return (
            <li key={c.key}>
              <button
                type="button"
                disabled={answered}
                onClick={() => onPick(c.key)}
                aria-label={`${c.key}${answered && isAnswer ? " (correct answer)" : ""}${answered && isPick && !isAnswer ? " (your answer)" : ""}`}
                aria-describedby={`choice-${q.id}-${c.key}`}
                className={`group flex w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left transition-[transform,background-color,border-color] duration-150 active:scale-[0.99] disabled:cursor-default disabled:active:scale-100 ${cls}`}
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-colors ${badge}`}>{c.key}</span>
                <span id={`choice-${q.id}-${c.key}`} className="rich min-w-0 flex-1 text-[1.02rem] leading-snug" dangerouslySetInnerHTML={{ __html: c.html || "&nbsp;" }} />
                {mark}
                {!answered && <span className="hidden text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 sm:block"><Kbd>{i + 1}</Kbd></span>}
              </button>
            </li>
          );
        })}
      </ol>

      <div aria-live="polite">{answered && <Feedback q={q} outcome={outcome} picked={picked} seconds={seconds} />}</div>

      <div className="mt-5 flex items-center justify-between gap-3">
        {!answered ? (
          <>
            <button type="button" onClick={onSkip} className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-3 hover:bg-paper-2 hover:text-ink">
              Not sure: skip and show answer
            </button>
            <span className="hidden text-xs text-ink-3 sm:inline">
              <Kbd>S</Kbd> skip
            </span>
          </>
        ) : (
          <>
            <span className="hidden text-xs text-ink-3 sm:inline">
              <Kbd>Enter</Kbd> next
            </span>
            <button
              ref={nextRef}
              type="button"
              onClick={onNext}
              className="group ml-auto inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 font-semibold text-brand-ink shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
            >
              {isLast ? "See results" : "Next card"}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
