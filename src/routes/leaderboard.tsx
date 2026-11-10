import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { Badge } from "@/components/desk/badge";
import { listLeaders, type Leader } from "@/lib/leaderboard-api";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { syncDeviceProgress } from "@/lib/progress-sync";
import type { PeriodScores } from "@/lib/desk/periods";
import { answerChallenge, challengeBoard, challengeKinds, sendChallenge, type ChallengeBoard } from "@/lib/challenges-api";
import { honors } from "@/lib/desk/honors";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

const titles = ["Olympian", "Hero", "Champion", "Argonaut", "Hoplite"];
const boards: { id: keyof PeriodScores | "challenges" | "badges"; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
  { id: "challenges", label: "Challenges" },
  { id: "badges", label: "Badges" },
];

function titleFor(index: number, score: number) {
  if (score <= 0) return "No score yet";
  return titles[index] ?? "Hoplite";
}

function ranked(leaders: Leader[], board: keyof PeriodScores) {
  return [...leaders].sort((a, b) => b.periods[board] - a.periods[board] || a.name.localeCompare(b.name));
}

function Board({ board, label, leaders }: { board: keyof PeriodScores; label: string; leaders: Leader[] }) {
  const shown = ranked(leaders, board);
  return (
    <section id={`board-${board}`} className="scroll-mt-32 px-4 pb-8">
      <h2 className="font-serif text-2xl text-[#1d3557]">{label}</h2>
      <ol className="mt-3 flex flex-col gap-3">
        {shown.map((leader, index) => {
          const score = leader.periods[board];
          return (
            <li key={`${board}-${leader.name}-${index}`} className="flex items-center gap-3 rounded border border-white/80 bg-white/80 px-3 py-3">
              <div className="w-8 text-center font-serif text-xl text-[#8a6418]">{index + 1}</div>
              {leader.image ? (
                <img src={leader.image} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1d3557] font-serif text-xl text-white">
                  {leader.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#1d3557]">{leader.name}</p>
                <p className="text-sm text-[#8a6418]">
                  {titleFor(index, score)}
                  {leader.champion ? " · Champion" : ""}
                </p>
                {leader.bio ? <p className="truncate text-sm text-[#1d3557]/80">{leader.bio}</p> : null}
                <div className="mt-2 flex flex-wrap gap-1">
                  {leader.badges.map((element) => (
                    <Badge key={element} element={element} earned />
                  ))}
                </div>
              </div>
              <p className="text-right text-sm font-semibold text-[#1d3557]">
                {score > 0 ? "⚡" : "☁"} {score}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function kindLabel(id: string) {
  return challengeKinds.find((item) => item.id === id)?.label ?? id;
}

function Challenges({ userId }: { userId?: string }) {
  const [board, setBoard] = useState<ChallengeBoard | null>(null);
  const [error, setError] = useState("");
  const [person, setPerson] = useState("");
  const [kind, setKind] = useState("ten");

  const load = async () => {
    try {
      setBoard(await challengeBoard());
      setError("");
    } catch {
      setError("Sign in to opt in and send a challenge.");
    }
  };

  useEffect(() => {
    if (userId) void load();
  }, [userId]);

  if (!userId) return <p className="px-4 py-4 text-sm">Sign in to challenge someone.</p>;

  return (
    <section id="board-challenges" className="scroll-mt-32 px-4 pb-8">
      <h2 className="font-serif text-2xl text-[#1d3557]">Challenges</h2>
      <p className="mt-1 max-w-2xl text-sm text-[#1d3557]">Pick a person and what you want them to do. They get it under Notifications and can accept or decline.</p>
      {error ? <p className="mt-2 text-sm text-wrong">{error}</p> : null}
      {board ? (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
              <select value={person} onChange={(event) => setPerson(event.target.value)} className="min-h-11 rounded border border-[#c9a15b] bg-white px-2">
                <option value="">Who</option>
                {board.people.map((one) => (
                  <option key={one.id} value={one.id}>{one.name}</option>
                ))}
              </select>
              <select value={kind} onChange={(event) => setKind(event.target.value)} className="min-h-11 rounded border border-[#c9a15b] bg-white px-2">
                {challengeKinds.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!person}
                onClick={() => void sendChallenge({ data: { toId: person, kind } }).then(load).catch((reason: Error) => setError(reason.message))}
                className="min-h-11 rounded bg-[#1d3557] px-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Challenge
              </button>
            </div>
          <ul className="mt-3 flex flex-col gap-2">
            {board.rows.map((row) => (
              <li key={row.id} className="rounded border border-white/80 bg-white/80 px-3 py-2 text-sm">
                <p className="font-semibold">{row.fromId === board.me ? `You challenged ${row.toName}` : `${row.fromName} challenged you`}</p>
                <p>{kindLabel(row.kind)} · {row.status}</p>
                {row.toId === board.me && row.status === "pending" ? (
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => void answerChallenge({ data: { id: row.id, accept: true } }).then(load)} className="min-h-11 rounded bg-[#1d3557] px-3 text-sm font-semibold text-white">Accept</button>
                    <button type="button" onClick={() => void answerChallenge({ data: { id: row.id, accept: false } }).then(load)} className="min-h-11 rounded border border-[#c9a15b] px-3 text-sm font-semibold">Decline</button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
function Badges() {
  const list = honors();
  const earned = list.filter((honor) => honor.earned).length;
  return (
    <section id="board-badges" className="scroll-mt-32 px-4 pb-8">
      <h2 className="font-serif text-2xl text-[#1d3557]">Badges</h2>
      <p className="mt-1 max-w-2xl text-sm text-[#1d3557]">
        {earned} of {list.length}. These come from questions, a run of right answers, study days, miles, and town trials.
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {list.map((honor) => (
          <li key={honor.id} className={`rounded border px-3 py-3 ${honor.earned ? "border-[#c9a15b] bg-white" : "border-white/70 bg-white/40 text-[#1d3557]/50"}`}>
            <p className="font-semibold text-[#1d3557]">{honor.earned ? "Earned" : "Not yet"} · {honor.name}</p>
            <p className="text-sm">{honor.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[] | null>(null);
  const [error, setError] = useState("");
  const [board, setBoard] = useState<keyof PeriodScores | "challenges" | "badges">("today");
  const { user, isPending } = useCurrentUserState();

  useEffect(() => {
    if (isPending) return;
    let stop = false;
    void (async () => {
      await syncDeviceProgress(user?.id);
      try {
        const result = await listLeaders();
        if (!stop) setLeaders(result.leaders);
      } catch {
        if (!stop) setError("The mountain is quiet. Try again in a moment.");
      }
    })();
    return () => {
      stop = true;
    };
  }, [isPending, user?.id]);

  const jump = (id: keyof PeriodScores | "challenges" | "badges") => {
    setBoard(id);
    document.getElementById(`board-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Shell>
      <section className="overflow-hidden rounded border border-[#c9a15b] bg-[#e7f3ff]">
        <img src="/olympus.jpg" alt="" className="h-56 w-full object-cover" />
        <div className="px-4 py-4">
          <p className="text-xs font-semibold tracking-wide text-[#8a6418] uppercase">Above the clouds</p>
          <h1 className="font-serif text-3xl text-[#1d3557]">Leaderboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#1d3557]">
            A point is a correct answer. Today, this week, and this month use Central time. The week resets Monday. A bolt means that score is at least one. Nothing expires.
          </p>
        </div>
        <div className="sticky top-16 z-10 border-y border-[#c9a15b] bg-[#e7f3ff]/95 px-4 py-3 backdrop-blur">
          <div className="flex flex-wrap gap-2">
            {boards.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => jump(item.id)}
                className={`min-h-11 rounded px-3 text-sm font-semibold ${
                  board === item.id ? "bg-[#1d3557] text-white" : "border border-[#c9a15b] bg-white/80 text-[#1d3557]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {error ? <p className="px-4 py-4 text-sm text-wrong">{error}</p> : null}
        {!leaders ? <p className="px-4 py-4 text-sm">Calling the list…</p> : null}
        {leaders && leaders.length === 0 ? (
          <p className="px-4 py-4 text-sm">No accounts yet. Sign in, answer a question, and your name will land here.</p>
        ) : null}
        {leaders && leaders.length > 0
          ? boards.filter((item) => item.id !== "challenges" && item.id !== "badges").map((item) => (
              <Board key={item.id} board={item.id as keyof PeriodScores} label={item.label} leaders={leaders} />
            ))
          : null}
        <Challenges userId={user?.id} />
        <Badges />
      </section>
    </Shell>
  );
}
