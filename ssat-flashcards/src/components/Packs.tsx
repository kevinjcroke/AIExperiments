import { useRef, useState } from "react";
import { PackError, parsePack, type Pack } from "../lib/packs";
import { sanitizeHtml } from "../lib/sanitize";
import { Book, Check, Cross, Sigma } from "./Icons";

interface Props {
  packs: Pack[];
  /** Throws PackError when the browser can't save it. */
  onAdd: (p: Pack) => void;
  onRemove: (id: string) => void;
}

const MAX_BYTES = 8_000_000;

/** Add, list and remove private question packs. */
export function Packs({ packs, onAdd, onRemove }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  async function load(file: File) {
    setBusy(true);
    setMsg(null);
    try {
      if (file.size > MAX_BYTES) throw new PackError("That file is too big to be a question pack.");
      let raw: unknown;
      try {
        raw = JSON.parse(await file.text());
      } catch {
        throw new PackError("That file isn't an Upper Hand question pack.");
      }
      const pack = parsePack(raw, sanitizeHtml);
      const replacing = packs.some((p) => p.id === pack.id);
      onAdd(pack);
      const m = pack.questions.filter((q) => q.subject === "math").length;
      setMsg({ ok: true, text: `${replacing ? "Updated" : "Added"} ${pack.name}: ${m} math and ${pack.questions.length - m} reading cards.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof PackError ? e.message : "Couldn't read that file." });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const picker = (
    <input
      ref={input}
      type="file"
      accept=".json,application/json"
      className="sr-only"
      tabIndex={-1}
      aria-hidden
      onChange={(e) => {
        const f = e.currentTarget.files?.[0];
        if (f) void load(f);
      }}
    />
  );
  const addButton = (label: string, cls: string) => (
    <button type="button" disabled={busy} onClick={() => input.current?.click()} className={cls}>
      {busy ? "Reading…" : label}
    </button>
  );
  const message = msg && (
    <p role="status" className={`mt-3 inline-flex items-start gap-1.5 text-sm ${msg.ok ? "text-good" : "text-bad"}`}>
      {msg.ok ? <Check size={16} className="mt-0.5 shrink-0" /> : <Cross size={16} className="mt-0.5 shrink-0" />}
      {msg.text}
    </p>
  );

  if (packs.length === 0) {
    return (
      <section className="mt-12 text-sm text-ink-3" aria-label="Question packs">
        <p>
          Have an Upper Hand question pack (for example, a practice test you own)? Add it here. It's saved only in this browser.{" "}
          {addButton("Add a question pack", "font-semibold text-ink-2 underline underline-offset-2 disabled:opacity-60")}
        </p>
        {picker}
        {message}
      </section>
    );
  }

  return (
    <section className="mt-12" aria-labelledby="packs-h">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="packs-h" className="font-display text-2xl font-semibold">
            Your question packs
          </h2>
          <p className="mt-1 text-sm text-ink-3">Saved only in this browser. They aren't part of the public site, so add them again on another device.</p>
        </div>
        {addButton(
          "Add another pack",
          "rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold text-ink-2 hover:border-line-2 hover:text-ink disabled:opacity-60",
        )}
      </div>
      {picker}
      {message}
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {packs.map((p) => {
          const m = p.questions.filter((q) => q.subject === "math").length;
          const r = p.questions.length - m;
          return (
            <li key={p.id} className="rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-card)]">
              <p className="font-semibold">{p.name}</p>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                <span className="inline-flex items-center gap-1.5">
                  <Sigma size={15} className="text-math" /> {m} math
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Book size={15} className="text-reading" /> {r} reading · {p.passages.length} passages
                </span>
              </p>
              {p.note && <p className="mt-2 text-xs text-ink-3">{p.note}</p>}
              <div className="mt-3 text-sm">
                {confirm === p.id ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <span className="text-ink-2">Remove it? Your progress on its cards is kept.</span>
                    <button
                      type="button"
                      className="rounded-full bg-bad px-3 py-1 font-semibold text-white"
                      onClick={() => {
                        try {
                          onRemove(p.id);
                          setMsg(null);
                        } catch (e) {
                          setMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't remove it." });
                        }
                        setConfirm(null);
                      }}
                    >
                      Remove
                    </button>
                    <button type="button" className="rounded-full border border-line px-3 py-1 font-semibold text-ink-2" onClick={() => setConfirm(null)}>
                      Keep
                    </button>
                  </span>
                ) : (
                  <button type="button" className="font-semibold text-ink-3 underline underline-offset-2 hover:text-ink" onClick={() => setConfirm(p.id)}>
                    Remove pack
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
