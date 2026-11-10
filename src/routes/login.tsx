import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { authClient, authEnabled, setBearerToken } from "@/lib/auth/client";
import { Shell } from "@/components/desk/shell";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "signup" ? ("signup" as const) : ("signin" as const),
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);

  const submit = async () => {
    setError(null);
    setPending(true);
    try {
      if (mode === "forgot") {
        const response = await fetch("/api/auth/request-password-reset", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: email.trim(), redirectTo: `${window.location.origin}/reset` }),
        });
        if (!response.ok) throw new Error("Could not send the reset email. Try again in a minute.");
        setSent(true);
        return;
      }
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0],
          callbackURL: `${window.location.origin}/`,
        });
        if (err) throw new Error(err.message ?? "Sign up failed");
        setSent(true);
        return;
      }
      const { data, error: err } = await authClient.signIn.email({ email, password, rememberMe: true });
      if (err) throw new Error(err.message ?? "Sign in failed");
      const token = data && "token" in data ? data.token : null;
      if (typeof token === "string") setBearerToken(token);
      const session = await authClient.getSession();
      if (!session.data?.user) throw new Error("This browser did not keep the session. Try again.");
      window.location.href = "/";
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      if (message.toLowerCase().includes("not verified")) {
        setNeedsVerify(true);
        setError("Confirm that email first. The link goes only to the address you signed up with.");
      } else {
        setError(message);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-sm">
        <h1 className="font-serif text-2xl">{mode === "signup" ? "Create account" : mode === "forgot" ? "Forgot password" : "Sign in"}</h1>
        <p className="mt-1 text-sm text-muted">
          {mode === "forgot"
            ? "Type the email on the account. If it matches, that address gets the reset link. No other address is emailed."
            : mode === "signin"
            ? "Sign in so this browser and your other devices share one account."
            : "Use your name. The desk stays closed until the account is approved. Your questions and prizes stay on that profile."}
        </p>
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
            {mode === "signup" ? (
              <label className="text-sm font-semibold">
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 w-full rounded border border-line px-3 py-2"
                />
              </label>
            ) : null}
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
            {mode === "forgot" ? null : (
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
            )}
            {error ? <p className="text-sm text-wrong">{error}</p> : null}
            {sent && mode === "forgot" ? <p className="text-sm">If that email is on an account, a reset link is on its way to the address on file.</p> : null}
            {sent && mode === "signup" ? <p className="text-sm">Check that inbox and click the confirm link. After that, the account shows up for approval. The link only goes to the email you just typed.</p> : null}
            {needsVerify ? (
              <button
                type="button"
                onClick={() => {
                  void fetch("/api/auth/send-verification-email", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ email: email.trim(), callbackURL: `${window.location.origin}/` }),
                  }).then(() => setSent(true));
                }}
                className="text-sm font-semibold text-blue"
              >
                Send the confirm link again
              </button>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 rounded bg-navy font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Working…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Email reset link" : "Sign in"}
            </button>
            {mode === "signin" ? (
              <button type="button" onClick={() => { setMode("forgot"); setError(null); setSent(false); }} className="text-sm font-semibold text-blue">
                Forgot password?
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setSent(false);
              }}
              className="text-sm font-semibold text-blue"
            >
              {mode === "signup" ? "Already have an account? Sign in" : mode === "forgot" ? "Back to sign in" : "Need an account? Sign up"}
            </button>
          </form>
        )}
      </div>
    </Shell>
  );
}
