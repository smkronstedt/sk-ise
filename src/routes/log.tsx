import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { dayKey, loadActivity, type DayLog } from "@/lib/desk/activity";
import { loadBankProgress } from "@/lib/desk/original-bank";
import { loadEvoLog } from "@/lib/desk/quest-bag";
import { CABINET_PURSE, examProgress, purseFor, YEAR_PURSE } from "@/lib/desk/sasp-exams";

export const Route = createFileRoute("/log")({
  component: LogPage,
});

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function LogPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const [days, setDays] = useState<Record<string, DayLog>>({});
  const [answered, setAnswered] = useState<Set<string>>(new Set());

  useEffect(() => {
    const read = () => {
      setDays(loadActivity());
      setAnswered(new Set(Object.keys(loadBankProgress().answers)));
    };
    read();
    window.addEventListener("ise-activity", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("ise-activity", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  const today = dayKey();
  const exams = examProgress(answered);
  const finished = exams.filter((exam) => exam.complete);
  const purse = purseFor(finished.length);
  const evolutions = loadEvoLog().sort((a, b) => b.at - a.at);

  return (
    <Shell>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <section className="rounded border border-line bg-paper p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">History</p>
              <h1 className="font-serif text-3xl tracking-tight">
                {cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}
              </h1>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} className="min-h-11 rounded border border-line px-3 text-sm font-semibold">
                Prev
              </button>
              <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} className="min-h-11 rounded border border-line px-3 text-sm font-semibold">
                Next
              </button>
            </div>
          </div>
          <p className="mt-1 text-sm text-muted">Questions and flashcards finished on this device, starting from when this log was added.</p>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted">
            {weekdays.map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} />;
              const key = dayKey(new Date(year, month, day));
              const row = days[key];
              const isToday = key === today;
              return (
                <div key={key} className={`min-h-16 rounded border p-1 text-left ${isToday ? "border-navy bg-navy/5" : "border-line"}`}>
                  <div className="text-xs font-semibold">{day}</div>
                  {row?.questions ? <div className="text-[11px] text-navy">{row.questions} q</div> : null}
                  {row?.cards ? <div className="text-[11px] text-mark">{row.cards} cards</div> : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded border border-amber-500 bg-amber-50">
          <img src="/field/league.jpg" alt="" className="h-36 w-full object-cover" />
          <div className="p-4">
            <p className="text-xs font-semibold tracking-wide text-amber-800 uppercase">SASP practice tests</p>
            <h2 className="font-serif text-3xl text-amber-950">${purse.toLocaleString()}</h2>
            <p className="mt-1 text-sm text-amber-950">
              Finish a SASP year from the spreadsheet and the purse adds ${YEAR_PURSE.toLocaleString()}. 2016 through 2023 are 150 questions. 2025 has 14. There is no 2024 in the file. Finishing every year adds another ${CABINET_PURSE.toLocaleString()}.
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {exams.map((exam) => (
                <li key={exam.year}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-semibold">{exam.complete ? "Done" : "Open"} · SASP {exam.year}</span>
                    <span>
                      {exam.done}/{exam.total}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded bg-white">
                    <div className="h-full bg-amber-600" style={{ width: `${(exam.done / exam.total) * 100}%` }} />
                  </div>
                  {exam.complete ? <p className="mt-1 text-xs font-semibold text-amber-800">Prize ${YEAR_PURSE.toLocaleString()}</p> : null}
                </li>
              ))}
            </ul>
            {finished.length === exams.length ? (
              <p className="mt-4 text-sm font-semibold text-amber-950">Cabinet prize ${CABINET_PURSE.toLocaleString()} is yours.</p>
            ) : (
              <p className="mt-4 text-sm text-amber-950">{finished.length}/{exams.length} full tests finished.</p>
            )}
            <Link to="/bank" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-navy">
              Open the bank
            </Link>
          </div>
        </section>
        <section className="rounded border border-line bg-paper p-4 lg:col-span-2">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Record</p>
          <h2 className="font-serif text-2xl">Evolutions</h2>
          {evolutions.length === 0 ? <p className="mt-2 text-sm text-muted">None yet. A creature evolves at level 6, then again at level 14.</p> : null}
          <ul className="mt-3 flex flex-col gap-2">
            {evolutions.map((entry) => (
              <li key={`${entry.id}-${entry.stage}`} className="text-sm">
                <span className="font-semibold">{entry.name}</span> evolved at level {entry.level}. {entry.stage >= 2 ? "Final form." : "First form."}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Shell>
  );
}
