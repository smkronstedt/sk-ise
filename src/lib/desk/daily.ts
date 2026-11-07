import { dayKey } from "@/lib/desk/activity";
import { loadBankProgress, type BankAnswer, type BankItem } from "@/lib/desk/original-bank";

const KEY = "callroom-daily-v1";

export const DAY_PAY = 5;
export const DAILY_RIGHT_PAY = 25;

export type DailyRecord = { id: string; choice?: string; correct?: boolean };

export function loadDaily(): Record<string, DailyRecord> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, DailyRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveDaily(days: Record<string, DailyRecord>) {
  localStorage.setItem(KEY, JSON.stringify(days));
  window.dispatchEvent(new Event("ise-activity"));
}

export function mergeDaily(local: Record<string, DailyRecord>, remote: Record<string, DailyRecord> | null | undefined) {
  const out: Record<string, DailyRecord> = { ...local };
  for (const [day, row] of Object.entries(remote ?? {})) {
    if (!row?.id) continue;
    const have = out[day];
    if (!have || (row.choice && !have.choice)) out[day] = row;
  }
  return out;
}

function hash(text: string) {
  let value = 0;
  for (const char of text) value = (value * 33 + char.charCodeAt(0)) >>> 0;
  return value;
}

export function pickDailyItem(items: BankItem[], date = dayKey()) {
  const saved = loadDaily()[date];
  if (saved) {
    const kept = items.find((item) => item.id === saved.id);
    if (kept) return kept;
  }
  const answers = loadBankProgress().answers;
  const byTopic = new Map<string, BankItem[]>();
  for (const item of items) {
    const list = byTopic.get(item.topic) ?? [];
    list.push(item);
    byTopic.set(item.topic, list);
  }
  const ranked = [...byTopic.entries()].map(([topic, list]) => {
    let attempted = 0;
    let correct = 0;
    for (const item of list) {
      const row: BankAnswer | undefined = answers[item.id];
      if (!row) continue;
      attempted += 1;
      if (row.correct) correct += 1;
    }
    const weakness = attempted === 0 ? 0.45 : 1 - correct / attempted;
    const unused = list.filter((item) => !answers[item.id]).length;
    return { topic, list, weakness, unused };
  });
  ranked.sort((a, b) => b.weakness - a.weakness || b.unused - a.unused);
  const open = ranked.find((topic) => topic.unused > 0) ?? ranked[0];
  if (!open) return null;
  const pool = open.list.filter((item) => !answers[item.id]);
  const set = pool.length ? pool : open.list;
  const item = set[hash(`${date}:${open.topic}`) % set.length];
  const days = loadDaily();
  days[date] = { id: item.id };
  saveDaily(days);
  return item;
}

export function dailyRightPay(days = loadDaily()) {
  return Object.values(days).filter((row) => row.correct).length * DAILY_RIGHT_PAY;
}
