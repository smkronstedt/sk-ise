import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { latestResult } from "@/lib/desk/adapt";
import { blueprint } from "@/lib/desk/blueprint";
import { useDesk } from "@/lib/desk/provider";
import { questions } from "@/lib/desk/questions";
import { topicById, topics } from "@/lib/desk/topics";

export const Route = createFileRoute("/items")({
  component: ItemsPage,
});

function ItemsPage() {
  const desk = useDesk();
  const navigate = useNavigate();
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return questions.filter((question) => {
      if (topic !== "all" && question.topicId !== topic) return false;
      const result = latestResult(desk.state, question.id);
      if (status === "marked" && !desk.state.marks[question.id]) return false;
      if (status !== "all" && status !== "marked" && result !== status) return false;
      if (!needle) return true;
      const blob = `${question.stem.join(" ")} ${topicById[question.topicId]?.title ?? ""}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [desk.state, query, status, topic]);

  const study = () => {
    const id = desk.createFromIds(
      rows.map((question) => question.id),
      "Filtered review",
    );
    if (id) void navigate({ to: "/test/$id", params: { id } });
  };

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-wide text-muted uppercase">Guideline bank</p>
          <h1 className="font-serif text-3xl tracking-tight">Items</h1>
        </div>
        <button type="button" onClick={study} className="min-h-11 rounded bg-blue px-4 font-semibold text-white">
          Tutor these ({rows.length})
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className="min-h-11 rounded border border-line bg-paper px-3"
        >
          <option value="all">All guidelines</option>
          {blueprint.map((bucket) => (
            <optgroup key={bucket.id} label={`${bucket.short} · ${bucket.percent}%`}>
              {topics
                .filter((item) => item.blueprintId === bucket.id)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="min-h-11 rounded border border-line bg-paper px-3"
        >
          <option value="all">Any result</option>
          <option value="unused">Unused</option>
          <option value="incorrect">Missed</option>
          <option value="correct">Correct</option>
          <option value="marked">Marked</option>
        </select>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search stem"
          className="min-h-11 flex-1 rounded border border-line bg-paper px-3"
        />
      </div>
      <ul className="mt-4 divide-y divide-line rounded border border-line bg-paper">
        {rows.map((question) => {
          const result = latestResult(desk.state, question.id);
          const guide = topicById[question.topicId];
          return (
            <li key={question.id} className="px-4 py-3">
              <p className="text-sm font-semibold text-muted">
                {guide?.title} · {result}
                {desk.state.marks[question.id] ? " · marked" : ""}
              </p>
              <p className="mt-1">{question.stem[0]}</p>
            </li>
          );
        })}
        {rows.length === 0 ? <li className="px-4 py-6 text-sm text-muted">No items in this filter.</li> : null}
      </ul>
    </Shell>
  );
}
