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
  .inputValidator((data: { payload: string }) => {
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
    const cards = JSON.stringify(parsed.cards ?? []);
    await sql`
      insert into user_progress (user_id, desk, bank, cards, updated_at)
      values (${context.userId}, ${desk}::jsonb, ${bank}::jsonb, ${cards}::jsonb, now())
      on conflict (user_id) do update set
        desk = excluded.desk,
        bank = excluded.bank,
        cards = excluded.cards,
        updated_at = now()
    `;
    return { ok: true as const };
  });
