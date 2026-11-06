import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/desk/shell";
import { scoreTest } from "@/lib/desk/adapt";
import { useDesk } from "@/lib/desk/provider";

export const Route = createFileRoute("/tests")({
  component: TestsPage,
});

function TestsPage() {
  const desk = useDesk();
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const tests = [...desk.state.tests].reverse().filter((test) => filter === "all" || test.status === filter);

  return (
    <Shell>
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">Saved on this browser</p>
      <h1 className="font-serif text-3xl tracking-tight">Tests</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Every block is kept as you go. Leave in the middle and resume later, or open a finished block and walk back through each explanation.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["open", "In progress"],
            ["done", "Finished"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`min-h-11 rounded border px-3 text-sm font-semibold ${filter === id ? "border-navy bg-navy text-white" : "border-line bg-paper"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tests.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No blocks in this list yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded border border-line bg-paper">
          {tests.map((test) => {
            const score = scoreTest(desk.state, test.id);
            const when = new Date(test.finishedAt ?? test.createdAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });
            return (
              <li key={test.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{test.name}</p>
                  <p className="text-sm text-muted">
                    {test.status === "done" ? "Finished" : "In progress"} · {test.mode}
                    {test.adaptive ? " · adaptive" : ""} · {when}
                  </p>
                  <p className="text-sm">
                    {score.correct}/{score.answered} correct · {score.answered}/{score.total} answered
                  </p>
                </div>
                <Link
                  to="/test/$id"
                  params={{ id: test.id }}
                  className="inline-flex min-h-11 items-center rounded bg-navy px-4 text-sm font-semibold text-white"
                >
                  {test.status === "done" ? "Review" : "Resume"}
                </Link>
                <button
                  type="button"
                  className="min-h-11 rounded border border-line px-3 text-sm font-semibold"
                  onClick={() => {
                    if (window.confirm(`Delete “${test.name}”? Your other blocks stay.`)) desk.removeTest(test.id);
                  }}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Shell>
  );
}
