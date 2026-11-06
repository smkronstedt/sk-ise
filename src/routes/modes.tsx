import { bucketStats } from "@/lib/desk/adapt";
import type { DeskState } from "@/lib/desk/types";
import { topics } from "@/lib/desk/topics";

export function UroTrail({
  battleDone,
  startAdaptive,
}: {
  battleDone: Set<string>;
  startAdaptive: () => void;
}) {
  const landmarks = topics.map((t) => ({
    id: t.id,
    name: t.short,
    unlocked: battleDone.has(t.id),
  }));

  const unlockedCount = landmarks.filter((l) => l.unlocked).length;

  return (
    <section className="rounded border border-line bg-paper overflow-hidden">
      <div className="bg-gradient-to-b from-emerald-50 to-white px-6 py-6">
        <h1 className="font-serif text-3xl tracking-tight">Uro Trail</h1>
        <p className="mt-1 text-sm text-muted">
          Travel the path. Landmarks unlock as you complete battles. {unlockedCount}/{landmarks.length} reached.
        </p>
        <button
          type="button"
          onClick={startAdaptive}
          className="mt-4 min-h-11 rounded bg-emerald-700 px-5 text-sm font-semibold text-white"
        >
          Continue trail
        </button>
      </div>

      <div className="p-4">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-emerald-200" />
          <div className="flex flex-col gap-3">
            {landmarks.map((l) => (
              <div key={l.id} className="relative flex items-center gap-3 pl-10">
                <div
                  className={`absolute left-2.5 h-4 w-4 rounded-full border-2 ${
                    l.unlocked ? "border-emerald-600 bg-emerald-500" : "border-line bg-paper"
                  }`}
                />
                <div
                  className={`flex-1 rounded border px-4 py-3 ${
                    l.unlocked ? "border-emerald-300 bg-emerald-50" : "border-line bg-paper"
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold">{l.name}</span>
                    <span className="text-xs text-muted">{l.unlocked ? "Reached" : "Ahead"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function RpgMode({
  pct,
  mastered,
  battleDone,
  startAdaptive,
}: {
  pct: number;
  mastered: number;
  battleDone: Set<string>;
  startAdaptive: () => void;
}) {
  const level = Math.floor(pct / 10) + 1;
  const rank = pct >= 80 ? "Chief" : pct >= 65 ? "Senior" : pct >= 50 ? "Junior" : "Intern";
  const caught = battleDone.size;

  return (
    <section className="rounded border border-line bg-paper overflow-hidden">
      <div className="bg-gradient-to-b from-indigo-50 to-white px-6 py-6">
        <h1 className="font-serif text-3xl tracking-tight">RPG</h1>
        <p className="mt-1 text-sm text-muted">Your character grows as you study.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-white p-4 text-center">
            <div className="text-3xl font-bold text-indigo-600">Lv {level}</div>
            <div className="text-sm text-muted">Level</div>
          </div>
          <div className="rounded-lg border border-line bg-white p-4 text-center">
            <div className="text-2xl font-bold text-navy">{rank}</div>
            <div className="text-sm text-muted">Rank</div>
          </div>
          <div className="rounded-lg border border-line bg-white p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{caught}</div>
            <div className="text-sm text-muted">Cases caught</div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1 flex justify-between text-sm">
            <span>Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded bg-chip">
            <div className="h-full bg-indigo-600" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <button
          type="button"
          onClick={startAdaptive}
          className="mt-5 min-h-11 rounded bg-indigo-700 px-5 text-sm font-semibold text-white"
        >
          Train
        </button>
      </div>

      <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-50 flex items-center justify-center text-sm text-muted">
        Character scene — grows with level
      </div>
    </section>
  );
}

const missions = [
  { id: "oncology", name: "Objective Alpha", region: "North" },
  { id: "stones", name: "Objective Bravo", region: "East" },
  { id: "andrology", name: "Objective Charlie", region: "Central" },
  { id: "obstruction", name: "Objective Delta", region: "West" },
  { id: "urogyn", name: "Objective Echo", region: "South" },
  { id: "peds", name: "Objective Foxtrot", region: "Highlands" },
  { id: "core", name: "Objective Golf", region: "Valley" },
  { id: "basic", name: "Objective Hotel", region: "Base" },
];

export function MissionMap({
  battleDone,
  startTopicBattle,
}: {
  battleDone: Set<string>;
  startTopicBattle: (topicId: string) => void;
}) {
  return (
    <section className="rounded border border-line bg-paper overflow-hidden">
      <div className="bg-gradient-to-b from-slate-100 to-white px-6 py-6">
        <h1 className="font-serif text-3xl tracking-tight">Operations</h1>
        <p className="mt-1 text-sm text-muted">
          Complete missions by finishing topic battles. Original study map.
        </p>
      </div>

      <div className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {missions.map((mission) => {
            const missionTopics = topics.filter((t) => t.blueprintId === mission.id);
            const done = missionTopics.filter((t) => battleDone.has(t.id)).length;
            const next = missionTopics.find((t) => !battleDone.has(t.id));
            const cleared = done === missionTopics.length && missionTopics.length > 0;
            return (
              <div key={mission.id} className="rounded border border-line p-4">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-semibold">{mission.name}</h2>
                  <span className="text-sm text-muted">{done}/{missionTopics.length}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{mission.region}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {missionTopics.map((t) => (
                    <span
                      key={t.id}
                      className={`rounded px-2 py-0.5 text-xs ${
                        battleDone.has(t.id) ? "bg-green-100 text-green-800" : "bg-chip text-muted"
                      }`}
                    >
                      {t.short}
                    </span>
                  ))}
                </div>
                {next && !cleared && (
                  <button
                    type="button"
                    onClick={() => startTopicBattle(next.id)}
                    className="mt-3 min-h-9 rounded bg-slate-700 px-3 text-sm font-semibold text-white"
                  >
                    Start {next.short}
                  </button>
                )}
                {cleared && <p className="mt-3 text-sm font-semibold text-green-700">Mission complete</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
