import { ArrowRight, ChevronDown, Lock, RotateCcw, Unlock } from "lucide-react";
import { useState } from "react";
import { CHARTS } from "../lib/charts";
import { formatAverage, formatValue } from "../lib/format";
import { EVENTS, GRACE_POINTS, OUTCOME_COPY, RANKS, type EventId, type Profile } from "../lib/model";
import type { Plan } from "../lib/scoring";
import { usePlanner } from "../store/plannerStore";
import { Belt } from "./Belt";
import { Wordmark } from "./Header";
import { OUTCOME_COLOR } from "./OutcomeBadge";
import { draftToProfile, ProfilePicker, type ProfileDraft } from "./ProfilePicker";

const h3 = "m-0 font-display text-lg font-bold tracking-[0.12em] uppercase";

/** First visit. Starts blank on purpose so nobody gets scored on the wrong chart by tapping straight through. */
export function Onboarding() {
  const setProfile = usePlanner((s) => s.setProfile);
  const [draft, setDraft] = useState<ProfileDraft>({ age: null, gender: null, rank: null });
  const profile = draftToProfile(draft);

  return (
    <main className="flex min-h-dvh items-end justify-center min-[960px]:items-start min-[960px]:pt-[88px] min-[960px]:pb-12">
      <section
        aria-labelledby="onboarding-title"
        className="flex w-full flex-col gap-[18px] overflow-hidden rounded-t-xl border border-line bg-sheet px-5 pb-[max(22px,env(safe-area-inset-bottom))] shadow-[0_-24px_70px_rgb(0_0_0/0.65)] min-[960px]:w-[560px] min-[960px]:rounded-xl"
      >
        <Belt rank={draft.rank ?? "blue-brown"} variant="band" className="-mx-5 h-2.5" />
        <div className="flex flex-col gap-2">
          <Wordmark size="s" />
          <h2 id="onboarding-title" className="m-0 font-display text-[38px] leading-[0.95] font-extrabold text-balance uppercase">
            Let&rsquo;s plan your red stripe.
          </h2>
          <p className="m-0 text-[15px] leading-[22px] text-pretty text-ink-2">Three quick answers pick your scoring charts. You can change them any time.</p>
        </div>
        <ProfilePicker draft={draft} onChange={setDraft} />
        <button
          type="button"
          disabled={!profile}
          onClick={() => profile && setProfile(profile)}
          className="btn flex h-14 items-center justify-center gap-2.5 rounded-[12px] bg-stripe font-display text-[21px] font-extrabold tracking-[0.1em] text-white uppercase shadow-[0_10px_30px_-10px_rgb(219_34_43/0.8)] disabled:bg-surface-3 disabled:text-ink-3 disabled:shadow-none"
        >
          Build my plan <ArrowRight className="size-5" strokeWidth={2.8} aria-hidden="true" />
        </button>
        <p className="-mt-1.5 mb-0 text-center text-xs leading-[17px] text-ink-3">
          {profile ? "Saved on this device. No account, no sign-in." : "Pick your age, scoring chart and rank to continue."}
        </p>
      </section>
    </main>
  );
}

