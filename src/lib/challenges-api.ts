import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export const challengeKinds = [
  { id: "ten", label: "Ten correct today" },
  { id: "row", label: "Five correct in a row" },
  { id: "miles", label: "Five miles" },
  { id: "week", label: "More correct than me this week" },
] as const;

export type ChallengeKind = (typeof challengeKinds)[number]["id"];

export type ChallengeRow = {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  kind: string;
  status: string;
};

export type ChallengeBoard = {
  me: string;
  opted: boolean;
  people: { id: string; name: string; image: string }[];
  rows: ChallengeRow[];
};

const kinds = new Set(challengeKinds.map((item) => item.id));

export const challengeBoard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ChallengeBoard> => {
    const sql = await getSql();
    const mine = await sql<{ opted: boolean }>`
      select opted from challenge_opt where user_id = ${context.userId}
    `;
    const people = await sql<{ id: string; name: string | null; image: string | null }>`
      select u.id, u.name, u.image
      from challenge_opt o
      join "user" u on u.id = o.user_id
      where o.opted = true and u.id <> ${context.userId}
      order by u.name asc
    `;
    const rows = await sql<{ id: string; from_id: string; to_id: string; from_name: string | null; to_name: string | null; kind: string; status: string }>`
      select c.id, c.from_id, c.to_id, f.name as from_name, t.name as to_name, c.kind, c.status
      from challenges c
      join "user" f on f.id = c.from_id
      join "user" t on t.id = c.to_id
      where c.from_id = ${context.userId} or c.to_id = ${context.userId}
      order by c.created_at desc
      limit 40
    `;
    return {
      me: context.userId,
      opted: Boolean(mine[0]?.opted),
      people: people.map((row) => ({ id: row.id, name: row.name?.trim() || "Resident", image: row.image ?? "" })),
      rows: rows.map((row) => ({
        id: row.id,
        fromId: row.from_id,
        toId: row.to_id,
        fromName: row.from_name?.trim() || "Resident",
        toName: row.to_name?.trim() || "Resident",
        kind: row.kind,
        status: row.status,
      })),
    };
  });

export const setChallengeOpt = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { opted: boolean }) => ({ opted: Boolean(data?.opted) }))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql`
      insert into challenge_opt (user_id, opted)
      values (${context.userId}, ${data.opted})
      on conflict (user_id) do update set opted = excluded.opted
    `;
    return { ok: true as const };
  });

export const sendChallenge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { toId: string; kind: string }) => {
    if (!data?.toId || !kinds.has(data.kind as ChallengeKind)) throw new Error("Pick a person and a challenge.");
    return { toId: data.toId, kind: data.kind as ChallengeKind };
  })
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const ready = await sql<{ user_id: string }>`
      select user_id from challenge_opt
      where opted = true and user_id in (${context.userId}, ${data.toId})
    `;
    if (ready.length < 2) throw new Error("Both of you have to opt in first.");
    const id = crypto.randomUUID();
    await sql`
      insert into challenges (id, from_id, to_id, kind)
      values (${id}, ${context.userId}, ${data.toId}, ${data.kind})
    `;
    return { ok: true as const };
  });

export const answerChallenge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string; accept: boolean }) => {
    if (!data?.id) throw new Error("Missing challenge.");
    return { id: data.id, accept: Boolean(data.accept) };
  })
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql`
      update challenges
      set status = ${data.accept ? "accepted" : "declined"}
      where id = ${data.id} and to_id = ${context.userId} and status = 'pending'
    `;
    return { ok: true as const };
  });
