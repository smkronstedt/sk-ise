import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { dayKey, loadActivity, type DayLog } from "@/lib/desk/activity";

const levels = ["#e7e5e1", "#d6e4f5", "#7aa2d4", "#1d3d66", "#c45c26"];

function total(row?: DayLog) {
  return (row?.questions ?? 0) + (row?.cards ?? 0);
}

function levelFor(count: number) {
  if (count <= 0) return 0;
  if (count < 10) return 1;
  if (count < 25) return 2;
  if (count < 50) return 3;
  return 4;
}

function shift(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function streakEnding(days: Record<string, DayLog>, from: Date) {
  let cursor = new Date(from);
  let count = 0;
  while (total(days[dayKey(cursor)]) > 0) {
    count += 1;
    cursor = shift(cursor, -1);
  }
  return count;
}

export function HeatMap() {
  const [days, setDays] = useState<Record<string, DayLog>>({});
  const [picked, setPicked] = useState(dayKey());

  useEffect(() => {
    const read = () => setDays(loadActivity());
    read();
    window.addEventListener("ise-activity", read);
    return () => window.removeEventListener("ise-activity", read);
  }, []);

  const today = new Date();
  const end = shift(today, 6 - today.getDay());
  const start = shift(end, -52 * 7);
  const weeks: Date[][] = [];
  for (let week = 0; week < 53; week += 1) {
    const column = [];
    for (let weekday = 0; weekday < 7; weekday += 1) column.push(shift(start, week * 7 + weekday));
    weeks.push(column);
  }

  const todayKey = dayKey(today);
  const studiedToday = total(days[todayKey]) > 0;
  const current = studiedToday ? streakEnding(days, today) : streakEnding(days, shift(today, -1));
  let longest = 0;
  let run = 0;
  for (let cursor = new Date(start); cursor <= end; cursor = shift(cursor, 1)) {
    if (total(days[dayKey(cursor)]) > 0) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  let questions = 0;
  let cards = 0;
  let active = 0;
  for (const row of Object.values(days)) {
    questions += row.questions || 0;
    cards += row.cards || 0;
    if (total(row) > 0) active += 1;
  }
  const selected = days[picked];

  return (
    <section className="mb-4 overflow-hidden rounded border border-line bg-paper">
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Heat</p>
          <h2 className="font-serif text-2xl tracking-tight">A year of work</h2>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <p><span className="font-semibold">{current}</span> day streak</p>
          <p><span className="font-semibold">{longest}</span> best</p>
          <p><span className="font-semibold">{active}</span> days</p>
          <p><span className="font-semibold">{questions}</span> q · <span className="font-semibold">{cards}</span> cards</p>
        </div>
      </div>
      <div className="overflow-x-auto px-4 py-3">
        <div className="flex gap-2">
          <div className="flex flex-col justify-between py-4 text-[10px] text-muted">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>
          <div>
            <div className="mb-1 flex gap-[3px]">
              {weeks.map((week, index) => {
                const firstOfMonth = week.find((date) => date.getDate() === 1);
                return (
                  <div key={index} className="relative h-3 w-3 shrink-0">
                    {firstOfMonth ? (
                      <span className="absolute text-[9px] whitespace-nowrap text-muted">
                        {firstOfMonth.toLocaleString("en-US", { month: "short" })}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-[3px]">
              {weeks.map((week, index) => (
                <div key={index} className="flex flex-col gap-[3px]">
                  {week.map((date) => {
                    const key = dayKey(date);
                    const future = date > today;
                    const row = days[key];
                    const count = total(row);
                    const color = future ? "transparent" : levels[levelFor(count)];
                    return (
                      <button
                        key={key}
                        type="button"
                        title={`${key}: ${row?.questions ?? 0} questions, ${row?.cards ?? 0} cards`}
                        onClick={() => setPicked(key)}
                        className="h-3 w-3 rounded-[2px]"
                        style={{
                          background: color,
                          outline: key === picked ? "1px solid #111" : key === todayKey ? "1px solid #1d3d66" : "none",
                          boxShadow: row?.cards ? "inset 0 0 0 1.5px #f3c56b" : undefined,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 text-xs text-muted">
        <p>
          {picked}: {selected?.questions ?? 0} questions, {selected?.cards ?? 0} cards.
          {selected?.cards ? " Gold edge means cards." : ""}
        </p>
        <div className="flex items-center gap-1">
          <span>Less</span>
          {levels.map((color) => (
            <span key={color} className="h-3 w-3 rounded-[2px]" style={{ background: color }} />
          ))}
          <span>More</span>
          <Link to="/log" className="ml-2 font-semibold text-navy">Full log</Link>
        </div>
      </div>
    </section>
  );
}
