import type { BlueprintId } from "./types";

/** ABU Qualifying / In-Service content outline. Top-level shares sum to 100.
 * ABU notes the exact mix varies slightly year to year.
 * Source: abu.org Exam Content for Qualifying and In-service Examinations.
 */
export type Blueprint = {
  id: BlueprintId;
  title: string;
  short: string;
  percent: number;
  detail: string;
};

export const blueprint: Blueprint[] = [
  {
    id: "oncology",
    title: "Oncology",
    short: "Oncology",
    percent: 25,
    detail: "Upper tract 12, lower tract 12, diversions 4, plus core overlap. Adrenal sits with upper tract.",
  },
  {
    id: "core",
    title: "Core urologic knowledge",
    short: "Core",
    percent: 20,
    detail: "Office urology 7, postoperative care and trauma 7, imaging and ethics 5, transplant 0.5, statistics 0.5.",
  },
  {
    id: "urogyn",
    title: "Urogynecology and reconstruction",
    short: "Urogyn",
    percent: 12,
    detail: "Neurourology and congenital anomalies that affect reconstruction 7. Incontinence, OAB, and bladder pain 4. Prolapse 1.",
  },
  {
    id: "obstruction",
    title: "Urinary obstruction",
    short: "Obstruction",
    percent: 10,
    detail: "BPH, urethral obstruction, and LUTS 8. Upper-tract obstruction 2.",
  },
  {
    id: "stones",
    title: "Urolithiasis",
    short: "Stones",
    percent: 10,
    detail: "Renal and ureteral calculi 9, including metabolic evaluation. Bladder stones 1.",
  },
  {
    id: "peds",
    title: "Pediatric urology",
    short: "Peds",
    percent: 10,
    detail: "Congenital anomalies 3, obstruction 2, voiding dysfunction 2, infection 1, neoplasms 1.5, nephrology 0.5.",
  },
  {
    id: "andrology",
    title: "Andrology",
    short: "Andrology",
    percent: 8,
    detail: "Erectile function and androgen deficiency 6. Infertility 2.",
  },
  {
    id: "basic",
    title: "Basic science",
    short: "Basic",
    percent: 5,
    detail: "Physiology and molecular biology 1, fluids 1, anatomy 0.5, renovascular 0.5, nephrology 0.5. Must be tied to a clinical decision.",
  },
];

export const blueprintById = Object.fromEntries(blueprint.map((b) => [b.id, b])) as Record<
  BlueprintId,
  Blueprint
>;
