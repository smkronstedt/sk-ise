import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

async function handle(request: Request) {
  const path = new URL(request.url).pathname;
  if (path.endsWith("/db-check")) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
    if (!url) return Response.json({ ok: false, message: "No database URL on the server." });
    try {
      const { Pool, neonConfig } = await import("@neondatabase/serverless");
      neonConfig.poolQueryViaFetch = true;
      const pool = new Pool({ connectionString: url, max: 1 });
      const result = await pool.query("select 1 as ok");
      await pool.end().catch(() => undefined);
      return Response.json({ ok: true, rows: result.rows });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Response.json({ ok: false, message });
    }
  }
  try {
    const response = await auth.handler(request);
    const body = await response.text();
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.delete("transfer-encoding");
    return new Response(body, { status: response.status, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign-in crashed before it could answer.";
    console.error("[auth]", message);
    return Response.json({ message, code: "AUTH_CRASH" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});

