import { getQuestion } from "./catalog";
import { UQB_TOTAL, loadBankProgress } from "./original-bank";
import { questions } from "./questions";
import type { TestBlock } from "./types";

const GYMS = ["oncology", "stones", "andrology", "obstruction", "urogyn", "peds", "core", "basic"] as const;
type Gym = (typeof GYMS)[number];

const FIRST = [
  "Ash", "Brine", "Cairn", "Delta", "Ember", "Fern", "Gale", "Harbor", "Iris", "Juniper", "Kite", "Lumen", "Marrow",
  "Nimbus", "Ore", "Plover", "Quartz", "Reed", "Sable", "Thorn", "Umber", "Vesper", "Wren", "Yarrow", "Zephyr",
];
const SECOND = ["cap", "fin", "hop", "ling", "mite", "cub", "kit", "pup", "nix", "eel", "jay"];

export type Creature = { number: number; name: string; gym: Gym };

export const DEX: Creature[] = FIRST.flatMap((a) => SECOND.map((b) => `${a}${b}`))
  .slice(0, 151)
  .map((name, index) => ({
    number: index + 1,
    name,
    gym: GYMS[index % GYMS.length],
  }));

/** Unique correct questions required for one creature. Full bank ÷ 151, and never fewer than 8. */
export const CATCH_EVERY = Math.max(8, Math.floor((UQB_TOTAL + questions.length) / DEX.length));

const KEY = "callroom-field-caught-v2";
const LEAD = "callroom-field-lead";

type Save = { caught: number[]; rare: number[] };

export function loadField() {
  return load();
}

export function fieldLead() {
  const caught = load().caught;
  const picked = Number(localStorage.getItem(LEAD));
  if (caught.includes(picked)) return picked;
  return caught[0] ?? null;
}

export function chooseLead(number: number) {
  if (!load().caught.includes(number)) return;
  localStorage.setItem(LEAD, String(number));
}

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { caught: [], rare: [] };
    const parsed = JSON.parse(raw) as Save;
    return { caught: parsed.caught ?? [], rare: parsed.rare ?? [] };
  } catch {
    return { caught: [], rare: [] };
  }
}

function gymFor(topicId: string): Gym {
  const text = topicId.toLowerCase();
  if (text.includes("stone")) return "stones";
  if (/infer|androl|sex|testost|erect|peyron|ejacul/.test(text)) return "andrology";
  if (/bph|obstruct|luts|stricture/.test(text)) return "obstruction";
  if (/incont|urogyn|pelvic|oab|bladder-pain|menopause/.test(text)) return "urogyn";
  if (text.includes("ped") || text.includes("reflux") || text.includes("crypt")) return "peds";
  if (/oncol|nmibc|mibc|prostate|renal|testic|penile|utuc|hematuria/.test(text)) return "oncology";
  if (/trauma|core|diversion/.test(text)) return "core";
  return "basic";
}

function correctIds(tests: TestBlock[]) {
  const ids: string[] = [];
  const seen = new Set<string>();
  const add = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };
  for (const test of tests) {
    for (const id of test.questionIds) {
      const answer = test.answers[id];
      if (answer?.submitted && answer.choice != null && answer.choice === getQuestion(id)?.answer) add(id);
    }
  }
  for (const [id, row] of Object.entries(loadBankProgress().answers)) {
    if (row.correct) add(id);
  }
  return ids;
}

export function syncCatches(tests: TestBlock[]): {
  caught: number[];
  rare: number[];
  fresh: Creature[];
  correct: number;
  toward: number;
} {
  const previous = load();
  const had = new Set(previous.caught);
  const ids = correctIds(tests);
  const earned = Math.min(DEX.length, Math.floor(ids.length / CATCH_EVERY));
  const caught: number[] = [];
  const rare: number[] = [];
  const have = new Set<number>();
  for (let n = 0; n < earned; n += 1) {
    const chunk = ids.slice(n * CATCH_EVERY, (n + 1) * CATCH_EVERY);
    const gym = gymFor(getQuestion(chunk[chunk.length - 1] ?? "")?.topicId ?? "");
    const sameTopic = new Set(chunk.map((id) => getQuestion(id)?.topicId)).size === 1;
    const pick =
      DEX.find((creature) => creature.gym === gym && !have.has(creature.number)) ??
      DEX.find((creature) => !have.has(creature.number));
    if (!pick) break;
    have.add(pick.number);
    caught.push(pick.number);
    if (sameTopic) rare.push(pick.number);
  }
  const fresh = caught.filter((number) => !had.has(number)).map((number) => DEX[number - 1]);
  localStorage.setItem(KEY, JSON.stringify({ caught, rare }));
  return { caught, rare, fresh, correct: ids.length, toward: ids.length % CATCH_EVERY };
}

const PORTRAITS = [
  "/field/stone.jpg",
  "/field/lantern.jpg",
  "/field/reed.jpg",
  "/field/crab.jpg",
  "/field/sprout.jpg",
  "/field/drop.jpg",
  "/field/ember.jpg",
  "/field/cloud.jpg",
];

const RARE = ["/field/rare-stone.jpg", "/field/rare-lantern.jpg", "/field/rare-reed.jpg", "/field/rare-crab.jpg"];

export function portraitFor(number: number, rare = false) {
  if (rare) return RARE[(number - 1) % RARE.length];
  return PORTRAITS[(number - 1) % PORTRAITS.length];
}

export function spriteFor(number: number, rare = false) {
  return portraitFor(number, rare).replace("/field/", "/field/cut/").replace(".jpg", ".png");
}