import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { latestResult } from "@/lib/desk/adapt";
import { bankList, getQuestion, loadCatalog, topicSlug } from "@/lib/desk/catalog";
import {
  gear,
  levelFor,
  loadOps,
  saveOps,
  statsFor,
  theaters,
  type OpsSave,
  type Slot,
  type TheaterId,
  type Town,
} from "@/lib/desk/ops";
import { useDesk } from "@/lib/desk/provider";

const MEDIC = 40;

const slots: { id: Slot; label: string }[] = [
  { id: "head", label: "Head" },
  { id: "eyes", label: "Eyes" },
  { id: "plate", label: "Carrier" },
  { id: "uniform", label: "Uniform" },
  { id: "workout", label: "Workout" },
  { id: "boots", label: "Feet" },
  { id: "primary", label: "Primary" },
  { id: "sidearm", label: "Sidearm" },
  { id: "extra", label: "Extra" },
  { id: "ride", label: "Ride" },
  { id: "partner", label: "Dog" },
];

export function Operations({ correct, total }: { correct: number; total: number }) {
  const desk = useDesk();
  const navigate = useNavigate();
  const [save, setSave] = useState<OpsSave | null>(null);
  const [theater, setTheater] = useState<TheaterId>("afghanistan");
  const [panel, setPanel] = useState<"map" | "camp" | "shop">("map");
  const [busy, setBusy] = useState("");
  const [selectedId, setSelectedId] = useState("bagram");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    setSave(loadOps());
    void loadCatalog();
  }, []);

  if (!save) return null;

  const commit = (next: OpsSave) => {
    setSave(next);
    saveOps(next);
  };

  const level = levelFor(correct, total);
  const holdings = save.owned.reduce((sum, id) => sum + (gear.find((item) => item.id === id)?.price ?? 0), 0);
  const cash = Math.max(0, correct - holdings - save.fees);
  const stats = statsFor(save.owned, save.equipped, level);
  const route = theaters.find((row) => row.id === theater) ?? theaters[0];
  const maps: Record<TheaterId, string> = {
    afghanistan: "/ops/afghanistan.jpg",
    iraq: "/ops/iraq.jpg",
    horn: "/ops/horn.jpg",
    syria: "/ops/syria.jpg",
    philippines: "/ops/philippines.jpg",
    iran: "/ops/iran.jpg",
    route7: "/ops/gaza.jpg",
    route8: "/ops/russia.jpg",
    route9: "/ops/korea.jpg",
    route10: "/ops/china.jpg",
  };

  const missionName = (town: Town) => `Op: ${town.name}`;

  const cleared = (town: Town) =>
    desk.state.tests.some((test) => {
      if (test.status !== "done" || test.name !== missionName(town)) return false;
      let answered = 0;
      let right = 0;
      for (const id of test.questionIds) {
        const answer = test.answers[id];
        if (!answer?.submitted || answer.choice == null) continue;
        answered += 1;
        if (answer.choice === getQuestion(id)?.answer) right += 1;
      }
      const need = Math.min(10, test.questionIds.length);
      return answered >= need && right / answered >= 0.6;
    });

  const theaterDone = (id: TheaterId) => theaters.find((row) => row.id === id)?.towns.every((town) => cleared(town)) ?? false;
  const later: TheaterId[] = ["horn", "syria", "philippines", "iran", "route7", "route8", "route9", "route10"];
  const theaterOpen = (id: TheaterId): boolean => {
    if (id === "afghanistan" || id === "iraq") return true;
    const index = later.indexOf(id);
    if (index < 0) return false;
    if (index === 0) return theaterDone("afghanistan") && theaterDone("iraq");
    const prev = later[index - 1];
    return theaterOpen(prev) && theaterDone(prev);
  };
  const lastOp = desk.state.tests
    .filter((test) => test.status === "done" && test.name.startsWith("Op:"))
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))[0];
  let hits = 0;
  if (lastOp) {
    for (const id of lastOp.questionIds) {
      const answer = lastOp.answers[id];
      if (!answer?.submitted || answer.choice == null) continue;
      if (answer.choice !== getQuestion(id)?.answer) hits += 1;
    }
  }
  const down = Boolean(lastOp && hits >= 6 && !save.treated.includes(lastOp.id));

  const payMedic = () => {
    if (!lastOp || !down || cash < MEDIC) return;
    commit({ ...save, treated: [...save.treated, lastOp.id], fees: save.fees + MEDIC });
  };

  const frontier = route.towns.findIndex((town) => !cleared(town));
  const openIndex = frontier === -1 ? route.towns.length - 1 : frontier;

  const startTown = async (town: Town) => {
    if (down) return;
    const existing = desk.state.tests.find((test) => test.status === "open" && test.name === missionName(town));
    if (existing) {
      void navigate({ to: "/test/$id", params: { id: existing.id } });
      return;
    }
    setBusy(town.id);
    await loadCatalog();
    const wanted = new Set(town.topics.map((topic) => topicSlug(topic)));
    const pool = bankList().filter((question) => wanted.has(question.topicId));
    const unused = pool.filter((question) => latestResult(desk.state, question.id) === "unused");
    const source = unused.length >= 10 ? unused : pool;
    const shuffled = [...source];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const ids = shuffled.slice(0, 15).map((question) => question.id);
    setBusy("");
    if (!ids.length) return;
    const id = desk.createTest({
      name: missionName(town),
      mode: "tutor",
      adaptive: false,
      topicIds: [],
      pool: "all",
      count: ids.length,
      questionIds: ids,
    });
    if (id) void navigate({ to: "/test/$id", params: { id } });
  };

  const buy = (id: string) => {
    const item = gear.find((row) => row.id === id);
    if (!item || save.owned.includes(id) || item.price > cash) return;
    const equipped = { ...save.equipped };
    if (item.slot !== "supply") equipped[item.slot] = item.id;
    commit({ ...save, owned: [...save.owned, id], equipped });
  };

  const sell = (id: string) => {
    const item = gear.find((row) => row.id === id);
    if (!item || !save.owned.includes(id)) return;
    const equipped = { ...save.equipped };
    for (const slot of Object.keys(equipped) as Slot[]) {
      if (equipped[slot] === id) delete equipped[slot];
    }
    const refund = Math.floor(item.price / 2);
    commit({
      ...save,
      owned: save.owned.filter((owned) => owned !== id),
      equipped,
      fees: save.fees + (item.price - refund),
    });
  };

  const equip = (id: string) => {
    const item = gear.find((row) => row.id === id);
    if (!item || item.slot === "supply" || !save.owned.includes(id)) return;
    commit({ ...save, equipped: { ...save.equipped, [item.slot]: id } });
  };

  return (
    <section className="overflow-hidden rounded border border-ops bg-ops text-white">
      <div className="border-b border-white/10 px-4 py-4">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-ops-amber uppercase">
          Night ops
          <img src="/ops/trident-flag.png" alt="" className="h-8 w-8 rounded object-cover" />
        </p>
        <div className="mt-2 grid items-center gap-4 lg:grid-cols-[minmax(0,1.2fr)_auto_auto]">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/ops/operator.jpg" alt="Your operator" className="h-16 w-16 shrink-0 rounded-full border border-ops-amber object-cover object-top" />
            <div>
              <h1 className="font-serif text-3xl tracking-tight">Two routes. One camp.</h1>
              <p className="mt-2 max-w-xl text-sm text-ops-olive">
                Each town is a block from the bank. Start the town you are on. Clear it at 60% on at least 10 items, and the next town opens. Cash is still $1 per correct answer.
              </p>
            </div>
          </div>
          <img src="/ops/task-unit.png" alt="Task unit" className="mx-auto h-56 w-auto object-contain" />
          <div className="text-center">
            <img src="/ops/trident.png" alt="Trident" className="mx-auto h-24 w-auto" />
            <p className="mt-1 text-sm text-ops-olive">
              Lv {level}
              <span className="mx-2 text-faint">·</span>
              ${cash}
              <span className="mx-2 text-faint">·</span>
              {correct}/{total} correct
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["map", "Map"],
              ["camp", "Camp"],
              ["shop", "Shop"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPanel(id)}
              className={`min-h-11 rounded px-4 text-sm font-semibold ${panel === id ? "bg-ops-amber text-ops" : "border border-white/20 text-white"}`}
            >
              {label}
            </button>
          ))}
          <Link to="/bank" className="flex min-h-11 items-center rounded border border-white/20 px-4 text-sm font-semibold text-white">
            Study the bank
          </Link>
        </div>
        {down ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded border border-ops-amber/60 px-3 py-2">
            <p className="text-sm text-ops-olive">
              {hits} misses on the last town. You are down. A combat medic costs ${MEDIC} before you roll again.
            </p>
            <button
              type="button"
              disabled={cash < MEDIC}
              onClick={payMedic}
              className="min-h-11 rounded bg-ops-amber px-4 text-sm font-semibold text-ops disabled:opacity-40"
            >
              {cash < MEDIC ? `Need $${MEDIC}` : `Pay medic $${MEDIC}`}
            </button>
          </div>
        ) : null}
      </div>

      {panel === "map" && (
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {theaters.map((row) => {
                const locked = !theaterOpen(row.id);
                return (
                  <button
                    key={row.id}
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      setTheater(row.id);
                      setSelectedId(row.towns[0]?.id ?? "");
                    }}
                    className={`min-h-11 rounded px-4 text-sm font-semibold ${theater === row.id ? "bg-ops-amber text-ops" : "border border-white/20 text-white"} disabled:opacity-40`}
                  >
                    {row.classified ? "Undisclosed" : row.name}
                    {locked ? " · locked" : ""}
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <img src={maps[theater]} alt="" className="w-full rounded border border-line object-cover" />
              {route.towns.map((town) => {
                const on = town.id === selectedId;
                const done = cleared(town);
                return (
                  <button
                    key={town.id}
                    type="button"
                    aria-label={town.name}
                    onClick={() => {
                      setSelectedId(town.id);
                      setFlash(`${town.name} selected`);
                    }}
                    style={{ left: `${town.x}%`, top: `${town.y}%` }}
                    className={`absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 ${
                      on ? "border-navy bg-paper ring-4 ring-navy" : done ? "border-correct bg-paper" : "border-white bg-navy"
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full ${done ? "bg-correct" : on ? "bg-navy" : "bg-white"}`} />
                  </button>
                );
              })}
            </div>
            {flash ? <p className="mt-2 text-sm font-semibold">{flash}</p> : null}
          </div>
          <ol className="flex flex-col gap-2">
            {route.towns.map((town, index) => {
              const done = cleared(town);
              const open = index <= openIndex;
              const current = index === openIndex && !done;
              const resume = desk.state.tests.some((test) => test.status === "open" && test.name === missionName(town));
              return (
                <li key={town.id} className={`rounded border px-3 py-3 ${town.id === selectedId ? "border-ops-amber bg-ops-panel" : "border-white/10 bg-ops-panel"}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="font-semibold">{town.name}</h2>
                    <span className="text-sm text-ops-olive">{done ? "Cleared" : current ? "You are here" : open ? "Open" : "Locked"}</span>
                  </div>
                  <p className="mt-1 text-sm text-ops-olive">{town.note}</p>
                  <p className="mt-1 text-sm text-ops-olive">{town.topics.join(" · ")}</p>
                  {open ? (
                    <button
                      type="button"
                      onClick={() => void startTown(town)}
                      disabled={busy === town.id}
                      className="mt-2 min-h-11 rounded bg-ops-amber px-3 text-sm font-semibold text-ops disabled:opacity-50"
                    >
                      {busy === town.id ? "Opening…" : resume ? "Resume" : done ? "Run again" : "Start"}
                    </button>
                  ) : (
                    <p className="mt-2 text-sm">Clear {route.towns[index - 1]?.name} first.</p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {panel === "camp" && (
        <div className="grid gap-4 p-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <div className="flex flex-col items-center">
            <img src="/ops/operator.jpg" alt="Your operator" className="max-h-96 w-full rounded border border-ops-amber object-cover object-top" />
            <img src="/ops/trident.png" alt="Trident" className="mt-3 h-16 w-auto" />
          </div>
          <div>
            <h2 className="font-serif text-2xl">Camp</h2>
            <p className="mt-1 text-sm text-muted">One item per slot. Supplies stay on once you buy them.</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {(
                [
                  ["Strength", stats.strength],
                  ["Endurance", stats.endurance],
                  ["Smarts", stats.smarts],
                  ["Cool", stats.cool],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded border border-line px-3 py-2">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-xl font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-4 divide-y divide-line">
              {slots.map((slot) => {
                const worn = gear.find((item) => item.id === save.equipped[slot.id]);
                const choices = gear.filter((item) => item.slot === slot.id && save.owned.includes(item.id));
                return (
                  <li key={slot.id} className="flex flex-wrap items-center gap-2 py-2">
                    <span className="w-24 text-sm text-muted">{slot.label}</span>
                    <span className="min-w-0 flex-1 font-semibold">{worn?.name ?? "Empty"}</span>
                    {choices.length > 1 &&
                      choices.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => equip(item.id)}
                          className={`min-h-11 rounded border px-3 text-sm ${worn?.id === item.id ? "border-navy bg-navy text-white" : "border-line"}`}
                        >
                          {item.name}
                        </button>
                      ))}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {panel === "shop" && (
        <ul className="divide-y divide-line">
          {gear.map((item) => {
            const owned = save.owned.includes(item.id);
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted">
                    {item.note} +{item.strength} str · +{item.endurance} end · +{item.smarts} smarts · +{item.cool} cool
                  </p>
                </div>
                <span className="text-sm font-semibold">${item.price}</span>
                {owned ? (
                  <button type="button" onClick={() => sell(item.id)} className="min-h-11 rounded border border-line px-3 text-sm font-semibold">
                    Sell ${Math.floor(item.price / 2)}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={item.price > cash}
                    onClick={() => buy(item.id)}
                    className="min-h-11 rounded bg-navy px-3 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    Buy
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
