import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type { IseReport } from "@/lib/desk/ise";
import { getSql } from "@/lib/db";

function cleanReport(data: IseReport): IseReport {
  const year = Math.round(Number(data?.year));
  const score = Math.round(Number(data?.score));
  const percentile = Math.round(Number(data?.percentile));
  if (year < 2015 || year > 2035 || score < 0 || score > 100 || percentile < 0 || percentile > 100) {
    throw new Error("Enter a year, a score from 0 to 100, and a percentile from 0 to 100.");
  }
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
  const leaks = (Array.isArray(data?.leaks) ? data.leaks : []).slice(0, 4).map((row) => {
    const label = String(row?.label ?? "").trim().slice(0, 80);
    const items = Math.round(Number(row?.items));
    const leakScore = Math.round(Number(row?.score));
    if (!label || items < 1 || items > 200 || leakScore < 0 || leakScore > 100) {
      throw new Error("Each weak section needs a name, a percent, and how many items it had.");
    }
    return { label, items, score: leakScore };
  });
  return { year, score, percentile, prior, leaks };
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
