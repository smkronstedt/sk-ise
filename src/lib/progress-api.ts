import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export const loadProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ payload: string } | null> => {
    const sql = await getSql();
    const rows = await sql<{ desk: unknown; bank: unknown; cards: unknown }>`
      select desk, bank, cards from user_progress where user_id = ${context.userId}
    `;
    const row = rows[0];
    if (!row) return null;
    return { payload: JSON.stringify(row) };
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
    const desk = JSON.stringify(parsed.desk ?? {});
    const bank = JSON.stringify(parsed.bank ?? {});
    const cards = JSON.stringify(parsed.cards ?? {});
    const score = bankScore(parsed.bank);
    await sql`
      insert into user_progress (user_id, desk, bank, cards, score, updated_at)
      values (${context.userId}, ${desk}::jsonb, ${bank}::jsonb, ${cards}::jsonb, ${score}, now())
      on conflict (user_id) do update set
        desk = excluded.desk,
        bank = excluded.bank,
        cards = excluded.cards,
        score = excluded.score,
        updated_at = now()
    `;
    return { ok: true as const };
  });

function bankScore(bank: unknown) {
  const answers = (bank as { answers?: Record<string, { correct?: boolean }> } | null)?.answers;
  if (!answers) return 0;
  return Object.values(answers).filter((row) => row?.correct).length;
}
