import { loadProgress, saveProgress } from "@/lib/progress-api";
import { loadActivity, mergeActivity, saveActivity, dayKey, type DayLog } from "@/lib/desk/activity";
import { getQuestion, loadCatalog } from "@/lib/desk/catalog";
import { loadDaily, mergeDaily, saveDaily } from "@/lib/desk/daily";
import type { ItemAnswer, TestBlock } from "@/lib/desk/types";
import type { Card } from "@/lib/cards";
import { BAG_KEY, mergeBags } from "@/lib/desk/quest-bag";

const DESK = "callroom-desk-v1";
const BANK = "callroom-original-bank-v1";
const CARDS = "callroom-cards-v1";
const OPS = "callroom-ops-v1";
const TRAIN = "callroom-training-v1";
const QUEST = "callroom-quest-spend-v1";
const OWNER = "callroom-owner";
const DAILY = "callroom-daily-v1";
const EXTRA = [DAILY, "callroom-activity-v1", "callroom-field-caught-v2", "callroom-field-lead", "callroom-fieldnotes-xp", "ise-trail-pos", "houston-trail-at", "callroom-trials", "callroom-row-v1", "callroom-row-best", TRAIN, QUEST, BAG_KEY];
const SEED = "callroom-correct-seed-v1";

type Side = {
  field?: { caught?: number[]; rare?: number[] } | null;
  lead?: number | null;
  trials?: string[] | null;
  row?: number;
  rowBest?: number;
  houston?: number;
  trail?: { x?: number; y?: number } | null;
  notes?: { topicId?: string; xp?: number; level?: number; stage?: number }[] | null;
  evos?: { id: string; name: string; level: number; stage: number; at: number }[] | null;
};

type CardsField = { list?: unknown; ops?: unknown; activity?: Record<string, DayLog>; daily?: Record<string, { id: string; choice?: string; correct?: boolean }>; training?: unknown; questSpend?: number; questBag?: unknown; side?: Side } | unknown[] | null;

type Bundle = {
  desk: unknown;
  bank: unknown;
  cards: unknown;
  ops: unknown;
  training: unknown;
  questSpend: number;
  questBag: unknown;
  side: Side;
};

function questNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

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

function readSide(): Side {
  const num = (key: string) => {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) ? value : 0;
  };
  return {
    field: read("callroom-field-caught-v2") as Side["field"],
    lead: num("callroom-field-lead") || null,
    trials: read("callroom-trials") as string[] | null,
    row: num("callroom-row-v1"),
    rowBest: num("callroom-row-best"),
    houston: num("houston-trail-at"),
    trail: read("ise-trail-pos") as Side["trail"],
    notes: read("callroom-fieldnotes-xp") as Side["notes"],
    evos: read("callroom-evo-log-v1") as Side["evos"],
  };
}

function localBundle(): Bundle {
  return {
    desk: read(DESK),
    bank: read(BANK),
    cards: read(CARDS),
    ops: read(OPS),
    training: read(TRAIN),
    questSpend: questNumber(localStorage.getItem(QUEST)),
    questBag: read(BAG_KEY),
    side: readSide(),
  };
}

function hasLocalWork(bundle: Bundle) {
  const desk = bundle.desk as { tests?: unknown[] } | null;
  const bank = bundle.bank as { answers?: Record<string, unknown> } | null;
  const cards = Array.isArray(bundle.cards) ? bundle.cards : [];
  const training = Array.isArray(bundle.training) ? bundle.training : [];
  const bag = bundle.questBag as { party?: unknown[] } | null;
  const caught = bundle.side?.field?.caught?.length ?? 0;
  return Boolean(desk?.tests?.length || (bank?.answers && Object.keys(bank.answers).length) || cards.length || bundle.ops || training.length || bundle.questSpend > 0 || bag?.party?.length || caught || (bundle.side?.trials?.length ?? 0) || (bundle.side?.houston ?? 0) > 0);
}

