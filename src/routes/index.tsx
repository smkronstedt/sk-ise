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
import type { BlueprintId, Focus, DeskState } from "@/lib/desk/types";
import { topics } from "@/lib/desk/topics";
import { DEX, portraitFor, syncCatches, type Creature } from "@/lib/desk/field-dex";
import { MODE_EVENT, loadMode, type DeskMode } from "@/lib/desk/modes";
import { RpgMode } from "@/components/desk/game-modes";

export const Route = createFileRoute("/")({
  component: Home,
});

const focusChoices: { id: Focus; label: string }[] = [
  { id: "boost", label: "Boost" },
  { id: "hold", label: "Hold" },
  { id: "ease", label: "Ease" },
];

const fieldCreatures = topics.map((t, i) => ({
  id: t.id,
  name: t.short,
  number: i + 1,
  type: t.blueprintId,
}));

const gyms = [
  { id: "oncology", name: "Oncology Gym", leader: "Dr. Oncology" },
  { id: "stones", name: "Stone Gym", leader: "Dr. Lithiasis" },
  { id: "andrology", name: "Andrology Gym", leader: "Dr. Andro" },
  { id: "obstruction", name: "Obstruction Gym", leader: "Dr. Flow" },
  { id: "urogyn", name: "Urogyn Gym", leader: "Dr. Continence" },
  { id: "peds", name: "Peds Gym", leader: "Dr. Pediatric" },
  { id: "core", name: "Core Gym", leader: "Dr. Trauma" },
  { id: "basic", name: "Physiology Gym", leader: "Dr. Physio" },
];

function completedBattleTopics(state: DeskState): Set<string> {
  const done = new Set<string>();
  for (const test of state.tests) {
    if (test.status !== "done") continue;
    if (!test.name.startsWith("Battle:")) continue;
    const topicShort = test.name.replace("Battle: ", "");
    const topic = topics.find((t) => t.short === topicShort);
    if (topic) done.add(topic.id);
  }
  return done;
}

