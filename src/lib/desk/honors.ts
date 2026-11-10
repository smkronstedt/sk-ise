import { loadActivity, studyStreak } from "@/lib/desk/activity";
import { trainingSummary } from "@/lib/desk/training";
import { touchProgress } from "@/lib/desk/touch";

const TRIALS = "callroom-trials";
const ROW = "callroom-row-v1";
const BEST = "callroom-row-best";

export function noteRow(correct: boolean) {
  if (typeof window === "undefined") return;
  const next = correct ? Number(localStorage.getItem(ROW) || 0) + 1 : 0;
  localStorage.setItem(ROW, String(next));
  const best = Number(localStorage.getItem(BEST) || 0);
  if (next > best) localStorage.setItem(BEST, String(next));
  touchProgress();
}

export function rowBest() {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(BEST) || 0);
}

export function trialIds() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(TRIALS) || "[]") as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function trialDone(id: string) {
  return trialIds().includes(id);
}

export function markTrial(id: string) {
  if (typeof window === "undefined") return;
  const ids = trialIds();
  if (!ids.includes(id)) localStorage.setItem(TRIALS, JSON.stringify([...ids, id]));
  touchProgress();
}

export type Honor = { id: string; name: string; detail: string; earned: boolean };

export function honors(): Honor[] {
  if (typeof window === "undefined") return [];
  const days = loadActivity();
  const correct = Object.values(days).reduce((sum, row) => sum + (row.correct ?? 0), 0);
  const streak = studyStreak(days);
  const row = rowBest();
  const miles = trainingSummary().miles;
  const trials = trialIds().length;
  const list: Honor[] = [
    { id: "q10", name: "Ten right", detail: "10 correct", earned: correct >= 10 },
    { id: "q50", name: "Fifty right", detail: "50 correct", earned: correct >= 50 },
    { id: "q100", name: "Hundred", detail: "100 correct", earned: correct >= 100 },
    { id: "q250", name: "Two-fifty", detail: "250 correct", earned: correct >= 250 },
    { id: "row5", name: "Five straight", detail: "5 in a row", earned: row >= 5 },
    { id: "row10", name: "Ten straight", detail: "10 in a row", earned: row >= 10 },
    { id: "row20", name: "Twenty straight", detail: "20 in a row", earned: row >= 20 },
    { id: "day3", name: "Three days", detail: "3-day study streak", earned: streak >= 3 },
    { id: "day7", name: "Week streak", detail: "7-day study streak", earned: streak >= 7 },
    { id: "day30", name: "Month streak", detail: "30-day study streak", earned: streak >= 30 },
    { id: "mi10", name: "Ten miles", detail: "10 miles", earned: miles >= 10 },
    { id: "mi26", name: "Marathon", detail: "26.2 miles", earned: miles >= 26.2 },
    { id: "mi50", name: "Fifty miles", detail: "50 miles", earned: miles >= 50 },
    { id: "side", name: "Town trial", detail: "One side quest", earned: trials >= 1 },
    { id: "side8", name: "All towns", detail: "A trial in every town", earned: trials >= 8 },
  ];
  return list;
}
