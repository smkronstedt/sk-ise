import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/desk/shell";

export const Route = createFileRoute("/reset")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
    error: typeof search.error === "string" ? search.error : "",
  }),
  component: ResetPage,
});

function ResetPage() {
  const { token, error: linkError } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(linkError ? "That reset link is no longer good. Ask for a new one." : null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setError(null);
    if (!token) {
      setError("This page needs the link from the email.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those two passwords do not match.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newPassword: password, token }),
      });
      if (!response.ok) throw new Error("That link expired or was already used. Ask for a new one.");
      setDone(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not reset the password.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-sm">
        <h1 className="font-serif text-2xl">New password</h1>
        <p className="mt-1 text-sm text-muted">This link only works for the email already on the account.</p>
        {done ? (
          <p className="mt-4 text-sm">
            Password saved. <Link to="/login" search={{ mode: "signin" }} className="font-semibold text-blue">Sign in</Link>
          </p>
        ) : (
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <label className="text-sm font-semibold">
              New password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} className="mt-1 w-full rounded border border-line px-3 py-2" />
            </label>
            <label className="text-sm font-semibold">
              Type it again
              <input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required minLength={8} className="mt-1 w-full rounded border border-line px-3 py-2" />
            </label>
            {error ? <p className="text-sm text-wrong">{error}</p> : null}
            <button type="submit" disabled={pending || !token} className="min-h-11 rounded bg-navy font-semibold text-white disabled:opacity-50">
              {pending ? "Saving…" : "Save password"}
            </button>
            <Link to="/login" search={{ mode: "signin" }} className="text-sm font-semibold text-blue">Back to sign in</Link>
          </form>
        )}
      </div>
    </Shell>
  );
}
