import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/desk/shell";
import { bucketStats, scoreTest } from "@/lib/desk/adapt";
import { ise2025 } from "@/lib/desk/ise";
import { questions } from "@/lib/desk/questions";
import { useDesk } from "@/lib/desk/provider";
import type { BlueprintId, Focus } from "@/lib/desk/types";
import { topics } from "@/lib/desk/topics";

export const Route = createFileRoute("/")({
  component: Home,
});

const focusChoices: { id: Focus; label: string }[] = [
  { id: "boost", label: "Boost" },
  { id: "hold", label: "Hold" },
  { id: "ease", label: "Ease" },
];

function Home() {
  const desk = useDesk();
  const navigate = useNavigate();
  const stats = bucketStats(desk.state);
  const ranked = [...stats].sort((a, b) => b.suggested - a.suggested);
  const top = ranked[0];
  const attempted = stats.reduce((sum, row) => sum + row.attempted, 0);
  const correct = stats.reduce((sum, row) => sum + row.correct, 0);
  const openTests = [...desk.state.tests].reverse();

  const startAdaptive = () => {
    const id = desk.createTest({
      mode: "tutor",
      adaptive: true,
      topicIds: topics.map((topic) => topic.id),
      pool: "all",
      count: 15,
      name: "2025 plan",
    });
    if (id) void navigate({ to: "/test/$id", params: { id } });
  };

  const applyPlan = () => desk.setFocusMap(ise2025.focus);

  return (
    <Shell>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
        <section className="rounded border border-line bg-paper">
          <div className="border-b border-line px-4 py-4">
            <p className="text-sm font-semibold tracking-wide text-muted uppercase">Where the exam spends its questions</p>
            <h1 className="font-serif text-3xl tracking-tight">Focus before you sit down</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Shares are the ABU in-service outline. They add to 100 and move a little year to year. Suggested time starts as that outline, then shifts toward buckets you miss. Boost a row you are weak on. Ease one you already own.
            </p>
          </div>
          <div className="divide-y divide-line">
            {stats.map((row) => (
              <div key={row.id} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-base font-semibold">{row.title}</h2>
                  <p className="text-sm">
                    <span className="font-semibold">{row.percent}%</span>
                    <span className="text-muted"> of the exam</span>
                    <span className="mx-2 text-faint">·</span>
                    <span className="font-semibold">{Math.round(row.suggested)}%</span>
                    <span className="text-muted"> of your time</span>
                  </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded bg-chip">
                  <div className="h-full bg-navy" style={{ width: `${row.percent * 4}%` }} />
                </div>
                <p className="mt-2 text-sm text-muted">{row.detail}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="text-sm">
                    {row.attempted === 0
                      ? `${row.bank} trainer items, none answered`
                      : `${row.correct}/${row.attempted} last answers correct`}
                  </p>
                  <div className="ml-auto flex gap-1">
                    {focusChoices.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => desk.setFocus(row.id as BlueprintId, choice.id)}
                        className={`min-h-11 rounded border px-3 text-sm font-semibold ${
                          row.focus === choice.id
                            ? "border-navy bg-navy text-white"
                            : "border-line bg-paper text-ink"
                        }`}
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded border border-line bg-paper p-4">
            <p className="text-sm font-semibold tracking-wide text-muted uppercase">2025 in-service</p>
            <h2 className="font-serif text-2xl tracking-tight">
              {ise2025.score}% · {ise2025.percentile}th percentile
            </h2>
            <p className="mt-1 text-sm text-muted">
              Up from {ise2025.prior[0].score}% ({ise2025.prior[0].percentile}th) in 2024. Time goes to misses that were both common and large.
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {ise2025.leaks.map((row) => (
                <li key={row.label}>
                  <span className="font-semibold">{row.label}</span>
                  <span className="text-muted">
                    {" "}
                    · {row.score}% on {row.items}. {row.note}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">
              Leave infection, fluids, trauma, and congenital alone. Oncology stays on the outline because it is a quarter of the exam, not because it was the weak spot.
            </p>
            <button
              type="button"
              onClick={applyPlan}
              className="mt-3 min-h-11 w-full rounded border border-navy px-4 text-sm font-semibold"
            >
              Set focus from this report
            </button>
          </section>

          <section className="rounded border border-line bg-paper p-4">
            <p className="text-sm font-semibold tracking-wide text-muted uppercase">Next block</p>
            <h2 className="font-serif text-2xl tracking-tight">
              {top ? `Start with ${top.short}` : "Adaptive block"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {attempted === 0
                ? "You have no scored items yet, so the block follows the exam weights."
                : `You are ${Math.round((correct / attempted) * 100)}% on last answers. The block leans into misses and into whatever you boosted.`}
            </p>
            <button
              type="button"
              onClick={startAdaptive}
              className="mt-3 min-h-11 w-full rounded bg-blue px-4 text-base font-semibold text-white"
            >
              Start adaptive tutor block
            </button>
            <Link
              to="/create"
              className="mt-2 flex min-h-11 items-center justify-center rounded border border-line px-4 text-sm font-semibold"
            >
              Build a custom block
            </Link>
            <Link
              to="/guidelines"
              className="mt-2 flex min-h-11 items-center justify-center rounded border border-line px-4 text-sm font-semibold"
            >
              Guideline statements
            </Link>
            <p className="mt-3 text-sm text-muted">
              {questions.length} original items across {topics.length} guidelines. SASP booklets stay in your Drive and are not scored here.
            </p>
          </section>

          <section className="rounded border border-line bg-paper p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold">Saved tests</h2>
              <Link to="/tests" className="text-sm font-semibold text-blue">
                All tests
              </Link>
            </div>
            {openTests.length === 0 ? (
              <p className="mt-2 text-sm text-muted">None yet. An adaptive block or a custom build is saved here as soon as you start it.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {openTests.slice(0, 5).map((test) => {
                  const score = scoreTest(desk.state, test.id);
                  return (
                    <li key={test.id} className="flex items-center gap-2 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{test.name}</p>
                        <p className="text-sm text-muted">
                          {test.status === "done" ? "Finished" : "In progress"} · {score.correct}/{score.answered} correct · {score.total} items
                        </p>
                      </div>
                      <Link
                        to="/test/$id"
                        params={{ id: test.id }}
                        className="min-h-11 rounded border border-line px-3 py-2 text-sm font-semibold"
                      >
                        {test.status === "done" ? "Review" : "Resume"}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </Shell>
  );
}
