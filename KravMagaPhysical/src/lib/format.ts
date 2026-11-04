import { EVENTS, type EventId } from "./model";

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatValue(event: EventId, value: number): string {
  return EVENTS[event].kind === "time" ? formatTime(value) : String(Math.round(value));
}

export function unitLabel(event: EventId): string {
  return EVENTS[event].kind === "time" ? "" : "reps";
}

/** Spoken form for screen readers: "8 minutes 40 seconds" / "55 reps". */
export function spokenValue(event: EventId, value: number): string {
  if (EVENTS[event].kind === "reps") return `${Math.round(value)} reps`;
  const s = Math.max(0, Math.round(value));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const parts = [];
  if (m) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  if (sec || !m) parts.push(`${sec} second${sec === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/**
 * Parse what someone types into a value box.
 * Times: "8:40", "8.40", "8 40" -> m:ss; a bare number under 30 is minutes ("9" -> 9:00),
 * otherwise seconds ("135" -> 2:15). Reps: whole numbers.
 */
export function parseValue(event: EventId, text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  if (EVENTS[event].kind === "reps") {
    if (!/^\d{1,3}$/.test(t)) return null;
    return Number(t);
  }
  const mss = /^(\d{1,2})\s*[:.\s]\s*(\d{1,2})$/.exec(t);
  if (mss) {
    const m = Number(mss[1]);
    const s = Number(mss[2]);
    if (s >= 60) return null;
    return m * 60 + s;
  }
  if (/^\d{1,4}$/.test(t)) {
    const n = Number(t);
    return n < 30 ? n * 60 : n;
  }
  return null;
}

export function formatAverage(avg: number): string {
  return Number.isInteger(avg) ? String(avg) : avg.toFixed(2).replace(/0$/, "");
}
