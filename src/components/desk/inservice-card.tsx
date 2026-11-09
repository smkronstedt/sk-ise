import { useEffect, useState } from "react";
import { focusFromReport, ise2025, type IseReport } from "@/lib/desk/ise";
import { loadIseReport, saveIseReport } from "@/lib/ise-api";
import type { BlueprintId, Focus } from "@/lib/desk/types";

type Draft = {
  year: string;
  score: string;
  percentile: string;
  priorYear: string;
  priorScore: string;
  priorPercentile: string;
  leaks: { label: string; score: string; items: string }[];
};

const emptyDraft = (): Draft => ({
  year: "2025",
  score: "",
  percentile: "",
  priorYear: "2024",
  priorScore: "",
  priorPercentile: "",
  leaks: [
    { label: "", score: "", items: "" },
    { label: "", score: "", items: "" },
    { label: "", score: "", items: "" },
  ],
});

function fromReport(report: IseReport): Draft {
  const leaks = [0, 1, 2].map((index) => {
    const row = report.leaks[index];
    return row ? { label: row.label, score: String(row.score), items: String(row.items) } : { label: "", score: "", items: "" };
  });
  return {
    year: String(report.year),
    score: String(report.score),
    percentile: String(report.percentile),
    priorYear: report.prior ? String(report.prior.year) : "",
    priorScore: report.prior ? String(report.prior.score) : "",
    priorPercentile: report.prior ? String(report.prior.percentile) : "",
    leaks,
  };
}

