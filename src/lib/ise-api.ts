import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { iseSections, type IseReport } from "@/lib/desk/ise";
import { getSql } from "@/lib/db";

const sectionIds = new Set(iseSections.map((row) => row.id));

function cleanReport(data: IseReport): IseReport {
  const year = Math.round(Number(data?.year));
  const score = Math.round(Number(data?.score));
  const percentile = Math.round(Number(data?.percentile));
  const items = Math.round(Number(data?.items ?? 0));
  if (year < 2015 || year > 2035 || score < 0 || score > 100 || percentile < 0 || percentile > 100) {
    throw new Error("Enter a year, a score from 0 to 100, and a percentile from 0 to 100.");
  }
  if (items < 0 || items > 300) throw new Error("Item count looks off.");
  let prior: IseReport["prior"] = null;
  if (data?.prior) {
    const priorYear = Math.round(Number(data.prior.year));
    const priorScore = Math.round(Number(data.prior.score));
    const priorPercentile = Math.round(Number(data.prior.percentile));
    if (priorYear < 2015 || priorYear > 2035 || priorScore < 0 || priorScore > 100 || priorPercentile < 0 || priorPercentile > 100) {
      throw new Error("The earlier year needs a score and a percentile, or leave it blank.");
    }
    prior = { year: priorYear, score: priorScore, percentile: priorPercentile };
  }
  const lines = (Array.isArray(data?.lines) ? data.lines : [])
    .filter((row) => sectionIds.has(String(row?.id)))
    .map((row) => {
      const count = Math.round(Number(row.items));
      const lineScore = Math.round(Number(row.score));
      if (count < 1 || count > 200 || lineScore < 0 || lineScore > 100) {
        throw new Error("Each filled section needs an item count and a percent from 0 to 100.");
      }
      return { id: String(row.id), items: count, score: lineScore };
    });
  return { year, score, percentile, items, prior, lines };
}

export const loadIseReport = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ report: IseReport | null }> => {
    const sql = await getSql();
    const rows = await sql<{ ise: IseReport | null }>`
      select ise from user_progress where user_id = ${context.userId}
    `;
    const raw = rows[0]?.ise;
    if (!raw || typeof raw !== "object") return { report: null };
    try {
      return { report: cleanReport(raw) };
    } catch {
      return { report: null };
    }
  });

export const saveIseReport = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: IseReport) => cleanReport(data))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const body = JSON.stringify(data);
    await sql`
      insert into user_progress (user_id, desk, bank, cards, ise)
      values (${context.userId}, '{}'::jsonb, '{}'::jsonb, '[]'::jsonb, ${body}::jsonb)
      on conflict (user_id) do update set ise = excluded.ise, updated_at = now()
    `;
    return { ok: true as const, report: data };
  });
