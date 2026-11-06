import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export type Profile = { name: string; email: string; image: string; bio: string };

export const loadProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Profile | null> => {
    const sql = await getSql();
    const rows = await sql<{ name: string; email: string; image: string | null; bio: string | null }>`
      select u.name, u.email, u.image, pr.bio
      from "user" u
      left join user_profile pr on pr.user_id = u.id
      where u.id = ${context.userId}
    `;
    const row = rows[0];
    if (!row) return null;
    return { name: row.name, email: row.email, image: row.image ?? "", bio: row.bio ?? "" };
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { name: string; bio: string; image: string }) => {
    if (data.image && data.image.length > 500_000) throw new Error("Photo is too large. Use a smaller picture.");
    return {
      name: data.name.trim().slice(0, 80) || "Resident",
      bio: data.bio.trim().slice(0, 280),
      image: data.image,
    };
  })
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql`
      update "user"
      set name = ${data.name}, image = ${data.image || null}, "updatedAt" = now()
      where id = ${context.userId}
    `;
    await sql`
      insert into user_profile (user_id, bio, updated_at)
      values (${context.userId}, ${data.bio}, now())
      on conflict (user_id) do update set bio = excluded.bio, updated_at = now()
    `;
    return { ok: true as const };
  });

export const changeLoginEmail = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { email: string }) => {
    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email.");
    return { email };
  })
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const taken = await sql<{ id: string }>`
      select id from "user" where email = ${data.email} and id <> ${context.userId}
    `;
    if (taken.length) throw new Error("That email is already in use.");
    await sql`
      update "user" set email = ${data.email}, "emailVerified" = true, "updatedAt" = now()
      where id = ${context.userId}
    `;
    return { ok: true as const };
  });
