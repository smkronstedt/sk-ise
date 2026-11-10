import { spendQuest } from "@/lib/desk/purse";

export const BAG_KEY = "callroom-quest-bag-v1";

export type SpeciesId = "sprout" | "pebble" | "wick" | "drop";
export type Ball = "ball" | "great" | "ultra" | "master";

export const lines: Record<SpeciesId, { names: [string, string, string] }> = {
  sprout: { names: ["Sprout", "Thicket", "Canopy"] },
  pebble: { names: ["Pebble", "Ridge", "Crag"] },
  wick: { names: ["Wick", "Kindle", "Pyre"] },
  drop: { names: ["Drop", "Brook", "Tide"] },
};

export type Creature = {
  id: string;
  species: SpeciesId;
  exp: number;
  hp: number;
};

export type QuestBag = {
  party: Creature[];
  box: Creature[];
  balls: Record<Ball, number>;
  potions: number;
  supers: number;
  hpBonus: number;
  power: number;
  mastersBought: number;
  updatedAt: number;
};

export const shopItems = [
  { id: "potion", name: "Potion", price: 8, note: "Heals 12 HP." },
  { id: "super", name: "Super Potion", price: 18, note: "Heals all HP." },
  { id: "ball", name: "Ball", price: 12, note: "A normal catch." },
  { id: "great", name: "Great Ball", price: 28, note: "Better when it is hurt." },
  { id: "ultra", name: "Ultra Ball", price: 60, note: "A strong catch." },
  { id: "master", name: "Master Ball", price: 280, note: "Does not miss. Rare." },
  { id: "hp", name: "HP Up", price: 40, note: "Permanent. +6 max HP." },
  { id: "protein", name: "Protein", price: 45, note: "Permanent. Hits harder." },
  { id: "candy", name: "Rare Candy", price: 50, note: "Permanent. One level. Can evolve." },
] as const;

export type ShopId = (typeof shopItems)[number]["id"];

export function monSrc(species: SpeciesId, stage: 0 | 1 | 2) {
  return `/quest/mon/${species}-${stage}.png`;
}

export function levelOf(exp: number) {
  let level = 1;
  let spent = 0;
  while (level < 40) {
    const need = 8 + level * 2;
    if (spent + need > exp) return level;
    spent += need;
    level += 1;
  }
  return 40;
}

export function stageOf(level: number): 0 | 1 | 2 {
  if (level >= 16) return 2;
  if (level >= 8) return 1;
  return 0;
}

export function nameOf(creature: Creature) {
  return lines[creature.species].names[stageOf(levelOf(creature.exp))];
}

export function maxHp(creature: Creature, bag: Pick<QuestBag, "hpBonus">) {
  const level = levelOf(creature.exp);
  return 20 + bag.hpBonus + stageOf(level) * 6 + level * 2;
}

export function strike(creature: Creature, bag: Pick<QuestBag, "power">) {
  const level = levelOf(creature.exp);
  return 3 + bag.power + stageOf(level) + Math.floor(level / 5);
}

function expForLevel(level: number) {
  let exp = 0;
  for (let i = 1; i < level; i++) exp += 8 + i * 2;
  return exp;
}

