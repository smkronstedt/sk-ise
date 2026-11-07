const KEY = "callroom-training-v1";

export type WorkoutKind = "run" | "lift" | "plunge" | "other";

export type Workout = {
  id: string;
  day: string;
  source: "strava" | "garmin" | "trainingpeaks" | "apple" | "log";
  kind: WorkoutKind;
  miles: number;
  note: string;
};

function read(): Workout[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Workout[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(rows: Workout[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event("ise-activity"));
}

export function loadTraining() {
  return read().sort((a, b) => b.day.localeCompare(a.day) || b.id.localeCompare(a.id));
}

export function addWorkout(entry: Omit<Workout, "id">) {
  const rows = read();
  rows.push({ ...entry, id: `${Date.now()}` });
  write(rows);
}

function daySet(rows: Workout[]) {
  return new Set(rows.map((row) => row.day));
}

export function workoutStreak(rows = read()) {
  const days = daySet(rows);
  const cursor = new Date();
  const key = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  };
  if (!days.has(key(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(key(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function trainingSummary(rows = read()) {
  const miles = rows.reduce((sum, row) => sum + (Number(row.miles) || 0), 0);
  const lifts = rows.filter((row) => row.kind === "lift").length;
  const mental = rows.filter((row) => row.kind === "plunge" || (row.kind === "run" && row.miles >= 5)).length;
  const streak = workoutStreak(rows);
  const weekBonus = Math.floor(streak / 7) * 25;
  const monthBonus = streak >= 30 ? 100 : 0;
  return {
    miles,
    lifts,
    mental,
    streak,
    purse: Math.floor(miles) + weekBonus + monthBonus,
    weekBonus,
    monthBonus,
  };
}
