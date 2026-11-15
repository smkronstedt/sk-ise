import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { badgeElements, isChampion } from "@/lib/desk/route";
import { getQuestion } from "@/lib/desk/catalog";
import { centralToday } from "@/lib/desk/periods";
import { periodTotals, withBankScore, type PeriodScores } from "@/lib/desk/periods";
import type { TestBlock } from "@/lib/desk/types";

export type StudyCounts = {
  done: number;
  right: number;
  wrong: number;
  finished: number;
};

export type Leader = {
  name: string;
  image: string;
  score: number;
  periods: PeriodScores;
  bio: string;
  badges: string[];
  champion: boolean;
  done: number;
  right: number;
  wrong: number;
  finished: number;
};

function testsOf(desk: unknown): TestBlock[] {
  try {
    const value = typeof desk === "string" ? JSON.parse(desk) : desk;
    const tests = (value as { tests?: TestBlock[] } | null)?.tests;
    return Array.isArray(tests) ? tests : [];
  } catch {
    return [];
  }
}

function activityOf(cards: unknown): Record<string, { questions?: number; correct?: number }> {
  try {
    const value = typeof cards === "string" ? JSON.parse(cards) : cards;
    if (!value || Array.isArray(value)) return {};
    const activity = (value as { activity?: Record<string, { questions?: number; correct?: number }> }).activity;
    return activity && typeof activity === "object" ? activity : {};
  } catch {
    return {};
  }
}

function withFinishedTests(days: Record<string, { questions?: number; correct?: number }>, tests: TestBlock[]) {
  const extra = new Map<string, { questions: number; correct: number }>();
  for (const test of tests) {
    const stamp = test.finishedAt || test.createdAt;
    if (!stamp) continue;
    const key = centralToday(new Date(stamp));
    let questions = 0;
    let correct = 0;
    for (const [id, answer] of Object.entries(test.answers ?? {})) {
      if (!answer?.submitted || answer.choice == null) continue;
      questions += 1;
      const question = getQuestion(id);
      if (question && answer.choice === question.answer) correct += 1;
    }
    const have = extra.get(key) ?? { questions: 0, correct: 0 };
    extra.set(key, { questions: have.questions + questions, correct: have.correct + correct });
  }
  const out: Record<string, { questions?: number; correct?: number }> = { ...days };
  for (const [key, add] of extra) {
    const row = out[key] ?? {};
    out[key] = {
      ...row,
      questions: Math.max(row.questions ?? 0, add.questions),
      correct: Math.max(row.correct ?? 0, add.correct),
    };
  }
  return out;
}

function bankAnswers(bank: unknown): Record<string, { correct?: boolean }> {
  try {
    const value = typeof bank === "string" ? JSON.parse(bank) : bank;
    const answers = (value as { answers?: Record<string, { correct?: boolean }> } | null)?.answers;
    return answers && typeof answers === "object" ? answers : {};
  } catch {
    return {};
  }
}

export function studyCounts(desk: unknown, bank: unknown): StudyCounts {
  const tests = testsOf(desk);
  const seen = new Map<string, boolean>();
  for (const [id, row] of Object.entries(bankAnswers(bank))) {
    seen.set(id, Boolean(row?.correct));
  }
  for (const test of tests) {
    for (const [id, answer] of Object.entries(test.answers ?? {})) {
      if (!answer?.submitted || answer.choice == null || seen.has(id)) continue;
      const question = getQuestion(id);
      seen.set(id, Boolean(question && answer.choice === question.answer));
    }
  }
  let right = 0;
  for (const ok of seen.values()) if (ok) right += 1;
  const done = seen.size;
  return {
    done,
    right,
    wrong: done - right,
    finished: tests.filter((test) => test.status === "done").length,
  };
}

export const listLeaders = createServerFn({ method: "GET" }).handler(async (): Promise<{ leaders: Leader[] }> => {
  const sql = await getSql();
  const rows = await sql<{ name: string | null; image: string | null; score: number | null; bio: string | null; desk: unknown; cards: unknown; bank: unknown }>`
    select u.name, u.image, coalesce(p.score, 0) as score, coalesce(pr.bio, '') as bio, p.desk as desk, p.cards as cards, p.bank as bank
    from "user" u
    left join user_progress p on p.user_id = u.id
    left join user_profile pr on pr.user_id = u.id
    where u.email is not null and u.email <> ''
    order by score desc, u.name asc
  `;
  return {
    leaders: rows.map((row) => {
      const tests = testsOf(row.desk);
      const activity = withFinishedTests(activityOf(row.cards), tests);
      const bankScore = Number(row.score ?? 0);
      const periods = withBankScore(periodTotals(activity), activity, bankScore);
      const counts = studyCounts(row.desk, row.bank);
      return {
        name: row.name?.trim() || "Resident",
        image: row.image ?? "",
        score: bankScore,
        periods,
        bio: row.bio ?? "",
        badges: badgeElements(tests),
        champion: isChampion(tests),
        ...counts,
      };
    }),
  };
});
