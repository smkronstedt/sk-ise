import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/desk/shell";
import { eligibleQuestions } from "@/lib/desk/adapt";
import { blueprint } from "@/lib/desk/blueprint";
import { useDesk } from "@/lib/desk/provider";
import { topics } from "@/lib/desk/topics";
import type { Mode, Pool } from "@/lib/desk/types";

export const Route = createFileRoute("/create")({
  component: CreatePage,
});

const pools: { id: Pool; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unused", label: "Unused" },
  { id: "incorrect", label: "Missed" },
  { id: "correct", label: "Correct" },
  { id: "marked", label: "Marked" },
];

function CreatePage() {
  const desk = useDesk();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("tutor");
  const [adaptive, setAdaptive] = useState(true);
  const [pool, setPool] = useState<Pool>("all");
  const [count, setCount] = useState(15);
  const [picked, setPicked] = useState<string[]>(topics.map((topic) => topic.id));
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const available = eligibleQuestions(desk.state, picked, pool).length;

  const toggle = (id: string) => {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const start = () => {
    const id = desk.createTest({
      name,
      mode,
      adaptive,
      topicIds: picked,
      pool,
      count: Math.min(count, available),
    });
    if (!id) {
      setError("Nothing in that pool. Widen the guidelines or switch the pool to All.");
      return;
    }
    void navigate({ to: "/test/$id", params: { id } });
  };

  return (
    <Shell>
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold tracking-wide text-muted uppercase">Custom block</p>
        <h1 className="font-serif text-3xl tracking-tight">Build a test</h1>
        <p className="mt-1 text-sm text-muted">
          Filter by AUA guideline. Adaptive selection still respects the guidelines you leave on, then weights them by exam share and your misses.
        </p>

        <label className="mt-4 block text-sm font-semibold">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Optional"
            className="mt-1 w-full rounded border border-line bg-paper px-3 py-2 text-base font-normal"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["tutor", "timed"] as Mode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`min-h-11 rounded border px-4 font-semibold capitalize ${mode === item ? "border-navy bg-navy text-white" : "border-line bg-paper"}`}
            >
              {item}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAdaptive((value) => !value)}
            className={`min-h-11 rounded border px-4 font-semibold ${adaptive ? "border-blue bg-blue-soft text-navy" : "border-line bg-paper"}`}
          >
            {adaptive ? "Adaptive on" : "Adaptive off"}
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">
          {mode === "timed"
            ? "Timed blocks hide explanations until you end. Ninety seconds are budgeted per item."
            : "Tutor shows the explanation as soon as you submit an item."}
          {adaptive ? " Adaptive draws more from heavy, weak buckets." : " Off means a plain shuffle."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {pools.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPool(item.id)}
              className={`min-h-11 rounded border px-3 text-sm font-semibold ${pool === item.id ? "border-navy bg-navy text-white" : "border-line bg-paper"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Items</span>
          {[10, 15, 20, 30].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCount(value)}
              className={`min-h-11 rounded border px-3 font-semibold ${count === value ? "border-navy bg-navy text-white" : "border-line bg-paper"}`}
            >
              {value}
            </button>
          ))}
          <span className="text-sm text-muted">{available} available</span>
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" className="text-sm font-semibold text-blue" onClick={() => setPicked(topics.map((topic) => topic.id))}>
            All guidelines
          </button>
          <button type="button" className="text-sm font-semibold text-blue" onClick={() => setPicked([])}>
            Clear
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-4">
          {blueprint.map((bucket) => {
            const group = topics.filter((topic) => topic.blueprintId === bucket.id);
            return (
              <fieldset key={bucket.id} className="rounded border border-line bg-paper p-3">
                <legend className="px-1 text-sm font-semibold">
                  {bucket.title} · {bucket.percent}%
                </legend>
                <div className="flex flex-wrap gap-2">
                  {group.map((topic) => {
                    const on = picked.includes(topic.id);
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => toggle(topic.id)}
                        className={`min-h-11 rounded border px-3 text-left text-sm ${on ? "border-blue bg-blue-soft" : "border-line bg-paper text-muted"}`}
                      >
                        <span className="block font-semibold text-ink">{topic.short}</span>
                        {topic.title}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>

        {error ? <p className="mt-3 text-sm text-wrong">{error}</p> : null}
        <button type="button" onClick={start} className="mt-4 min-h-11 rounded bg-blue px-5 font-semibold text-white">
          Start block
        </button>
      </div>
    </Shell>
  );
}