export function makeCreature(species: SpeciesId, level: number, hpBonus = 0): Creature {
  const creature: Creature = { id: `${species}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, species, exp: expForLevel(level), hp: 1 };
  creature.hp = maxHp(creature, { hpBonus });
  return creature;
}

function starterBag(): QuestBag {
  const starter = makeCreature("sprout", 5, 0);
  starter.id = "starter-sprout";
  return {
    party: [starter],
    box: [],
    balls: { ball: 8, great: 0, ultra: 0, master: 0 },
    potions: 3,
    supers: 0,
    hpBonus: 0,
    power: 0,
    mastersBought: 0,
    updatedAt: 1,
  };
}

function clamp(bag: QuestBag): QuestBag {
  for (const creature of [...bag.party, ...bag.box]) creature.hp = Math.max(0, Math.min(creature.hp, maxHp(creature, bag)));
  return bag;
}

export function loadBag(): QuestBag {
  try {
    const raw = localStorage.getItem(BAG_KEY);
    if (!raw) return starterBag();
    const parsed = JSON.parse(raw) as QuestBag;
    return clamp({
      ...starterBag(),
      ...parsed,
      party: parsed.party?.length ? parsed.party : starterBag().party,
      box: parsed.box ?? [],
      balls: {
        ball: parsed.balls?.ball ?? 8,
        great: parsed.balls?.great ?? 0,
        ultra: parsed.balls?.ultra ?? 0,
        master: parsed.balls?.master ?? 0,
      },
    });
  } catch {
    return starterBag();
  }
}

export function saveBag(bag: QuestBag) {
  bag.updatedAt = Date.now();
  localStorage.setItem(BAG_KEY, JSON.stringify(clamp(bag)));
  if (typeof window !== "undefined") window.dispatchEvent(new Event("ise-progress"));
}

export function foeHealth(kind: "trainer" | "leader" | "rival" | "wild", count: number, cityIndex: number) {
  if (kind === "wild") return 10 + cityIndex * 2;
  if (kind === "leader") return 22 + count * 2;
  if (kind === "rival") return 28;
  return 12 + count * 2;
}

export function grantExp(creature: Creature, amount: number) {
  const beforeStage = stageOf(levelOf(creature.exp));
  const beforeLevel = levelOf(creature.exp);
  const beforeName = nameOf(creature);
  creature.exp += amount;
  const afterLevel = levelOf(creature.exp);
  const afterStage = stageOf(afterLevel);
  if (afterStage > beforeStage) return `${beforeName} evolved into ${nameOf(creature)}!`;
  if (afterLevel > beforeLevel) return `${nameOf(creature)} grew to level ${afterLevel}.`;
  return "";
}

export function catchChance(ball: Ball, hp: number, max: number) {
  if (ball === "master") return 1;
  const hurt = 1 - Math.max(0, hp) / Math.max(1, max);
  const base = ball === "ultra" ? 0.55 : ball === "great" ? 0.35 : 0.2;
  return Math.min(0.95, base + hurt * 0.6);
}

export function wildSpecies(cityIndex: number): SpeciesId {
  const pool: SpeciesId[] = ["sprout", "pebble", "wick", "drop"];
  return pool[(cityIndex + Math.floor(Math.random() * 2)) % pool.length];
}

export function masterStock(bag: QuestBag, badges: number) {
  const allowed = badges >= 4 ? 1 + Math.floor((badges - 4) / 2) : 0;
  return Math.max(0, allowed - bag.mastersBought);
}

export function buyItem(id: ShopId, badges: number): string {
  const item = shopItems.find((row) => row.id === id);
  if (!item) return "Not for sale.";
  const bag = loadBag();
  if (id === "master" && masterStock(bag, badges) <= 0) return "No Master Ball in stock.";
  if (!spendQuest(item.price)) return "Not enough Quest money.";
  const lead = bag.party[0];
  if (id === "potion") bag.potions += 1;
  if (id === "super") bag.supers += 1;
  if (id === "ball" || id === "great" || id === "ultra" || id === "master") bag.balls[id] += 1;
  if (id === "master") bag.mastersBought += 1;
  if (id === "hp") {
    bag.hpBonus += 6;
    for (const creature of [...bag.party, ...bag.box]) creature.hp += 6;
  }
  if (id === "protein") bag.power += 1;
  let note = `Bought ${item.name}.`;
  if (id === "candy" && lead) {
    const gain = 8 + levelOf(lead.exp) * 2;
    const grew = grantExp(lead, gain);
    lead.hp = maxHp(lead, bag);
    note = grew || `${nameOf(lead)} is level ${levelOf(lead.exp)}.`;
  }
  saveBag(bag);
  return note;
}

export function drink(kind: "potion" | "super", index = 0): string {
  const bag = loadBag();
  const creature = bag.party[index];
  if (!creature) return "No one to heal.";
  if (kind === "potion") {
    if (bag.potions <= 0) return "No Potions.";
    bag.potions -= 1;
    creature.hp = Math.min(maxHp(creature, bag), creature.hp + 12);
  } else {
    if (bag.supers <= 0) return "No Super Potions.";
    bag.supers -= 1;
    creature.hp = maxHp(creature, bag);
  }
  saveBag(bag);
  return `${nameOf(creature)} healed.`;
}

export function takeBall(ball: Ball): boolean {
  const bag = loadBag();
  if ((bag.balls[ball] ?? 0) <= 0) return false;
  bag.balls[ball] -= 1;
  saveBag(bag);
  return true;
}

export function keepCatch(species: SpeciesId, level: number): string {
  const bag = loadBag();
  const creature = makeCreature(species, level, bag.hpBonus);
  const home = bag.party.length < 6 ? "party" : "box";
  if (home === "party") bag.party.push(creature);
  else bag.box.push(creature);
  saveBag(bag);
  return home === "party" ? `${nameOf(creature)} joined you.` : `${nameOf(creature)} went to the box.`;
}

export function makeLead(index: number) {
  const bag = loadBag();
  if (index <= 0 || index >= bag.party.length) return;
  const [creature] = bag.party.splice(index, 1);
  bag.party.unshift(creature);
  saveBag(bag);
}

export function swapBox(index: number) {
  const bag = loadBag();
  const boxed = bag.box[index];
  const lead = bag.party[0];
  if (!boxed || !lead) return;
  bag.box[index] = lead;
  bag.party[0] = boxed;
  saveBag(bag);
}

export function mergeBags(local: unknown, remote: unknown): QuestBag | null {
  const left = asBag(local);
  const right = asBag(remote);
  if (!left && !right) return null;
  if (!left) return right;
  if (!right) return left;
  const newer = (left.updatedAt ?? 0) >= (right.updatedAt ?? 0) ? left : right;
  const older = newer === left ? right : left;
  const seen = new Map<string, Creature>();
  for (const creature of [...older.party, ...older.box, ...newer.party, ...newer.box]) {
    const have = seen.get(creature.id);
    if (!have || creature.exp > have.exp) seen.set(creature.id, { ...creature, hp: Math.max(have?.hp ?? 0, creature.hp) });
  }
  const partyIds = new Set(newer.party.map((creature) => creature.id));
  const party = newer.party.map((creature) => seen.get(creature.id) ?? creature);
  for (const creature of seen.values()) {
    if (!partyIds.has(creature.id) && !newer.box.some((row) => row.id === creature.id) && !newer.party.some((row) => row.id === creature.id)) party.push(creature);
  }
  const box = newer.box.map((creature) => seen.get(creature.id) ?? creature).filter((creature) => !party.some((row) => row.id === creature.id));
  const extras = [...seen.values()].filter((creature) => !party.some((row) => row.id === creature.id) && !box.some((row) => row.id === creature.id));
  return clamp({
    ...newer,
    party: party.slice(0, 6),
    box: [...box, ...party.slice(6), ...extras],
    hpBonus: Math.max(left.hpBonus, right.hpBonus),
    power: Math.max(left.power, right.power),
    mastersBought: Math.max(left.mastersBought, right.mastersBought),
  });
}

function asBag(value: unknown): QuestBag | null {
  if (!value || typeof value !== "object") return null;
  const bag = value as QuestBag;
  if (!Array.isArray(bag.party)) return null;
  return bag;
}
