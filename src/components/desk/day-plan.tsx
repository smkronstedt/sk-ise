import { useEffect, useState } from "react";
import { lectureFor } from "@/lib/desk/lectures";
import { DAILY_GOAL, prizeStatus } from "@/lib/desk/activity";
import type { BucketStat } from "@/lib/desk/adapt";

const EXAM = new Date("2026-11-21T13:00:00Z");

function remaining(now: number) {
  const ms = Math.max(0, EXAM.getTime() - now);
  const day = Math.floor(ms / 86400000);
  const hour = Math.floor((ms % 86400000) / 3600000);
  return { day, hour, done: ms === 0 };
}

const topicFor: Record<string, string> = {
  oncology: "Oncology-Bladder/Urothelial",
  core: "Anatomy/Embryology",
  urogyn: "Voiding Dysfunction/Incontinence",
  obstruction: "BPH/LUTS",
  stones: "Stones",
  peds: "Pediatrics",
  andrology: "Infertility/Andrology",
  basic: "Laparoscopy/Robotics/Perioperative",
};

export function DayPlan({
  stats,
  onStart,
}: {
  stats: BucketStat[];
  onStart: (blueprintId: string) => void;
}) {
  const [clock, setClock] = useState(() => remaining(Date.now()));
  const [today, setToday] = useState(0);
  useEffect(() => {
    const tick = () => setClock(remaining(Date.now()));
    const id = window.setInterval(tick, 60000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    const read = () => setToday(prizeStatus().today);
    read();
    window.addEventListener("ise-activity", read);
    return () => window.removeEventListener("ise-activity", read);
  }, []);
  const weak = [...stats].sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0) || b.percent - a.percent);
  const focus = weak.filter((row) => row.bank > 0).slice(0, 2);
  const primary = focus[0];
  const lecture = lectureFor(topicFor[primary?.id ?? ""] ?? "");
  const left = Math.max(0, DAILY_GOAL - today);
  return (
    <section className="mb-4 rounded border border-line bg-paper px-4 py-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Today</p>
          <h2 className="font-serif text-2xl tracking-tight">Study plan</h2>
        </div>
        <div className="text-right">
          <p className="font-blackletter text-3xl leading-none">{clock.done ? "Exam day" : `${clock.day}d ${clock.hour}h`}</p>
          <p className="text-xs text-muted">In-service · Sat Nov 21, 2026</p>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">
        {left > 0 ? `${left} more questions today for the $${10} prize.` : "The daily prize is already in. A short set still pays $1 a correct answer."}{" "}
        {primary ? `Work ${focus.map((row) => row.short).join(" and ")}.` : "Start anywhere."}
      </p>
      {primary ? (
        <p className="mt-1 text-sm">
          Watch <span className="font-semibold">{lecture.title}</span>, then do {Math.max(left, 10)} questions in {focus.map((row) => row.short).join(" / ")}.
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => onStart(primary?.id ?? focus[0]?.id ?? "oncology")}
        className="mt-3 min-h-11 rounded bg-navy px-4 text-sm font-semibold text-white"
      >
        Build today’s test
      </button>
    </section>
  );
}
