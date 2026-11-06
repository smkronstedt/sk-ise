import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { authClient } from "@/lib/auth/client";
import { changeLoginEmail, loadProfile } from "@/lib/account-api";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadProfile()
      .then((profile) => {
        if (profile) setEmail(profile.email);
      })
      .catch(() => setError("Could not load your account."));
  }, []);

  const saveEmail = async () => {
    setError("");
    setNote("");
    try {
      await changeLoginEmail({ data: { email } });
      setNote("Email updated. Use it the next time you sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the email.");
    }
  };

  const savePassword = async () => {
    setError("");
    setNote("");
    const { error: err } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    });
    if (err) {
      setError(err.message ?? "Could not change the password.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setNote("Password updated.");
  };

  return (
    <Shell>
      <h1 className="font-serif text-3xl">Settings</h1>
      <div className="mt-4 grid max-w-lg gap-4">
        <form
          className="rounded border border-line bg-paper p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void saveEmail();
          }}
        >
          <h2 className="font-semibold">Email</h2>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded border border-line px-3 py-2"
          />
          <button type="submit" className="mt-3 min-h-11 rounded bg-navy px-4 font-semibold text-white">
            Update email
          </button>
        </form>
        <form
          className="rounded border border-line bg-paper p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void savePassword();
          }}
        >
          <h2 className="font-semibold">Password</h2>
          <label className="mt-2 block text-sm font-semibold">
            Current password
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-1 w-full rounded border border-line px-3 py-2 font-normal"
            />
          </label>
          <label className="mt-3 block text-sm font-semibold">
            New password
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-1 w-full rounded border border-line px-3 py-2 font-normal"
            />
          </label>
          <button type="submit" className="mt-3 min-h-11 rounded bg-navy px-4 font-semibold text-white">
            Update password
          </button>
        </form>
        {error ? <p className="text-sm text-wrong">{error}</p> : null}
        {note ? <p className="text-sm font-semibold text-correct">{note}</p> : null}
      </div>
    </Shell>
  );
}
