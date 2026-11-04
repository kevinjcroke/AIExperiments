import { useMemo } from "react";
import { stripTags } from "../lib/hints";
import { isMastered, type Progress } from "../lib/progress";
import { ssatRawScore, type SessionConfig } from "../lib/session";
import type { Deck } from "../lib/types";
import { Brand } from "./Brand";
import { ArrowRight, Rotate, Star, Target } from "./Icons";
import type { SessionResult } from "./Study";
import { Ring } from "./ui";

interface Props {
  deck: Deck;
  progress: Progress;
  result: SessionResult;
  onAgain: () => void;
  onReview: (cfg: SessionConfig) => void;
  onHome: () => void;
}

export function Summary({ deck, progress, result, onAgain, onReview, onHome }: Props) {
  const byId = useMemo(() => new Map(deck.questions.map((q) => [q.id, q])), [deck]);
  // Score the first attempt at each card; second tries only help mastery.
  const first = useMemo(() => {
    const seen = new Set<string>();
    return result.answers.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
  }, [result]);
  const right = first.filter((a) => a.outcome === "right").length;
  const wrong = first.filter((a) => a.outcome === "wrong").length;
  const skipped = first.filter((a) => a.outcome === "skipped").length;
  const total = first.length;
  const pct = total ? right / total : 0;
  const raw = ssatRawScore(right, wrong);
  const before = new Set(result.masteredBefore);
  const newlyMastered = [...new Set(result.answers.map((a) => a.id))].filter((id) => !before.has(id) && isMastered(progress.cards[id]));
  const missedIds = [...new Set(first.filter((a) => a.outcome !== "right").map((a) => a.id))].filter((id) => !isMastered(progress.cards[id]));
  const avgSecs = total ? Math.round(first.reduce((s, a) => s + a.seconds, 0) / total) : 0;

  const headline = total === 0 ? "No cards answered" : pct === 1 ? "Perfect round!" : pct >= 0.8 ? "Strong work." : pct >= 0.6 ? "Good progress." : "Every miss is a lesson.";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <header className="py-5">
        <Brand compact />
      </header>
      <main className="anim-card-in rounded-[var(--radius-card)] border border-line bg-card p-6 shadow-[var(--shadow-lift)] sm:p-8">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <Ring value={pct} size={128} stroke={11} className={pct >= 0.6 ? "text-good" : "text-accent"}>
            <div className="text-center">
              <div className="tabular font-display text-3xl font-semibold">{Math.round(pct * 100)}%</div>
              <div className="text-xs text-ink-3">right</div>
            </div>
          </Ring>
          <div>
            <h1 className="font-display text-3xl font-semibold">{headline}</h1>
            <p className="mt-1 text-ink-2">
              {right} of {total} right on the first try{skipped ? `, ${skipped} skipped` : ""}. About {avgSecs}s per card.
            </p>
            {newlyMastered.length > 0 && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold">
                <Star size={16} className="text-accent" /> {newlyMastered.length} {newlyMastered.length === 1 ? "card" : "cards"} newly mastered
              </p>
            )}
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-line bg-paper/60 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink-2">SSAT-style raw score</h2>
            <span className="tabular font-display text-2xl font-semibold">
              {Number.isInteger(raw) ? raw : raw.toFixed(2)} <span className="text-base font-normal text-ink-3">/ {total}</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-2">
            {right} right × 1 − {wrong} wrong × ¼ + {skipped} skipped × 0.{" "}
            {wrong > 0 && skipped === 0 ? "Wrong answers cost a quarter point, so skip when you can't rule out any choice." : "Skipping costs nothing; a wrong guess costs ¼."}
          </p>
        </div>

        {missedIds.length > 0 && (
          <section className="mt-7">
            <h2 className="font-semibold">Worth another look</h2>
            <ul className="mt-2 divide-y divide-line rounded-2xl border border-line">
              {missedIds.slice(0, 8).map((id) => {
                const q = byId.get(id)!;
                const answerHtml = q.choices.find((c) => c.key === q.answer)?.html ?? "";
                return (
                  <li key={id} className="px-4 py-3 text-sm">
                    <p className="line-clamp-2 text-ink">{stripTags(q.stem)}</p>
                    <p className="mt-1 text-ink-3">
                      Answer: <b className="text-good">{q.answer}</b>{" "}
                      <span className="rich inline" dangerouslySetInnerHTML={{ __html: answerHtml }} />
                    </p>
                  </li>
                );
              })}
            </ul>
            {missedIds.length > 8 && <p className="mt-2 text-xs text-ink-3">…and {missedIds.length - 8} more.</p>}
          </section>
        )}

        <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
          {missedIds.length > 0 ? (
            <button
              type="button"
              onClick={() => onReview({ deck: "mixed", topics: [], genres: [], size: 0, mode: "everything", only: missedIds })}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3.5 font-semibold text-brand-ink shadow-[var(--shadow-card)]"
            >
              <Target size={18} /> Retry these {missedIds.length} now
            </button>
          ) : (
            <button
              type="button"
              onClick={onAgain}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3.5 font-semibold text-brand-ink shadow-[var(--shadow-card)]"
            >
              <Rotate size={18} /> Another round
            </button>
          )}
          <button
            type="button"
            onClick={onHome}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-card px-5 py-3.5 font-semibold text-ink"
          >
            Back to decks <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
