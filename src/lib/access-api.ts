import { createServerFn } from "@tanstack/react-start";
import { isAdminEmail } from "@/lib/admin-email";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export type AccessStatus = "pending" | "approved" | "denied";

export type Person = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  status: AccessStatus;
  score: number;
};

async function requireAdmin(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ email: string }>`select email from "user" where id = ${userId}`;
  if (!isAdminEmail(rows[0]?.email)) throw new Error("Not allowed.");
  return sql;
}

export const myAccess = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ status: AccessStatus; admin: boolean }> => {
    const sql = await getSql();
    const rows = await sql<{ email: string; status: string | null }>`
      select u.email, a.status
      from "user" u
      left join account_access a on a.user_id = u.id
      where u.id = ${context.userId}
    `;
    const status = rows[0]?.status;
    const known: AccessStatus = status === "pending" || status === "denied" ? status : "approved";
    return { status: known, admin: isAdminEmail(rows[0]?.email) };
  });

export const listPeople = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ people: Person[] }> => {
    const sql = await requireAdmin(context.userId);
    const people = await sql<Person>`
      select u.id, u.name, u.email, u."createdAt"::text as "createdAt",
        coalesce(a.status, 'approved') as status,
        coalesce(p.score, 0)::int as score
      from "user" u
      left join account_access a on a.user_id = u.id
      left join user_progress p on p.user_id = u.id
      order by case when coalesce(a.status, 'approved') = 'pending' then 0 else 1 end, u."createdAt" desc
    `;
    return {
      people: people.map((person) => ({
        ...person,
        status: person.status === "pending" || person.status === "denied" ? person.status : "approved",
        score: Number(person.score) || 0,
      })),
    };
  });

export const setAccess = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { userId: string; status: "approved" | "denied" }) => {
    if (!data?.userId || (data.status !== "approved" && data.status !== "denied")) {
      throw new Error("Bad request.");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const sql = await requireAdmin(context.userId);
    const target = await sql<{ email: string }>`select email from "user" where id = ${data.userId}`;
    if (!target[0]) throw new Error("No such account.");
    if (isAdminEmail(target[0].email)) throw new Error("That account stays open.");
    await sql`
      insert into account_access (user_id, status, decided_at)
      values (${data.userId}, ${data.status}, now())
      on conflict (user_id) do update set status = excluded.status, decided_at = now()
    `;
    if (data.status === "denied") {
      await sql`delete from "session" where "userId" = ${data.userId}`;
    }
    return { ok: true as const };
  });
