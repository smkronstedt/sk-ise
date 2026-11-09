import { blueprint } from "./blueprint";
import type { BlueprintId, Focus } from "./types";

export type IseLine = { id: string; items: number; score: number };

export type IseSection = {
  id: string;
  group: "Patient type" | "Problem area" | "Additional";
  label: string;
  bucket?: BlueprintId;
};

/** Same rows as the AUA in-service score report, in report order. */
export const iseSections: IseSection[] = [
  { id: "adult", group: "Patient type", label: "Adult" },
  { id: "general", group: "Patient type", label: "General", bucket: "core" },
  { id: "pediatric", group: "Patient type", label: "Pediatric", bucket: "peds" },
  { id: "calculous", group: "Problem area", label: "Calculous Disease", bucket: "stones" },
  { id: "congenital", group: "Problem area", label: "Congenital Anomalies, Embryology, Anatomy", bucket: "peds" },
  { id: "core", group: "Problem area", label: "Core Competencies, Geriatric, Radiation Safety and Ultrasound", bucket: "core" },
  { id: "fluid", group: "Problem area", label: "Fluid & Electrolyte, Transplant, Hypertension, Vasc. Disease, Nephrology", bucket: "basic" },
  { id: "infection", group: "Problem area", label: "Infection & Inflammatory Disease", bucket: "basic" },
  { id: "neoplasm", group: "Problem area", label: "Neoplasm", bucket: "oncology" },
  { id: "voiding", group: "Problem area", label: "Neurogenic Bladder, Voiding Dysfunction, Incontinence", bucket: "urogyn" },
  { id: "obstructive", group: "Problem area", label: "Obstructive Uropathy, Laparoscopy, Robotic Surgery", bucket: "obstruction" },
  { id: "physiology", group: "Problem area", label: "Physiology, Immunology, & Adrenal", bucket: "basic" },
  { id: "sexual", group: "Problem area", label: "Sexual Dysfunction, Endocrinopathy, Fertility Problems", bucket: "andrology" },
  { id: "trauma", group: "Problem area", label: "Trauma & Fistulae", bucket: "core" },
  { id: "diversion", group: "Problem area", label: "Urinary Diversion", bucket: "obstruction" },
  { id: "imaging", group: "Additional", label: "Imaging Questions", bucket: "core" },
];

export type IseReport = {
  year: number;
  score: number;
  percentile: number;
  items: number;
  prior: { year: number; score: number; percentile: number } | null;
  lines: IseLine[];
};

const lines2025: IseLine[] = [
  { id: "adult", items: 121, score: 62 },
  { id: "general", items: 22, score: 45 },
  { id: "pediatric", items: 22, score: 63 },
  { id: "calculous", items: 17, score: 52 },
  { id: "congenital", items: 11, score: 72 },
  { id: "core", items: 8, score: 37 },
  { id: "fluid", items: 7, score: 85 },
  { id: "infection", items: 13, score: 92 },
  { id: "neoplasm", items: 30, score: 63 },
  { id: "voiding", items: 30, score: 43 },
  { id: "obstructive", items: 12, score: 58 },
  { id: "physiology", items: 5, score: 60 },
  { id: "sexual", items: 15, score: 60 },
  { id: "trauma", items: 11, score: 72 },
  { id: "diversion", items: 6, score: 50 },
  { id: "imaging", items: 32, score: 65 },
];

const lines2024: IseLine[] = [
  { id: "adult", items: 121, score: 46 },
  { id: "general", items: 21, score: 38 },
  { id: "pediatric", items: 24, score: 50 },
  { id: "calculous", items: 16, score: 43 },
  { id: "congenital", items: 12, score: 66 },
  { id: "core", items: 9, score: 44 },
  { id: "fluid", items: 7, score: 57 },
  { id: "infection", items: 13, score: 46 },
  { id: "neoplasm", items: 29, score: 44 },
  { id: "voiding", items: 27, score: 44 },
  { id: "obstructive", items: 14, score: 42 },
  { id: "physiology", items: 5, score: 60 },
  { id: "sexual", items: 16, score: 37 },
  { id: "trauma", items: 11, score: 45 },
  { id: "diversion", items: 7, score: 28 },
  { id: "imaging", items: 33, score: 36 },
];

/** 2025 AUA in-service, PGY3. Numbers are the uploaded score report. Focus still follows the large misses. */
export const ise2025 = {
  year: 2025,
  score: 60,
  percentile: 60,
  items: 165,
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
  lines: lines2025,
};

/** 2024 AUA in-service, PGY2, from the uploaded score report. */
export const ise2024 = {
  year: 2024,
  score: 45,
  percentile: 31,
  items: 166,
  lines: lines2024,
};

export function sectionById(id: string) {
  return iseSections.find((row) => row.id === id);
}

/** Weak sections they typed become a boost. Everything else holds. */
export function focusFromReport(report: IseReport): Record<BlueprintId, Focus> {
  const focus = Object.fromEntries(blueprint.map((bucket) => [bucket.id, "hold"])) as Record<BlueprintId, Focus>;
  for (const line of report.lines) {
    if (line.score >= 60) continue;
    const bucket = sectionById(line.id)?.bucket;
    if (bucket) focus[bucket] = "boost";
  }
  return focus;
}
