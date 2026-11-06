import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export type ProgressRow = {
  desk: unknown;
  bank: unknown;
  cards: unknown;
};

export const loadProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ProgressRow | null> => {
    const sql = await getSql();
    const rows = await sql<ProgressRow>`
      select desk, bank, cards from user_progress where user_id = ${context.userId}
    `;
    return rows[0] ?? null;
  });

export const saveProgress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: ProgressRow) => data)
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql`
      insert into user_progress (user_id, desk, bank, cards, updated_at)
      values (${context.userId}, ${JSON.stringify(data.desk)}::jsonb, ${JSON.stringify(data.bank)}::jsonb, ${JSON.stringify(data.cards)}::jsonb, now())
      on conflict (user_id) do update set
        desk = excluded.desk,
        bank = excluded.bank,
        cards = excluded.cards,
        updated_at = now()
    `;
    return { ok: true };
  });
