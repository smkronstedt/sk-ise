/** Questions already worked in the official SASP player. His account only. */
export type SaspCredit = {
  id: string;
  choice: string;
  correct: boolean;
  /** Central-time day it was worked, so the log stays on that day. */
  day: string;
};

export const saspCredits: SaspCredit[] = [
  { id: "SASP2026-001", choice: "A", correct: false, day: "2026-11-19" },
  { id: "SASP2026-002", choice: "C", correct: true, day: "2026-11-19" },
  { id: "SASP2026-003", choice: "B", correct: true, day: "2026-11-19" },
  { id: "SASP2026-004", choice: "E", correct: false, day: "2026-11-19" },
  { id: "SASP2026-005", choice: "C", correct: true, day: "2026-11-19" },
  { id: "SASP2026-006", choice: "D", correct: false, day: "2026-11-19" },
  { id: "SASP2026-007", choice: "C", correct: false, day: "2026-11-19" },
  { id: "SASP2026-008", choice: "A", correct: false, day: "2026-11-19" },
  { id: "SASP2026-009", choice: "E", correct: false, day: "2026-11-19" },
  { id: "SASP2026-010", choice: "D", correct: false, day: "2026-11-19" },
  { id: "SASP2026-011", choice: "A", correct: true, day: "2026-11-19" },
  { id: "SASP2026-012", choice: "C", correct: false, day: "2026-11-19" },
  { id: "SASP2026-013", choice: "A", correct: true, day: "2026-11-19" },
  { id: "SASP2026-014", choice: "E", correct: false, day: "2026-11-20" },
  { id: "SASP2026-015", choice: "D", correct: false, day: "2026-11-20" },
  { id: "SASP2026-016", choice: "A", correct: false, day: "2026-11-20" },
  { id: "SASP2026-017", choice: "C", correct: false, day: "2026-11-20" },
  { id: "SASP2026-018", choice: "B", correct: false, day: "2026-11-20" },
  { id: "SASP2026-019", choice: "A", correct: false, day: "2026-11-20" },
  { id: "SASP2026-020", choice: "E", correct: false, day: "2026-11-20" },
  { id: "SASP2026-021", choice: "D", correct: false, day: "2026-11-20" },
  { id: "SASP2026-022", choice: "B", correct: false, day: "2026-11-20" },
  { id: "SASP2026-023", choice: "A", correct: true, day: "2026-11-20" },
  { id: "SASP2026-024", choice: "A", correct: false, day: "2026-11-20" },
  { id: "SASP2026-025", choice: "B", correct: true, day: "2026-11-20" },
  { id: "SASP2026-026", choice: "D", correct: false, day: "2026-11-20" },
  { id: "SASP2026-027", choice: "A", correct: true, day: "2026-11-20" },
  { id: "SASP2026-028", choice: "A", correct: true, day: "2026-11-20" },
  { id: "SASP2026-029", choice: "B", correct: false, day: "2026-11-20" },
  { id: "SASP2026-030", choice: "B", correct: false, day: "2026-11-20" },
  { id: "SASP2026-031", choice: "E", correct: true, day: "2026-11-20" },
  { id: "SASP2026-032", choice: "A", correct: true, day: "2026-11-20" },
  { id: "SASP2026-033", choice: "B", correct: false, day: "2026-11-20" },
  { id: "SASP2026-034", choice: "D", correct: true, day: "2026-11-20" },
  { id: "SASP2026-035", choice: "D", correct: false, day: "2026-11-20" },
  { id: "SASP2026-036", choice: "D", correct: true, day: "2026-11-20" },
  { id: "SASP2026-037", choice: "C", correct: false, day: "2026-11-20" },
  { id: "SASP2026-038", choice: "A", correct: false, day: "2026-11-20" },
  { id: "SASP2026-039", choice: "A", correct: false, day: "2026-11-20" },
  { id: "SASP2026-040", choice: "B", correct: true, day: "2026-11-20" },
  { id: "SASP2026-041", choice: "D", correct: false, day: "2026-11-20" },
  { id: "SASP2026-043", choice: "C", correct: true, day: "2026-11-20" },
  { id: "SASP2026-044", choice: "D", correct: false, day: "2026-11-20" },
  { id: "SASP2026-045", choice: "A", correct: false, day: "2026-11-20" },
  { id: "SASP2026-046", choice: "A", correct: false, day: "2026-11-20" },
  { id: "SASP2026-047", choice: "A", correct: false, day: "2026-11-20" },
  { id: "SASP2026-048", choice: "E", correct: false, day: "2026-11-20" },
  { id: "SASP2026-049", choice: "B", correct: false, day: "2026-11-20" },
  { id: "SASP2026-050", choice: "C", correct: false, day: "2026-11-20" },
  { id: "SASP2026-051", choice: "C", correct: true, day: "2026-11-20" },
  { id: "SASP2026-052", choice: "D", correct: false, day: "2026-11-20" },
  { id: "SASP2026-053", choice: "A", correct: true, day: "2026-11-20" },
  { id: "SASP2026-054", choice: "C", correct: false, day: "2026-11-20" },
  { id: "SASP2026-055", choice: "A", correct: false, day: "2026-11-20" },
  { id: "SASP2026-056", choice: "E", correct: false, day: "2026-11-20" },
  { id: "SASP2026-057", choice: "E", correct: false, day: "2026-11-20" },
  { id: "SASP2026-058", choice: "B", correct: false, day: "2026-11-20" },
  { id: "SASP2026-059", choice: "B", correct: false, day: "2026-11-20" },
  { id: "SASP2026-060", choice: "B", correct: false, day: "2026-11-20" },
  { id: "SASP2026-061", choice: "E", correct: false, day: "2026-11-20" },
  { id: "SASP2026-062", choice: "D", correct: false, day: "2026-11-20" },
  { id: "SASP2026-063", choice: "D", correct: true, day: "2026-11-21" },
  { id: "SASP2026-064", choice: "D", correct: true, day: "2026-11-21" },
];

