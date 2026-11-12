import { Fragment, useEffect, useState } from "react";
import { focusFromReport, ise2024, ise2025, iseSections, type IseLine, type IseReport } from "@/lib/desk/ise";
import { loadIseReport, saveIseReport } from "@/lib/ise-api";
import type { BlueprintId, Focus } from "@/lib/desk/types";

type LineDraft = { items: string; score: string };

type Draft = {
  year: string;
  items: string;
  score: string;
  percentile: string;
  priorYear: string;
  priorScore: string;
  priorPercentile: string;
  lines: Record<string, LineDraft>;
};

function blankLines(): Record<string, LineDraft> {
  return Object.fromEntries(iseSections.map((row) => [row.id, { items: "", score: "" }]));
}

function emptyDraft(): Draft {
  return {
    year: "2025",
    items: "",
    score: "",
    percentile: "",
    priorYear: "2024",
    priorScore: "",
    priorPercentile: "",
    lines: blankLines(),
  };
}

function fromReport(report: IseReport): Draft {
  const lines = blankLines();
  for (const line of report.lines) {
    if (lines[line.id]) lines[line.id] = { items: String(line.items), score: String(line.score) };
  }
  return {
    year: String(report.year),
    items: report.items ? String(report.items) : "",
    score: String(report.score),
    percentile: String(report.percentile),
    priorYear: report.prior ? String(report.prior.year) : "",
    priorScore: report.prior ? String(report.prior.score) : "",
    priorPercentile: report.prior ? String(report.prior.percentile) : "",
    lines,
  };
}

