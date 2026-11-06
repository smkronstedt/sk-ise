import type { BlueprintId, Focus } from "./types";

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
