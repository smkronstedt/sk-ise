import { spendQuest } from "@/lib/desk/purse";
import { DEX, loadField, spriteFor } from "@/lib/desk/field-dex";

export const BAG_KEY = "callroom-quest-bag-v1";

export type SpeciesId = "sprout" | "pebble" | "wick" | "drop";
export type Ball = "ball" | "great" | "ultra" | "master";

export const lines: Record<SpeciesId, { names: [string, string, string] }> = {
  sprout: { names: ["Sprout", "Thicket", "Canopy"] },
  pebble: { names: ["Pebble", "Ridge", "Crag"] },
  wick: { names: ["Wick", "Kindle", "Pyre"] },
  drop: { names: ["Drop", "Brook", "Tide"] },
};

export type KnownMove = { id: string; pp: number };

export type Creature = {
  id: string;
  species: SpeciesId;
  exp: number;
  hp: number;
  dex?: number;
  moves?: KnownMove[];
  pending?: string;
};

export type QuestBag = {
  party: Creature[];
  box: Creature[];
  balls: Record<Ball, number>;
  potions: number;
  supers: number;
  revives: number;
  maxRevives: number;
  repels: number;
  repelLeft: number;
  guards: number;
  xAttacks: number;
  expShare: boolean;
  charm: boolean;
  hpBonus: number;
  power: number;
  mastersBought: number;
  candies: number;
  updatedAt: number;
};

export const shopItems = [
  { id: "potion", name: "Potion", price: 8, note: "Heals 12 HP." },
  { id: "super", name: "Super Potion", price: 18, note: "Heals all HP." },
  { id: "ball", name: "Ball", price: 12, note: "A normal catch." },
  { id: "great", name: "Great Ball", price: 28, note: "Better when it is hurt." },
  { id: "ultra", name: "Ultra Ball", price: 60, note: "A strong catch." },
  { id: "master", name: "Master Ball", price: 280, note: "Does not miss. Rare." },
  { id: "revive", name: "Revive", price: 22, note: "A fainted one returns at half HP." },
  { id: "maxRevive", name: "Max Revive", price: 55, note: "A fainted one returns at full HP." },
  { id: "repel", name: "Repel", price: 12, note: "No wild ones for 30 steps." },
  { id: "guard", name: "Guard", price: 14, note: "The next hit you take is weak." },
  { id: "xattack", name: "X Attack", price: 14, note: "Your next hit hits twice as hard." },
  { id: "hp", name: "HP Up", price: 40, note: "Permanent. +6 max HP." },
  { id: "protein", name: "Protein", price: 45, note: "Permanent. Hits harder." },
  { id: "candy", name: "Rare Candy", price: 50, note: "Goes in the bag. Use it on one creature for a level." },
  { id: "share", name: "Exp. Share", price: 75, note: "Once. The rest of the party gains experience." },
  { id: "charm", name: "Catch Charm", price: 90, note: "Once. Balls work better. Not a Master Ball." },
] as const;

export type ShopId = (typeof shopItems)[number]["id"];

const cute: Record<SpeciesId, string> = {
  sprout: "/field/cut/sprout.png?v=3",
  pebble: "/field/cut/stone.png?v=3",
  wick: "/field/cut/ember.png?v=3",
  drop: "/field/cut/drop.png?v=3",
};