function ReportTable({ lines }: { lines: IseLine[] }) {
  const byId = new Map(lines.map((line) => [line.id, line]));
  let group = "";
  return (
    <table className="mt-3 w-full text-sm">
      <tbody>
        {iseSections.map((section) => {
          const line = byId.get(section.id);
          if (!line) return null;
          const header = section.group !== group;
          group = section.group;
          const weak = line.score < 60;
          return (
            <Fragment key={section.id}>
              {header ? (
                <tr>
                  <td colSpan={3} className="pt-2 text-xs font-semibold tracking-wide text-muted uppercase">
                    {section.group}
                  </td>
                </tr>
              ) : null}
              <tr className="border-t border-line">
                <td className="py-1 pr-2">{section.label}</td>
                <td className="w-12 py-1 text-right text-muted">{line.items}</td>
                <td className={`w-12 py-1 text-right ${weak ? "font-semibold text-wrong" : ""}`}>{line.score}%</td>
              </tr>
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

function SavedReport({
  report,
  onApply,
  onEdit,
}: {
  report: IseReport;
  onApply: () => void;
  onEdit?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const prior = report.prior;
  const direction = prior ? (report.score >= prior.score ? "Up" : "Down") : "";
  return (
    <section className="rounded border border-line bg-paper p-4">
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">{report.year} in-service</p>
      {open ? (
        <>
          <h2 className="font-serif text-2xl tracking-tight">
            {report.score}% · {report.percentile}th percentile
          </h2>
          <p className="mt-1 text-sm text-muted">
            {report.items ? `${report.items} items. ` : ""}
            {prior ? `${direction} from ${prior.score}% (${prior.percentile}th) in ${prior.year}. ` : ""}
            Sections under 60% are marked.
          </p>
          <ReportTable lines={report.lines} />
          <button type="button" onClick={onApply} className="mt-3 min-h-11 w-full rounded border border-navy px-4 text-sm font-semibold">
            Set focus from this report
          </button>
          {onEdit ? (
            <button type="button" onClick={onEdit} className="mt-2 min-h-11 w-full rounded border border-line px-4 text-sm font-semibold">
              Edit report
            </button>
          ) : null}
          <button type="button" onClick={() => setOpen(false)} className="mt-2 min-h-11 w-full rounded border border-line px-4 text-sm font-semibold">
            Hide score
          </button>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">Hidden, so a shared screen does not show the score.</p>
          <button type="button" onClick={() => setOpen(true)} className="mt-3 min-h-11 w-full rounded bg-navy px-4 text-sm font-semibold text-white">
            View
          </button>
        </>
      )}
    </section>
  );
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
  onReport?: (report: IseReport | null) => void;
}) {
  const [report, setReport] = useState<IseReport | null>(null);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mine || pending || !signedIn) {
      setReport(null);
      onReport?.(null);
      return;
    }
    let stop = false;
    void loadIseReport()
      .then((result) => {
        if (stop) return;
        setReport(result.report);
        onReport?.(result.report);
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
      <div className="flex flex-col gap-4">
        <section className="rounded border border-line bg-paper p-4">
          <p className="text-sm font-semibold tracking-wide text-muted uppercase">2025 in-service</p>
          {open ? (
            <>
              <h2 className="font-serif text-2xl tracking-tight">
                {ise2025.score}% · {ise2025.percentile}th percentile
              </h2>
              <p className="mt-1 text-sm text-muted">
                {ise2025.items} items. Up from {ise2025.prior[0].score}% ({ise2025.prior[0].percentile}th) in {ise2025.prior[0].year}, and {ise2025.prior[1].score}% ({ise2025.prior[1].percentile}th) in {ise2025.prior[1].year}. Time still goes to the large misses: voiding was 43% on 30 items, stones 52% on 17, and core 37% on 8. Neoplasm was 63% on 30 items, so it stays on the outline.
              </p>
              <ReportTable lines={ise2025.lines} />
              <button type="button" onClick={() => onApply(ise2025.focus)} className="mt-3 min-h-11 w-full rounded border border-navy px-4 text-sm font-semibold">
                Set focus from this report
              </button>
              <button type="button" onClick={() => setOpen(false)} className="mt-2 min-h-11 w-full rounded border border-line px-4 text-sm font-semibold">
                Hide score
              </button>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">Hidden, so a shared screen does not show the score.</p>
              <button type="button" onClick={() => setOpen(true)} className="mt-3 min-h-11 w-full rounded bg-navy px-4 text-sm font-semibold text-white">
                View
              </button>
            </>
          )}
        </section>
        {open ? (
          <details className="rounded border border-line bg-paper p-4">
            <summary className="cursor-pointer text-sm font-semibold">2024 report</summary>
            <p className="mt-2 text-sm text-muted">{ise2024.items} items. {ise2024.score}% · {ise2024.percentile}th. PGY2.</p>
            <ReportTable lines={ise2024.lines} />
          </details>
        ) : null}
      </div>
    );
  }

  const save = () => {
    setError("");
    const priorFilled = draft.priorScore.trim() || draft.priorPercentile.trim();
    const lines: IseLine[] = [];
    for (const section of iseSections) {
      const row = draft.lines[section.id];
      if (!row.items.trim() && !row.score.trim()) continue;
      lines.push({ id: section.id, items: Number(row.items), score: Number(row.score) });
    }
    const next: IseReport = {
      year: Number(draft.year),
      items: draft.items.trim() ? Number(draft.items) : 0,
      score: Number(draft.score),
      percentile: Number(draft.percentile),
      prior: priorFilled
        ? { year: Number(draft.priorYear), score: Number(draft.priorScore), percentile: Number(draft.priorPercentile) }
        : null,
      lines,
    };
    setBusy(true);
    void saveIseReport({ data: next })
      .then((result) => {
        setReport(result.report);
        onReport?.(result.report);
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
        <p className="mt-1 text-sm text-muted">Sign in and type your score report once. It stays on your account.</p>
      </section>
    );
  }

  if (report && !editing) {
    return <SavedReport report={report} onApply={() => onApply(focusFromReport(report))} onEdit={() => setEditing(true)} />;
  }

  const field = "min-h-11 w-full rounded border border-line px-2";
  let group = "";
  return (
    <section className="rounded border border-line bg-paper p-4">
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">Your in-service</p>
      <p className="mt-1 text-sm text-muted">Type the report once. Saving it builds the same card, with your numbers. Leave a row blank if you do not have it.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-sm">
          Year
          <input value={draft.year} onChange={(event) => setDraft({ ...draft, year: event.target.value })} className={field} inputMode="numeric" />
        </label>
        <label className="text-sm">
          Total items
          <input value={draft.items} onChange={(event) => setDraft({ ...draft, items: event.target.value })} className={field} inputMode="numeric" />
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
      <div className="mt-3 flex flex-col gap-2">
        {iseSections.map((section) => {
          const header = section.group !== group;
          group = section.group;
          const row = draft.lines[section.id];
          const setLine = (patch: Partial<LineDraft>) => {
            setDraft({ ...draft, lines: { ...draft.lines, [section.id]: { ...row, ...patch } } });
          };
          return (
            <div key={section.id}>
              {header ? <p className="pt-1 text-xs font-semibold tracking-wide text-muted uppercase">{section.group}</p> : null}
              <div className="mt-1 grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] gap-2">
                <p className="self-center text-sm">{section.label}</p>
                <input value={row.items} onChange={(event) => setLine({ items: event.target.value })} className={field} inputMode="numeric" placeholder="Items" aria-label={`${section.label} items`} />
                <input value={row.score} onChange={(event) => setLine({ score: event.target.value })} className={field} inputMode="numeric" placeholder="%" aria-label={`${section.label} percent`} />
              </div>
            </div>
          );
        })}
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
