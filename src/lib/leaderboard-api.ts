import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { badgeElements, isChampion } from "@/lib/desk/route";
import { periodTotals, withBankScore, type PeriodScores } from "@/lib/desk/periods";
import type { TestBlock } from "@/lib/desk/types";

export type Leader = {
  name: string;
  image: string;
  score: number;
  periods: PeriodScores;
  bio: string;
  badges: string[];
  champion: boolean;
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

function activityOf(cards: unknown): Record<string, { correct?: number }> {
  try {
    const value = typeof cards === "string" ? JSON.parse(cards) : cards;
    if (!value || Array.isArray(value)) return {};
    const activity = (value as { activity?: Record<string, { correct?: number }> }).activity;
    return activity && typeof activity === "object" ? activity : {};
  } catch {
    return {};
  }
}

export const listLeaders = createServerFn({ method: "GET" }).handler(async (): Promise<{ leaders: Leader[] }> => {
  const sql = await getSql();
  const rows = await sql<{ name: string | null; image: string | null; score: number | null; bio: string | null; desk: unknown; cards: unknown }>`
    select u.name, u.image, coalesce(p.score, 0) as score, coalesce(pr.bio, '') as bio, p.desk as desk, p.cards as cards
    from "user" u
    left join user_progress p on p.user_id = u.id
    left join user_profile pr on pr.user_id = u.id
    where u.email is not null and u.email <> ''
    order by score desc, u.name asc
  `;
  return {
    leaders: rows.map((row) => {
      const tests = testsOf(row.desk);
      const activity = activityOf(row.cards);
      const bankScore = Number(row.score ?? 0);
      const periods = withBankScore(periodTotals(activity), activity, bankScore);
      return {
        name: row.name?.trim() || "Resident",
        image: row.image ?? "",
        score: bankScore,
        periods,
        bio: row.bio ?? "",
        badges: badgeElements(tests),
        champion: isChampion(tests),
      };
    }),
  };
});
