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
  blackops: boolean;
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
        coalesce(p.score, 0)::int as score,
        coalesce(a.blackops, false) as blackops
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
        blackops: Boolean(person.blackops),
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

export const blackOpsStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ admin: boolean; allowed: boolean; unlocked: boolean; hasPassword: boolean }> => {
    const sql = await getSql();
    const rows = await sql<{ email: string; blackops: boolean | null; open: boolean | null }>`
      select u.email, a.blackops, a.blackops_open as open
      from "user" u
      left join account_access a on a.user_id = u.id
      where u.id = ${context.userId}
    `;
    const secret = await sql<{ value: string }>`select value from site_secret where key = 'blackops'`;
    const admin = isAdminEmail(rows[0]?.email);
    return {
      admin,
      allowed: admin || Boolean(rows[0]?.blackops),
      unlocked: admin || Boolean(rows[0]?.open),
      hasPassword: Boolean(secret[0]?.value),
    };
  });

export const unlockBlackOps = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { password: string }) => {
    const password = data?.password?.trim() ?? "";
    if (!password || password.length > 80) throw new Error("Enter the password.");
    return { password };
  })
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const who = await sql<{ email: string; blackops: boolean | null }>`
      select u.email, a.blackops
      from "user" u
      left join account_access a on a.user_id = u.id
      where u.id = ${context.userId}
    `;
    const admin = isAdminEmail(who[0]?.email);
    if (!admin && !who[0]?.blackops) throw new Error("Black Ops access is closed for this account.");
    const secret = await sql<{ value: string }>`select value from site_secret where key = 'blackops'`;
    if (!secret[0]?.value || secret[0].value !== data.password) throw new Error("Wrong password.");
    await sql`
      insert into account_access (user_id, status, blackops, blackops_open)
      values (${context.userId}, 'approved', true, true)
      on conflict (user_id) do update set blackops = true, blackops_open = true
    `;
    return { ok: true as const };
  });

export const setBlackOpsPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { password: string }) => {
    const password = data?.password?.trim() ?? "";
    if (password.length < 4 || password.length > 80) throw new Error("Use at least 4 characters.");
    return { password };
  })
  .handler(async ({ data, context }) => {
    const sql = await requireAdmin(context.userId);
    await sql`
      insert into site_secret (key, value) values ('blackops', ${data.password})
      on conflict (key) do update set value = excluded.value
    `;
    await sql`update account_access set blackops_open = false`;
    return { ok: true as const };
  });

export const setBlackOpsAccess = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { userId: string; allowed: boolean }) => {
    if (!data?.userId || typeof data.allowed !== "boolean") throw new Error("Bad request.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const sql = await requireAdmin(context.userId);
    const target = await sql<{ email: string }>`select email from "user" where id = ${data.userId}`;
    if (!target[0]) throw new Error("No such account.");
    if (isAdminEmail(target[0].email)) throw new Error("That account already has Black Ops.");
    await sql`
      insert into account_access (user_id, status, blackops, blackops_open)
      values (${data.userId}, 'approved', ${data.allowed}, false)
      on conflict (user_id) do update set blackops = ${data.allowed}, blackops_open = false
    `;
    return { ok: true as const };
  });

