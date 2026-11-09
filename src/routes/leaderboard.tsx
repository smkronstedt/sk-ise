import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { Badge } from "@/components/desk/badge";
import { listLeaders, type Leader } from "@/lib/leaderboard-api";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { syncDeviceProgress } from "@/lib/progress-sync";
import type { PeriodScores } from "@/lib/desk/periods";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

const titles = ["Olympian", "Hero", "Champion", "Argonaut", "Hoplite"];
const boards: { id: keyof PeriodScores; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
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

function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[] | null>(null);
  const [error, setError] = useState("");
  const [board, setBoard] = useState<keyof PeriodScores>("today");
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

  const jump = (id: keyof PeriodScores) => {
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
            A point is a correct answer. Today, this week, and this month use Central time. A bolt means that score is at least one. Nothing expires.
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
          ? boards.map((item) => <Board key={item.id} board={item.id} label={item.label} leaders={leaders} />)
          : null}
      </section>
    </Shell>
  );
}
