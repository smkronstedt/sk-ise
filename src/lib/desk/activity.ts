const KEY = "callroom-activity-v1";

export type DayLog = { questions: number; cards: number };

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
    };
  }
  return out;
}

export function saveActivity(days: Record<string, DayLog>) {
  localStorage.setItem(KEY, JSON.stringify(days));
  window.dispatchEvent(new Event("ise-activity"));
}

export function logActivity(kind: keyof DayLog) {
  const days = loadActivity();
  const today = dayKey();
  const row = days[today] ?? { questions: 0, cards: 0 };
  row[kind] += 1;
  days[today] = row;
  saveActivity(days);
}