function writeSide(side: Side | null | undefined) {
  if (!side) return;
  if (side.field) write("callroom-field-caught-v2", side.field);
  if (side.lead) localStorage.setItem("callroom-field-lead", String(side.lead));
  if (side.trials) write("callroom-trials", side.trials);
  localStorage.setItem("callroom-row-v1", String(side.row || 0));
  localStorage.setItem("callroom-row-best", String(side.rowBest || 0));
  if (side.houston) localStorage.setItem("houston-trail-at", String(side.houston));
  if (side.trail) write("ise-trail-pos", side.trail);
  if (side.notes) write("callroom-fieldnotes-xp", side.notes);
  if (side.evos) write("callroom-evo-log-v1", side.evos);
}

function apply(bundle: Bundle) {
  write(DESK, bundle.desk);
  write(BANK, bundle.bank);
  write(CARDS, bundle.cards);
  write(OPS, bundle.ops);
  write(TRAIN, bundle.training);
  localStorage.setItem(QUEST, String(bundle.questSpend || 0));
  if (bundle.questBag) write(BAG_KEY, bundle.questBag);
  writeSide(bundle.side);
}

function clearStudy() {
  for (const key of [DESK, BANK, CARDS, OPS, SEED, ...EXTRA]) localStorage.removeItem(key);
}