/** Settings sheet body: profile edits apply right away; reset asks first. */
export function SettingsPanel({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const setProfile = usePlanner((s) => s.setProfile);
  const locked = usePlanner((s) => s.locked);
  const unlockAll = usePlanner((s) => s.unlockAll);
  const reset = usePlanner((s) => s.reset);
  const [confirming, setConfirming] = useState(false);
  const anyLocked = Object.values(locked).some((v) => v !== null);

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-1">
        <h3 className={h3}>Profile</h3>
        <p className="m-0 text-[13px] leading-[18px] text-ink-3">Changes re-score everything right away. Locked numbers stay put.</p>
      </div>
      <ProfilePicker
        draft={profile}
        onChange={(d) => {
          const next = draftToProfile(d);
          if (next) setProfile(next);
        }}
      />
      <div className="h-px bg-surface-3" />
      <div className="flex flex-col gap-2.5">
        <h3 className={h3}>Your numbers</h3>
        <button
          type="button"
          disabled={!anyLocked}
          onClick={() => {
            unlockAll();
            onClose();
          }}
          className={`btn flex min-h-14 items-center justify-between gap-3 rounded-[12px] border border-line-strong bg-[#15171b] px-4 text-left text-[15px] font-semibold ${anyLocked ? "text-ink" : "text-[#5d6470]"}`}
        >
          <span className="flex flex-col gap-0.5">
            <span>Unlock all</span>
            <span className="text-xs font-normal text-ink-3">{anyLocked ? "Every event goes back to Auto." : "Nothing is locked right now."}</span>
          </span>
          <Unlock className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
        </button>
        {confirming ? (
          <div role="alertdialog" aria-label="Confirm reset" className="flex flex-col gap-3 rounded-[12px] border-[1.5px] border-retest bg-[#1a1012] px-4 py-3.5">
            <p className="m-0 text-sm leading-5">
              <strong>Reset everything?</strong> Your profile and numbers are cleared and you start from the first-visit setup. This can&rsquo;t be undone.
            </p>
            <div className="flex gap-2">
              <button type="button" autoFocus onClick={() => setConfirming(false)} className="btn h-11 flex-1 rounded-sm border border-line-strong bg-[#15171b] text-sm font-semibold">
                Keep my plan
              </button>
              <button type="button" onClick={reset} className="btn h-11 flex-1 rounded-sm bg-stripe text-sm font-bold text-white">
                Yes, reset
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="btn flex min-h-14 items-center justify-between gap-3 rounded-[12px] border border-[#7a2a2e] bg-[#1a1012] px-4 text-left text-[15px] font-semibold text-[#ff8a8f]"
          >
            <span className="flex flex-col gap-0.5">
              <span>Reset everything</span>
              <span className="text-xs font-normal text-ink-2">Clears your profile and all four numbers from this device.</span>
            </span>
            <RotateCcw className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="m-0 text-xs leading-[17px] text-ink-3">Everything is saved on this device only. There is no account and nothing is sent anywhere.</p>
    </div>
  );
}

/** Rules from the school's email, collapsed by default. */
export function HowItWorks() {
  return (
    <details className="group mx-5 mt-6 rounded-md border border-line bg-panel p-4 open:pb-5">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-display text-lg font-bold tracking-[0.12em] uppercase [&::-webkit-details-marker]:hidden">
        How the test is scored
        <ChevronDown className="size-5 transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-3 grid gap-6 text-sm leading-relaxed text-body min-[960px]:grid-cols-2">
        <div className="flex flex-col gap-3">
          <p className="m-0">
            The physical test starts at your Green/Blue red-stripe test and happens at every red-stripe test after that, in this order:{" "}
            <b className="text-ink">one-mile run</b>, <b className="text-ink">push-ups</b> (2 min), <b className="text-ink">squats</b> (2 min),{" "}
            <b className="text-ink">plank</b>.
          </p>
          <p className="m-0">
            Each event scores 0&ndash;100 points from the school&rsquo;s charts (the email calls these percentages). The run and push-ups have separate men&rsquo;s and women&rsquo;s charts by age, squats go by age, and
            the plank is the same for everyone. Your score is the <b className="text-ink">average of the four</b>, so a strong event can make up for a weak one.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <table className="w-full text-left">
            <thead className="font-display text-xs tracking-[0.15em] text-ink-3 uppercase">
              <tr>
                <th className="py-1 font-bold">Testing at</th>
                <th className="py-1 text-right font-bold">Average needed</th>
              </tr>
            </thead>
            <tbody>
              {RANKS.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="py-1.5">
                    <span className="flex items-center gap-2">
                      <Belt rank={r.id} className="h-3 w-10" stripe={false} /> {r.label}
                    </span>
                  </td>
                  <td className="py-1.5 text-right font-display text-lg font-bold">{r.required}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            <li>
              <b className="text-pass">Pass</b>: you meet the average.
            </li>
            <li>
              <b className="text-conditional">Within {GRACE_POINTS} points</b>: you get the stripe, but retest at your first stripe test at the next rank.
            </li>
            <li>
              <b className="text-retest">More than {GRACE_POINTS} short</b>: retake the physical test in one month.
            </li>
          </ul>
        </div>
      </div>
      <p className="mt-4 mb-0 text-xs text-ink-3">
        Charts converted from the school&rsquo;s scoring spreadsheets ({CHARTS.generated}). Always confirm with your instructor.
      </p>
    </details>
  );
}

/** Phones: the score, pinned to the top while you scroll. (960px and up shows the full dial instead.) */
export function MiniScore({ plan }: { plan: Plan }) {
  const color = OUTCOME_COLOR[plan.outcome];
  const best = plan.status === "impossible";
  return (
    <section
      aria-label="Your score"
      className="sticky top-0 z-30 mt-3 border-y border-line bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur min-[960px]:hidden"
    >
      <div className="flex h-14 items-center gap-3 px-5">
        <span aria-hidden="true" className="size-3 flex-none rounded-full" style={{ backgroundColor: color }} />
        <span className="font-display text-3xl font-extrabold tabular">
          {best && <span className="text-base text-ink-3 uppercase">Best{" "}</span>}
          {formatAverage(plan.average)}%
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-display text-sm font-bold tracking-[0.12em] uppercase" style={{ color }}>
            {OUTCOME_COPY[plan.outcome].label}
          </span>
          <span className="truncate text-xs text-ink-3 tabular">
            {plan.totalPoints} / {plan.requiredTotal} pts needed
          </span>
        </span>
      </div>
    </section>
  );
}

/** One-time tip shown the first time an event gets locked. */
export function LockTip({ event, value, onClose }: { event: EventId; value: number; onClose: () => void }) {
  const meta = EVENTS[event];
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        role="status"
        className="tip-in pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-md border border-line-strong bg-surface-2 p-3.5 shadow-[0_12px_40px_rgb(0_0_0/0.6)]"
      >
        <Lock className="mt-0.5 size-5 flex-none text-locked" strokeWidth={2.4} aria-hidden="true" />
        <p className="m-0 flex-1 text-sm leading-5 text-body">
          <strong className="text-ink">
            {meta.short} locked at {formatValue(event, value)}
            {meta.kind === "reps" ? " reps" : ""}.
          </strong>{" "}
          It stays put while the other events rebalance. Tap <b className="text-ink">LOCKED</b> on its card to let it float again.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="btn h-11 flex-none rounded-sm border border-line-strong bg-transparent px-3 font-display text-[15px] font-bold tracking-[0.1em] uppercase"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
