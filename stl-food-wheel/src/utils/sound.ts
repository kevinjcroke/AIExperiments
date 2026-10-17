/**
 * Web Audio synth — no audio files.
 *
 * - The AudioContext is created lazily inside `unlockAudio()` (call it from a user
 *   gesture; iOS Safari requires both creation/resume inside the gesture).
 * - Every voice routes through a single master GainNode controlled by `setMuted`.
 * - `playTick` / `playWin` are silent no-ops until the context is unlocked.
 */

type AudioCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let muted = false;

const MASTER_LEVEL = 0.8;

function getCtor(): AudioCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export async function unlockAudio(): Promise<void> {
  if (!ctx) {
    const Ctor = getCtor();
    if (!Ctor) return;
    try {
      ctx = new Ctor();
    } catch {
      ctx = null;
      return;
    }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_LEVEL;
    master.connect(ctx.destination);

    // One short white-noise burst, generated once and reused for every tick.
    const len = Math.max(1, Math.floor(ctx.sampleRate * 0.05));
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    // iOS: play a silent 1-sample buffer inside the gesture to fully unlock output.
    try {
      const silent = ctx.createBufferSource();
      silent.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      silent.connect(ctx.destination);
      silent.start(0);
      silent.onended = () => silent.disconnect();
    } catch {
      /* ignore */
    }
  }
  if (ctx.state !== "running") {
    try {
      await ctx.resume();
    } catch {
      /* resume can reject if not in a gesture; a later unlock call will retry */
    }
  }
}

function ready(): { ctx: AudioContext; master: GainNode } | null {
  if (!ctx || !master || muted || ctx.state !== "running") return null;
  return { ctx, master };
}

export function playTick(): void {
  const r = ready();
  if (!r || !noise) return;
  const { ctx: c, master: out } = r;
  const t = c.currentTime;

  const src = c.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.85 + Math.random() * 0.3;

  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2500 * (0.9 + Math.random() * 0.2);
  bp.Q.value = 3;

  const g = c.createGain();
  const peak = 0.55 + Math.random() * 0.2;
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

  src.connect(bp);
  bp.connect(g);
  g.connect(out);
  src.start(t);
  src.stop(t + 0.04);
  src.onended = () => {
    src.disconnect();
    bp.disconnect();
    g.disconnect();
  };
}

export function playWin(): void {
  const r = ready();
  if (!r) return;
  const { ctx: c, master: out } = r;
  const t0 = c.currentTime + 0.01;

  // C5, E5, G5 arpeggio, then the C6 chord (with the triad sustaining underneath).
  const C5 = 523.25;
  const E5 = 659.25;
  const G5 = 783.99;
  const C6 = 1046.5;
  const step = 0.11;
  const end = t0 + 1.2;

  const notes: { f: number; at: number; level: number }[] = [
    { f: C5, at: t0, level: 0.22 },
    { f: E5, at: t0 + step, level: 0.2 },
    { f: G5, at: t0 + step * 2, level: 0.2 },
    { f: C6, at: t0 + step * 3, level: 0.24 },
  ];

  const bus = c.createGain();
  bus.gain.value = 0.7;
  bus.connect(out);
  const nodes: AudioNode[] = [bus];

  for (const note of notes) {
    for (const [type, mul] of [
      ["triangle", 1],
      ["sine", 0.6],
    ] as const) {
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.value = type === "sine" ? note.f * 2 : note.f;
      const g = c.createGain();
      const lvl = note.level * mul;
      g.gain.setValueAtTime(0.0001, note.at);
      g.gain.exponentialRampToValueAtTime(lvl, note.at + 0.02);
      g.gain.setTargetAtTime(lvl * 0.55, note.at + 0.05, 0.15);
      g.gain.setTargetAtTime(0.0001, end - 0.35, 0.09);
      osc.connect(g);
      g.connect(bus);
      osc.start(note.at);
      osc.stop(end);
      nodes.push(osc, g);
    }
  }

  // Clean up the whole voice graph once it has finished.
  const last = nodes[nodes.length - 2] as OscillatorNode | undefined;
  if (last) {
    last.onended = () => {
      for (const n of nodes) n.disconnect();
    };
  }
}

export function setMuted(m: boolean): void {
  muted = m;
  if (ctx && master) {
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setTargetAtTime(m ? 0 : MASTER_LEVEL, t, 0.015);
  }
}