function unpack(payload: string) {
  const parsed = JSON.parse(payload) as { desk?: unknown; bank?: unknown; cards?: unknown };
  const cardsField = parsed.cards as CardsField;
  const remoteActivity = Array.isArray(cardsField) ? null : cardsField?.activity;
  const remoteDaily = Array.isArray(cardsField) ? null : cardsField?.daily;
  const remoteTraining = Array.isArray(cardsField) ? null : cardsField?.training;
  const remoteQuest = Array.isArray(cardsField) ? 0 : questNumber(cardsField?.questSpend);
  const remoteBundle: Bundle = {
    desk: parsed.desk ?? null,
    bank: parsed.bank ?? null,
    cards: Array.isArray(cardsField) ? cardsField : (cardsField?.list ?? null),
    ops: Array.isArray(cardsField) ? null : (cardsField?.ops ?? null),
    training: remoteTraining ?? null,
    questSpend: remoteQuest,
    questBag: Array.isArray(cardsField) ? null : (cardsField?.questBag ?? null),
    side: Array.isArray(cardsField) ? {} : (cardsField?.side ?? {}),
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

function mergeSide(local: Side = {}, remote: Side = {}): Side {
  const caught = [...new Set([...(local.field?.caught ?? []), ...(remote.field?.caught ?? [])])].sort((a, b) => a - b);
  const rare = [...new Set([...(local.field?.rare ?? []), ...(remote.field?.rare ?? [])])].sort((a, b) => a - b);
  const trials = [...new Set([...(local.trials ?? []), ...(remote.trials ?? [])])];
  const notes = new Map<string, { topicId?: string; xp?: number; level?: number; stage?: number }>();
  for (const row of [...(remote.notes ?? []), ...(local.notes ?? [])]) {
    if (!row?.topicId) continue;
    const have = notes.get(row.topicId);
    if (!have || (row.xp ?? 0) > (have.xp ?? 0)) notes.set(row.topicId, row);
  }
  return {
    field: { caught, rare },
    lead: local.lead || remote.lead || null,
    trials,
    row: Math.max(local.row || 0, remote.row || 0),
    rowBest: Math.max(local.rowBest || 0, remote.rowBest || 0),
    houston: Math.max(local.houston || 0, remote.houston || 0),
    trail: local.trail ?? remote.trail ?? null,
    notes: [...notes.values()],
    evos: [...new Map([...(remote.evos ?? []), ...(local.evos ?? [])].map((entry) => [`${entry.id}:${entry.stage}`, entry])).values()],
  };
}
function mergeTraining(local: unknown, remote: unknown) {
  const rows = [...(Array.isArray(remote) ? remote : []), ...(Array.isArray(local) ? local : [])];
  const map = new Map<string, unknown>();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const id = String((row as { id?: string }).id ?? "");
    if (id) map.set(id, row);
  }
  return [...map.values()];
}

function mergeBundles(local: Bundle, remote: Bundle): Bundle {
  const localCards = Array.isArray(local.cards) ? (local.cards as Card[]) : [];
  const remoteCards = Array.isArray(remote.cards) ? (remote.cards as Card[]) : [];
  return {
    desk: mergeDesk(asRecord<DeskShape>(local.desk), asRecord<DeskShape>(remote.desk)),
    bank: mergeBank(asRecord<BankShape>(local.bank), asRecord<BankShape>(remote.bank)),
    cards: mergeCards(localCards, remoteCards),
    ops: mergeOps(local.ops && typeof local.ops === "object" ? (local.ops as OpsShape) : null, remote.ops && typeof remote.ops === "object" ? (remote.ops as OpsShape) : null),
    training: mergeTraining(local.training, remote.training),
    questSpend: Math.max(local.questSpend || 0, remote.questSpend || 0),
    questBag: mergeBags(local.questBag, remote.questBag),
    side: mergeSide(local.side, remote.side),
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

let syncing: Promise<"synced" | "device"> | null = null;
let syncAgain = false;

function playingNow() {
  if (typeof window === "undefined") return false;
  if (window.location.pathname.startsWith("/test")) return true;
  try {
    return sessionStorage.getItem("ise-playing") === "1" || sessionStorage.getItem("ise-battle") === "1";
  } catch {
    return false;
  }
}

function reloadIfIdle() {
  if (playingNow()) return;
  window.location.reload();
}

export async function syncDeviceProgress(userId?: string): Promise<"synced" | "device"> {
  if (syncing) {
    syncAgain = true;
    return syncing;
  }
  syncing = drain(userId).finally(() => {
    syncing = null;
  });
  return syncing;
}

async function drain(userId?: string): Promise<"synced" | "device"> {
  let result: "synced" | "device" = "device";
  do {
    syncAgain = false;
    result = await syncOnce(userId);
  } while (syncAgain);
  return result;
}

async function syncOnce(userId?: string): Promise<"synced" | "device"> {
  try {
    const remote = await loadProgress();
    const owner = userId ? localStorage.getItem(OWNER) : null;
    if (userId && owner && owner !== userId) {
      clearStudy();
      if (remote?.payload) {
        const unpacked = unpack(remote.payload);
        if (hasLocalWork(unpacked.remoteBundle)) apply(unpacked.remoteBundle);
        restoreSide(unpacked.remoteActivity, unpacked.remoteDaily, false);
      }
      localStorage.setItem(OWNER, userId);
      reloadIfIdle();
      return "synced";
    }
    if (!remote?.payload) {
      if (hasLocalWork(localBundle())) {
        await ensureCorrectLog();
        await saveProgress({ data: { payload: JSON.stringify(pack(localBundle())) } });
      }
      if (userId) localStorage.setItem(OWNER, userId);
      return "synced";
    }
    const first = unpack(remote.payload);
    const newer = await loadProgress();
    const unpacked = newer?.payload ? unpack(newer.payload) : first;
    if (playingNow()) {
      await saveProgress({ data: { payload: JSON.stringify(pack(localBundle())) } });
      if (userId) localStorage.setItem(OWNER, userId);
      return "synced";
    }
    restoreSide(unpacked.remoteActivity, unpacked.remoteDaily, true);
    const before = stable(localBundle());
    const merged = mergeBundles(localBundle(), unpacked.remoteBundle);
    const changed = stable(merged) !== before;
    if (changed) {
      apply(merged);
      localStorage.removeItem(SEED);
    }
    await ensureCorrectLog();
    const fresh = mergeBundles(localBundle(), merged);
    await saveProgress({ data: { payload: JSON.stringify(pack(fresh)) } });
    if (userId) localStorage.setItem(OWNER, userId);
    if (changed) reloadIfIdle();
    return "synced";
  } catch {
    return "device";
  }
}

function pack(bundle: Bundle) {
  return {
    desk: bundle.desk ?? {},
    bank: bundle.bank ?? {},
    cards: { list: bundle.cards ?? [], ops: bundle.ops ?? null, activity: loadActivity(), daily: loadDaily(), training: bundle.training ?? [], questSpend: bundle.questSpend || 0, questBag: bundle.questBag ?? null, side: bundle.side ?? {} },
  };
}
