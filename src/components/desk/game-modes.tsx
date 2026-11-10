import { useEffect, useRef, useState } from "react";
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

function FieldQuest({
  startTopicBattle,
  battleDone,
}: {
  startTopicBattle: (topicId: string) => void;
  battleDone: Set<string>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef(new Set<string>());
  const state = useRef({
    x: 5,
    y: 6,
    hearts: 3,
    rupees: 0,
    swing: 0,
    lock: false,
    foe: { x: 10, y: 4, alive: true },
  });
  const [hud, setHud] = useState({ hearts: 3, rupees: 0, line: "The field is quiet. Z locks on. Sword swings." });
  const next = topics.find((topic) => !battleDone.has(topic.id));
  const openRef = useRef(startTopicBattle);
  openRef.current = startTopicBattle;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let raf = 0;
    const tile = 28;
    const cols = 16;
    const rows = 11;
    const solid = (x: number, y: number) => x <= 0 || y <= 0 || x >= cols - 1 || y >= rows - 1 || (x === 8 && y < 4);
    const draw = () => {
      frame += 1;
      const hero = state.current;
      if (frame % 8 === 0 && hero.swing <= 0) {
        const step = keys.current.has("w") ? [0, -1] : keys.current.has("s") ? [0, 1] : keys.current.has("a") ? [-1, 0] : keys.current.has("d") ? [1, 0] : null;
        if (step && !solid(hero.x + step[0], hero.y + step[1])) {
          hero.x += step[0];
          hero.y += step[1];
          if (hero.x === 12 && hero.y === 8 && hero.rupees < 99) {
            hero.rupees += 1;
            setHud((row) => ({ ...row, rupees: hero.rupees, line: "A green rupee." }));
          }
        }
      }
      if (hero.swing > 0) hero.swing -= 1;
      const foe = hero.foe;
      if (foe.alive && frame % 20 === 0) foe.x += foe.x > 12 ? -1 : foe.x < 9 ? 1 : Math.random() > 0.5 ? 1 : -1;
      const near = Math.abs(foe.x - hero.x) + Math.abs(foe.y - hero.y) <= 1;
      if (foe.alive && near && hero.swing > 0) {
        foe.alive = false;
        setHud((row) => ({ ...row, line: "The guard dropped. The temple door is north." }));
      } else if (foe.alive && hero.x === foe.x && hero.y === foe.y && frame % 30 === 0) {
        hero.hearts = Math.max(0, hero.hearts - 1);
        setHud((row) => ({ ...row, hearts: hero.hearts, line: hero.hearts ? "The guard hit you." : "You woke at the forest edge." }));
        if (hero.hearts <= 0) {
          hero.hearts = 3;
          hero.x = 5;
          hero.y = 6;
        }
      }
      ctx.fillStyle = "#67b15a";
      ctx.fillRect(0, 0, cols * tile, rows * tile);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) {
            ctx.fillStyle = "#2f6b32";
            ctx.fillRect(x * tile, y * tile, tile, tile);
          }
          if (x === 8 && y < 4) {
            ctx.fillStyle = "#8d8a84";
            ctx.fillRect(x * tile, y * tile, tile, tile);
          }
        }
      }
      ctx.fillStyle = "#c4553a";
      ctx.fillRect(8 * tile, 0, tile, tile);
      ctx.fillStyle = "#3aa34a";
      ctx.fillRect(12 * tile + 8, 8 * tile + 8, 12, 16);
      if (foe.alive) {
        ctx.fillStyle = hero.lock ? "#f2d15a" : "#6b4632";
        ctx.fillRect(foe.x * tile + 4, foe.y * tile + 2, 20, 24);
      }
      ctx.fillStyle = "#2d6cdf";
      ctx.fillRect(hero.x * tile + 6, hero.y * tile + 4, 16, 20);
      if (hero.swing > 0) {
        ctx.strokeStyle = "#f4f1ea";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hero.x * tile + 14, hero.y * tile + 10, 18, -0.6, 1.2);
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ("wasd".includes(key)) keys.current.add(key);
      if (key === "j") state.current.swing = 10;
      if (key === "z") {
        state.current.lock = !state.current.lock;
        setHud((row) => ({ ...row, line: state.current.lock ? "Locked on." : "Lock off." }));
      }
      if (key === "e" && state.current.x === 8 && state.current.y === 1 && next) openRef.current(next.id);
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [battleDone, next]);

  return (
    <div className="border-b border-world bg-black">
      <div className="flex items-center justify-between px-4 py-2 text-sm">
        <p>{"♥".repeat(hud.hearts)}{"♡".repeat(Math.max(0, 3 - hud.hearts))} · Rupees {hud.rupees}</p>
        <p className="text-stone">{hud.line}</p>
      </div>
      <canvas ref={canvasRef} width={448} height={308} className="mx-auto block w-full max-w-xl" />
      <div className="flex flex-wrap gap-2 p-3">
        {(["w", "a", "s", "d"] as const).map((key) => (
          <button key={key} type="button" onPointerDown={() => keys.current.add(key)} onPointerUp={() => keys.current.delete(key)} className="min-h-11 min-w-11 border border-stone text-sm font-bold uppercase">{key}</button>
        ))}
        <button type="button" onClick={() => { state.current.swing = 10; }} className="min-h-11 border border-stone px-3 text-sm font-bold">Sword</button>
        <button type="button" onClick={() => { state.current.lock = !state.current.lock; setHud((row) => ({ ...row, line: state.current.lock ? "Locked on." : "Lock off." })); }} className="min-h-11 border border-stone px-3 text-sm font-bold">Z</button>
        <button type="button" disabled={!next} onClick={() => next && startTopicBattle(next.id)} className="min-h-11 border border-stone px-3 text-sm font-bold disabled:opacity-40">Temple door</button>
      </div>
    </div>
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
      <FieldQuest battleDone={battleDone} startTopicBattle={startTopicBattle} />
      <div className="px-6 py-5">
        <p className="text-xs font-semibold tracking-wide text-stone uppercase">Overworld</p>
        <h1 className="font-serif text-3xl tracking-tight">RPG</h1>
        <p className="mt-1 max-w-xl text-sm text-stone">
          Hearts, a sword, and Z to lock on. The red door at the top of the field is the temple. The rooms below are the same road, listed.
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
