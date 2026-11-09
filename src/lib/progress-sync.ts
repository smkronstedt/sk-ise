import { loadProgress, saveProgress } from "@/lib/progress-api";
import { loadActivity, mergeActivity, saveActivity, dayKey, type DayLog } from "@/lib/desk/activity";
import { getQuestion, loadCatalog } from "@/lib/desk/catalog";
import { loadDaily, saveDaily } from "@/lib/desk/daily";

const DESK = "callroom-desk-v1";
const BANK = "callroom-original-bank-v1";
const CARDS = "callroom-cards-v1";
const OPS = "callroom-ops-v1";
const OWNER = "callroom-owner";
const DAILY = "callroom-daily-v1";
const EXTRA = [DAILY, "callroom-activity-v1", "callroom-field-caught-v2", "callroom-fieldnotes-xp", "ise-trail-pos"];
const SEED = "callroom-correct-seed-v1";

type CardsField = { list?: unknown; ops?: unknown; activity?: Record<string, DayLog>; daily?: Record<string, { id: string; choice?: string; correct?: boolean }> } | unknown[] | null;

type Bundle = {
  desk: unknown;
  bank: unknown;
  cards: unknown;
  ops: unknown;
};

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (value == null) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function localBundle(): Bundle {
  return {
    desk: read(DESK),
    bank: read(BANK),
    cards: read(CARDS),
    ops: read(OPS),
  };
}

function hasLocalWork(bundle: Bundle) {
  const desk = bundle.desk as { tests?: unknown[] } | null;
  const bank = bundle.bank as { answers?: Record<string, unknown> } | null;
  const cards = Array.isArray(bundle.cards) ? bundle.cards : [];
  return Boolean(desk?.tests?.length || (bank?.answers && Object.keys(bank.answers).length) || cards.length || bundle.ops);
}

function apply(bundle: Bundle) {
  write(DESK, bundle.desk);
  write(BANK, bundle.bank);
  write(CARDS, bundle.cards);
  write(OPS, bundle.ops);
}

function clearStudy() {
  for (const key of [DESK, BANK, CARDS, OPS, SEED, ...EXTRA]) localStorage.removeItem(key);
}

function unpack(payload: string) {
  const parsed = JSON.parse(payload) as { desk?: unknown; bank?: unknown; cards?: unknown };
  const cardsField = parsed.cards as CardsField;
  const remoteActivity = Array.isArray(cardsField) ? null : cardsField?.activity;
  const remoteDaily = Array.isArray(cardsField) ? null : cardsField?.daily;
  const remoteBundle: Bundle = {
    desk: parsed.desk ?? null,
    bank: parsed.bank ?? null,
    cards: Array.isArray(cardsField) ? cardsField : (cardsField?.list ?? null),
    ops: Array.isArray(cardsField) ? null : (cardsField?.ops ?? null),
  };
  return { remoteBundle, remoteActivity, remoteDaily };
}

function restoreSide(remoteActivity: Record<string, DayLog> | null | undefined, remoteDaily: Record<string, { id: string }> | null | undefined, merge: boolean) {
  saveActivity(merge ? mergeActivity(loadActivity(), remoteActivity) : (remoteActivity ?? {}));
  if (remoteDaily) saveDaily(remoteDaily);
}

type SeedAnswer = { choice?: number | null; submitted?: boolean };
type SeedTest = { createdAt?: number; finishedAt?: number; answers?: Record<string, SeedAnswer> };

/** Count correct answers already sitting on finished and open tests, once. */
export async function ensureCorrectLog() {
  try {
    if (localStorage.getItem(SEED)) return;
    const raw = localStorage.getItem(DESK);
    const tests = (raw ? (JSON.parse(raw) as { tests?: SeedTest[] }).tests : []) ?? [];
    const needsBank = tests.some((test) => Object.keys(test.answers ?? {}).some((id) => id.startsWith("UQB-")));
    if (needsBank) {
      await loadCatalog();
      if (!getQuestion("UQB-0001")) return;
    }
    const seeded = new Map<string, number>();
    for (const test of tests) {
      const stamp = test.finishedAt || test.createdAt;
      if (!stamp) continue;
      let count = 0;
      for (const [id, answer] of Object.entries(test.answers ?? {})) {
        if (!answer?.submitted || answer.choice == null) continue;
        const question = getQuestion(id);
        if (question && answer.choice === question.answer) count += 1;
      }
      if (!count) continue;
      const key = dayKey(new Date(stamp));
      seeded.set(key, (seeded.get(key) ?? 0) + count);
    }
    const days = loadActivity();
    for (const [key, count] of seeded) {
      const row = days[key] ?? { questions: 0, cards: 0 };
      row.correct = Math.max(row.correct ?? 0, count);
      days[key] = row;
    }
    saveActivity(days);
    localStorage.setItem(SEED, "1");
  } catch {
    return;
  }
}

export async function syncDeviceProgress(userId?: string): Promise<"synced" | "device"> {
  const local = localBundle();
  const owner = userId ? localStorage.getItem(OWNER) : null;
  try {
    const remote = await loadProgress();
    if (userId && owner && owner !== userId) {
      clearStudy();
      if (remote?.payload) {
        const unpacked = unpack(remote.payload);
        if (hasLocalWork(unpacked.remoteBundle)) apply(unpacked.remoteBundle);
        restoreSide(unpacked.remoteActivity, unpacked.remoteDaily, false);
      }
      localStorage.setItem(OWNER, userId);
      window.location.reload();
      return "synced";
    }
    if (!remote?.payload) {
      if (hasLocalWork(local)) {
        await ensureCorrectLog();
        await saveProgress({ data: { payload: JSON.stringify(pack(local)) } });
      }
      if (userId) localStorage.setItem(OWNER, userId);
      return "synced";
    }
    const unpacked = unpack(remote.payload);
    restoreSide(unpacked.remoteActivity, unpacked.remoteDaily, true);
    if (!hasLocalWork(local) && hasLocalWork(unpacked.remoteBundle)) {
      apply(unpacked.remoteBundle);
      if (userId) localStorage.setItem(OWNER, userId);
      window.location.reload();
      return "synced";
    }
    await ensureCorrectLog();
    await saveProgress({ data: { payload: JSON.stringify(pack(local)) } });
    if (userId) localStorage.setItem(OWNER, userId);
    return "synced";
  } catch {
    return "device";
  }
}

function pack(bundle: Bundle) {
  return {
    desk: bundle.desk ?? {},
    bank: bundle.bank ?? {},
    cards: { list: bundle.cards ?? [], ops: bundle.ops ?? null, activity: loadActivity(), daily: loadDaily() },
  };
}
