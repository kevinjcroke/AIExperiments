import type { GenreGroup } from "./session";
import type { Difficulty, Genre, MathTopic, Skill, Source } from "./types";

export const TOPIC_LABEL: Record<MathTopic, string> = {
  numbers: "Numbers",
  algebra: "Algebra",
  geometry: "Geometry",
  measurement: "Measurement",
  data: "Data & probability",
};

export const TOPICS: MathTopic[] = ["numbers", "algebra", "geometry", "measurement", "data"];

export const GENRE_GROUP_LABEL: Record<GenreGroup, string> = {
  fiction: "Fiction",
  poetry: "Poetry & drama",
  nonfiction: "Nonfiction",
};

export const GENRE_GROUPS: GenreGroup[] = ["fiction", "poetry", "nonfiction"];

export const GENRE_LABEL: Record<Genre, string> = {
  fiction: "Fiction",
  poetry: "Poetry",
  drama: "Drama",
  nonfiction: "Nonfiction",
};

export const SKILL_LABEL: Record<Skill, string> = {
  "main-idea": "Main idea",
  detail: "Detail",
  inference: "Inference",
  vocabulary: "Vocabulary",
  craft: "Author's craft",
  tone: "Tone & mood",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Warm-up",
  medium: "Medium",
  hard: "Tough",
};

export function sourceLabel(s: Source): string {
  if (s.test === "pack") return `${s.short} · private pack`;
  return `${s.test} ${s.year} · Grade ${s.grade}`;
}

export function sourceLong(s: Source): string {
  if (s.test === "pack") return `${s.name}${s.ref ? ` · ${s.ref}` : ""}`;
  const test =
    s.test === "NAEP" ? "National Assessment of Educational Progress (NAEP)" : "Massachusetts Comprehensive Assessment System (MCAS)";
  return `${test}, ${s.year}, grade ${s.grade}${s.ref ? ` · ${s.ref}` : ""}`;
}
