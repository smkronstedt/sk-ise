import { useEffect, useState } from "react";
import {
  DAILY_GOAL,
  DAILY_PRIZE,
  MONTH_GOAL,
  MONTH_PRIZE,
  WEEK_GOAL,
  WEEK_PRIZE,
  YEAR_GOAL,
  YEAR_PRIZE,
  prizeStatus,
} from "@/lib/desk/activity";

export function PrizeLadder() {
  const [status, setStatus] = useState<ReturnType<typeof prizeStatus> | null>(null);
  useEffect(() => {
    const read = () => setStatus(prizeStatus());
    read();
    window.addEventListener("ise-activity", read);
    return () => window.removeEventListener("ise-activity", read);
  }, []);
  if (!status) return null;
  const rows = [
    ["Today", `${status.today}/${DAILY_GOAL} questions`, status.today >= DAILY_GOAL ? `$${DAILY_PRIZE} in` : `$${DAILY_PRIZE} at ${DAILY_GOAL}`],
    ["This week", `${status.weekDays}/${WEEK_GOAL} paid days`, status.weekDays >= WEEK_GOAL ? `$${WEEK_PRIZE} in` : `$${WEEK_PRIZE} at ${WEEK_GOAL} days`],
    ["This month", `${status.monthDays}/${MONTH_GOAL} paid days`, status.monthDays >= MONTH_GOAL ? `$${MONTH_PRIZE} in` : `$${MONTH_PRIZE} at ${MONTH_GOAL} days`],
    ["This year", `${status.yearDays}/${YEAR_GOAL} paid days`, status.yearDays >= YEAR_GOAL ? `$${YEAR_PRIZE} in` : `$${YEAR_PRIZE} at ${YEAR_GOAL} days`],
  ];
  return (
    <section className="mb-4 rounded border border-line bg-paper px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-2xl tracking-tight">Study prizes</h2>
        <p className="text-sm font-semibold">${status.purse} earned</p>
      </div>
      <p className="mt-1 text-sm text-muted">A day pays only after {DAILY_GOAL} submitted questions. Cards do not count. Correct answers still pay $1 on their own.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        {rows.map(([label, progress, prize]) => (
          <div key={label} className="rounded border border-line px-3 py-2">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
            <p className="mt-1 font-semibold">{progress}</p>
            <p className="text-sm text-muted">{prize}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
