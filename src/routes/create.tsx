import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { eligibleQuestions, filterPool, pickFrom, selectionStatus } from "@/lib/desk/adapt";
import { blueprint } from "@/lib/desk/blueprint";
import { bankList, bankTopicList, loadCatalog, type CatalogTopic } from "@/lib/desk/catalog";
import { useDesk } from "@/lib/desk/provider";
import { questions } from "@/lib/desk/questions";
import { topics } from "@/lib/desk/topics";
import type { Mode, Pool } from "@/lib/desk/types";

export const Route = createFileRoute("/create")({
  component: CreatePage,
});

const pools: { id: Pool; label: string }[] = [
  { id: "unused", label: "Unused" },
  { id: "used", label: "Used" },
  { id: "all", label: "All" },
  { id: "incorrect", label: "Missed" },
  { id: "correct", label: "Correct" },
  { id: "marked", label: "Marked" },
];

function CreatePage() {
  const desk = useDesk();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("tutor");
  const [adaptive, setAdaptive] = useState(true);
  const [pool, setPool] = useState<Pool>("unused");
  const [count, setCount] = useState(15);
  const [source, setSource] = useState<"bank" | "trainer">("bank");
  const [bankTopics, setBankTopics] = useState<CatalogTopic[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [focused, setFocused] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [hardOnly, setHardOnly] = useState(false);

  useEffect(() => {
    void loadCatalog().then(() => {
      const list = bankTopicList();
      setBankTopics(list);
      setPicked(list.map((topic) => topic.id));
    });
  }, []);

  const trainerCount = new Map<string, number>();
  for (const question of questions) trainerCount.set(question.topicId, (trainerCount.get(question.topicId) ?? 0) + 1);

  const bankPool = hardOnly ? bankList().filter((question) => question.hard) : bankList();
  const available =
    source === "bank"
      ? filterPool(desk.state, bankPool, picked, pool).length
      : eligibleQuestions(desk.state, picked, pool).length;

  const focusedTopic =
    source === "bank" ? bankTopics.find((topic) => topic.id === focused) : topics.find((topic) => topic.id === focused);
  const focusedCount =
    source === "bank"
      ? (focusedTopic && "count" in focusedTopic ? focusedTopic.count : 0)
      : focused
        ? (trainerCount.get(focused) ?? 0)
        : 0;

  const chooseSource = (next: "bank" | "trainer") => {
    setSource(next);
    setFocused(null);
    setPicked(next === "bank" ? bankTopics.map((topic) => topic.id) : topics.map((topic) => topic.id));
  };

  const toggle = (id: string) => {
    setFocused(id);
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const start = () => {
    const take = Math.min(count, available);
    const questionIds =
      source === "bank" ? pickFrom(desk.state, bankPool, picked, pool, take) : undefined;
    const id = desk.createTest({
      name,
      mode,
      adaptive: source === "trainer" && adaptive,
      topicIds: picked,
      pool,
      count: take,
      questionIds,
    });
    if (!id) {
      setError(
        pool === "unused"
          ? "Nothing unused in that set. Open Used and recycle them, or turn more topics on."
          : "Nothing in that pool for the topics that are on.",
      );
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
          The bank is the 1,214-item set. The guideline trainer is the 57 original items. Click a topic to see how many questions it holds.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["bank", "Question bank"],
              ["trainer", "Guideline trainer"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => chooseSource(id)}
              className={`min-h-11 rounded border px-4 font-semibold ${source === id ? "border-navy bg-navy text-white" : "border-line bg-paper"}`}
            >
              {label}
            </button>
          ))}
        </div>

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
          <button
            type="button"
            onClick={() => {
              const list = source === "bank" ? bankPool : questions;
              const ids = list
                .filter((question) => picked.includes(question.topicId) && selectionStatus(desk.state, question.id) !== "unused")
                .map((question) => question.id);
              if (!ids.length) {
                setError("Nothing in Used for the topics that are on.");
                return;
              }
              desk.recycle(ids);
              setPool("unused");
              setError("");
            }}
            className="min-h-11 rounded border border-line bg-paper px-3 text-sm font-semibold"
          >
            Recycle used
          </button>
        </div>
        {source === "bank" ? (
          <button
            type="button"
            onClick={() => setHardOnly((on) => !on)}
            className={`mt-3 min-h-11 rounded border px-3 text-sm font-semibold ${hardOnly ? "border-navy bg-navy text-white" : "border-line bg-paper"}`}
          >
            Hard set only
          </button>
        ) : null}

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
          <span className="text-sm font-semibold text-ink">
            {focusedTopic
              ? `${focusedTopic.title} · ${focusedCount} questions`
              : `${available} questions in the topics that are on`}
          </span>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="text-sm font-semibold text-blue"
            onClick={() => setPicked(source === "bank" ? bankTopics.map((topic) => topic.id) : topics.map((topic) => topic.id))}
          >
            {source === "bank" ? "All bank topics" : "All guidelines"}
          </button>
          <button type="button" className="text-sm font-semibold text-blue" onClick={() => setPicked([])}>
            Clear
          </button>
        </div>

        {source === "trainer" ? (
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
                    const n = trainerCount.get(topic.id) ?? 0;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => toggle(topic.id)}
                        className={`min-h-11 rounded border px-3 text-left text-sm ${on ? "border-blue bg-blue-soft" : "border-line bg-paper text-muted"}`}
                      >
                        <span className="block font-semibold text-ink">{topic.short}</span>
                        {n} questions
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {bankTopics.length === 0 ? <p className="text-sm text-muted">Opening the bank…</p> : null}
            {bankTopics.map((topic) => {
              const on = picked.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => toggle(topic.id)}
                  className={`min-h-11 rounded border px-3 text-left text-sm ${on ? "border-blue bg-blue-soft" : "border-line bg-paper text-muted"}`}
                >
                  <span className="block font-semibold text-ink">{topic.title}</span>
                  {topic.count} questions
                </button>
              );
            })}
          </div>
        )}

        {error ? <p className="mt-3 text-sm text-wrong">{error}</p> : null}
        <button type="button" onClick={start} className="mt-4 min-h-11 rounded bg-blue px-5 font-semibold text-white">
          Start block
        </button>
      </div>
    </Shell>
  );
}
