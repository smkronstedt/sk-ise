import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { importWorkouts } from "@/lib/desk/training";
import { linkStatus, saveStrava, syncStrava } from "@/lib/links-api";

export const Route = createFileRoute("/connections")({
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [athlete, setAthlete] = useState("");
  const [connected, setConnected] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void linkStatus()
      .then((status) => {
        if (status.strava) {
          setConnected(true);
          setAthlete(status.strava.athlete);
        }
      })
      .catch(() => setError("Sign in before adding a connection."));
  }, []);

  const save = () => {
    setBusy(true);
    setError("");
    setNote("");
    void saveStrava({ data: { clientId, clientSecret, refreshToken } })
      .then((result) => {
        setConnected(true);
        setAthlete(result.athlete);
        setClientSecret("");
        setRefreshToken("");
        setNote(result.athlete ? `Connected as ${result.athlete}.` : "Connected.");
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not add Strava."))
      .finally(() => setBusy(false));
  };

  const sync = () => {
    setBusy(true);
    setError("");
    setNote("");
    void syncStrava()
      .then((result) => {
        const added = importWorkouts(
          result.runs.map((run) => ({
            day: run.day,
            source: "strava" as const,
            kind: "run" as const,
            miles: run.miles,
            note: run.note,
            externalId: run.externalId,
          })),
        );
        if (result.athlete) setAthlete(result.athlete);
        setNote(`${added} new runs added. ${result.runs.length} runs on Strava. $1 a mile is already in the purse.`);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Sync failed."))
      .finally(() => setBusy(false));
  };

  return (
    <Shell>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Profile</p>
      <h1 className="font-serif text-3xl tracking-tight">Connections</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Strava is the login this site can keep. Garmin, TrainingPeaks, and Apple Health do not give a personal website a sign-in. Turn on Strava sharing in those apps, then sync here. The miles pay $1 each.
      </p>
      {error ? <p className="mt-3 text-sm text-wrong">{error}</p> : null}
      {note ? <p className="mt-3 text-sm">{note}</p> : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <section className="rounded border border-line bg-paper p-4">
          <h2 className="font-semibold">Strava {connected ? "· connected" : ""}</h2>
          {athlete ? <p className="mt-1 text-sm text-muted">{athlete}</p> : null}
          <p className="mt-1 text-sm text-muted">
            Open strava.com/settings/api, create an app, and paste the client ID, client secret, and refresh token. The callback domain can be sk-ise.vercel.app.
          </p>
          <label className="mt-3 block text-sm font-semibold">
            Client ID
            <input value={clientId} onChange={(event) => setClientId(event.target.value)} className="mt-1 w-full rounded border border-line px-3 py-2" />
          </label>
          <label className="mt-2 block text-sm font-semibold">
            Client secret
            <input value={clientSecret} onChange={(event) => setClientSecret(event.target.value)} type="password" className="mt-1 w-full rounded border border-line px-3 py-2" />
          </label>
          <label className="mt-2 block text-sm font-semibold">
            Refresh token
            <input value={refreshToken} onChange={(event) => setRefreshToken(event.target.value)} type="password" className="mt-1 w-full rounded border border-line px-3 py-2" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={save} className="min-h-11 rounded bg-navy px-3 text-sm font-semibold text-white disabled:opacity-50">
              Add Strava
            </button>
            <button type="button" disabled={busy || !connected} onClick={sync} className="min-h-11 rounded border border-line px-3 text-sm font-semibold disabled:opacity-50">
              Sync runs
            </button>
          </div>
        </section>
        <ShareCard
          name="Garmin Connect"
          body="In Garmin Connect, open Settings, then Connected Apps, and allow Strava. New runs show up the next time you sync Strava here."
        />
        <ShareCard
          name="TrainingPeaks"
          body="TrainingPeaks only gives its API to approved companies, not a personal site. Push completed workouts to Strava, or log them in Black Ops under Training and tag them TrainingPeaks."
        />
        <ShareCard
          name="Apple Health"
          body="Apple Health cannot sign in from a website. On the iPhone, open the Strava app and turn on Health access. Those runs sync with the Strava button."
        />
      </div>
      <Link to="/" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-blue">
        Open Black Ops and use Training
      </Link>
    </Shell>
  );
}

function ShareCard({ name, body }: { name: string; body: string }) {
  return (
    <section className="rounded border border-line bg-paper p-4">
      <h2 className="font-semibold">{name}</h2>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </section>
  );
}
