import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { Badge } from "@/components/desk/badge";
import { listLeaders, type Leader } from "@/lib/leaderboard-api";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

const titles = ["Olympian", "Hero", "Champion", "Argonaut", "Hoplite"];

function titleFor(index: number, score: number) {
  if (score <= 0) return "Unranked";
  return titles[index] ?? "Hoplite";
}

function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void listLeaders()
      .then((result) => setLeaders(result.leaders))
      .catch(() => setError("The mountain is quiet. Try again in a moment."));
  }, []);

  return (
    <Shell>
      <section className="overflow-hidden rounded border border-[#c9a15b] bg-[#e7f3ff]">
        <img src="/olympus.jpg" alt="" className="h-56 w-full object-cover" />
        <div className="px-4 py-4">
          <p className="text-xs font-semibold tracking-wide text-[#8a6418] uppercase">Above the clouds</p>
          <h1 className="font-serif text-3xl text-[#1d3557]">Leaderboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#1d3557]">
            Only signed-in accounts are listed. Rank is correct answers in the bank. A bolt means you have started.
          </p>
        </div>
        {error ? <p className="px-4 pb-4 text-sm text-wrong">{error}</p> : null}
        {!leaders ? <p className="px-4 pb-4 text-sm">Calling the list…</p> : null}
        {leaders && leaders.length === 0 ? (
          <p className="px-4 pb-4 text-sm">No accounts yet. Sign in, answer a question, and your name will land here.</p>
        ) : null}
        <ol className="flex flex-col gap-3 px-4 pb-5">
          {leaders?.map((leader, index) => (
            <li key={`${leader.name}-${index}`} className="flex items-center gap-3 rounded border border-white/80 bg-white/80 px-3 py-3">
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
                <p className="text-sm text-[#8a6418]">{titleFor(index, leader.score)}{leader.champion ? " · Champion" : ""}</p>
                {leader.bio ? <p className="truncate text-sm text-[#1d3557]/80">{leader.bio}</p> : null}
                <div className="mt-2 flex flex-wrap gap-1">
                  {leader.badges.map((element) => (
                    <Badge key={element} element={element} earned />
                  ))}
                </div>
              </div>
              <p className="text-right text-sm font-semibold text-[#1d3557]">
                {leader.score > 0 ? "⚡" : "☁"} {leader.score}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </Shell>
  );
}