export function InserviceCard({
  mine,
  pending,
  signedIn,
  onApply,
  onReport,
}: {
  mine: boolean;
  pending: boolean;
  signedIn: boolean;
  onApply: (focus: Record<BlueprintId, Focus>) => void;
  onReport: (report: IseReport | null) => void;
}) {
  const [report, setReport] = useState<IseReport | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mine || pending || !signedIn) {
      setReport(null);
      onReport(null);
      return;
    }
    let stop = false;
    void loadIseReport()
      .then((result) => {
        if (stop) return;
        setReport(result.report);
        onReport(result.report);
        setEditing(!result.report);
        if (result.report) setDraft(fromReport(result.report));
      })
      .catch(() => {
        if (!stop) setEditing(true);
      });
    return () => {
      stop = true;
    };
  }, [mine, pending, signedIn]);

  if (mine) {
    return (
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
        <button type="button" onClick={() => onApply(ise2025.focus)} className="mt-3 min-h-11 w-full rounded border border-navy px-4 text-sm font-semibold">
          Set focus from this report
        </button>
      </section>
    );
  }

  const save = () => {
    setError("");
    const priorFilled = draft.priorScore.trim() || draft.priorPercentile.trim();
    const leaks = draft.leaks
      .filter((row) => row.label.trim() || row.score.trim() || row.items.trim())
      .map((row) => ({ label: row.label.trim(), items: Number(row.items), score: Number(row.score) }));
    const next: IseReport = {
      year: Number(draft.year),
      score: Number(draft.score),
      percentile: Number(draft.percentile),
      prior: priorFilled
        ? { year: Number(draft.priorYear), score: Number(draft.priorScore), percentile: Number(draft.priorPercentile) }
        : null,
      leaks,
    };
    setBusy(true);
    void saveIseReport({ data: next })
      .then((result) => {
        setReport(result.report);
        onReport(result.report);
        setEditing(false);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save that report."))
      .finally(() => setBusy(false));
  };

  if (pending) {
    return (
      <section className="rounded border border-line bg-paper p-4">
        <p className="text-sm text-muted">Opening your in-service report…</p>
      </section>
    );
  }

  if (!signedIn) {
    return (
      <section className="rounded border border-line bg-paper p-4">
        <p className="text-sm font-semibold tracking-wide text-muted uppercase">In-service</p>
        <p className="mt-1 text-sm text-muted">Sign in to enter your own score report. It stays on your account.</p>
      </section>
    );
  }

  if (report && !editing) {
    const prior = report.prior;
    const direction = prior ? (report.score >= prior.score ? "Up" : "Down") : "";
    return (
      <section className="rounded border border-line bg-paper p-4">
        <p className="text-sm font-semibold tracking-wide text-muted uppercase">{report.year} in-service</p>
        <h2 className="font-serif text-2xl tracking-tight">
          {report.score}% · {report.percentile}th percentile
        </h2>
        {prior ? (
          <p className="mt-1 text-sm text-muted">
            {direction} from {prior.score}% ({prior.percentile}th) in {prior.year}. Time goes to the sections you missed.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">Your national in-service. Time goes to the sections you missed.</p>
        )}
        {report.leaks.length ? (
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {report.leaks.map((row) => (
              <li key={row.label}>
                <span className="font-semibold">{row.label}</span>
                <span className="text-muted">
                  {" "}
                  · {row.score}% on {row.items}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          onClick={() => onApply(focusFromReport(report))}
          className="mt-3 min-h-11 w-full rounded border border-navy px-4 text-sm font-semibold"
        >
          Set focus from this report
        </button>
        <button type="button" onClick={() => setEditing(true)} className="mt-2 min-h-11 w-full rounded border border-line px-4 text-sm font-semibold">
          Edit report
        </button>
      </section>
    );
  }

  const field = "min-h-11 w-full rounded border border-line px-3";
  return (
    <section className="rounded border border-line bg-paper p-4">
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">Your in-service</p>
      <p className="mt-1 text-sm text-muted">Enter it once. It stays on this account and replaces anyone else’s report.</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <label className="text-sm">
          Year
          <input value={draft.year} onChange={(event) => setDraft({ ...draft, year: event.target.value })} className={field} inputMode="numeric" />
        </label>
        <label className="text-sm">
          Score %
          <input value={draft.score} onChange={(event) => setDraft({ ...draft, score: event.target.value })} className={field} inputMode="numeric" />
        </label>
        <label className="text-sm">
          Percentile
          <input value={draft.percentile} onChange={(event) => setDraft({ ...draft, percentile: event.target.value })} className={field} inputMode="numeric" />
        </label>
      </div>
      <p className="mt-3 text-sm font-semibold">Year before, if you have it</p>
      <div className="mt-1 grid grid-cols-3 gap-2">
        <input value={draft.priorYear} onChange={(event) => setDraft({ ...draft, priorYear: event.target.value })} className={field} inputMode="numeric" aria-label="Prior year" />
        <input value={draft.priorScore} onChange={(event) => setDraft({ ...draft, priorScore: event.target.value })} className={field} inputMode="numeric" placeholder="Score %" />
        <input value={draft.priorPercentile} onChange={(event) => setDraft({ ...draft, priorPercentile: event.target.value })} className={field} inputMode="numeric" placeholder="Percentile" />
      </div>
      <p className="mt-3 text-sm font-semibold">Weak sections</p>
      <div className="mt-1 flex flex-col gap-2">
        {draft.leaks.map((row, index) => (
          <div key={index} className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] gap-2">
            <input
              value={row.label}
              onChange={(event) => {
                const leaks = draft.leaks.slice();
                leaks[index] = { ...row, label: event.target.value };
                setDraft({ ...draft, leaks });
              }}
              className={field}
              placeholder="Section"
            />
            <input
              value={row.score}
              onChange={(event) => {
                const leaks = draft.leaks.slice();
                leaks[index] = { ...row, score: event.target.value };
                setDraft({ ...draft, leaks });
              }}
              className={field}
              inputMode="numeric"
              placeholder="%"
              aria-label="Section percent"
            />
            <input
              value={row.items}
              onChange={(event) => {
                const leaks = draft.leaks.slice();
                leaks[index] = { ...row, items: event.target.value };
                setDraft({ ...draft, leaks });
              }}
              className={field}
              inputMode="numeric"
              placeholder="Items"
              aria-label="Section item count"
            />
          </div>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-wrong">{error}</p> : null}
      <button type="button" disabled={busy} onClick={save} className="mt-3 min-h-11 w-full rounded bg-navy px-4 text-sm font-semibold text-white disabled:opacity-50">
        {busy ? "Saving…" : "Save report"}
      </button>
      {report ? (
        <button type="button" onClick={() => setEditing(false)} className="mt-2 min-h-11 w-full rounded border border-line px-4 text-sm font-semibold">
          Cancel
        </button>
      ) : null}
    </section>
  );
}
