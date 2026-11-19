import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { isAdminEmail } from "@/lib/admin-email";
import { applySaspCredits } from "@/lib/desk/sasp-credit";

export const loadProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ payload: string } | null> => {
    const sql = await getSql();
    const rows = await sql<{ desk: unknown; bank: unknown; cards: unknown }>`
      select desk, bank, cards from user_progress where user_id = ${context.userId}
    `;
    const row = rows[0];
    if (!row) {
      const credited = await creditFor(sql, context.userId, {}, {});
      if (!credited) return null;
      const score = bankScore(credited.bank);
      await sql`
        insert into user_progress (user_id, desk, bank, cards, score, updated_at)
        values (${context.userId}, ${JSON.stringify({})}::jsonb, ${JSON.stringify(credited.bank)}::jsonb, ${JSON.stringify(credited.cards)}::jsonb, ${score}, now())
        on conflict (user_id) do nothing
      `;
      return { payload: JSON.stringify({ desk: {}, bank: credited.bank, cards: credited.cards }) };
    }
    const credited = await creditFor(sql, context.userId, row.bank, row.cards);
    if (!credited) return { payload: JSON.stringify(row) };
    const score = bankScore(credited.bank);
    await sql`
      update user_progress
      set bank = ${JSON.stringify(credited.bank)}::jsonb,
          cards = ${JSON.stringify(credited.cards)}::jsonb,
          score = ${score},
          updated_at = now()
      where user_id = ${context.userId}
    `;
    return { payload: JSON.stringify({ ...row, bank: credited.bank, cards: credited.cards }) };
  });

export const saveProgress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { payload: string }) => {
    if (typeof data?.payload !== "string" || data.payload.length > 4_000_000) {
      throw new Error("Progress payload is missing.");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const parsed = JSON.parse(data.payload) as { desk?: unknown; bank?: unknown; cards?: unknown };
    const sql = await getSql();
    const credited = await creditFor(sql, context.userId, parsed.bank ?? {}, parsed.cards ?? {});
    const bank = credited?.bank ?? parsed.bank ?? {};
    const cards = credited?.cards ?? parsed.cards ?? {};
    const desk = JSON.stringify(parsed.desk ?? {});
    const score = bankScore(bank);
    await sql`
      insert into user_progress (user_id, desk, bank, cards, score, updated_at)
      values (${context.userId}, ${desk}::jsonb, ${JSON.stringify(bank)}::jsonb, ${JSON.stringify(cards)}::jsonb, ${score}, now())
      on conflict (user_id) do update set
        desk = excluded.desk,
        bank = excluded.bank,
        cards = excluded.cards,
        score = excluded.score,
        updated_at = now()
    `;
    return { ok: true as const };
  });

async function creditFor(sql: Awaited<ReturnType<typeof getSql>>, userId: string, bank: unknown, cards: unknown) {
  const who = await sql<{ email: string | null }>`select email from "user" where id = ${userId}`;
  if (!isAdminEmail(who[0]?.email)) return null;
  const applied = applySaspCredits(bank, cards);
  return applied.changed ? applied : null;
}

function bankScore(bank: unknown) {
  const answers = (bank as { answers?: Record<string, { correct?: boolean }> } | null)?.answers;
  if (!answers) return 0;
  return Object.values(answers).filter((row) => row?.correct).length;
}
