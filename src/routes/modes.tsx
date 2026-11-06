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
  battleDone,
  startTopicBattle,
}: {
  battleDone: Set<string>;
  startTopicBattle: (topicId: string) => void;
}) {
  const rooms = [
    { id: "basic", name: "Physio grove" },
    { id: "core", name: "Trauma cave" },
    { id: "stones", name: "Stone shrine" },
    { id: "obstruction", name: "Flow gate" },
    { id: "urogyn", name: "Pelvic ruins" },
    { id: "andrology", name: "Andro keep" },
    { id: "peds", name: "Peds woods" },
    { id: "oncology", name: "Oncology citadel" },
  ] as const;
  const cleared = (id: string) => {
    const mine = topics.filter((topic) => topic.blueprintId === id);
    return mine.length > 0 && mine.every((topic) => battleDone.has(topic.id));
  };
  const frontier = Math.max(
    0,
    rooms.findIndex((room) => !cleared(room.id)),
  );
  const openIndex = frontier === -1 ? rooms.length - 1 : frontier;

  return (
    <section className="overflow-hidden rounded border border-world-deep bg-world-deep text-white">
      <div className="px-6 py-5">
        <p className="text-xs font-semibold tracking-wide text-stone uppercase">Overworld</p>
        <h1 className="font-serif text-3xl tracking-tight">RPG</h1>
        <p className="mt-1 max-w-xl text-sm text-stone">
          Walk the rooms in order. A cleared room opens the next door. Enter a room to battle its next case.
        </p>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {rooms.map((room, index) => {
          const mine = topics.filter((topic) => topic.blueprintId === room.id);
          const done = mine.filter((topic) => battleDone.has(topic.id)).length;
          const next = mine.find((topic) => !battleDone.has(topic.id));
          const open = index <= openIndex;
          const here = index === openIndex && !cleared(room.id);
          return (
            <div
              key={room.id}
              className={`rounded border p-4 ${here ? "border-stone bg-world" : open ? "border-world bg-world/80" : "border-world-deep bg-world-deep"}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className={`font-semibold ${open ? "text-world-deep" : "text-stone"}`}>{open ? room.name : "????"}</h2>
                <span className={`text-sm ${open ? "text-world-deep/80" : "text-stone"}`}>{done}/{mine.length}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded bg-world-deep/20">
                <div className="h-full bg-world-deep" style={{ width: `${mine.length ? (done / mine.length) * 100 : 0}%` }} />
              </div>
              {open && next ? (
                <button
                  type="button"
                  onClick={() => startTopicBattle(next.id)}
                  className="mt-3 min-h-11 rounded bg-world-deep px-3 text-sm font-semibold text-white"
                >
                  Enter {next.short}
                </button>
              ) : null}
              {cleared(room.id) ? <p className="mt-3 text-sm font-semibold text-world-deep">Room cleared</p> : null}
              {!open ? <p className="mt-3 text-sm text-stone">The door ahead is shut.</p> : null}
            </div>
          );
        })}
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
