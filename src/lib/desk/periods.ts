/** Leaderboard windows. The team clock is Central time. */

export type PeriodScores = { today: number; week: number; month: number; all: number };

export function centralToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function shiftKey(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekStartKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  const dow = new Date(Date.UTC(year, (month || 1) - 1, day || 1)).getUTCDay();
  return shiftKey(key, -dow);
}

export function periodTotals(days: Record<string, { correct?: number } | undefined>, now = new Date()): PeriodScores {
  const today = centralToday(now);
  const start = weekStartKey(today);
  const month = today.slice(0, 7);
  let todayN = 0;
  let weekN = 0;
  let monthN = 0;
  let allN = 0;
  for (const [key, row] of Object.entries(days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || key > today) continue;
    const count = Math.max(0, Math.round(Number(row?.correct) || 0));
    allN += count;
    if (key === today) todayN += count;
    if (key >= start) weekN += count;
    if (key.startsWith(month)) monthN += count;
  }
  return { today: todayN, week: weekN, month: monthN, all: allN };
}

/** Bank items have no day. If this person has no earlier study day, those points happened today. */
export function withBankScore(
  periods: PeriodScores,
  days: Record<string, { correct?: number } | undefined>,
  bankScore: number,
  now = new Date(),
): PeriodScores {
  const today = centralToday(now);
  const remainder = Math.max(0, bankScore - periods.all);
  const older = Object.keys(days).some((key) => /^\d{4}-\d{2}-\d{2}$/.test(key) && key < today);
  if (!older && remainder > 0) {
    return {
      today: periods.today + remainder,
      week: periods.week + remainder,
      month: periods.month + remainder,
      all: periods.all + remainder,
    };
  }
  return { ...periods, all: Math.max(periods.all, bankScore) };
}
