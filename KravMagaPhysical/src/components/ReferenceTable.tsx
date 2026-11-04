import { useState } from "react";
import { ageBracketLabels } from "../lib/charts";
import { formatTime } from "../lib/format";
import { CHART_LABEL, EVENT_IDS, EVENTS, type EventId, type Profile } from "../lib/model";
import { MAX_POINTS, type Plan } from "../lib/scoring";

const RULE: Record<EventId, string> = { mile: "at or under", pushups: "at least", squats: "at least", plank: "at least" };

/** All four of this person's charts side by side: the school's spreadsheets, readable. */
export function ReferenceTable({ plan, profile, highlight }: { plan: Plan; profile: Profile; highlight: EventId | null }) {
  const [every, setEvery] = useState<1 | 5>(5);
  const req = plan.required;
  const b = ageBracketLabels(profile.age);
  const profileText = `Age ${profile.age} · ${CHART_LABEL[profile.gender]} charts · mile ${b.mile} · push-ups and squats ${b.reps}`;

  const cellText = (id: EventId, p: number): string | null => {
    const v = plan.events[id].table.bracket.values[p];
    if (v === null || v === undefined || v < 0) return null;
    return EVENTS[id].kind === "time" ? formatTime(v) : String(v);
  };

  const rows: number[] = [];
  for (let p = MAX_POINTS; p >= 0; p -= every) rows.push(p);

  const floor = (id: EventId) => plan.events[id].floor;
  const toggle = (on: boolean) =>
    `btn h-[38px] rounded-[8px] px-3 font-display text-sm font-bold tracking-[0.08em] uppercase ${on ? "bg-ink text-bg" : "bg-transparent text-ink-2"}`;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <p className="m-0 text-[13px] leading-[18px] text-ink-2">{profileText}</p>
        <div role="group" aria-label="Rows to show" className="flex gap-[3px] rounded-sm border border-line bg-surface-2 p-[3px]">
          <button type="button" aria-pressed={every === 5} onClick={() => setEvery(5)} className={toggle(every === 5)}>
            Every 5 pts
          </button>
          <button type="button" aria-pressed={every === 1} onClick={() => setEvery(1)} className={toggle(every === 1)}>
            Every point
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs leading-4 text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-[18px] rounded-[3px] bg-stripe/22 shadow-[inset_3px_0_0_#ff3b44]" />
          Required: {req} pts
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-[18px] rounded-[3px] border-[1.5px] border-locked" />
          Your locked number
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-[18px] rounded-[3px] border-[1.5px] border-dashed border-auto" />
          What Auto needs
        </span>
      </div>

      <div className="overflow-clip rounded-[12px] border border-line bg-[#111316] tabular">
        <table className="w-full table-fixed border-collapse" aria-label={`Points for each value on your charts. ${profileText}`}>
          <colgroup>
            <col className="w-16" />
            <col span={4} />
          </colgroup>
          <thead className="sticky top-0 z-[1] bg-surface-2">
            <tr className="border-b border-line">
              <th scope="col" className="py-2.5 pr-1 pl-3 text-left align-bottom font-display text-[13px] font-bold tracking-[0.12em] uppercase">
                Pts
              </th>
              {EVENT_IDS.map((id) => (
                <th key={id} scope="col" className="px-0.5 pt-2.5 pb-2 text-center align-bottom">
                  <span
                    className={`block font-display text-[13px] font-bold tracking-[0.1em] uppercase ${highlight === id ? "text-stripe-text underline decoration-2 underline-offset-4" : ""}`}
                  >
                    {EVENTS[id].short}
                  </span>
                  <span className="block text-[11px] leading-[14px] font-normal text-ink-3">{RULE[id]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const isReq = p === req;
              return (
                <tr
                  key={p}
                  className="border-t border-control"
                  style={{
                    background: isReq ? "rgb(219 34 43 / 0.16)" : p % 10 === 0 ? "#111316" : "#14161a",
                    boxShadow: isReq ? "inset 3px 0 0 #ff3b44" : undefined,
                  }}
                >
                  <th scope="row" className={`py-0 pr-1 pl-3 text-left font-display text-[19px] font-extrabold whitespace-nowrap ${isReq ? "text-[#ff8a8f]" : ""}`}>
                    {p}
                    {isReq && <span className="ml-1.5 rounded-[3px] bg-stripe px-1 py-px align-middle text-[10px] tracking-[0.08em] text-white">REQ</span>}
                  </th>
                  {EVENT_IDS.map((id) => {
                    const e = plan.events[id];
                    const mine = e.points - (e.points % every) === p;
                    const text = cellText(id, p);
                    const auto = mine && !e.locked;
                    return (
                      <td key={id} className="p-[3px]">
                        <span
                          className={`flex h-[30px] items-center justify-center rounded-[6px] font-display text-lg ${mine ? "font-extrabold" : "font-semibold"}`}
                          style={{
                            border: mine ? (auto ? "1.5px dashed #43d9f5" : "1.5px solid #e9e5de") : "1.5px solid transparent",
                            background: mine ? (auto ? "rgb(67 217 245 / 0.12)" : "rgb(233 229 222 / 0.1)") : "transparent",
                            color: text === null ? "#8a909b" : mine ? (auto ? "#7fe6fa" : "#fff") : "#d9d6d0",
                          }}
                        >
                          {text ?? "—"}
                          {mine && <span className="sr-only"> ({auto ? "what Auto needs" : "your locked number"})</span>}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="m-0 flex list-disc flex-col gap-1 pl-4 text-xs leading-[17px] text-ink-3">
        <li>Mile: run at or under the time shown. Reps and plank: do at least the number shown.</li>
        <li>
          &mdash; means the chart has no value there: 0 push-ups already scores {floor("pushups")}, 0 squats scores {floor("squats")}, and a 0:00 plank
          scores {floor("plank")}.
        </li>
        <li>Every event is capped at 100. Scores are whole points; between two rows you get the lower one.</li>
      </ul>
    </div>
  );
}
