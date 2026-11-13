import { centralToday } from "@/lib/desk/periods";

const KEY = "callroom-activity-v1";
const LIFE = "callroom-correct-lifetime";

export const MISSIONS = [
  { id: "ten", label: "10 right", need: 10, pay: 10, kind: "correct" as const },
  { id: "twentyfive", label: "25 right", need: 25, pay: 25, kind: "correct" as const },
  { id: "fifty", label: "50 right", need: 50, pay: 50, kind: "correct" as const },
  { id: "cards", label: "5 cards", need: 5, pay: 5, kind: "cards" as const },
];

export type DayLog = { questions: number; cards: number; correct?: number };

function deviceDay(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Study days use Central time, the same clock as the leaderboard. */
export function dayKey(date = new Date()) {
  return centralToday(date);
}

/** If this phone's calendar day is not Central, today's log still counts today. */
export function alignActivityClock(days: Record<string, DayLog>) {
  const central = centralToday();
  const local = deviceDay();
  if (local === central || !days[local]) return days;
  const from = days[local];
  const have = days[central] ?? { questions: 0, cards: 0 };
  const next: Record<string, DayLog> = { ...days };
  next[central] = {
    questions: Math.max(have.questions ?? 0, from.questions ?? 0),
    cards: Math.max(have.cards ?? 0, from.cards ?? 0),
    correct: Math.max(have.correct ?? 0, from.correct ?? 0),
  };
  delete next[local];
  return next;
}

export function loadActivity(): Record<string, DayLog> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, DayLog>;
    if (!parsed || typeof parsed !== "object") return {};
    const aligned = alignActivityClock(parsed);
    if (aligned !== parsed && JSON.stringify(aligned) !== raw) localStorage.setItem(KEY, JSON.stringify(aligned));
    return aligned;
  } catch {
    return {};
  }
}

export function mergeActivity(local: Record<string, DayLog>, remote: Record<string, DayLog> | null | undefined) {
  const out: Record<string, DayLog> = { ...local };
  for (const [day, row] of Object.entries(remote ?? {})) {
    const have = out[day] ?? { questions: 0, cards: 0 };
    out[day] = {
      questions: Math.max(have.questions, Number(row?.questions) || 0),
      cards: Math.max(have.cards, Number(row?.cards) || 0),
      correct: Math.max(have.correct ?? 0, Number(row?.correct) || 0),
    };
  }
  return out;
}

export function lifetimeCorrect() {
  const raw = typeof window === "undefined" ? null : localStorage.getItem(LIFE);
  return raw == null ? 0 : Math.max(0, Number(raw) || 0);
}

/** First visit keeps every correct answer already on the account. After that, each new one adds. */
export function ensureLifetime(floor: number) {
  if (typeof window === "undefined") return Math.max(0, floor);
  const raw = localStorage.getItem(LIFE);
  const have = raw == null ? 0 : Number(raw) || 0;
  const next = Math.max(have, Math.max(0, floor));
  if (raw == null || have !== next) localStorage.setItem(LIFE, String(next));
  return next;
}

export function todayCorrect() {
  return loadActivity()[dayKey()]?.correct ?? 0;
}

export function missionPay(row: { correct?: number; cards?: number } | undefined) {
  const right = row?.correct ?? 0;
  const cards = row?.cards ?? 0;
  return MISSIONS.reduce((sum, mission) => sum + ((mission.kind === "cards" ? cards : right) >= mission.need ? mission.pay : 0), 0);
}

export function saveActivity(days: Record<string, DayLog>) {
  localStorage.setItem(KEY, JSON.stringify(days));
  window.dispatchEvent(new Event("ise-activity"));
}

export const DAY_PAY = 5;
export const WEEK_PURSE = 50;

export function showUpPay(days: Record<string, DayLog>) {
  return Object.values(days).filter((row) => (row.questions ?? 0) + (row.cards ?? 0) > 0).length * DAY_PAY;
}

