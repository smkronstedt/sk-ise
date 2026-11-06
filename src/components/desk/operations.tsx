import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  gear,
  levelFor,
  loadOps,
  saveOps,
  statsFor,
  theaters,
  townGate,
  type OpsSave,
  type Slot,
  type TheaterId,
} from "@/lib/desk/ops";

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
  const [save, setSave] = useState<OpsSave | null>(null);
  const [theater, setTheater] = useState<TheaterId>("afghanistan");
  const [panel, setPanel] = useState<"map" | "camp" | "shop">("map");

  useEffect(() => {
    setSave(loadOps());
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
  const here = save.here[theater];
  const hereIndex = Math.max(0, route.towns.findIndex((town) => town.id === here));

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

  const moveTo = (townId: string) => {
    const index = route.towns.findIndex((town) => town.id === townId);
    if (index < 0 || correct < townGate(index, route.towns.length, total)) return;
    commit({ ...save, here: { ...save.here, [theater]: townId } });
  };

  return (
    <section className="overflow-hidden rounded border border-line bg-paper">
      <div className="border-b border-line px-4 py-4">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Operations</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-serif text-3xl tracking-tight">Two routes. One camp.</h1>
          <p className="text-sm text-muted">
            Lv {level}
            <span className="mx-2 text-faint">·</span>
            ${cash}
            <span className="mx-2 text-faint">·</span>
            {correct}/{total} correct
          </p>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Each correct answer on the Bank or the guideline trainer is a dollar and a step. Towns open on that count. The figure at camp is a drawn operator, not a photo.
        </p>
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
              className={`min-h-11 rounded px-4 text-sm font-semibold ${panel === id ? "bg-navy text-white" : "border border-line bg-paper"}`}
            >
              {label}
            </button>
          ))}
          <Link to="/bank" className="flex min-h-11 items-center rounded border border-line px-4 text-sm font-semibold">
            Study the bank
          </Link>
        </div>
      </div>

      {panel === "map" && (
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
          <div>
            <div className="mb-3 flex gap-2">
              {theaters.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setTheater(row.id)}
                  className={`min-h-11 rounded px-4 text-sm font-semibold ${theater === row.id ? "bg-navy text-white" : "border border-line"}`}
                >
                  {row.name}
                </button>
              ))}
            </div>
            <img
              src={theater === "afghanistan" ? "/ops/afghanistan.jpg" : "/ops/iraq.jpg"}
              alt=""
              className="w-full rounded border border-line object-cover"
            />
          </div>
          <ol className="flex flex-col gap-2">
            {route.towns.map((town, index) => {
              const need = townGate(index, route.towns.length, total);
              const open = correct >= need;
              const current = town.id === here;
              return (
                <li key={town.id} className={`rounded border px-3 py-3 ${current ? "border-navy bg-blue-soft" : "border-line"}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="font-semibold">{town.name}</h2>
                    <span className="text-sm text-muted">{open ? (current ? "You are here" : "Open") : `${need} correct`}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{town.note}</p>
                  {open && !current && (
                    <button type="button" onClick={() => moveTo(town.id)} className="mt-2 min-h-11 rounded bg-navy px-3 text-sm font-semibold text-white">
                      Move here
                    </button>
                  )}
                  {!open && index === hereIndex + 1 && (
                    <p className="mt-2 text-sm">Need {need - correct} more correct to leave {route.towns[hereIndex]?.name}.</p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {panel === "camp" && (
        <div className="grid gap-4 p-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <img src="/ops/operator.jpg" alt="" className="max-h-96 w-full rounded border border-line object-cover object-top" />
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
