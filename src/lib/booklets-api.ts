import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { booklets, notesRoot, uploadsRoot, type Booklet } from "@/lib/desk/booklets";
import { isAdminEmail } from "@/lib/admin-email";
import { getSql } from "@/lib/db";

export type BookletUnlock = {
  booklets: Booklet[];
  notesRoot: string;
  uploadsRoot: string;
};

export const unlockBooklets = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { password: string }) => {
    const password = data?.password?.trim() ?? "";
    if (!password || password.length > 80) throw new Error("Enter the password.");
    return { password };
  })
  .handler(async ({ data }): Promise<BookletUnlock> => {
    const sql = await getSql();
    const secret = await sql<{ value: string }>`select value from site_secret where key = 'booklets'`;
    if (!secret[0]?.value) throw new Error("No booklet password has been set.");
    if (secret[0].value !== data.password) throw new Error("Wrong password.");
    return { booklets, notesRoot, uploadsRoot };
  });

export const setBookletsPassword = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { password: string }) => {
    const password = data?.password?.trim() ?? "";
    if (password.length < 4 || password.length > 80) throw new Error("Use at least 4 characters.");
    return { password };
  })
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const rows = await sql<{ email: string }>`select email from "user" where id = ${context.userId}`;
    if (!isAdminEmail(rows[0]?.email)) throw new Error("Not allowed.");
    await sql`
      insert into site_secret (key, value) values ('booklets', ${data.password})
      on conflict (key) do update set value = excluded.value
    `;
    return { ok: true as const };
  });
