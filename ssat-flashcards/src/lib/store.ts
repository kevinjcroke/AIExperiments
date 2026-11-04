// React hooks for the deck (lazy-loaded) and for saved progress and preferences.

import { useCallback, useEffect, useState } from "react";
import { loadPacks, PACKS_KEY, savePacks, type Pack } from "./packs";
import { emptyProgress, loadProgress, record, saveProgress, type Progress } from "./progress";
import { sanitizeHtml } from "./sanitize";
import type { DeckChoice, GenreGroup } from "./session";
import type { Deck, MathTopic } from "./types";

let deckPromise: Promise<Deck> | null = null;

export function loadDeck(): Promise<Deck> {
  deckPromise ??= import("../data/deck.json").then((m) => m.default as unknown as Deck);
  return deckPromise;
}

export function useDeck(): { deck: Deck | null; error: string | null } {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadDeck().then(
      (d) => live && setDeck(d),
      (e: unknown) => live && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      live = false;
    };
  }, []);
  return { deck, error };
}

const storage = (): Storage | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress(storage()));

  useEffect(() => {
    saveProgress(storage(), progress);
  }, [progress]);

  // Keep two open tabs in step.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith("upper-hand/progress")) setProgress(loadProgress(storage()));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const answer = useCallback((id: string, correct: boolean) => {
    setProgress((p) => record(p, id, correct, Date.now()));
  }, []);
  const reset = useCallback(() => setProgress(emptyProgress()), []);
  return { progress, answer, reset };
}

/** Private question packs saved in this browser. add() and remove() throw PackError when storage fails. */
export function usePacks() {
  const [packs, setPacks] = useState<Pack[]>(() => loadPacks(storage(), sanitizeHtml));

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === PACKS_KEY) setPacks(loadPacks(storage(), sanitizeHtml));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback(
    (pack: Pack) => {
      const next = [...packs.filter((p) => p.id !== pack.id), pack];
      savePacks(storage(), next);
      setPacks(next);
    },
    [packs],
  );
  const remove = useCallback(
    (id: string) => {
      const next = packs.filter((p) => p.id !== id);
      savePacks(storage(), next);
      setPacks(next);
    },
    [packs],
  );
  return { packs, add, remove };
}

export interface Prefs {
  deck: DeckChoice;
  topics: MathTopic[];
  genres: GenreGroup[];
  /** Source filter: "released" and/or pack ids. Empty = everything. */
  sources: string[];
  size: number;
}

const PREFS_KEY = "upper-hand/prefs/v1";
const DEFAULT_PREFS: Prefs = { deck: "math", topics: [], genres: [], sources: [], size: 10 };
const SIZES = [10, 20, 0];

function loadPrefs(): Prefs {
  try {
    const raw = storage()?.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const d = JSON.parse(raw) as Partial<Prefs>;
    return {
      deck: d.deck === "math" || d.deck === "reading" || d.deck === "mixed" ? d.deck : DEFAULT_PREFS.deck,
      topics: Array.isArray(d.topics) ? (d.topics.filter((t) => typeof t === "string") as MathTopic[]) : [],
      genres: Array.isArray(d.genres) ? (d.genres.filter((t) => typeof t === "string") as GenreGroup[]) : [],
      sources: Array.isArray(d.sources) ? d.sources.filter((t) => typeof t === "string") : [],
      size: typeof d.size === "number" && SIZES.includes(d.size) ? d.size : DEFAULT_PREFS.size,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  useEffect(() => {
    try {
      storage()?.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);
  return [prefs, setPrefs] as const;
}
