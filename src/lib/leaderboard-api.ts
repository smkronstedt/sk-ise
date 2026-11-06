import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { badgeElements, isChampion } from "@/lib/desk/route";
import type { TestBlock } from "@/lib/desk/types";

export type Leader = { name: string; image: string; score: number; bio: string; badges: string[]; champion: boolean };

function testsOf(desk: unknown): TestBlock[] {
  try {
    const value = typeof desk === "string" ? JSON.parse(desk) : desk;
    const tests = (value as { tests?: TestBlock[] } | null)?.tests;
    return Array.isArray(tests) ? tests : [];
  } catch {
    return [];
  }
}

export const listLeaders = createServerFn({ method: "GET" }).handler(async (): Promise<{ leaders: Leader[] }> => {
  const sql = await getSql();
  const rows = await sql<{ name: string | null; image: string | null; score: number | null; bio: string | null; desk: unknown }>`
    select u.name, u.image, coalesce(p.score, 0) as score, coalesce(pr.bio, '') as bio, p.desk as desk
    from "user" u
    left join user_progress p on p.user_id = u.id
    left join user_profile pr on pr.user_id = u.id
    where u.email is not null and u.email <> ''
    order by score desc, u.name asc
  `;
  return {
    leaders: rows.map((row) => {
      const tests = testsOf(row.desk);
      return {
        name: row.name?.trim() || "Resident",
        image: row.image ?? "",
        score: Number(row.score ?? 0),
        bio: row.bio ?? "",
        badges: badgeElements(tests),
        champion: isChampion(tests),
      };
    }),
  };
});