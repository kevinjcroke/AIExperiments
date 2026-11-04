import { sourceLong } from "../lib/labels";
import type { ChoiceKey, Question } from "../lib/types";
import { Check, Clock, Cross, Eye } from "./Icons";

export type Outcome = "right" | "wrong" | "skipped";

const PACE: Record<Question["subject"], number> = { math: 72, reading: 60 };

export function Feedback({ q, outcome, picked, seconds }: { q: Question; outcome: Outcome; picked: ChoiceKey | null; seconds: number }) {
  const verdict =
    outcome === "right" ? (
      <>
        <Check size={20} /> Correct!
      </>
    ) : outcome === "wrong" ? (
      <>
        <Cross size={20} /> Not quite. The answer is {q.answer}.
      </>
    ) : (
      <>
        <Eye size={20} /> Skipped. The answer is {q.answer}.
      </>
    );
  const tone = outcome === "right" ? "text-good" : outcome === "wrong" ? "text-bad" : "text-ink-2";
  const pace = PACE[q.subject];

  return (
    <div className="anim-fade-up mt-5 rounded-2xl border border-line bg-paper/60 p-4 sm:p-5">
      <p className={`flex items-center gap-2 text-lg font-semibold ${tone}`}>{verdict}</p>
      {q.explanation && <p className="mt-2 leading-relaxed text-ink">{q.explanation}</p>}
      {q.stats && <StatsBars q={q} picked={picked} />}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-3 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} />
          <span className="tabular">
            {seconds < 600 ? `${seconds}s` : "10+ min"}
            <span className="hidden sm:inline">
              {" "}
              · SSAT pace ≈ {pace}s{seconds <= pace ? " ✓" : ""}
            </span>
          </span>
        </span>
        <SourceLine q={q} />
      </div>
    </div>
  );
}

function SourceLine({ q }: { q: Question }) {
  const s = q.source;
  if (s.test === "pack") {
    return (
      <span className="max-w-[60ch]" title={sourceLong(s)}>
        Source: {s.name}
        {s.ref ? `, ${s.ref}` : ""}. Private copy, saved only in this browser.
      </span>
    );
  }
  if (s.test === "NAEP") {
    const subject = q.subject === "math" ? "Mathematics" : "Reading";
    return (
      <span className="max-w-[60ch]" title={sourceLong(s)}>
        Source: U.S. Dept. of Education, IES, NCES, National Assessment of Educational Progress (NAEP), {s.year} {subject} Assessment, grade {s.grade}
        {s.ref ? ` (${s.ref.split(" · ")[1] ?? s.ref})` : ""}.
      </span>
    );
  }
  return (
    <span className="max-w-[60ch]" title={sourceLong(s)}>
      Source: Massachusetts Department of Elementary and Secondary Education, MCAS {s.year}, grade {s.grade} ELA{s.ref ? `, ${s.ref.split(" · ")[0]}` : ""}.
    </span>
  );
}

function StatsBars({ q, picked }: { q: Question; picked: ChoiceKey | null }) {
  const stats = q.stats!;
  const keys = q.choices.map((c) => c.key);
  const max = Math.max(...keys.map((k) => stats.pct[k] ?? 0), 1);
  const right = stats.pct[q.answer];
  return (
    <figure className="mt-4">
      <figcaption className="text-sm text-ink-2">
        <b className="font-semibold text-ink">{right !== undefined ? `${Math.round(right)}%` : "—"}</b> of {stats.who} got this one right.
      </figcaption>
      <ul className="mt-2 grid gap-1.5" aria-label="How students answered">
        {keys.map((k) => {
          const v = stats.pct[k] ?? 0;
          const isAnswer = k === q.answer;
          const isPick = k === picked && !isAnswer;
          return (
            <li key={k} className="grid grid-cols-[1.4rem_1fr_2.6rem] items-center gap-2 text-xs">
              <span className={`text-center font-bold ${isAnswer ? "text-good" : isPick ? "text-bad" : "text-ink-3"}`}>{k}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-paper-2">
                <span
                  className={`anim-grow block h-full rounded-full ${isAnswer ? "bg-good" : isPick ? "bg-bad/80" : "bg-line-2"}`}
                  style={{ width: `${(100 * v) / max}%` }}
                />
              </span>
              <span className={`tabular text-right ${isAnswer ? "font-semibold text-good" : "text-ink-3"}`}>{Math.round(v)}%</span>
            </li>
          );
        })}
      </ul>
      {picked && picked !== q.answer && stats.pct[picked] !== undefined && (stats.pct[picked] ?? 0) >= 15 && (
        <p className="mt-2 text-xs text-ink-3">You're not alone: {Math.round(stats.pct[picked] ?? 0)}% picked {picked} too.</p>
      )}
    </figure>
  );
}
