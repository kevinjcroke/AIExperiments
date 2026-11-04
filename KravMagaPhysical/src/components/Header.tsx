import { Pencil, SlidersHorizontal, Table2 } from "lucide-react";
import { rankById, type Profile } from "../lib/model";
import { Belt } from "./Belt";

export function Wordmark({ size = "l" }: { size?: "s" | "l" }) {
  const small = size === "s";
  return (
    <span
      className={`flex items-center gap-2 font-display leading-none font-extrabold tracking-[0.02em] text-ink uppercase italic ${small ? "text-lg" : "text-[27px]"}`}
    >
      <span>Red Stripe</span>
      <span className={`slant bg-stripe text-white ${small ? "py-0.5 pr-[9px] pl-[7px]" : "py-[5px] pr-[13px] pl-[11px]"}`}>Ready</span>
    </span>
  );
}

const iconBtn =
  "btn flex h-11 min-w-11 items-center justify-center gap-2 rounded-[12px] border border-line-strong bg-[#15171b] px-3 font-display text-[15px] font-bold tracking-[0.1em] uppercase";

/** Belt band, wordmark + actions, and the "testing at" strip with the profile. */
export function Header({ profile, onOpenChart, onOpenSettings }: { profile: Profile; onOpenChart: () => void; onOpenSettings: () => void }) {
  const rank = rankById(profile.rank);
  const gender = profile.gender === "female" ? "Female" : "Male";
  return (
    <header className="flex flex-col gap-3.5 pt-[env(safe-area-inset-top)]">
      <Belt rank={profile.rank} variant="band" className="h-3" />

      <div className="flex flex-wrap items-center justify-between gap-3 px-5">
        <h1 className="m-0">
          <Wordmark />
        </h1>
        <div className="flex gap-2">
          <button type="button" onClick={onOpenChart} aria-label="Scoring chart" className={iconBtn}>
            <Table2 className="size-5" strokeWidth={2.2} aria-hidden="true" />
            <span className="hidden min-[960px]:inline">Scoring chart</span>
          </button>
          <button type="button" onClick={onOpenSettings} aria-label="Settings" className={iconBtn}>
            <SlidersHorizontal className="size-5" strokeWidth={2.2} aria-hidden="true" />
            <span className="hidden min-[960px]:inline">Settings</span>
          </button>
        </div>
      </div>

      <div className="mx-5 flex flex-wrap items-center gap-x-[18px] gap-y-3 rounded-md border border-line bg-panel px-3.5 py-3">
        <div className="flex min-w-0 flex-[1_1_190px] items-center gap-3">
          <Belt rank={profile.rank} className="h-4 w-[46px] flex-none" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-display text-xs font-bold tracking-[0.18em] text-ink-3 uppercase">Testing at</span>
            <span className="font-display text-[22px] leading-none font-bold tracking-[0.04em] whitespace-nowrap uppercase">{rank.label}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[34px] leading-none font-extrabold text-stripe-text tabular">{rank.required}%</span>
          <span className="font-display text-[13px] font-bold tracking-[0.12em] text-ink-2 uppercase">avg needed</span>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={`Change profile. Age ${profile.age}, ${gender.toLowerCase()}, testing at ${rank.label}.`}
          className="btn flex min-h-11 flex-[1_1_100%] items-center gap-2 rounded-sm text-left"
        >
          <span className="inline-flex h-8 items-center rounded-full border border-line-strong bg-control px-3 text-sm font-semibold">Age {profile.age}</span>
          <span className="inline-flex h-8 items-center rounded-full border border-line-strong bg-control px-3 text-sm font-semibold">{gender}</span>
          <span className="ml-auto inline-flex h-8 items-center gap-1.5 px-2.5 font-display text-[15px] font-bold tracking-[0.1em] text-[#ff8a8f] uppercase">
            <Pencil className="size-[15px]" strokeWidth={2.4} aria-hidden="true" />
            Change
          </span>
        </button>
      </div>
    </header>
  );
}
