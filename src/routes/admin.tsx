import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { listPeople, setAccess, type Person } from "@/lib/access-api";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

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

  const waiting = (people ?? []).filter((person) => person.status === "pending");

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
        <h2 className="border-b border-line px-4 py-3 font-semibold">Waiting ({waiting.length})</h2>
        {people === null ? <p className="px-4 py-3 text-sm text-muted">Loading…</p> : null}
        {people && waiting.length === 0 ? <p className="px-4 py-3 text-sm text-muted">No one is waiting.</p> : null}
        <ul>
          {waiting.map((person) => (
            <li key={person.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
              <div>
                <p className="font-semibold">{person.name || "No name"}</p>
                <p className="text-sm text-muted">{person.email}</p>
              </div>
              <button
                type="button"
                disabled={busy === person.id}
                onClick={() => decide(person.id, "approved")}
                className="min-h-11 rounded bg-navy px-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                Approve
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-4 rounded border border-line bg-paper">
        <h2 className="border-b border-line px-4 py-3 font-semibold">Everyone</h2>
        <ul>
          {(people ?? []).map((person) => (
            <li key={person.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
              <div>
                <p className="font-semibold">{person.name || person.email}</p>
                <p className="text-sm text-muted">
                  {person.email} · {person.status} · {person.score} correct on the account
                </p>
              </div>
              {person.status !== "pending" ? (
                <button
                  type="button"
                  disabled={busy === person.id}
                  onClick={() => decide(person.id, person.status === "approved" ? "denied" : "approved")}
                  className="min-h-11 rounded border border-line px-3 text-sm font-semibold disabled:opacity-50"
                >
                  {person.status === "approved" ? "Close access" : "Approve"}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}
