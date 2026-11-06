import { getQuestion } from "./catalog";
import { topics } from "./topics";
import type { TestBlock } from "./types";

const GYMS = ["oncology", "stones", "andrology", "obstruction", "urogyn", "peds", "core", "basic"] as const;

const FIRST = [
  "Ash", "Brine", "Cairn", "Delta", "Ember", "Fern", "Gale", "Harbor", "Iris", "Juniper", "Kite", "Lumen", "Marrow",
  "Nimbus", "Ore", "Plover", "Quartz", "Reed", "Sable", "Thorn", "Umber", "Vesper", "Wren", "Yarrow", "Zephyr",
];
const SECOND = ["cap", "fin", "hop", "ling", "mite", "cub", "kit", "pup", "nix", "eel", "jay"];

export type Creature = { number: number; name: string; gym: (typeof GYMS)[number] };

export const DEX: Creature[] = FIRST.flatMap((a) => SECOND.map((b) => `${a}${b}`))
  .slice(0, 151)
  .map((name, index) => ({
    number: index + 1,
    name,
    gym: GYMS[index % GYMS.length],
  }));

const KEY = "callroom-field-caught-v1";

type Save = { awarded: Record<string, number>; caught: number[]; rare: number[] };

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { awarded: {}, caught: [], rare: [] };
    const parsed = JSON.parse(raw) as Save;
    return { awarded: parsed.awarded ?? {}, caught: parsed.caught ?? [], rare: parsed.rare ?? [] };
  } catch {
    return { awarded: {}, caught: [], rare: [] };
  }
}

export function syncCatches(tests: TestBlock[]): { caught: number[]; rare: number[]; fresh: Creature[] } {
  const save = load();
  const fresh: Creature[] = [];
  const have = new Set(save.caught);
  const rare = new Set(save.rare);
  for (const test of tests) {
    if (test.status !== "done" || !test.name.startsWith("Battle:")) continue;
    if (save.awarded[test.id] != null) continue;
    let right = 0;
    for (const id of test.questionIds) {
      const answer = test.answers[id];
      if (answer?.submitted && answer.choice != null && answer.choice === getQuestion(id)?.answer) right += 1;
    }
    const topic = topics.find((row) => row.short === test.name.replace("Battle: ", ""));
    const gym = topic?.blueprintId;
    const pool = [
      ...DEX.filter((creature) => creature.gym === gym && !have.has(creature.number)),
      ...DEX.filter((creature) => !have.has(creature.number)),
    ];
    const perfect = right > 0 && right === test.questionIds.length;
    const picks = pool.slice(0, right);
    for (const creature of picks) {
      have.add(creature.number);
      save.caught.push(creature.number);
      fresh.push(creature);
    }
    if (perfect && picks.length) {
      const last = picks[picks.length - 1];
      if (!rare.has(last.number)) {
        rare.add(last.number);
        save.rare.push(last.number);
      }
    }
    save.awarded[test.id] = picks.length;
  }
  localStorage.setItem(KEY, JSON.stringify(save));
  return { caught: save.caught, rare: save.rare, fresh };
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
