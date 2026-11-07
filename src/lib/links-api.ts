import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

type Run = { externalId: string; day: string; miles: number; note: string };

async function stravaToken(row: { client_id: string; client_secret: string; refresh_token: string; access_token: string | null; expires_at: number | null }, userId: string) {
  const fresh = row.access_token && row.expires_at && row.expires_at * 1000 > Date.now() + 60_000;
  if (fresh && row.access_token) return row.access_token;
  const body = new URLSearchParams({
    client_id: row.client_id,
    client_secret: row.client_secret,
    grant_type: "refresh_token",
    refresh_token: row.refresh_token,
  });
  const response = await fetch("https://www.strava.com/oauth/token", { method: "POST", body });
  const json = (await response.json()) as { access_token?: string; refresh_token?: string; expires_at?: number; message?: string; athlete?: { firstname?: string; lastname?: string } };
  if (!response.ok || !json.access_token) throw new Error(json.message || "Strava refused that refresh token.");
  const athlete = [json.athlete?.firstname, json.athlete?.lastname].filter(Boolean).join(" ");
  const sql = await getSql();
  await sql`
    update service_links
    set access_token = ${json.access_token},
        refresh_token = ${json.refresh_token ?? row.refresh_token},
        expires_at = ${json.expires_at ?? null},
        athlete = case when ${athlete} <> '' then ${athlete} else service_links.athlete end
    where user_id = ${userId} and provider = 'strava'
  `;
  return json.access_token;
}

export const linkStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ provider: string; athlete: string | null }>`
      select provider, athlete from service_links where user_id = ${context.userId}
    `;
    const strava = rows.find((row) => row.provider === "strava");
    return { strava: strava ? { athlete: strava.athlete ?? "" } : null };
  });

export const saveStrava = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { clientId: string; clientSecret: string; refreshToken: string }) => {
    const clientId = data?.clientId?.trim() ?? "";
    const clientSecret = data?.clientSecret?.trim() ?? "";
    const refreshToken = data?.refreshToken?.trim() ?? "";
    if (!clientId || !clientSecret || !refreshToken) throw new Error("Client ID, client secret, and refresh token are all required.");
    return { clientId, clientSecret, refreshToken };
  })
  .handler(async ({ data, context }) => {
    const body = new URLSearchParams({
      client_id: data.clientId,
      client_secret: data.clientSecret,
      grant_type: "refresh_token",
      refresh_token: data.refreshToken,
    });
    const response = await fetch("https://www.strava.com/oauth/token", { method: "POST", body });
    const json = (await response.json()) as { access_token?: string; refresh_token?: string; expires_at?: number; message?: string; athlete?: { firstname?: string; lastname?: string } };
    if (!response.ok || !json.access_token) throw new Error(json.message || "Strava did not accept those keys.");
    const athlete = [json.athlete?.firstname, json.athlete?.lastname].filter(Boolean).join(" ");
    const sql = await getSql();
    await sql`
      insert into service_links (user_id, provider, client_id, client_secret, refresh_token, access_token, expires_at, athlete)
      values (${context.userId}, 'strava', ${data.clientId}, ${data.clientSecret}, ${json.refresh_token ?? data.refreshToken}, ${json.access_token}, ${json.expires_at ?? null}, ${athlete})
      on conflict (user_id, provider) do update set
        client_id = excluded.client_id,
        client_secret = excluded.client_secret,
        refresh_token = excluded.refresh_token,
        access_token = excluded.access_token,
        expires_at = excluded.expires_at,
        athlete = excluded.athlete
    `;
    return { athlete };
  });

export const syncStrava = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ athlete: string; runs: Run[] }> => {
    const sql = await getSql();
    const rows = await sql<{ client_id: string; client_secret: string; refresh_token: string; access_token: string | null; expires_at: number | null; athlete: string | null }>`
      select client_id, client_secret, refresh_token, access_token, expires_at, athlete
      from service_links where user_id = ${context.userId} and provider = 'strava'
    `;
    const row = rows[0];
    if (!row) throw new Error("Add Strava first.");
    const token = await stravaToken(row, context.userId);
    const runs: Run[] = [];
    for (let page = 1; page <= 3; page++) {
      const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=100&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Strava did not return activities.");
      const list = (await response.json()) as { id: number; name?: string; type?: string; sport_type?: string; distance?: number; start_date_local?: string }[];
      if (!list.length) break;
      for (const activity of list) {
        const sport = activity.sport_type || activity.type || "";
        if (!/run/i.test(sport)) continue;
        const miles = (activity.distance ?? 0) / 1609.344;
        if (miles <= 0) continue;
        const day = (activity.start_date_local ?? "").slice(0, 10);
        if (!day) continue;
        runs.push({ externalId: `strava:${activity.id}`, day, miles: Math.round(miles * 100) / 100, note: activity.name || "Run" });
      }
    }
    return { athlete: row.athlete ?? "", runs };
  });
