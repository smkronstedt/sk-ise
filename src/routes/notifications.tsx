import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { ChallengeCard } from "@/components/desk/challenge-card";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { challengeBoard, type ChallengeBoard } from "@/lib/challenges-api";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user, isPending } = useCurrentUserState();
  const [board, setBoard] = useState<ChallengeBoard | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setBoard(await challengeBoard());
      setError("");
    } catch {
      setError("Sign in to see challenges.");
    }
  };

  useEffect(() => {
    if (!isPending && user?.id) void load();
  }, [isPending, user?.id]);

  const incoming = board?.rows.filter((row) => row.toId === board.me && row.status === "pending") ?? [];
  const rest = board?.rows.filter((row) => !(row.toId === board.me && row.status === "pending")) ?? [];

  return (
    <Shell>
      <section className="rounded border border-line bg-paper p-4">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Inbox</p>
        <h1 className="font-serif text-3xl">Notifications</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">When someone challenges you, it lands here. Accept or decline. A duel uses the same questions for both of you, on your own time.</p>
        {error ? <p className="mt-3 text-sm text-wrong">{error}</p> : null}
        {!user && !isPending ? <p className="mt-3 text-sm">Sign in to get challenges.</p> : null}
        {user && !board && !error ? <p className="mt-3 text-sm">Checking…</p> : null}
        {incoming.length ? (
          <ul className="mt-4 flex flex-col gap-2">
            {incoming.map((row) => (
              <ChallengeCard key={row.id} row={row} me={board?.me ?? ""} onChange={() => void load()} />
            ))}
          </ul>
        ) : board ? (
          <p className="mt-4 text-sm">No challenges waiting.</p>
        ) : null}
        {rest.length ? (
          <ul className="mt-4 flex flex-col gap-2">
            {rest.map((row) => (
              <ChallengeCard key={row.id} row={row} me={board?.me ?? ""} onChange={() => void load()} />
            ))}
          </ul>
        ) : null}
        <p className="mt-4 text-sm">
          <Link to="/leaderboard" className="font-semibold underline">Send one from the leaderboard.</Link>
        </p>
      </section>
    </Shell>
  );
}
