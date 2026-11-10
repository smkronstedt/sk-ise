export type CaseProgress = {
  topicId: string;
  xp: number;
  level: number;
  stage: number;
};

const XP_KEY = "callroom-fieldnotes-xp";

export function loadProgress(): CaseProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(XP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProgress(progress: CaseProgress[]) {
  localStorage.setItem(XP_KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event("ise-progress"));
}

export function addXp(topicId: string, amount: number): CaseProgress {
  const all = loadProgress();
  let entry = all.find((p) => p.topicId === topicId);
  if (!entry) {
    entry = { topicId, xp: 0, level: 1, stage: 1 };
    all.push(entry);
  }
  entry.xp += amount;
  entry.level = Math.floor(entry.xp / 100) + 1;
  entry.stage = entry.level >= 10 ? 3 : entry.level >= 5 ? 2 : 1;
  saveProgress(all);
  return entry;
}

export function getProgress(topicId: string): CaseProgress {
  const all = loadProgress();
  return all.find((p) => p.topicId === topicId) ?? { topicId, xp: 0, level: 1, stage: 1 };
}

export const stages = ["Basic", "Advanced", "Master"];
