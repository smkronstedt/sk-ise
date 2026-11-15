import { ensureLifetime, prizeStatus } from "@/lib/desk/activity";
import { uniqueCorrectCount } from "@/lib/desk/adapt";
import { countBankCorrect } from "@/lib/desk/original-bank";
import { gearCost } from "@/lib/desk/ops";
import { trainingSummary } from "@/lib/desk/training";
import type { DeskState } from "@/lib/desk/types";

export const QUEST_SPEND_KEY = "callroom-quest-spend-v1";

/** Questions, prizes, and training. The same pile for every game. */
export function earnedPurse(): number {
  let floor = countBankCorrect();
  try {
    const raw = localStorage.getItem("callroom-desk-v1");
    const parsed = raw ? (JSON.parse(raw) as DeskState) : { tests: [], marks: {}, notes: {}, focus: {} };
    floor = uniqueCorrectCount(parsed as DeskState);
  } catch {
    floor = countBankCorrect();
  }
  const bonus = Number(localStorage.getItem("ise-lecture-bonus") || "0") + Number(localStorage.getItem("ise-card-bonus") || "0");
  return ensureLifetime(floor) + prizeStatus().purse + trainingSummary().purse + (Number.isFinite(bonus) ? bonus : 0);
}

export function questSpent(): number {
  try {
    const value = Number(localStorage.getItem(QUEST_SPEND_KEY));
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  } catch {
    return 0;
  }
}

export function opsCash(): number {
  return Math.max(0, earnedPurse() - gearCost());
}

export function questCash(): number {
  return Math.max(0, earnedPurse() - questSpent());
}

export function spendQuest(amount: number) {
  if (amount <= 0) return true;
  if (questCash() < amount) return false;
  localStorage.setItem(QUEST_SPEND_KEY, String(questSpent() + amount));
  if (typeof window !== "undefined") window.dispatchEvent(new Event("ise-activity"));
  return true;
}

/** Outside the two games, show earnings with nothing spent. */
export function cashForMode(mode: string): number {
  if (mode === "ops") return opsCash();
  if (mode === "notes") return questCash();
  return Math.max(0, earnedPurse());
}
