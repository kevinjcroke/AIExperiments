import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Home } from "./components/Home";
import type { SessionResult } from "./components/Study";
import { Brand } from "./components/Brand";
import { mergePacks } from "./lib/packs";
import { useDeck, usePacks, usePrefs, useProgress } from "./lib/store";
import type { SessionConfig } from "./lib/session";

const Study = lazy(() => import("./components/Study").then((m) => ({ default: m.Study })));
const Summary = lazy(() => import("./components/Summary").then((m) => ({ default: m.Summary })));

type Screen =
  | { name: "home" }
  | { name: "study"; cfg: SessionConfig; run: number }
  | { name: "summary"; cfg: SessionConfig; result: SessionResult };

export default function App() {
  const { deck: baseDeck, error } = useDeck();
  const { packs, add: addPack, remove: removePack } = usePacks();
  const deck = useMemo(() => baseDeck && mergePacks(baseDeck, packs), [baseDeck, packs]);
  const { progress, answer, reset } = useProgress();
  const [prefs, setPrefs] = usePrefs();
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  const start = useCallback((cfg: SessionConfig) => setScreen({ name: "study", cfg, run: Date.now() }), []);
  const home = useCallback(() => setScreen({ name: "home" }), []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen.name]);

  if (error) {
    return (
      <Shell>
        <p className="mt-16 text-center text-ink-2">Couldn't load the flashcards ({error}). Try reloading the page.</p>
      </Shell>
    );
  }
  if (!deck) {
    return (
      <Shell>
        <div className="mt-24 grid place-items-center gap-3 text-ink-3" role="status">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-line border-t-accent" />
          <span className="text-sm">Shuffling the deck…</span>
        </div>
      </Shell>
    );
  }

  return (
    <Suspense fallback={<Shell />}>
      {screen.name === "home" && (
        <Home
          deck={deck}
          packs={packs}
          progress={progress}
          prefs={prefs}
          setPrefs={setPrefs}
          onStart={start}
          onReset={reset}
          onAddPack={addPack}
          onRemovePack={removePack}
        />
      )}
      {screen.name === "study" && (
        <Study
          key={screen.run}
          deck={deck}
          progress={progress}
          cfg={screen.cfg}
          onAnswer={answer}
          onExit={home}
          onDone={(result) => setScreen({ name: "summary", cfg: screen.cfg, result })}
        />
      )}
      {screen.name === "summary" && (
        <Summary deck={deck} progress={progress} result={screen.result} onAgain={() => start(screen.cfg)} onReview={start} onHome={home} />
      )}
    </Suspense>
  );
}

function Shell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
      <Brand />
      {children}
    </div>
  );
}
