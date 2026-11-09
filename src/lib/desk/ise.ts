import { blueprint } from "./blueprint";
import type { BlueprintId, Focus } from "./types";

export type IseLeak = { label: string; items: number; score: number; note?: string };

export type IseReport = {
  year: number;
  score: number;
  percentile: number;
  prior: { year: number; score: number; percentile: number } | null;
  leaks: IseLeak[];
};

/** 2025 AUA in-service, PGY3. Focus follows points left on the table, not the raw percent alone. */
export const ise2025 = {
  year: 2025,
  score: 60,
  percentile: 60,
  prior: [
    { year: 2024, score: 45, percentile: 31 },
    { year: 2023, score: 47, percentile: 77 },
  ],
  focus: {
    urogyn: "boost",
    stones: "boost",
    core: "boost",
    oncology: "hold",
    obstruction: "hold",
    andrology: "hold",
    peds: "ease",
    basic: "ease",
  } satisfies Record<BlueprintId, Focus>,
  leaks: [
    { label: "Voiding, neurogenic bladder, incontinence", items: 30, score: 43, note: "Largest hole. About 17 misses." },
    { label: "Stones", items: 17, score: 52, note: "About 8 misses, and a tenth of the next exam." },
    { label: "Core: ultrasound, radiation, geriatric", items: 8, score: 37, note: "Worst percent. General items were 45%." },
  ],
  keep: [
    { label: "Infection and inflammation", score: 92 },
    { label: "Fluids, transplant, hypertension", score: 85 },
    { label: "Trauma and fistulae", score: 72 },
    { label: "Congenital and anatomy", score: 72 },
  ],
};

const hints: { id: BlueprintId; keys: string[] }[] = [
  { id: "urogyn", keys: ["void", "incontin", "neurogen", "pelvic", "oab", "female"] },
  { id: "stones", keys: ["stone", "calculus"] },
  { id: "core", keys: ["trauma", "ultrasound", "radiation", "geriatric", "imaging", "core", "fistul"] },
  { id: "oncology", keys: ["oncol", "cancer", "prostate", "bladder", "renal"] },
  { id: "obstruction", keys: ["bph", "obstruct", "luts", "stricture"] },
  { id: "andrology", keys: ["androl", "infertil", "sexual", "erect", "testoster"] },
  { id: "peds", keys: ["peds", "pediatr", "congenital", "crypt", "reflux"] },
  { id: "basic", keys: ["fluid", "transplant", "infection", "anatomy", "physiol", "pharm"] },
];

/** Weak sections they typed become a boost. Everything else holds. */
export function focusFromReport(report: IseReport): Record<BlueprintId, Focus> {
  const focus = Object.fromEntries(blueprint.map((bucket) => [bucket.id, "hold"])) as Record<BlueprintId, Focus>;
  for (const leak of report.leaks) {
    if (leak.score >= 70) continue;
    const text = leak.label.toLowerCase();
    const hit = hints.find((row) => row.keys.some((key) => text.includes(key)));
    if (hit) focus[hit.id] = "boost";
  }
  return focus;
}
