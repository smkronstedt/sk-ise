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

type Save = { awarded: Record<string, number>; caught: number[] };

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { awarded: {}, caught: [] };
    const parsed = JSON.parse(raw) as Save;
    return { awarded: parsed.awarded ?? {}, caught: parsed.caught ?? [] };
  } catch {
    return { awarded: {}, caught: [] };
  }
}

export function syncCatches(tests: TestBlock[]): { caught: number[]; fresh: Creature[] } {
  const save = load();
  const fresh: Creature[] = [];
  const have = new Set(save.caught);
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
    const picks = pool.slice(0, right);
    for (const creature of picks) {
      have.add(creature.number);
      save.caught.push(creature.number);
      fresh.push(creature);
    }
    save.awarded[test.id] = picks.length;
  }
  localStorage.setItem(KEY, JSON.stringify(save));
  return { caught: save.caught, fresh };
}

const PORTRAITS = ["/field/stone.jpg", "/field/lantern.jpg", "/field/reed.jpg", "/field/crab.jpg"];

export function portraitFor(number: number) {
  return PORTRAITS[(number - 1) % PORTRAITS.length];
}