export function studyStreak(days: Record<string, DayLog>) {
  const has = (date: Date) => {
    const row = days[dayKey(date)];
    return (row?.questions ?? 0) + (row?.cards ?? 0) > 0;
  };
  const cursor = new Date();
  if (!has(cursor)) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (has(cursor)) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export const DAILY_GOAL = 10;
export const DAILY_PRIZE = 10;
export const WEEK_GOAL = 7;
export const WEEK_PRIZE = 50;
export const MONTH_GOAL = 30;
export const MONTH_PRIZE = 200;
export const YEAR_GOAL = 200;
export const YEAR_PRIZE = 1000;

function parseDay(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function weekStart(date: Date) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - copy.getDay());
  return dayKey(copy);
}

export function prizeStatus(days = typeof window === "undefined" ? {} : loadActivity()) {
  const weeks = new Map<string, number>();
  const months = new Map<string, number>();
  const years = new Map<string, number>();
  let daily = 0;
  let answered = 0;
  for (const [key, row] of Object.entries(days)) {
    const questions = row?.questions ?? 0;
    answered += questions;
    if (questions < DAILY_GOAL) continue;
    daily += 1;
    const date = parseDay(key);
    const week = weekStart(date);
    weeks.set(week, (weeks.get(week) ?? 0) + 1);
    const month = key.slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + 1);
    const year = key.slice(0, 4);
    years.set(year, (years.get(year) ?? 0) + 1);
  }
  const weekly = [...weeks.values()].filter((count) => count >= WEEK_GOAL).length;
  const monthly = [...months.values()].filter((count) => count >= MONTH_GOAL).length;
  const yearly = [...years.values()].filter((count) => count >= YEAR_GOAL).length;
  const todayKey = dayKey();
  const paid = (date: Date) => (days[dayKey(date)]?.questions ?? 0) >= DAILY_GOAL;
  const cursor = new Date();
  if (!paid(cursor)) cursor.setDate(cursor.getDate() - 1);
  let paidStreak = 0;
  while (paid(cursor)) {
    paidStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  const monthKeys = [...months.entries()].filter(([, count]) => count >= MONTH_GOAL).map(([key]) => key).sort();
  let monthStreak = 0;
  const probe = new Date();
  for (;;) {
    const key = `${probe.getFullYear()}-${String(probe.getMonth() + 1).padStart(2, "0")}`;
    if (!monthKeys.includes(key)) {
      if (key === todayKey.slice(0, 7)) {
        probe.setMonth(probe.getMonth() - 1);
        continue;
      }
      break;
    }
    monthStreak += 1;
    probe.setMonth(probe.getMonth() - 1);
  }
  let missions = 0;
  for (const row of Object.values(days)) missions += missionPay(row);
  return {
    answered,
    today: days[todayKey]?.questions ?? 0,
    daily,
    paidStreak,
    monthStreak,
    weekDays: weeks.get(weekStart(new Date())) ?? 0,
    monthDays: months.get(todayKey.slice(0, 7)) ?? 0,
    yearDays: years.get(todayKey.slice(0, 4)) ?? 0,
    weekly,
    monthly,
    yearly,
    todayCorrect: days[todayKey]?.correct ?? 0,
    todayCards: days[todayKey]?.cards ?? 0,
    todayMissions: missionPay(days[todayKey]),
    purse: daily * DAILY_PRIZE + weekly * WEEK_PRIZE + monthly * MONTH_PRIZE + yearly * YEAR_PRIZE + missions,
  };
}

export function logCorrect() {
  const days = loadActivity();
  const today = dayKey();
  const row = days[today] ?? { questions: 0, cards: 0 };
  row.correct = (row.correct ?? 0) + 1;
  days[today] = row;
  const have = localStorage.getItem(LIFE);
  localStorage.setItem(LIFE, String((have == null ? 0 : Number(have) || 0) + 1));
  saveActivity(days);
}

export function logActivity(kind: "questions" | "cards") {
  const days = loadActivity();
  const today = dayKey();
  const row = days[today] ?? { questions: 0, cards: 0 };
  row[kind] += 1;
  days[today] = row;
  saveActivity(days);
}