type Bank = {
  answers?: Record<string, { choice?: string; correct?: boolean }>;
  marks?: Record<string, boolean>;
  notes?: Record<string, string>;
};

type DayLog = { questions?: number; cards?: number; correct?: number };

type CardsObject = {
  list?: unknown;
  activity?: Record<string, DayLog>;
  [key: string]: unknown;
};

/** Fill any missing credits. Already-answered items are left alone. */
export function applySaspCredits(bank: unknown, cards: unknown) {
  const source = bank && typeof bank === "object" && !Array.isArray(bank) ? (bank as Bank) : {};
  const answers = { ...(source.answers ?? {}) };
  const added: SaspCredit[] = [];
  for (const credit of saspCredits) {
    if (answers[credit.id]) continue;
    answers[credit.id] = { choice: credit.choice, correct: credit.correct };
    added.push(credit);
  }
  const nextBank: Bank = { ...source, answers };
  if (!added.length) return { bank: nextBank, cards, changed: false };

  const byDay = new Map<string, { questions: number; correct: number }>();
  for (const credit of added) {
    const row = byDay.get(credit.day) ?? { questions: 0, correct: 0 };
    row.questions += 1;
    if (credit.correct) row.correct += 1;
    byDay.set(credit.day, row);
  }

  const base: CardsObject = Array.isArray(cards) ? { list: cards } : cards && typeof cards === "object" ? { ...(cards as CardsObject) } : {};
  const activity = { ...(base.activity ?? {}) };
  for (const [day, add] of byDay) {
    const have = activity[day] ?? {};
    activity[day] = {
      ...have,
      questions: (have.questions ?? 0) + add.questions,
      cards: have.cards ?? 0,
      correct: (have.correct ?? 0) + add.correct,
    };
  }
  return { bank: nextBank, cards: { ...base, activity }, changed: true };
}
