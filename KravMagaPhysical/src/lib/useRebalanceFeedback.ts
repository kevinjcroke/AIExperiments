import { useEffect, useRef, useState } from "react";
import { formatAverage, spokenValue } from "./format";
import { EVENT_IDS, EVENTS, OUTCOME_COPY, type EventId } from "./model";
import type { Plan } from "./scoring";

/** How long the "N pts easier" chips stay after the last change. */
const CHIP_MS = 1400;
/** Announce once things settle, so a slider drag isn't read out step by step. */
const ANNOUNCE_MS = 700;

export interface RebalanceFeedback {
  /** Auto events that moved since the burst of changes began (negative = easier). */
  moved: Partial<Record<EventId, number>>;
  /** Bumps on every change so the wash and chip animations replay. */
  tick: number;
  /** Text for the polite live region. */
  announce: string;
}

/**
 * Watches the plan for rebalances. Changes that come in quick succession (a slider drag, a held
 * +/- button) count as one burst, so the chips show the total move, not the last step.
 */
export function useRebalanceFeedback(plan: Plan): RebalanceFeedback {
  const prev = useRef(plan);
  const baseline = useRef<Plan | null>(null);
  const timers = useRef<{ clear?: number; say?: number }>({});
  const [state, setState] = useState<RebalanceFeedback>({ moved: {}, tick: 0, announce: "" });

  useEffect(() => {
    const before = prev.current;
    prev.current = plan;
    if (before === plan) return;

    baseline.current ??= before;
    const base = baseline.current;
    const moved: Partial<Record<EventId, number>> = {};
    for (const id of EVENT_IDS) {
      const e = plan.events[id];
      const d = e.points - base.events[id].points;
      if (!e.locked && d !== 0) moved[id] = d;
    }
    setState((s) => ({ ...s, moved, tick: s.tick + 1 }));

    window.clearTimeout(timers.current.clear);
    timers.current.clear = window.setTimeout(() => {
      baseline.current = null;
      setState((s) => ({ ...s, moved: {} }));
    }, CHIP_MS);

    window.clearTimeout(timers.current.say);
    timers.current.say = window.setTimeout(() => {
      const said = (Object.keys(moved) as EventId[]).map((id) => `${EVENTS[id].short} now needs ${spokenValue(id, plan.events[id].value)}`);
      said.push(`Average ${formatAverage(plan.average)} percent, ${OUTCOME_COPY[plan.outcome].label.toLowerCase()}`);
      setState((s) => ({ ...s, announce: `${said.join(". ")}.` }));
    }, ANNOUNCE_MS);
  }, [plan]);

  useEffect(() => {
    const t = timers.current;
    return () => {
      window.clearTimeout(t.clear);
      window.clearTimeout(t.say);
    };
  }, []);

  return state;
}
