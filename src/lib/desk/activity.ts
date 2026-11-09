const KEY = "callroom-activity-v1";

export type DayLog = { questions: number; cards: number; correct?: number };

export function dayKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function loadActivity(): Record<string, DayLog> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, DayLog>;
    return parsed && typeof parsed === "object" ? parsed : {};
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
    purse: daily * DAILY_PRIZE + weekly * WEEK_PRIZE + monthly * MONTH_PRIZE + yearly * YEAR_PRIZE,
  };
}

export function logCorrect() {
  const days = loadActivity();
  const today = dayKey();
  const row = days[today] ?? { questions: 0, cards: 0 };
  row.correct = (row.correct ?? 0) + 1;
  days[today] = row;
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
