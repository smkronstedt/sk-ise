import { loadProgress, saveProgress } from "@/lib/progress-api";
import { loadActivity, mergeActivity, saveActivity, dayKey, type DayLog } from "@/lib/desk/activity";
import { getQuestion, loadCatalog } from "@/lib/desk/catalog";
import { loadDaily, mergeDaily, saveDaily } from "@/lib/desk/daily";
import type { ItemAnswer, TestBlock } from "@/lib/desk/types";
import type { Card } from "@/lib/cards";

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

function restoreSide(remoteActivity: Record<string, DayLog> | null | undefined, remoteDaily: Record<string, { id: string; choice?: string; correct?: boolean }> | null | undefined, merge: boolean) {
  saveActivity(merge ? mergeActivity(loadActivity(), remoteActivity) : (remoteActivity ?? {}));
  if (!remoteDaily) return;
  saveDaily(merge ? mergeDaily(loadDaily(), remoteDaily) : remoteDaily);
}

type BankShape = { answers?: Record<string, { choice?: string; correct?: boolean }>; marks?: Record<string, boolean>; notes?: Record<string, string> };
type DeskShape = { tests?: TestBlock[]; marks?: Record<string, boolean>; notes?: Record<string, string>; focus?: Record<string, string>; fresh?: Record<string, boolean> };
type OpsShape = { owned?: string[]; equipped?: Record<string, string>; here?: Record<string, string>; fees?: number; treated?: string[] };

function asRecord<T>(value: unknown): T {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as T) : ({} as T);
}

function mergeFlags(local: Record<string, boolean> = {}, remote: Record<string, boolean> = {}) {
  const out: Record<string, boolean> = {};
  for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) out[key] = Boolean(local[key] || remote[key]);
  return out;
}

function mergeNotes(local: Record<string, string> = {}, remote: Record<string, string> = {}) {
  const out: Record<string, string> = { ...remote };
  for (const [key, note] of Object.entries(local)) {
    if (note || !out[key]) out[key] = note;
  }
  return out;
}

function mergeOneTest(local: TestBlock, remote: TestBlock): TestBlock {
  const answers: Record<string, ItemAnswer> = { ...(remote.answers ?? {}) };
  for (const [id, answer] of Object.entries(local.answers ?? {})) {
    const other = answers[id];
    if (!other?.submitted || answer?.submitted) answers[id] = answer;
  }
  const questionIds = (local.questionIds?.length ?? 0) >= (remote.questionIds?.length ?? 0) ? local.questionIds : remote.questionIds;
  const status = local.status === "done" || remote.status === "done" ? "done" : "open";
  const finishedAt = Math.max(local.finishedAt ?? 0, remote.finishedAt ?? 0) || undefined;
  return {
    ...remote,
    ...local,
    questionIds,
    answers,
    status,
    finishedAt,
    index: Math.max(local.index ?? 0, remote.index ?? 0),
  };
}

function mergeTests(local: TestBlock[] = [], remote: TestBlock[] = []) {
  const map = new Map<string, TestBlock>();
  for (const test of remote) {
    if (test?.id) map.set(test.id, test);
  }
  for (const test of local) {
    if (!test?.id) continue;
    const have = map.get(test.id);
    map.set(test.id, have ? mergeOneTest(test, have) : test);
  }
  return [...map.values()].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0) || a.id.localeCompare(b.id));
}

function mergeDesk(local: DeskShape, remote: DeskShape): DeskShape {
  return {
    tests: mergeTests(local.tests, remote.tests),
    marks: mergeFlags(local.marks, remote.marks),
    notes: mergeNotes(local.notes, remote.notes),
    focus: { ...(remote.focus ?? {}), ...(local.focus ?? {}) },
    fresh: mergeFlags(local.fresh, remote.fresh),
  };
}

function mergeBank(local: BankShape, remote: BankShape): BankShape {
  const answers: NonNullable<BankShape["answers"]> = {};
  for (const id of new Set([...Object.keys(local.answers ?? {}), ...Object.keys(remote.answers ?? {})])) {
    const left = local.answers?.[id];
    const right = remote.answers?.[id];
    if (!left) answers[id] = right!;
    else if (!right || left.correct === right.correct || left.correct) answers[id] = left;
    else answers[id] = right;
  }
  return {
    answers,
    marks: mergeFlags(local.marks, remote.marks),
    notes: mergeNotes(local.notes, remote.notes),
  };
}

function mergeCards(local: Card[], remote: Card[]) {
  const map = new Map<string, Card>();
  for (const card of remote) {
    if (card?.id) map.set(card.id, card);
  }
  for (const card of local) {
    if (!card?.id) continue;
    const have = map.get(card.id);
    if (!have || (card.reps ?? 0) > (have.reps ?? 0) || ((card.reps ?? 0) === (have.reps ?? 0) && (card.due ?? 0) > (have.due ?? 0))) map.set(card.id, card);
  }
  return [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function mergeOps(local: OpsShape | null, remote: OpsShape | null): OpsShape | null {
  if (!local && !remote) return null;
  const left = local ?? {};
  const right = remote ?? {};
  return {
    owned: [...new Set([...(left.owned ?? []), ...(right.owned ?? [])])].sort(),
    equipped: { ...(right.equipped ?? {}), ...(left.equipped ?? {}) },
    here: { ...(right.here ?? {}), ...(left.here ?? {}) },
    fees: Math.max(left.fees ?? 0, right.fees ?? 0),
    treated: [...new Set([...(left.treated ?? []), ...(right.treated ?? [])])].sort(),
  };
}

function mergeBundles(local: Bundle, remote: Bundle): Bundle {
  const localCards = Array.isArray(local.cards) ? (local.cards as Card[]) : [];
  const remoteCards = Array.isArray(remote.cards) ? (remote.cards as Card[]) : [];
  return {
    desk: mergeDesk(asRecord<DeskShape>(local.desk), asRecord<DeskShape>(remote.desk)),
    bank: mergeBank(asRecord<BankShape>(local.bank), asRecord<BankShape>(remote.bank)),
    cards: mergeCards(localCards, remoteCards),
    ops: mergeOps(local.ops && typeof local.ops === "object" ? (local.ops as OpsShape) : null, remote.ops && typeof remote.ops === "object" ? (remote.ops as OpsShape) : null),
  };
}

function stable(value: unknown): string {
  const sort = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(sort);
    if (input && typeof input === "object") {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(input as object).sort()) out[key] = sort((input as Record<string, unknown>)[key]);
      return out;
    }
    return input;
  };
  return JSON.stringify(sort(value));
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
    const merged = mergeBundles(local, unpacked.remoteBundle);
    const changed = stable(merged) !== stable(mergeBundles(local, { desk: {}, bank: {}, cards: [], ops: null }));
    if (changed) {
      apply(merged);
      localStorage.removeItem(SEED);
    }
    await ensureCorrectLog();
    await saveProgress({ data: { payload: JSON.stringify(pack(merged)) } });
    if (userId) localStorage.setItem(OWNER, userId);
    if (changed) window.location.reload();
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
