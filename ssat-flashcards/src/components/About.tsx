import type { Ref } from "react";
import type { Pack } from "../lib/packs";
import type { Deck } from "../lib/types";
import { Cross } from "./Icons";

export function About({ ref, deck, packs }: { ref: Ref<HTMLDialogElement>; deck: Deck; packs: Pack[] }) {
  const naep = deck.questions.filter((q) => q.source.test === "NAEP").length;
  const mcas = deck.questions.filter((q) => q.source.test === "MCAS").length;
  return (
    <dialog
      ref={ref}
      className="m-auto w-[min(680px,calc(100vw-24px))] max-h-[min(86dvh,820px)] rounded-[var(--radius-card)] border border-line bg-card p-0 text-ink shadow-[var(--shadow-lift)] backdrop:bg-[rgb(20_22_27/0.55)] backdrop:backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className="sticky top-0 flex items-center justify-between border-b border-line bg-card px-6 py-4">
        <h2 className="font-display text-xl font-semibold">Where these questions come from</h2>
        <form method="dialog">
          <button className="grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-paper-2" aria-label="Close">
            <Cross size={18} />
          </button>
        </form>
      </div>
      <div className="space-y-4 px-6 py-5 text-[0.95rem] leading-relaxed text-ink-2">
        <p>
          Every built-in question is a real, released question from an actual standardized test, copied word for word with its official answer key. None were
          written for this app. The explanations were.
        </p>
        <p>
          <b className="text-ink">Why not official SSAT questions?</b> The SSAT's own practice material is copyrighted and mostly sold, and the free mini-test needs an
          account. Most state tests are off-limits too: Missouri's MAP questions, for example, can't be reproduced without written permission from the state
          and its test publisher. Instead, these come from tests whose released questions anyone may reuse, chosen to match the SSAT Upper Level (grades 8–11):
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <b className="text-ink">{naep} from NAEP</b>, "The Nation's Report Card" (grades 8 and 12). Material from the NAEP Questions Tool is in the public domain.
            Math cards were chosen for no calculator and five answer choices, like the SSAT, and show how U.S. students actually answered.
            <span className="mt-1 block text-sm text-ink-3">
              SOURCE: U.S. Department of Education, Institute of Education Sciences, National Center for Education Statistics, National Assessment of Educational
              Progress (NAEP), 1990–2013 Mathematics and Reading Assessments.
            </span>
          </li>
          <li>
            <b className="text-ink">{mcas} from MCAS</b>, the Massachusetts state test (grades 8 and 10, 2002–2025). The Massachusetts Department of Elementary and
            Secondary Education grants permission to copy released items for non-commercial educational purposes, except reading passages that are not in the
            public domain. Only passages marked "In the public domain" are used.
          </li>
          <li>
            One NAEP set ("The Death of the Hired Man") was released without its poem. The 1914 public-domain text comes from Project Gutenberg.
          </li>
        </ul>
        <p>
          <b className="text-ink">Question packs.</b> You can add a private pack of extra questions, such as a practice test you own, from a file. A pack is saved only
          in this browser and is never part of the public site.
          {packs.length > 0 && (
            <>
              {" "}
              Added here: {packs.map((p) => `${p.name} (${p.questions.length} questions)`).join("; ")}. Practice tests in packs use the real SSAT format: five choices
              for reading too, with line-numbered passages.
            </>
          )}
        </p>
        <p>
          <b className="text-ink">Differences from the real SSAT:</b> built-in reading questions have four choices (the SSAT has five), and some passages are longer than
          the SSAT's. Some NAEP questions mention a "page" of the original booklet; the word they ask about is highlighted in the passage instead. The Verbal section
          (synonyms and analogies) and the Writing Sample aren't included.
        </p>
        <p className="text-sm text-ink-3">
          Upper Hand is not affiliated with or endorsed by the SSAT, E3n, NAEP, or the Massachusetts Department of Elementary and Secondary Education. Progress is
          saved only in this browser.
        </p>
      </div>
    </dialog>
  );
}
