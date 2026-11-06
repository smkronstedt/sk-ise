import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { authClient, authEnabled } from "@/lib/auth/client";
import { Shell } from "@/components/desk/shell";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setError(null);
    setPending(true);
    try {
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({ email, password, name: email.split("@")[0] });
        if (err) throw new Error(err.message ?? "Sign up failed");
      } else {
        const { error: err } = await authClient.signIn.email({ email, password, rememberMe: true });
        if (err) throw new Error(err.message ?? "Sign in failed");
      }
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-sm">
        <h1 className="font-serif text-2xl">{mode === "signin" ? "Sign in" : "Create account"}</h1>
        <p className="mt-1 text-sm text-muted">Your progress will sync across browsers and devices.</p>
        {!authEnabled ? (
          <p className="mt-4 text-sm text-muted">Sign-in is not enabled on this deployment yet.</p>
        ) : (
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <label className="text-sm font-semibold">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded border border-line px-3 py-2"
              />
            </label>
            <label className="text-sm font-semibold">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1 w-full rounded border border-line px-3 py-2"
              />
            </label>
            {error ? <p className="text-sm text-wrong">{error}</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 rounded bg-navy font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-sm font-semibold text-blue"
            >
              {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </form>
        )}
      </div>
    </Shell>
  );
}
