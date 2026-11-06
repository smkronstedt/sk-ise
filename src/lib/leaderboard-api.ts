import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export type Leader = { name: string; image: string; score: number; bio: string };

export const listLeaders = createServerFn({ method: "GET" }).handler(async (): Promise<{ leaders: Leader[] }> => {
  const sql = await getSql();
  const rows = await sql<{ name: string | null; image: string | null; score: number | null; bio: string | null }>`
    select u.name, u.image, coalesce(p.score, 0) as score, coalesce(pr.bio, '') as bio
    from "user" u
    left join user_progress p on p.user_id = u.id
    left join user_profile pr on pr.user_id = u.id
    where u.email is not null and u.email <> ''
    order by score desc, u.name asc
  `;
  return {
    leaders: rows.map((row) => ({
      name: row.name?.trim() || "Resident",
      image: row.image ?? "",
      score: Number(row.score ?? 0),
      bio: row.bio ?? "",
    })),
  };
});