export function monSrc(species: SpeciesId, _stage: 0 | 1 | 2) {
  return cute[species];
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

export function creatureSrc(creature: Creature) {
  if (creature.dex) return spriteFor(creature.dex, loadField().rare.includes(creature.dex));
  return monSrc(creature.species, stageOf(levelOf(creature.exp)));
}

export function nameOf(creature: Creature) {
  if (creature.dex) return DEX[creature.dex - 1]?.name ?? "Caught";
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

export type MoveDef = { id: string; name: string; kind: string; power: number; pp: number; level: number; species?: SpeciesId };

export const moveBook: MoveDef[] = [
  { id: "bash", name: "Bash", kind: "Normal", power: 4, pp: 35, level: 1 },
  { id: "brace", name: "Brace", kind: "Normal", power: 0, pp: 20, level: 6 },
  { id: "leaf", name: "Leaf Cut", kind: "Grass", power: 7, pp: 20, level: 8, species: "sprout" },
  { id: "stone", name: "Stone Toss", kind: "Rock", power: 7, pp: 20, level: 8, species: "pebble" },
  { id: "flare", name: "Flare", kind: "Fire", power: 7, pp: 20, level: 8, species: "wick" },
  { id: "spray", name: "Spray", kind: "Water", power: 7, pp: 20, level: 8, species: "drop" },
  { id: "slam", name: "Heavy Slam", kind: "Normal", power: 10, pp: 10, level: 16 },
  { id: "bloom", name: "Bloom Burst", kind: "Grass", power: 12, pp: 8, level: 22, species: "sprout" },
  { id: "quake", name: "Ground Crack", kind: "Rock", power: 12, pp: 8, level: 22, species: "pebble" },
  { id: "blaze", name: "Blaze", kind: "Fire", power: 12, pp: 8, level: 22, species: "wick" },
  { id: "surge", name: "Surge", kind: "Water", power: 12, pp: 8, level: 22, species: "drop" },
];

export function moveDef(id: string) {
  return moveBook.find((move) => move.id === id);
}

function starterMoves(creature: Creature): KnownMove[] {
  const level = levelOf(creature.exp);
  return moveBook
    .filter((move) => move.level <= level && (!move.species || move.species === creature.species))
    .slice(-4)
    .map((move) => ({ id: move.id, pp: move.pp }));
}

export function knownMoves(creature: Creature) {
  if (!creature.moves?.length) creature.moves = starterMoves(creature);
  return creature.moves
    .map((slot) => ({ ...slot, def: moveDef(slot.id) }))
    .filter((slot): slot is KnownMove & { def: MoveDef } => Boolean(slot.def));
}

export function learnThrough(creature: Creature, from: number, to: number) {
  const notes: string[] = [];
  if (!creature.moves?.length) creature.moves = starterMoves(creature);
  for (const move of moveBook) {
    if (move.level <= from || move.level > to) continue;
    if (move.species && move.species !== creature.species) continue;
    if (creature.moves.some((slot) => slot.id === move.id)) continue;
    if (creature.moves.length < 4) {
      creature.moves.push({ id: move.id, pp: move.pp });
      notes.push(`${nameOf(creature)} learned ${move.name}.`);
    } else if (!creature.pending) {
      creature.pending = move.id;
      notes.push(`${nameOf(creature)} wants to learn ${move.name}. Forget a move in the party.`);
    }
  }
  return notes.join(" ");
}

export function spendPp(creature: Creature, moveId: string) {
  const slot = knownMoves(creature).find((move) => move.id === moveId);
  const stored = creature.moves?.find((move) => move.id === moveId);
  if (!slot || !stored || stored.pp <= 0) return false;
  stored.pp -= 1;
  return true;
}

export function forgetForPending(creatureId: string, slot: number) {
  const bag = loadBag();
  const creature = [...bag.party, ...bag.box].find((row) => row.id === creatureId);
  const next = creature?.pending ? moveDef(creature.pending) : undefined;
  if (!creature?.moves || !next || slot < 0 || slot >= creature.moves.length) return "";
  const old = moveDef(creature.moves[slot].id);
  creature.moves[slot] = { id: next.id, pp: next.pp };
  creature.pending = undefined;
  saveBag(bag);
  return `${nameOf(creature)} forgot ${old?.name ?? "a move"} and learned ${next.name}.`;
}

export function expPace(exp: number) {
  const level = levelOf(exp);
  let spent = 0;
  for (let i = 1; i < level; i++) spent += 8 + i * 2;
  const need = level >= 40 ? 1 : 8 + level * 2;
  return { level, into: Math.max(0, exp - spent), need };
}

function expForLevel(level: number) {
  let exp = 0;
  for (let i = 1; i < level; i++) exp += 8 + i * 2;
  return exp;
}

export function makeCreature(species: SpeciesId, level: number, hpBonus = 0): Creature {
  const creature: Creature = { id: `${species}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, species, exp: expForLevel(level), hp: 1 };
  creature.hp = maxHp(creature, { hpBonus });
  creature.moves = starterMoves(creature);
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
    revives: 0,
    maxRevives: 0,
    repels: 0,
    repelLeft: 0,
    guards: 0,
    xAttacks: 0,
    expShare: false,
    charm: false,
    hpBonus: 0,
    power: 0,
    mastersBought: 0,
    candies: 0,
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
      candies: parsed.candies ?? 1,
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
  creature.exp += amount;
  const afterLevel = levelOf(creature.exp);
  const afterStage = stageOf(afterLevel);
  const learned = learnThrough(creature, beforeLevel, afterLevel);
  if (afterStage > beforeStage) {
    const line = creature.dex
      ? `${nameOf(creature)} evolved.`
      : `${lines[creature.species].names[beforeStage]} evolved into ${lines[creature.species].names[afterStage]}!`;
    return [line, learned].filter(Boolean).join(" ");
  }
  if (afterLevel > beforeLevel) return [`${nameOf(creature)} grew to level ${afterLevel}.`, learned].filter(Boolean).join(" ");
  return learned;
}

/** Experience for finishing a fight. The lead gets the full amount. Exp. Share splits half to the others. */
export function payExp(bag: QuestBag, amount: number) {
  const lead = bag.party[0];
  if (!lead || amount <= 0) return "";
  const notes = [`${nameOf(lead)} gained ${amount} Exp.`, grantExp(lead, amount)];
  if (bag.expShare) {
    for (const other of bag.party.slice(1)) {
      const shared = grantExp(other, Math.max(4, Math.floor(amount / 2)));
      if (shared) notes.push(shared);
    }
  }
  return notes.filter(Boolean).join(" ");
}

export function catchChance(ball: Ball, hp: number, max: number, charm = false) {
  if (ball === "master") return 1;
  const hurt = 1 - Math.max(0, hp) / Math.max(1, max);
  const base = ball === "ultra" ? 0.55 : ball === "great" ? 0.35 : 0.2;
  const chance = Math.min(0.95, base + hurt * 0.6);
  return charm ? Math.min(0.95, chance + 0.12) : chance;
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
  if (id === "share" && bag.expShare) return "You already have Exp. Share.";
  if (id === "charm" && bag.charm) return "You already have a Catch Charm.";
  if (!spendQuest(item.price)) return "Not enough Quest money.";
  if (id === "potion") bag.potions += 1;
  if (id === "super") bag.supers += 1;
  if (id === "revive") bag.revives += 1;
  if (id === "maxRevive") bag.maxRevives += 1;
  if (id === "repel") bag.repels += 1;
  if (id === "guard") bag.guards += 1;
  if (id === "xattack") bag.xAttacks += 1;
  if (id === "share") bag.expShare = true;
  if (id === "charm") bag.charm = true;
  if (id === "ball" || id === "great" || id === "ultra" || id === "master") bag.balls[id] += 1;
  if (id === "master") bag.mastersBought += 1;
  if (id === "hp") {
    bag.hpBonus += 6;
    for (const creature of [...bag.party, ...bag.box]) creature.hp += 6;
  }
  if (id === "protein") bag.power += 1;
  let note = `Bought ${item.name}.`;
  if (id === "candy") {
    bag.candies += 1;
    note = "Rare Candy is in the bag. Open Start, then use it on the one you choose.";
  }
  saveBag(bag);
  return note;
}

export function useHeld(kind: "candy" | "potion" | "super" | "revive" | "max", index: number, boxed = false): string {
  const bag = loadBag();
  const list = boxed ? bag.box : bag.party;
  const creature = list[index];
  if (!creature) return "No one there.";
  if (kind === "candy") {
    if (bag.candies <= 0) return "No Rare Candy.";
    bag.candies -= 1;
    const before = maxHp(creature, bag);
    const grew = grantExp(creature, 8 + levelOf(creature.exp) * 2);
    creature.hp = Math.min(maxHp(creature, bag), creature.hp + Math.max(0, maxHp(creature, bag) - before));
    saveBag(bag);
    return grew || `${nameOf(creature)} is level ${levelOf(creature.exp)}.`;
  }
  if (kind === "potion" || kind === "super") {
    if (creature.hp <= 0) return `${nameOf(creature)} is fainted. Use a Revive.`;
    if (creature.hp >= maxHp(creature, bag)) return `${nameOf(creature)} is already full.`;
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
  if (creature.hp > 0) return `${nameOf(creature)} is still up.`;
  if (kind === "revive") {
    if (bag.revives <= 0) return "No Revives.";
    bag.revives -= 1;
    creature.hp = Math.ceil(maxHp(creature, bag) / 2);
  } else {
    if (bag.maxRevives <= 0) return "No Max Revives.";
    bag.maxRevives -= 1;
    creature.hp = maxHp(creature, bag);
  }
  saveBag(bag);
  return `${nameOf(creature)} got back up.`;
}

export function drink(kind: "potion" | "super", index = 0): string {
  return useHeld(kind, index, false);
}

export function healAll(bag: QuestBag) {
  for (const creature of [...bag.party, ...bag.box]) creature.hp = maxHp(creature, bag);
}

export function revive(kind: "revive" | "max", index = 0): string {
  const bag = loadBag();
  const creature = bag.party[index];
  if (!creature) return "No one to revive.";
  if (creature.hp > 0) return `${nameOf(creature)} is still up.`;
  if (kind === "revive") {
    if (bag.revives <= 0) return "No Revives.";
    bag.revives -= 1;
    creature.hp = Math.ceil(maxHp(creature, bag) / 2);
  } else {
    if (bag.maxRevives <= 0) return "No Max Revives.";
    bag.maxRevives -= 1;
    creature.hp = maxHp(creature, bag);
  }
  saveBag(bag);
  return `${nameOf(creature)} got back up.`;
}

export function useRepel(): string {
  const bag = loadBag();
  if (bag.repels <= 0) return "No Repels.";
  bag.repels -= 1;
  bag.repelLeft = 30;
  saveBag(bag);
  return "No wild ones for 30 steps.";
}

export function spendBattleItem(kind: "guard" | "xattack"): boolean {
  const bag = loadBag();
  if (kind === "guard") {
    if (bag.guards <= 0) return false;
    bag.guards -= 1;
  } else {
    if (bag.xAttacks <= 0) return false;
    bag.xAttacks -= 1;
  }
  saveBag(bag);
  return true;
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

const GUIDE_SPECIES: SpeciesId[] = ["sprout", "pebble", "wick", "drop"];

/** Caught guide creatures join the same party that walks and fights. Six can travel. The rest wait in the box. */
export function enrollGuide() {
  const field = loadField();
  const bag = loadBag();
  const owned = new Set(
    [...bag.party, ...bag.box].map((creature) => creature.dex).filter((number): number is number => typeof number === "number"),
  );
  let changed = false;
  for (const number of field.caught) {
    if (owned.has(number)) continue;
    const creature = makeCreature(GUIDE_SPECIES[number % GUIDE_SPECIES.length], 5, bag.hpBonus);
    creature.id = `dex-${number}`;
    creature.dex = number;
    if (bag.party.length < 6) bag.party.push(creature);
    else bag.box.push(creature);
    owned.add(number);
    changed = true;
  }
  if (changed) saveBag(bag);
  return loadBag();
}

export function bringToFront(dex: number) {
  enrollGuide();
  const bag = loadBag();
  const partyIndex = bag.party.findIndex((creature) => creature.dex === dex);
  if (partyIndex === 0) return;
  if (partyIndex > 0) {
    const [creature] = bag.party.splice(partyIndex, 1);
    bag.party.unshift(creature);
    saveBag(bag);
    return;
  }
  const boxIndex = bag.box.findIndex((creature) => creature.dex === dex);
  if (boxIndex < 0) return;
  const [creature] = bag.box.splice(boxIndex, 1);
  const displaced = bag.party.length >= 6 ? bag.party.pop() : undefined;
  bag.party.unshift(creature);
  if (displaced) bag.box.unshift(displaced);
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
    expShare: Boolean(left.expShare || right.expShare),
    charm: Boolean(left.charm || right.charm),
    candies: Math.max(left.candies ?? 0, right.candies ?? 0),
  });
}

function asBag(value: unknown): QuestBag | null {
  if (!value || typeof value !== "object") return null;
  const bag = value as QuestBag;
  if (!Array.isArray(bag.party)) return null;
  return bag;
}
