import { Fragment, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { computeHints } from "../lib/hints";
import { clearHighlights, highlightPhrases } from "../lib/highlight";
import { GENRE_LABEL, sourceLabel } from "../lib/labels";
import type { Passage, Question } from "../lib/types";
import { Chip } from "./ui";

interface Props {
  passage: Passage;
  question: Question;
  /** Scroll container for the passage (the panel on desktop, the page on phones). */
  scrollParent?: () => HTMLElement | null;
  active: boolean;
}

export function PassageView({ passage, question, scrollParent, active }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const hints = useMemo(() => computeHints(question, passage), [question, passage]);
  const refLines = useMemo(() => new Set(hints.lines), [hints]);
  const refParas = useMemo(() => new Set(hints.paragraphs), [hints]);

  // Word highlights + scroll to whatever the question points at.
  useLayoutEffect(() => {
    const root = bodyRef.current;
    if (!root || !active) return;
    const focus = [...root.querySelectorAll<HTMLElement>(".is-ref")];
    const range = highlightPhrases(root, hints.phrases, focus);
    const target: Element | null = focus[0] ?? (range ? range.startContainer.parentElement : null);
    if (target) {
      const parent = scrollParent?.();
      const rect = target.getBoundingClientRect();
      const scrollable = !!parent && /(auto|scroll)/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight + 1;
      if (parent && scrollable) {
        const prect = parent.getBoundingClientRect();
        const top = parent.scrollTop + rect.top - prect.top - prect.height * 0.3;
        parent.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      } else if (rect.top < 80 || rect.bottom > window.innerHeight - 40) {
        window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight * 0.3, behavior: "smooth" });
      }
    }
  }, [hints, active, scrollParent]);

  useEffect(() => clearHighlights, []);

  return (
    <article aria-label={`Passage: ${passage.title}`} className="passage-card">
      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="reading">{GENRE_LABEL[passage.genre]}</Chip>
          <span className="text-xs text-ink-3">{sourceLabel(passage.source)}</span>
        </div>
        <h2 className="mt-3 font-display text-[1.6rem] leading-tight font-semibold text-balance">{passage.title}</h2>
        {(passage.author || passage.byline) && <p className="mt-1 text-sm font-medium text-ink-2">{passage.byline ?? `by ${passage.author}`}</p>}
        {passage.intro && <p className="mt-3 rounded-xl bg-paper-2 px-4 py-3 text-sm leading-relaxed text-ink-2 italic">{passage.intro}</p>}
      </header>

      <div ref={bodyRef} className={`passage ${passage.format === "lines" || (passage.format === "paragraphs" && passage.paragraphNumbered) ? "pl-10" : ""}`}>
        {passage.format === "lines" ? (
          passage.flow ? (
            <FlowLines passage={passage} refs={refLines} />
          ) : (
            <Lines passage={passage} refs={refLines} />
          )
        ) : (
          passage.paragraphs.map((html, i) => (
            <div
              key={i}
              className={`para ${refParas.has(i + 1) ? "is-ref" : ""}`}
              data-n={passage.paragraphNumbered ? i + 1 : undefined}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ))
        )}
      </div>

      {passage.footnotes.length > 0 && (
        <ol className="mt-6 space-y-1 border-t border-line pt-4 text-sm text-ink-2" data-nohint>
          {passage.footnotes.map((f) => (
            <li key={f.mark} className="flex gap-2">
              <span className="w-4 shrink-0 text-right font-semibold text-ink-3">{f.mark}</span>
              <span>{f.text.replace(/ -- /g, " — ")}</span>
            </li>
          ))}
        </ol>
      )}
      {passage.credit && <p className="mt-4 text-xs text-ink-3" data-nohint>{passage.credit}</p>}
    </article>
  );
}

function Lines({ passage, refs }: { passage: Extract<Passage, { format: "lines" }>; refs: Set<number> }) {
  const gaps = useMemo(() => new Set(passage.stanzaBreaksAfter), [passage]);
  return (
    <>
      {passage.lines.map((line, i) => {
        const n = i + 1;
        const show = n % 5 === 0 || refs.has(n);
        const indent = passage.indent[String(n)] ?? 0;
        return (
          <div
            key={i}
            className={`ln ${gaps.has(n) ? "gap" : ""} ${refs.has(n) ? "is-ref" : ""}`}
            data-num={show ? n : undefined}
            style={indent ? ({ "--indent": indent } as React.CSSProperties) : undefined}
          >
            {line || " "}
          </div>
        );
      })}
    </>
  );
}

/**
 * Prose printed with numbered lines, reflowed to fit the screen. Each printed line is an inline span;
 * its number sits in the margin beside the screen line where the printed line begins.
 */
function FlowLines({ passage, refs }: { passage: Extract<Passage, { format: "lines" }>; refs: Set<number> }) {
  const paragraphs = useMemo(() => {
    const ends = [...passage.stanzaBreaksAfter.filter((n) => n < passage.lines.length), passage.lines.length];
    const out: number[][] = [];
    let start = 1;
    for (const end of ends) {
      if (end < start) continue;
      out.push(Array.from({ length: end - start + 1 }, (_, i) => start + i));
      start = end + 1;
    }
    return out;
  }, [passage]);
  return (
    <>
      {paragraphs.map((nums) => (
        <div key={nums[0]} className="para flow">
          {nums.map((n, j) => {
            const prev = j > 0 ? passage.lines[n - 2]! : "";
            // A printed line that ends in a dash runs straight into the next one.
            const gap = j > 0 && !/[—–]$/.test(prev) ? " " : "";
            const show = n % 5 === 0 || refs.has(n);
            return (
              <Fragment key={n}>
                {gap}
                <span className={`fl ${refs.has(n) ? "is-ref" : ""}`} data-num={show ? n : undefined}>
                  {passage.lines[n - 1]}
                </span>
              </Fragment>
            );
          })}
        </div>
      ))}
    </>
  );
}
