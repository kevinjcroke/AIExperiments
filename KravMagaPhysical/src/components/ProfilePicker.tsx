import { Check, Minus, Plus } from "lucide-react";
import { useId, useState } from "react";
import { ageBracketLabels } from "../lib/charts";
import { CHART_LABEL, MAX_AGE, MIN_AGE, RANKS, type Gender, type Profile, type RankId } from "../lib/model";
import { Belt } from "./Belt";

/** A profile that may still be incomplete (first visit starts blank so nobody lands on the wrong chart). */
export interface ProfileDraft {
  age: number | null;
  gender: Gender | null;
  rank: RankId | null;
}

export function draftToProfile(d: ProfileDraft): Profile | null {
  if (d.age === null || d.gender === null || d.rank === null) return null;
  return { age: d.age, gender: d.gender, rank: d.rank };
}

const clampAge = (n: number) => Math.max(MIN_AGE, Math.min(MAX_AGE, n));
const legend = "mb-2 p-0 font-display text-sm font-bold tracking-[0.16em] text-ink-2 uppercase";
const stepBtn = "btn flex size-[52px] items-center justify-center rounded-[12px] border border-line-strong bg-control";

export function ProfilePicker({ draft, onChange }: { draft: ProfileDraft; onChange: (d: ProfileDraft) => void }) {
  const uid = useId();
  const [ageText, setAgeText] = useState<string | null>(null);
  const set = (patch: Partial<ProfileDraft>) => onChange({ ...draft, ...patch });
  const brackets = draft.age === null ? null : ageBracketLabels(draft.age);

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-2">
        <label htmlFor={`${uid}-age`} className="font-display text-sm font-bold tracking-[0.16em] text-ink-2 uppercase">
          Age on test day
        </label>
        <div className="flex items-center gap-2.5">
          <button type="button" aria-label="One year younger" onClick={() => set({ age: clampAge((draft.age ?? 31) - 1) })} className={stepBtn}>
            <Minus className="size-5" strokeWidth={2.6} aria-hidden="true" />
          </button>
          <input
            id={`${uid}-age`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="--"
            value={ageText ?? (draft.age === null ? "" : String(draft.age))}
            aria-describedby={`${uid}-age-hint`}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
              setAgeText(raw);
              const n = parseInt(raw, 10);
              if (!Number.isNaN(n) && n >= MIN_AGE) set({ age: clampAge(n) });
            }}
            onBlur={() => setAgeText(null)}
            className="h-[52px] w-24 rounded-[12px] border-2 border-locked-line bg-bg text-center font-display text-[32px] font-extrabold tabular outline-none focus:border-ink"
          />
          <button type="button" aria-label="One year older" onClick={() => set({ age: clampAge((draft.age ?? 29) + 1) })} className={stepBtn}>
            <Plus className="size-5" strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
        <p id={`${uid}-age-hint`} className="m-0 text-xs leading-[17px] text-ink-3">
          {brackets ? `Your charts: mile ${brackets.mile} · push-ups and squats ${brackets.reps}.` : `Ages ${MIN_AGE}–${MAX_AGE}. Picks your age column on the charts.`}
        </p>
      </div>

      <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
        <legend className={legend}>Scoring chart</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["male", "female"] as const).map((g) => {
            const on = draft.gender === g;
            return (
              <label key={g} className="relative block">
                <input type="radio" className="radio" name={`${uid}-gender`} value={g} checked={on} onChange={() => set({ gender: g })} />
                <span
                  className={`choice flex h-[52px] items-center justify-center gap-2 rounded-[12px] font-display text-xl font-bold tracking-[0.08em] uppercase ${
                    on ? "border-2 border-ink bg-ink text-bg" : "border border-line-strong bg-[#16181c] text-ink"
                  }`}
                >
                  {on && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
                  {CHART_LABEL[g]}
                </span>
              </label>
            );
          })}
        </div>
        <p className="m-0 text-xs leading-[17px] text-ink-3">
          Use the chart your instructor tests you on. It sets your mile and push-up targets; squats and the plank are the same either way.
        </p>
      </fieldset>

      <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
        <legend className={legend}>Testing at</legend>
        <div className="grid grid-cols-2 gap-2">
          {RANKS.map((r) => {
            const on = draft.rank === r.id;
            return (
              <label key={r.id} className="relative block">
                <input type="radio" className="radio" name={`${uid}-rank`} value={r.id} checked={on} onChange={() => set({ rank: r.id })} />
                <span
                  className={`choice flex min-h-24 flex-col gap-[9px] rounded-[12px] p-3 ${on ? "border-2 border-stripe-hot bg-[#1f1416]" : "border border-line-strong bg-[#16181c]"}`}
                >
                  <Belt rank={r.id} className="h-3" />
                  <span className="font-display text-lg leading-[1.05] font-bold tracking-[0.04em] uppercase">{r.label}</span>
                  <span className={`flex items-center justify-between gap-1.5 text-[13px] ${on ? "text-[#ff8a8f]" : "text-ink-2"}`}>
                    <span>
                      <span className="font-display text-lg font-extrabold">{r.required}%</span> average
                    </span>
                    {on && <Check className="size-[18px] text-stripe-text" strokeWidth={3} aria-hidden="true" />}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
