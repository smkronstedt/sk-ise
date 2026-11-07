import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { houstonStops } from "@/lib/desk/houston";
import { useDesk } from "@/lib/desk/provider";
import { getQuestion } from "@/lib/desk/catalog";
import type { TestBlock } from "@/lib/desk/types";

const AT = "houston-trail-at";

function passed(name: string, tests: TestBlock[]) {
  return tests.some((test) => {
    if (test.name !== name || test.status !== "done" || !test.questionIds.length) return false;
    let right = 0;
    for (const id of test.questionIds) {
      const answer = test.answers[id];
      if (answer?.submitted && answer.choice != null && answer.choice === getQuestion(id)?.answer) right += 1;
    }
    return right / test.questionIds.length >= 0.6;
  });
}

export function HoustonTrail() {
  const desk = useDesk();
  const navigate = useNavigate();
  const [at, setAt] = useState(() => {
    const saved = Number(localStorage.getItem(AT) ?? "0");
    return Number.isFinite(saved) ? Math.min(houstonStops.length - 1, Math.max(0, saved)) : 0;
  });
  const [map, setMap] = useState(false);
  const [pace, setPace] = useState<"steady" | "hurried">("steady");
  const [log, setLog] = useState("");
  const stop = houstonStops[at];
  const cleared = stop.kind !== "hospital" || passed(`Houston: ${stop.name}`, desk.state.tests);
  const miles = at * 0.6;

  const go = (next: number) => {
    const index = Math.min(houstonStops.length - 1, Math.max(0, next));
    localStorage.setItem(AT, String(index));
    setAt(index);
    setMap(false);
  };

  const study = () => {
    const count = pace === "hurried" ? Math.min(12, stop.count + 2) : stop.count;
    const id = desk.createTest({
      mode: "tutor",
      adaptive: false,
      topicIds: stop.topics,
      pool: "all",
      count,
      name: `Houston: ${stop.name}`,
    });
    if (id) void navigate({ to: "/test/$id", params: { id } });
  };

  return (
    <section className="overflow-hidden rounded border border-line bg-[#f4efe4] text-[#24180f]">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#24180f]/15 px-4 py-3">
        <div>
          <p className="text-xs font-semibold tracking-wide uppercase">Houston Trail</p>
          <h1 className="font-serif text-2xl">{stop.name}</h1>
        </div>
        <p className="text-sm">
          Mile {miles.toFixed(1)} · {pace} · {at + 1}/{houstonStops.length}
        </p>
      </div>
      {map ? (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_18rem]">
          <img src="/houston/map.png" alt="Texas Medical Center and Rice" className="h-full max-h-[36rem] w-full object-cover" />
          <ol className="max-h-[36rem] overflow-auto border-t border-[#24180f]/15 lg:border-t-0 lg:border-l">
            {houstonStops.map((row, index) => {
              const done = row.kind !== "hospital" || passed(`Houston: ${row.name}`, desk.state.tests);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    disabled={index > at}
                    onClick={() => go(index)}
                    className={`flex w-full items-baseline justify-between gap-2 px-3 py-2 text-left text-sm ${index === at ? "bg-[#24180f] text-[#f4efe4]" : ""} disabled:opacity-40`}
                  >
                    <span>{row.name}</span>
                    <span>{done ? "Clear" : index === at ? "Here" : ""}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <img src={stop.photo} alt="" className="max-h-[28rem] w-full object-cover" />
      )}
      <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <p className="text-sm leading-relaxed">{stop.note}</p>
          {log ? <p className="mt-2 text-sm font-semibold">{log}</p> : null}
          {stop.kind === "hospital" && !cleared ? <p className="mt-2 text-sm">You cannot leave until this post is passed at 60%.</p> : null}
          {cleared && stop.kind === "hospital" ? <p className="mt-2 text-sm font-semibold">This post is cleared.</p> : null}
        </div>
        <div className="flex flex-col gap-2">
          {stop.topics.length > 0 ? (
            <button type="button" onClick={study} className="min-h-11 rounded bg-[#24180f] px-3 text-sm font-semibold text-[#f4efe4]">
              {pace === "hurried" ? "Study at a hurry" : "Study here"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLog(stop.id === "rice" ? "You ran the outer loop and caught your breath." : stop.id === "hermann" ? "You ran the park. The zoo is on your way south." : "You cross into the medical center.")}
              className="min-h-11 rounded bg-[#24180f] px-3 text-sm font-semibold text-[#f4efe4]"
            >
              {stop.kind === "rest" ? "Rest and run" : "Look around"}
            </button>
          )}
          <button
            type="button"
            disabled={!cleared || at === houstonStops.length - 1}
            onClick={() => {
              setLog("");
              go(at + 1);
            }}
            className="min-h-11 rounded border border-[#24180f] px-3 text-sm font-semibold disabled:opacity-40"
          >
            Continue down the trail
          </button>
          <button type="button" onClick={() => setMap((open) => !open)} className="min-h-11 rounded border border-[#24180f]/30 px-3 text-sm font-semibold">
            {map ? "Back to the landmark" : "Look at the map"}
          </button>
          <button
            type="button"
            onClick={() => setPace((current) => (current === "steady" ? "hurried" : "steady"))}
            className="min-h-11 rounded border border-[#24180f]/30 px-3 text-sm font-semibold"
          >
            Pace: {pace}
          </button>
        </div>
      </div>
    </section>
  );
}