function Home() {
  const desk = useDesk();
  const navigate = useNavigate();
  const [mode, setMode] = useState<DeskMode>("classic");
  const stats = bucketStats(desk.state);
  const ranked = [...stats].sort((a, b) => b.suggested - a.suggested);
  const top = ranked[0];
  const attempted = stats.reduce((sum, row) => sum + row.attempted, 0);
  const correct = stats.reduce((sum, row) => sum + row.correct, 0);
  const openTests = [...desk.state.tests].reverse();
  const pct = attempted ? Math.round((correct / attempted) * 100) : 0;
  const mastered = stats.filter((s) => s.attempted > 5 && s.correct / s.attempted >= 0.7).length;
  const battleDone = completedBattleTopics(desk.state);

  useEffect(() => {
    const sync = () => setMode(loadMode());
    sync();
    window.addEventListener(MODE_EVENT, sync);
    return () => window.removeEventListener(MODE_EVENT, sync);
  }, []);

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
  const [bankCorrect, setBankCorrect] = useState(0);
  useEffect(() => {
    setBankCorrect(countBankCorrect());
  }, []);
  const experience = bankCorrect + correct;
  const experienceTotal = BANK_TOTAL + questions.length;
  const rank = careerRank(experience, experienceTotal);

  return (
    <Shell>
      <div className="mb-4 rounded border border-line bg-paper px-4 py-3">
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
      {mode === "trail" && (
        <TrailGame cleared={battleDone} done={attempted} right={correct} onEnter={startTopicBattle} />
      )}
      {mode === "encounter" && <Encounter pct={pct} top={top} startAdaptive={startAdaptive} />}
      {mode === "notes" && <FieldNotes battleDone={battleDone} startTopicBattle={startTopicBattle} />}
      {mode === "rpg" && <RpgMode battleDone={battleDone} startTopicBattle={startTopicBattle} />}
      {mode === "ops" && <Operations correct={experience} total={experienceTotal} />}
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
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Not a map</p>
      <h1 className="font-serif text-3xl tracking-tight">Case encounter</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">
        One weak bucket at a time. This is not a world to walk. It puts you against the outline area you are missing, then starts a block.
      </p>
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
  battleDone,
  startTopicBattle,
}: {
  battleDone: Set<string>;
  startTopicBattle: (topicId: string) => void;
}) {
  const desk = useDesk();
  const [view, setView] = useState<"gyms" | "collection">("gyms");
  const [caught, setCaught] = useState<number[]>([]);
  const [rare, setRare] = useState<number[]>([]);
  const [fresh, setFresh] = useState<Creature[]>([]);
  const have = new Set(caught);
  const rareSet = new Set(rare);

  useEffect(() => {
    const result = syncCatches(desk.state.tests);
    setCaught(result.caught);
    setRare(result.rare);
    setFresh(result.fresh);
  }, [desk.state.tests]);

  return (
    <section className="overflow-hidden rounded border border-field-ink bg-field text-field-ink">
      <div className="border-b border-field-ink/15 px-6 py-6">
        <p className="text-xs font-semibold tracking-wide text-field-stamp uppercase">Field guide</p>
        <h1 className="font-serif text-3xl tracking-tight">Field Notes</h1>
        <p className="mt-1 text-sm">
          Eight gyms. Each right answer catches one creature. A perfect battle makes the last one rare. {have.size}/151 caught.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setView("gyms")}
            className={`min-h-11 rounded px-3 text-sm font-semibold ${
              view === "gyms" ? "bg-field-stamp text-white" : "border border-field-ink/20 bg-field"
            }`}
          >
            Gyms
          </button>
          <button
            type="button"
            onClick={() => setView("collection")}
            className={`min-h-11 rounded px-3 text-sm font-semibold ${
              view === "collection" ? "bg-field-stamp text-white" : "border border-field-ink/20 bg-field"
            }`}
          >
            Guide
          </button>
        </div>
      </div>

      {view === "gyms" && fresh.length > 0 && (
        <div className="mx-4 mt-4 rounded border border-field-fern bg-white p-3 text-sm">
          Just caught: {fresh.map((creature) => `#${String(creature.number).padStart(3, "0")} ${creature.name}`).join(", ")}
        </div>
      )}

      {view === "gyms" && (
        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {gyms.map((gym) => {
              const gymTopics = topics.filter((t) => t.blueprintId === gym.id);
              const gymCaught = gymTopics.filter((t) => battleDone.has(t.id)).length;
              const nextTopic = gymTopics.find((t) => !battleDone.has(t.id));
              const cleared = gymCaught === gymTopics.length && gymTopics.length > 0;
              return (
                <div key={gym.id} className="rounded border border-field-ink/15 bg-white/70 p-4">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-semibold">{gym.name}</h2>
                    <span className="text-sm text-field-fern">{gymCaught}/{gymTopics.length}</span>
                  </div>
                  <p className="mt-1 text-sm">Leader: {gym.leader}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {gymTopics.map((t) => (
                      <span
                        key={t.id}
                        className={`rounded px-2 py-0.5 text-xs ${
                          battleDone.has(t.id) ? "bg-field-fern text-white" : "bg-field text-field-ink/70"
                        }`}
                      >
                        {battleDone.has(t.id) ? t.short : "???"}
                      </span>
                    ))}
                  </div>
                  {nextTopic && !cleared && (
                    <button
                      type="button"
                      onClick={() => startTopicBattle(nextTopic.id)}
                      className="mt-3 min-h-11 rounded bg-field-stamp px-3 text-sm font-semibold text-white"
                    >
                      Battle {nextTopic.short}
                    </button>
                  )}
                  {cleared && <p className="mt-3 text-sm font-semibold text-field-fern">Gym cleared</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "collection" && (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {DEX.map((creature) => {
              const isCaught = have.has(creature.number);
              const isRare = rareSet.has(creature.number);
              return (
                <div
                  key={creature.number}
                  className={`rounded border p-3 text-center ${
                    isRare ? "border-mark bg-mark-bg" : isCaught ? "border-field-fern bg-white" : "border-field-ink/15 bg-field-ink/5"
                  }`}
                >
                  <div className="font-mono text-[10px] opacity-70">#{String(creature.number).padStart(3, "0")}</div>
                  {isCaught ? (
                    <img src={portraitFor(creature.number, isRare)} alt={creature.name} className="mx-auto mt-2 h-28 w-28 rounded-full object-cover" />
                  ) : (
                    <div className="mx-auto mt-2 h-28 w-28 rounded-full bg-field-ink/10" />
                  )}
                  <div className="mt-2 font-semibold">{isCaught ? creature.name : "???"}</div>
                  {isRare ? <div className="text-xs font-semibold text-mark">Rare</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
