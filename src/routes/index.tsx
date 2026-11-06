import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

type Mode = "classic" | "base" | "trail" | "encounter" | "rpg" | "notes";

const modes: { id: Mode; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "base", label: "Home Base" },
  { id: "trail", label: "Uro Trail" },
  { id: "encounter", label: "Encounter" },
  { id: "notes", label: "Field Notes" },
  { id: "rpg", label: "RPG" },
];

const MODE_KEY = "callroom-desk-mode";

function loadMode(): Mode {
  if (typeof window === "undefined") return "classic";
  const saved = localStorage.getItem(MODE_KEY);
  return (saved as Mode) ?? "classic";
}

const focusChoices: { id: Focus; label: string }[] = [
  { id: "boost", label: "Boost" },
  { id: "hold", label: "Hold" },
  { id: "ease", label: "Ease" },
];

// Original Field Notes creatures (one per topic)
const fieldCreatures = topics.map((t, i) => ({
  id: t.id,
  name: t.short,
  number: i + 1,
  type: t.blueprintId,
}));

function Home() {
  const desk = useDesk();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("classic");
  const stats = bucketStats(desk.state);
  const ranked = [...stats].sort((a, b) => b.suggested - a.suggested);
  const top = ranked[0];
  const attempted = stats.reduce((sum, row) => sum + row.attempted, 0);
  const correct = stats.reduce((sum, row) => sum + row.correct, 0);
  const openTests = [...desk.state.tests].reverse();
  const pct = attempted ? Math.round((correct / attempted) * 100) : 0;
  const mastered = stats.filter((s) => s.attempted > 5 && s.correct / s.attempted >= 0.7).length;

  useEffect(() => {
    setMode(loadMode());
  }, []);

  const changeMode = (next: Mode) => {
    setMode(next);
    localStorage.setItem(MODE_KEY, next);
  };

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

  const startTopicBattle = (topicId: string) => {
    const id = desk.createTest({
      mode: "tutor",
      adaptive: false,
      topicIds: [topicId],
      pool: "all",
      count: 5,
      name: `Battle: ${topics.find((t) => t.id === topicId)?.short ?? topicId}`,
    });
    if (id) void navigate({ to: "/test/$id", params: { id } });
  };

  const applyPlan = () => desk.setFocusMap(ise2025.focus);

  return (
    <Shell>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-muted">Mode</span>
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => changeMode(m.id)}
            className={`min-h-9 rounded px-3 text-sm font-semibold ${
              mode === m.id ? "bg-navy text-white" : "border border-line bg-paper"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "classic" && (
        <ClassicView
          desk={desk}
          stats={stats}
          top={top}
          attempted={attempted}
          correct={correct}
          openTests={openTests}
          startAdaptive={startAdaptive}
          applyPlan={applyPlan}
        />
      )}
      {mode === "base" && <HomeBase pct={pct} mastered={mastered} dueCards={0} startAdaptive={startAdaptive} />}
      {mode === "trail" && <UroTrail stats={stats} startAdaptive={startAdaptive} />}
      {mode === "encounter" && <Encounter pct={pct} top={top} startAdaptive={startAdaptive} />}
      {mode === "notes" && <FieldNotes stats={stats} startTopicBattle={startTopicBattle} />}
      {mode === "rpg" && <RpgPlaceholder />}
    </Shell>
  );
}

function ClassicView({
  desk,
  stats,
  top,
  attempted,
  correct,
  openTests,
  startAdaptive,
  applyPlan,
}: {
  desk: ReturnType<typeof useDesk>;
  stats: ReturnType<typeof bucketStats>;
  top: ReturnType<typeof bucketStats>[0] | undefined;
  attempted: number;
  correct: number;
  openTests: ReturnType<typeof useDesk>["state"]["tests"];
  startAdaptive: () => void;
  applyPlan: () => void;
}) {
  return (
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
  );
}

function HomeBase({
  pct,
  mastered,
  dueCards,
  startAdaptive,
}: {
  pct: number;
  mastered: number;
  dueCards: number;
  startAdaptive: () => void;
}) {
  const rank = pct >= 80 ? "Chief" : pct >= 65 ? "Senior" : pct >= 50 ? "Junior" : "Intern";
  return (
    <section className="rounded border border-line bg-paper overflow-hidden">
      <div className="bg-gradient-to-b from-slate-100 to-white px-6 py-8">
        <h1 className="font-serif text-3xl tracking-tight">Call Room</h1>
        <p className="mt-1 text-sm text-muted">Your desk updates as you study.</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="rounded-lg border border-line bg-white px-5 py-4 text-center shadow-sm">
            <div className="text-4xl font-bold text-green-600">{pct}%</div>
            <div className="text-sm text-muted">Correct</div>
          </div>
          <div className="rounded-lg border border-line bg-white px-5 py-4 text-center shadow-sm">
            <div className="text-4xl font-bold text-blue-600">{mastered}</div>
            <div className="text-sm text-muted">Topics mastered</div>
          </div>
          <div className="rounded-lg border border-line bg-white px-5 py-4 text-center shadow-sm">
            <div className="text-4xl font-bold text-amber-600">{dueCards}</div>
            <div className="text-sm text-muted">Cards due</div>
          </div>
          <div className="rounded-lg border border-line bg-white px-5 py-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-navy">{rank}</div>
            <div className="text-sm text-muted">Rank</div>
          </div>
        </div>
        <button
          type="button"
          onClick={startAdaptive}
          className="mt-6 min-h-11 rounded bg-blue px-5 text-sm font-semibold text-white"
        >
          Start adaptive block
        </button>
      </div>
      <div className="h-40 bg-gradient-to-b from-blue-50 to-slate-100 flex items-end justify-center pb-4">
        <div className="text-sm text-muted">Desk scene — charts light up as topics are mastered</div>
      </div>
    </section>
  );
}

function UroTrail({
  stats,
  startAdaptive,
}: {
  stats: ReturnType<typeof bucketStats>;
  startAdaptive: () => void;
}) {
  return (
    <section className="rounded border border-line bg-paper overflow-hidden">
      <div className="bg-gradient-to-b from-emerald-50 to-white px-6 py-6">
        <h1 className="font-serif text-3xl tracking-tight">Uro Trail</h1>
        <p className="mt-1 text-sm text-muted">Landmarks unlock as you master topics.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {stats.map((s) => {
            const done = s.attempted > 3 && s.correct / Math.max(s.attempted, 1) >= 0.65;
            return (
              <div
                key={s.id}
                className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                  done ? "border-green-600 bg-green-100 text-green-800" : "border-line bg-white text-ink"
                }`}
              >
                {s.short}
                {done ? " ✓" : ""}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={startAdaptive}
          className="mt-5 min-h-11 rounded bg-emerald-700 px-5 text-sm font-semibold text-white"
        >
          Continue trail
        </button>
      </div>
      <div className="h-48 bg-gradient-to-r from-green-100 via-amber-50 to-sky-100 flex items-center justify-center">
        <div className="text-sm text-muted">Trail map — your wagon advances with progress</div>
      </div>
    </section>
  );
}

