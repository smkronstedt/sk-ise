import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { listPeople, setAccess, setBlackOpsAccess, setBlackOpsPassword, setUndisclosedPassword, setUserPassword, type Person } from "@/lib/access-api";
import { setBookletsPassword } from "@/lib/booklets-api";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function PasswordReset({ person, onError, onSaved }: { person: Person; onError: (message: string) => void; onSaved: (message: string) => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-2 flex flex-wrap gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        void setUserPassword({ data: { userId: person.id, password: value } })
          .then(() => {
            setValue("");
            onSaved(`Password updated for ${person.email}. They were signed out.`);
          })
          .catch((err: unknown) => onError(err instanceof Error ? err.message : "Could not set that password."))
          .finally(() => setBusy(false));
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="New password"
        minLength={8}
        className="min-h-11 w-48 rounded border border-line px-3 text-sm"
      />
      <button type="submit" disabled={busy || value.length < 8} className="min-h-11 rounded border border-line px-3 text-sm font-semibold disabled:opacity-50">
        Set password
      </button>
    </form>
  );
}

function AdminPage() {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [password, setPassword] = useState("");
  const [bookletPassword, setBookletPassword] = useState("");
  const [undisclosedPassword, setUndisclosedPasswordValue] = useState("");
  const [saved, setSaved] = useState("");

  const load = () => {
    setError("");
    void listPeople()
      .then((result) => setPeople(result.people))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load accounts."));
  };

  useEffect(() => {
    load();
  }, []);

  const decide = (userId: string, status: "approved" | "denied") => {
    setBusy(userId);
    void setAccess({ data: { userId, status } })
      .then(() => load())
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not update that account."))
      .finally(() => setBusy(""));
  };

  const waiting = (people ?? []).filter((person) => person.status === "pending" && person.emailVerified);

  return (
    <Shell>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Admin</p>
          <h1 className="font-serif text-3xl tracking-tight">Accounts</h1>
        </div>
        <button type="button" onClick={load} className="min-h-11 rounded border border-line bg-paper px-3 text-sm font-semibold">
          Refresh
        </button>
      </div>
      {error ? <p className="mb-3 text-sm text-wrong">{error}</p> : null}
      <section className="rounded border border-line bg-paper">
        <h2 className="border-b border-line px-4 py-3 font-semibold">Waiting for approval ({waiting.length})</h2>
        <p className="px-4 pt-3 text-sm text-muted">Only people who clicked the confirm link on their own email show up here.</p>
        {people === null ? <p className="px-4 py-3 text-sm text-muted">Loading…</p> : null}
        {people && waiting.length === 0 ? <p className="px-4 py-3 text-sm text-muted">No one is waiting.</p> : null}
        <ul>
          {waiting.map((person) => (
            <li key={person.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
              <div>
                <p className="font-semibold">{person.name || "No name"}</p>
                <p className="text-sm text-muted">{person.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy === person.id}
                  onClick={() => decide(person.id, "approved")}
                  className="min-h-11 rounded bg-navy px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy === person.id}
                  onClick={() => decide(person.id, "denied")}
                  className="min-h-11 rounded border border-wrong px-3 text-sm font-semibold text-wrong disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-4 rounded border border-line bg-paper">
        <h2 className="border-b border-line px-4 py-3 font-semibold">Everyone ({people?.length ?? 0})</h2>
        <p className="px-4 pt-3 text-sm text-muted">Approved accounts stay on this list. A new password signs that person out everywhere.</p>
        <ul>
          {(people ?? []).map((person) => (
            <li key={person.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
              <div>
                <p className="font-semibold">{person.name || person.email}</p>
                <p className="text-sm text-muted">
                  {person.email} · {person.emailVerified ? person.status : "email not confirmed"} · {person.score} correct on the account
                </p>
                <PasswordReset person={person} onError={setError} onSaved={setSaved} />
              </div>
              <div className="flex flex-wrap gap-2">
                {person.emailVerified && person.status !== "approved" ? (
                  <button
                    type="button"
                    disabled={busy === person.id}
                    onClick={() => decide(person.id, "approved")}
                    className="min-h-11 rounded bg-navy px-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                ) : null}
                {person.emailVerified && person.status !== "denied" ? (
                  <button
                    type="button"
                    disabled={busy === person.id}
                    onClick={() => decide(person.id, "denied")}
                    className="min-h-11 rounded border border-wrong px-3 text-sm font-semibold text-wrong disabled:opacity-50"
                  >
                    {person.status === "approved" ? "Close access" : "Decline"}
                  </button>
                ) : null}
                {person.status === "approved" ? (
                  <button
                    type="button"
                    disabled={busy === person.id}
                    onClick={() => {
                      setBusy(person.id);
                      void setBlackOpsAccess({ data: { userId: person.id, allowed: !person.blackops } })
                        .then(() => load())
                        .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not update Black Ops."))
                        .finally(() => setBusy(""));
                    }}
                    className="min-h-11 rounded border border-line px-3 text-sm font-semibold disabled:opacity-50"
                  >
                    {person.blackops ? "Close Black Ops" : "Allow Black Ops"}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-4 rounded border border-line bg-paper p-4">
        <h2 className="font-semibold">Black Ops password</h2>
        <p className="mt-1 text-sm text-muted">This opens the Black Ops game. It does not open the undisclosed routes.</p>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSaved("");
            void setBlackOpsPassword({ data: { password } })
              .then(() => setSaved("Password updated."))
              .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not set the password."));
          }}
        >
          <input
            type="text"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-11 flex-1 rounded border border-line px-3"
          />
          <button type="submit" className="min-h-11 rounded bg-navy px-3 text-sm font-semibold text-white">
            Set password
          </button>
        </form>
        {saved ? <p className="mt-2 text-sm">{saved}</p> : null}
      </section>
      <section className="mb-4 rounded border border-line bg-paper p-4">
        <h2 className="font-semibold">Undisclosed password</h2>
        <p className="mt-1 text-sm text-muted">Separate from the Black Ops password. One entry opens every undisclosed route. Changing it locks them again.</p>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSaved("");
            void setUndisclosedPassword({ data: { password: undisclosedPassword } })
              .then(() => setSaved("Undisclosed password updated."))
              .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not set the password."));
          }}
        >
          <input
            type="text"
            value={undisclosedPassword}
            onChange={(event) => setUndisclosedPasswordValue(event.target.value)}
            className="min-h-11 flex-1 rounded border border-line px-3"
          />
          <button type="submit" className="min-h-11 rounded bg-navy px-3 text-sm font-semibold text-white">
            Set password
          </button>
        </form>
      </section>
      <section className="mb-4 rounded border border-line bg-paper p-4">
        <h2 className="font-semibold">Booklets password</h2>
        <p className="mt-1 text-sm text-muted">The Booklets page stays blank until this password is entered. Changing it does not unlock anyone who already has the page open.</p>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSaved("");
            void setBookletsPassword({ data: { password: bookletPassword } })
              .then(() => setSaved("Booklet password updated."))
              .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not set the password."));
          }}
        >
          <input
            type="text"
            value={bookletPassword}
            onChange={(event) => setBookletPassword(event.target.value)}
            className="min-h-11 flex-1 rounded border border-line px-3"
          />
          <button type="submit" className="min-h-11 rounded bg-navy px-3 text-sm font-semibold text-white">
            Set password
          </button>
        </form>
      </section>
    </Shell>
  );
}
