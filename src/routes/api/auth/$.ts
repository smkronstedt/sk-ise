import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

async function handle(request: Request) {
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

