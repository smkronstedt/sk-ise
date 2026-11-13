import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export const challengeKinds = [
  { id: "ten", label: "Ten correct today" },
  { id: "row", label: "Five correct in a row" },
  { id: "miles", label: "Five miles" },
  { id: "week", label: "More correct than me this week" },
  { id: "duel", label: "Question duel" },
] as const;

export const duelSizes = [10, 15, 20] as const;
export type DuelSize = (typeof duelSizes)[number];

export type ChallengeKind = (typeof challengeKinds)[number]["id"];

export type ChallengeRow = {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  kind: string;
  status: string;
  count?: number | null;
  questionIds?: string[];
  fromScore?: number | null;
  toScore?: number | null;
  fromPower?: number | null;
  toPower?: number | null;
};

export type ChallengeBoard = {
  me: string;
  people: { id: string; name: string; image: string }[];
  pending: number;
  rows: ChallengeRow[];
};

const kinds = new Set(challengeKinds.map((item) => item.id));

export function duelSize(value: unknown): DuelSize | null {
  return value === 10 || value === 15 || value === 20 ? value : null;
}

export function challengeTitle(kind: string, count?: number | null) {
  if (kind === "duel") {
    const size = duelSize(count);
    return size ? `${size}-question duel` : "Question duel";
  }
  return challengeKinds.find((item) => item.id === kind)?.label ?? kind;
}

export function duelVerdict(row: ChallengeRow, me: string) {
  if (row.kind !== "duel" || row.status !== "accepted") return "";
  const mineIsFrom = row.fromId === me;
  const mine = mineIsFrom ? row.fromScore : row.toScore;
  const theirs = mineIsFrom ? row.toScore : row.fromScore;
  const myPower = mineIsFrom ? row.fromPower : row.toPower;
  const theirPower = mineIsFrom ? row.toPower : row.fromPower;
  const of = row.count ? `/${row.count}` : "";
  if (mine == null && theirs == null) return "Same questions for both of you. Start whenever you want.";
  if (mine == null) return `They finished ${theirs}${of}. Your turn.`;
  if (theirs == null) return `You scored ${mine}${of} · party ${myPower ?? 0}. Waiting on them.`;
  const line = `You ${mine}${of} (party ${myPower ?? 0}) · them ${theirs}${of} (party ${theirPower ?? 0})`;
  if (mine > theirs) return `You won. ${line}`;
  if (theirs > mine) return `They won. ${line}`;
  if ((myPower ?? 0) !== (theirPower ?? 0)) {
    return `${(myPower ?? 0) > (theirPower ?? 0) ? "Questions tied. Your party breaks it." : "Questions tied. Their party breaks it."} ${line}`;
  }
  return `Draw. ${line}`;
}

function parseIds(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return undefined;
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return undefined;
  }
}

function drawIds(pool: readonly string[], count: number) {
  const copy = pool.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j];
    copy[j] = swap;
  }
  return copy.slice(0, count);
}

export const challengeBoard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ChallengeBoard> => {
    const sql = await getSql();
    const people = await sql<{ id: string; name: string | null; image: string | null }>`
      select u.id, u.name, u.image
      from "user" u
      where u.email is not null and u.email <> '' and u.id <> ${context.userId}
      order by u.name asc
    `;
    const rows = await sql<{
      id: string;
      from_id: string;
      to_id: string;
      from_name: string | null;
      to_name: string | null;
      kind: string;
      status: string;
      duel_count: number | null;
      question_ids: string | null;
      from_score: number | null;
      to_score: number | null;
      from_power: number | null;
      to_power: number | null;
    }>`
      select c.id, c.from_id, c.to_id, f.name as from_name, t.name as to_name, c.kind, c.status,
             c.duel_count, c.question_ids, c.from_score, c.to_score, c.from_power, c.to_power
      from challenges c
      join "user" f on f.id = c.from_id
      join "user" t on t.id = c.to_id
      where c.from_id = ${context.userId} or c.to_id = ${context.userId}
      order by c.created_at desc
      limit 40
    `;
    return {
      me: context.userId,
      people: people.map((row) => ({ id: row.id, name: row.name?.trim() || "Resident", image: row.image ?? "" })),
      pending: rows.filter((row) => row.to_id === context.userId && row.status === "pending").length,
      rows: rows.map((row) => ({
        id: row.id,
        fromId: row.from_id,
        toId: row.to_id,
        fromName: row.from_name?.trim() || "Resident",
        toName: row.to_name?.trim() || "Resident",
        kind: row.kind,
        status: row.status,
        count: row.duel_count,
        questionIds: parseIds(row.question_ids),
        fromScore: row.from_score,
        toScore: row.to_score,
        fromPower: row.from_power,
        toPower: row.to_power,
      })),
    };
  });

export const sendChallenge = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { toId: string; kind: string; count?: number }) => {
    if (!data?.toId || !kinds.has(data.kind as ChallengeKind)) throw new Error("Pick a person and a challenge.");
    const count = data.kind === "duel" ? duelSize(data.count) : null;
    if (data.kind === "duel" && !count) throw new Error("Pick 10, 15, or 20 questions.");
    return { toId: data.toId, kind: data.kind as ChallengeKind, count };
  })
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    if (data.toId === context.userId) throw new Error("Pick someone else.");
    const id = crypto.randomUUID();
    await sql`
      insert into challenges (id, from_id, to_id, kind, duel_count)
      values (${id}, ${context.userId}, ${data.toId}, ${data.kind}, ${data.count})
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
    const [row] = await sql<{ kind: string; duel_count: number | null; question_ids: string | null }>`
      select kind, duel_count, question_ids
      from challenges
      where id = ${data.id} and to_id = ${context.userId} and status = 'pending'
    `;
    if (!row) return { ok: true as const };
    if (!data.accept) {
      await sql`
        update challenges set status = 'declined'
        where id = ${data.id} and to_id = ${context.userId} and status = 'pending'
      `;
      return { ok: true as const };
    }
    let stored = row.question_ids;
    if (row.kind === "duel" && !parseIds(stored)?.length) {
      const { bankIds } = await import("@/lib/desk/bank-ids");
      const count = duelSize(row.duel_count) ?? 10;
      stored = JSON.stringify(drawIds(bankIds, count));
    }
    await sql`
      update challenges
      set status = 'accepted', question_ids = ${stored}
      where id = ${data.id} and to_id = ${context.userId} and status = 'pending'
    `;
    return { ok: true as const };
  });

export const reportDuelScore = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string; score: number; power: number }) => {
    if (!data?.id) throw new Error("Missing duel.");
    const score = Math.round(Number(data.score));
    const power = Math.round(Number(data.power));
    if (!Number.isFinite(score) || score < 0 || score > 20) throw new Error("Bad score.");
    if (!Number.isFinite(power) || power < 0 || power > 9999) throw new Error("Bad party strength.");
    return { id: data.id, score, power };
  })
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql`
      update challenges
      set from_score = ${data.score}, from_power = ${data.power}
      where id = ${data.id} and from_id = ${context.userId} and kind = 'duel' and status = 'accepted' and from_score is null
    `;
    await sql`
      update challenges
      set to_score = ${data.score}, to_power = ${data.power}
      where id = ${data.id} and to_id = ${context.userId} and kind = 'duel' and status = 'accepted' and to_score is null
    `;
    return { ok: true as const };
  });
