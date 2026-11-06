import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Operations } from "@/components/desk/operations";
import { Shell } from "@/components/desk/shell";
import { TrailGame } from "@/components/desk/trail-game";
import { bucketStats, scoreTest } from "@/lib/desk/adapt";
import { ise2025 } from "@/lib/desk/ise";
import { BANK_TOTAL, countBankCorrect } from "@/lib/desk/original-bank";
import { questions } from "@/lib/desk/questions";
import { useDesk } from "@/lib/desk/provider";
import { careerRank } from "@/lib/desk/ranks";
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
  const [mode, setMode] = useState<"desk" | "trail" | "ops">("desk");
  const [bankCorrect, setBankCorrect] = useState(0);
  useEffect(() => {
    setBankCorrect(countBankCorrect());
  }, []);
  const experience = bankCorrect + correct;
  const experienceTotal = BANK_TOTAL + questions.length;
  const rank = careerRank(experience, experienceTotal);
  const cleared = new Set(
    topics
      .filter((topic) => {
        return desk.state.tests.some(
          (test) => test.status === "done" && test.topicIds.length === 1 && test.topicIds[0] === topic.id,
        );
      })
      .map((topic) => topic.id),
  );

  const startTopic = (topicId: string) => {
    const topic = topics.find((row) => row.id === topicId);
    const id = desk.createTest({
      mode: "tutor",
      adaptive: false,
      topicIds: [topicId],
      pool: "all",
      count: 5,
      name: `Battle: ${topic?.short ?? topicId}`,
    });
    if (id) void navigate({ to: "/test/$id", params: { id } });
  };

  return (
    <Shell>
      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_auto]">
        <section className="rounded border border-line bg-paper px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Rank</p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
            <h1 className="font-serif text-2xl tracking-tight">{rank.title}</h1>
            <p className="text-sm text-muted">
              {experience}/{experienceTotal} correct
              <span className="mx-2 text-faint">·</span>
              Bank {bankCorrect}/{BANK_TOTAL}
              <span className="mx-2 text-faint">·</span>
              Trainer {correct}/{questions.length}
              <span className="mx-2 text-faint">·</span>
              <span className="font-semibold text-ink">${experience}</span>
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded bg-chip">
            <div className="h-full bg-navy" style={{ width: `${Math.round((experience / experienceTotal) * 100)}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted">
            {rank.next
              ? `${rank.left} more correct to ${rank.next}. The last title needs every Bank item and every guideline item.`
              : "Every item in the bank is correct."}
          </p>
        </section>
        <div className="flex gap-2 sm:flex-col">
          <button
            type="button"
            onClick={() => setMode("desk")}
            className={`min-h-11 rounded px-4 text-sm font-semibold ${mode === "desk" ? "bg-navy text-white" : "border border-line bg-paper"}`}
          >
            Desk
          </button>
          <button
            type="button"
            onClick={() => setMode("trail")}
            className={`min-h-11 rounded px-4 text-sm font-semibold ${mode === "trail" ? "bg-navy text-white" : "border border-line bg-paper"}`}
          >
            Trail
          </button>
          <button
            type="button"
            onClick={() => setMode("ops")}
            className={`min-h-11 rounded px-4 text-sm font-semibold ${mode === "ops" ? "bg-navy text-white" : "border border-line bg-paper"}`}
          >
            Ops
          </button>
        </div>
      </div>

      {mode === "ops" ? (
        <Operations correct={experience} total={experienceTotal} />
      ) : mode === "trail" ? (
        <TrailGame cleared={cleared} done={attempted} right={correct} onEnter={startTopic} />
      ) : (
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
          <section className="rounded border border-line bg-paper p-4">
            <h2 className="font-semibold">Ladder</h2>
            <p className="mt-1 text-sm text-muted">Split evenly across {experienceTotal} items. The Bank holds {BANK_TOTAL}. The other {questions.length} are the guideline trainer on this desk. Only a perfect set reaches the last title.</p>
            <ol className="mt-3 flex max-h-80 flex-col gap-1 overflow-auto text-sm">
              {rank.gates.map((gate, index) => {
                const on = index === rank.index;
                const owned = index < rank.index;
                return (
                  <li
                    key={gate.title}
                    className={`flex min-w-0 items-baseline justify-between gap-3 rounded px-2 py-1 ${on ? "bg-navy text-white" : ""}`}
                  >
                    <span className={owned && !on ? "min-w-0 text-muted" : "min-w-0"}>{gate.title}</span>
                    <span className={`shrink-0 ${on ? "text-white/80" : "text-muted"}`}>{gate.at}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        </aside>
      </div>
      )}
    </Shell>
  );
}