function Encounter({
  pct,
  top,
  startAdaptive,
}: {
  pct: number;
  top: ReturnType<typeof bucketStats>[0] | undefined;
  startAdaptive: () => void;
}) {
  return (
    <section className="rounded border border-line bg-paper p-6">
      <h1 className="font-serif text-3xl tracking-tight">Case Encounter</h1>
      <p className="mt-1 text-sm text-muted">Face the next weak topic.</p>
      <div className="mt-6 flex items-center justify-between rounded-lg border border-line bg-slate-50 p-5">
        <div className="text-center">
          <div className="text-lg font-semibold">You</div>
          <div className="mt-1 text-3xl font-bold text-blue-600">{pct}%</div>
          <div className="text-sm text-muted">overall</div>
        </div>
        <div className="text-3xl text-muted">vs</div>
        <div className="text-center">
          <div className="text-lg font-semibold">{top?.short ?? "Next case"}</div>
          <div className="mt-1 text-sm text-muted">Suggested focus</div>
          <div className="mt-1 text-xs text-muted">{top ? `${top.percent}% of exam` : ""}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={startAdaptive}
        className="mt-5 min-h-11 w-full rounded bg-navy px-5 text-sm font-semibold text-white"
      >
        Start encounter
      </button>
    </section>
  );
}

function FieldNotes({
  stats,
  startTopicBattle,
}: {
  stats: ReturnType<typeof bucketStats>;
  startTopicBattle: (topicId: string) => void;
}) {
  const caught = new Set(
    stats.filter((s) => s.attempted > 3 && s.correct / Math.max(s.attempted, 1) >= 0.65).map((s) => s.id),
  );
  const next = fieldCreatures.find((c) => !caught.has(c.id));

  return (
    <section className="rounded border border-line bg-paper overflow-hidden">
      <div className="bg-gradient-to-b from-amber-50 to-white px-6 py-6">
        <h1 className="font-serif text-3xl tracking-tight">Field Notes</h1>
        <p className="mt-1 text-sm text-muted">
          Collect all {fieldCreatures.length} cases. Battles use your real questions.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="text-2xl font-bold text-amber-700">{caught.size}/{fieldCreatures.length}</div>
          <div className="text-sm text-muted">caught</div>
          {next && (
            <button
              type="button"
              onClick={() => startTopicBattle(next.id)}
              className="ml-auto min-h-11 rounded bg-amber-600 px-5 text-sm font-semibold text-white"
            >
              Battle {next.name}
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted uppercase">Collection</h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {fieldCreatures.map((c) => {
            const isCaught = caught.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => !isCaught && startTopicBattle(c.id)}
                disabled={isCaught}
                className={`rounded border p-2 text-center text-xs ${
                  isCaught
                    ? "border-green-600 bg-green-50 text-green-800"
                    : "border-line bg-paper hover:bg-amber-50"
                }`}
              >
                <div className="font-mono text-[10px] text-muted">#{String(c.number).padStart(3, "0")}</div>
                <div className="mt-1 font-semibold truncate">{isCaught ? c.name : "???"}</div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RpgPlaceholder() {
  return (
    <section className="rounded border border-line bg-paper p-6">
      <h1 className="font-serif text-3xl tracking-tight">RPG</h1>
      <p className="mt-1 text-sm text-muted">Overworld coming. Topics will become towns and dungeons that unlock with mastery.</p>
      <div className="mt-6 h-40 rounded bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-sm text-muted">
        Map in progress
      </div>
    </section>
  );
}
