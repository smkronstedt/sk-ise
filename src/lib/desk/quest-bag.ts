import { spendQuest } from "@/lib/desk/purse";
import { DEX, loadField, spriteFor } from "@/lib/desk/field-dex";

export const BAG_KEY = "callroom-quest-bag-v1";

export type SpeciesId = "sprout" | "pebble" | "wick" | "drop" | "pip" | "coal" | "dew" | "spark";
export type Ball = "ball" | "great" | "ultra" | "master";

export const lines: Record<SpeciesId, { names: string[] }> = {
  sprout: { names: ["Sprout", "Thicket", "Canopy"] },
  pebble: { names: ["Pebble", "Ridge", "Crag"] },
  wick: { names: ["Wick", "Kindle", "Pyre"] },
  drop: { names: ["Drop", "Brook", "Tide"] },
  pip: { names: ["Pip", "Grove", "Arbor", "Monarch"] },
  coal: { names: ["Coal", "Blaze", "Inferno", "Drake"] },
  dew: { names: ["Dew", "Coral", "Levi", "Kraken"] },
  spark: { names: ["Spark", "Volt", "Storm", "Tempest"] },
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
  /** Highest evolution stage the player has already been shown. */
  seenStage?: 0 | 1 | 2 | 3;
  /** 0–255. They start happy and love the Center. */
  joy?: number;
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
  hpUps?: number;
  proteins?: number;
  prime?: "guard" | "boost";
  /** The exclusive starter this trainer chose. Missing means they still need to pick. */
  starter?: SpeciesId;
  /** Gyms whose prize creature was already chosen. */
  aces?: string[];
  nurseDay?: Record<string, string>;
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
  { id: "hp", name: "HP Up", price: 40, note: "Held item. Use it outside a fight. +6 max HP." },
  { id: "protein", name: "Protein", price: 45, note: "Held item. Use it outside a fight. Hits harder." },
  { id: "candy", name: "Rare Candy", price: 50, note: "Goes in the bag. Use it on one creature for a level." },
  { id: "share", name: "Exp. Share", price: 75, note: "Once. The rest of the party gains experience." },
  { id: "charm", name: "Catch Charm", price: 90, note: "Once. Balls work better. Not a Master Ball." },
] as const;

export type ShopId = (typeof shopItems)[number]["id"];

const cute: Record<SpeciesId, string[]> = {
  sprout: ["/field/cut/sprout.png?v=4", "/field/cut/thicket.png?v=4", "/field/cut/canopy.png?v=4"],
  pebble: ["/field/cut/stone.png?v=4", "/field/cut/ridge.png?v=4", "/field/cut/crag.png?v=4"],
  wick: ["/field/cut/ember.png?v=4", "/field/cut/kindle.png?v=4", "/field/cut/pyre.png?v=4"],
  drop: ["/field/cut/drop.png?v=4", "/field/cut/brook.png?v=4", "/field/cut/tide.png?v=4"],
  pip: ["/field/cut/pip.png?v=1", "/field/cut/grove.png?v=1", "/field/cut/arbor.png?v=1", "/field/cut/monarch.png?v=1"],
  coal: ["/field/cut/coal.png?v=1", "/field/cut/blaze.png?v=1", "/field/cut/inferno.png?v=1", "/field/cut/drake.png?v=1"],
  dew: ["/field/cut/dew.png?v=1", "/field/cut/coral.png?v=1", "/field/cut/levi.png?v=1", "/field/cut/kraken.png?v=1"],
  spark: ["/field/cut/spark.png?v=1", "/field/cut/volt.png?v=4", "/field/cut/storm.png?v=1", "/field/cut/tempest.png?v=1"],
};

export function monSrc(species: SpeciesId, stage: 0 | 1 | 2 | 3) {
  const art = cute[species];
  return art[Math.min(stage, art.length - 1)];
}

export const speciesType: Record<SpeciesId, string> = {
  sprout: "Grass",
  pebble: "Rock",
  wick: "Fire",
  drop: "Water",
  pip: "Grass",
  coal: "Fire",
  dew: "Water",
  spark: "Electric",
};

export function effectiveness(move: string, foe: string) {
  const table: Record<string, Record<string, number>> = {
    Grass: { Water: 2, Ground: 2, Rock: 2, Fire: 0.5, Grass: 0.5, Poison: 0.5 },
    Fire: { Grass: 2, Poison: 0.5, Water: 0.5, Rock: 0.5, Fire: 0.5 },
    Water: { Fire: 2, Ground: 2, Rock: 2, Grass: 0.5, Water: 0.5 },
    Rock: { Fire: 2, Electric: 2, Poison: 0.5, Grass: 0.5, Ground: 0.5 },
    Electric: { Water: 2, Grass: 0.5, Electric: 0.5, Ground: 0 },
    Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Psychic: 2 },
    Psychic: { Poison: 2, Psychic: 0.5 },
    Ground: { Fire: 2, Electric: 2, Rock: 2, Grass: 0.5 },
    Normal: { Rock: 0.5 },
  };
  return table[move]?.[foe] ?? 1;
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

export function stageOf(level: number, species?: SpeciesId): 0 | 1 | 2 | 3 {
  if (species && isStarterSpecies(species) && level >= 28) return 3;
  if (level >= 14) return 2;
  if (level >= 6) return 1;
  return 0;
}

export function creatureSrc(creature: Creature) {
  if (creature.dex) return spriteFor(creature.dex, loadField().rare.includes(creature.dex));
  return monSrc(creature.species, stageOf(levelOf(creature.exp), creature.species));
}

export function nameOf(creature: Creature) {
  if (creature.dex) return DEX[creature.dex - 1]?.name ?? "Caught";
  const names = lines[creature.species].names;
  return names[stageOf(levelOf(creature.exp), creature.species)] ?? names[names.length - 1];
}

export type EvolutionMoment = {
  id: string;
  species: SpeciesId;
  from: 0 | 1 | 2 | 3;
  to: 0 | 1 | 2 | 3;
  name: string;
  level: number;
};

const EVO_LOG = "callroom-evo-log-v1";

export type EvoEntry = { id: string; name: string; level: number; stage: 1 | 2 | 3; at: number };

export function loadEvoLog(): EvoEntry[] {
  try {
    const raw = localStorage.getItem(EVO_LOG);
    const parsed = raw ? (JSON.parse(raw) as EvoEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loggedStage(id: string) {
  return loadEvoLog().reduce((stage, entry) => (entry.id === id ? Math.max(stage, entry.stage) : stage), 0);
}

/** First change is level 6. The next is 14. Starters have a big form at 28. */
export function evolutionMoment(creature: Creature): EvolutionMoment | null {
  const level = levelOf(creature.exp);
  const to = stageOf(level, creature.species);
  const from = loggedStage(creature.id) as 0 | 1 | 2 | 3;
  if (to <= from) return null;
  return { id: creature.id, species: creature.species, from, to, name: nameOf(creature), level };
}

export function markEvolutionSeen(creatureId: string) {
  const bag = loadBag();
  const creature = [...bag.party, ...bag.box].find((row) => row.id === creatureId);
  if (!creature) return bag;
  const stage = stageOf(levelOf(creature.exp), creature.species);
  creature.seenStage = stage;
  if (stage > 0) {
    const form = stage as 1 | 2 | 3;
    const log = loadEvoLog().filter((entry) => !(entry.id === creature.id && entry.stage === form));
    log.push({ id: creature.id, name: nameOf(creature), level: levelOf(creature.exp), stage: form, at: Date.now() });
    localStorage.setItem(EVO_LOG, JSON.stringify(log));
  }
  saveBag(bag);
  return loadBag();
}

export function isStarterSpecies(species: SpeciesId) {
  return species === "pip" || species === "coal" || species === "dew" || species === "spark";
}

export const STARTERS: { id: SpeciesId; type: string; line: string }[] = [
  { id: "pip", type: "Grass", line: "Pip, Grove at 6, Arbor at 14, Monarch at 28." },
  { id: "coal", type: "Fire", line: "Coal, Blaze at 6, Inferno at 14, Drake at 28." },
  { id: "dew", type: "Water", line: "Dew, Coral at 6, Levi at 14, Kraken at 28." },
  { id: "spark", type: "Electric", line: "Spark, Volt at 6, Storm at 14, Tempest at 28." },
];

export function formNote(creature: Creature) {
  const stage = stageOf(levelOf(creature.exp), creature.species);
  if (isStarterSpecies(creature.species)) {
    if (stage >= 3) return "Fully evolved.";
    if (stage === 2) return "Evolves at level 28.";
    if (stage === 1) return "Evolves at level 14.";
    return "Evolves at level 6.";
  }
  if (stage >= 2) return "Final form.";
  if (stage === 1) return "Evolves at level 14.";
  return "Evolves at level 6.";
}

export function maxHp(creature: Creature, bag: Pick<QuestBag, "hpBonus">) {
  const level = levelOf(creature.exp);
  const stage = stageOf(level, creature.species);
  const bonus = (isStarterSpecies(creature.species) ? 10 : 0) + (stage === 3 ? 16 : 0);
  return 20 + bag.hpBonus + bonus + stage * 6 + level * 2;
}

export function strike(creature: Creature, bag: Pick<QuestBag, "power">) {
  const level = levelOf(creature.exp);
  const stage = stageOf(level, creature.species);
  const bonus = (isStarterSpecies(creature.species) ? 2 : 0) + (stage === 3 ? 4 : 0);
  return 3 + bag.power + bonus + stage + Math.floor(level / 5);
}

/** Sum of strike across the current party. Used as the duel tiebreaker. */
export function partyStrength(bag: QuestBag = loadBag()) {
  return bag.party.reduce((sum, creature) => sum + strike(creature, bag), 0);
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
  { id: "vine", name: "Vine Whip", kind: "Grass", power: 9, pp: 15, level: 8, species: "pip" },
  { id: "royal", name: "Royal Bloom", kind: "Grass", power: 16, pp: 5, level: 22, species: "pip" },
  { id: "cinder", name: "Cinder", kind: "Fire", power: 9, pp: 15, level: 8, species: "coal" },
  { id: "crownfire", name: "Crownfire", kind: "Fire", power: 16, pp: 5, level: 22, species: "coal" },
  { id: "bubble", name: "Bubble", kind: "Water", power: 9, pp: 15, level: 8, species: "dew" },
  { id: "tidal", name: "Tidal", kind: "Water", power: 16, pp: 5, level: 22, species: "dew" },
  { id: "jolt", name: "Jolt", kind: "Electric", power: 9, pp: 15, level: 8, species: "spark" },
  { id: "thunder", name: "Thunder", kind: "Electric", power: 16, pp: 5, level: 22, species: "spark" },
  { id: "worldroot", name: "Worldroot", kind: "Grass", power: 22, pp: 5, level: 28, species: "pip" },
  { id: "skyfire", name: "Skyfire", kind: "Fire", power: 22, pp: 5, level: 28, species: "coal" },
  { id: "depth", name: "Depth Charge", kind: "Water", power: 22, pp: 5, level: 28, species: "dew" },
  { id: "stormcall", name: "Stormcall", kind: "Electric", power: 22, pp: 5, level: 28, species: "spark" },
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
  return {
    party: [],
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
    hpUps: 0,
    proteins: 0,
    aces: [],
    nurseDay: {},
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
    const parsed = JSON.parse(raw) as QuestBag & { hpUps?: number; proteins?: number };
    const legacyVitamins = !Object.prototype.hasOwnProperty.call(parsed, "hpUps") && !Object.prototype.hasOwnProperty.call(parsed, "proteins");
    if (legacyVitamins) {
      const refundHp = Math.floor((parsed.hpBonus ?? 0) / 6);
      parsed.hpUps = refundHp;
      parsed.hpBonus = (parsed.hpBonus ?? 0) - refundHp * 6;
      parsed.proteins = parsed.power ?? 0;
      parsed.power = 0;
    }
    const bag = clamp({
      ...starterBag(),
      ...parsed,
      party: Array.isArray(parsed.party) ? parsed.party : [],
      box: parsed.box ?? [],
      starter: parsed.starter,
      aces: parsed.aces ?? [],
      hpUps: parsed.hpUps ?? 0,
      proteins: parsed.proteins ?? 0,
      prime: parsed.prime,
      nurseDay: parsed.nurseDay ?? {},
      balls: {
        ball: parsed.balls?.ball ?? 8,
        great: parsed.balls?.great ?? 0,
        ultra: parsed.balls?.ultra ?? 0,
        master: parsed.balls?.master ?? 0,
      },
      candies: parsed.candies ?? 0,
    });
    if (legacyVitamins) saveBag(bag);
    return bag;
  } catch {
    return starterBag();
  }
}

export function saveBag(bag: QuestBag) {
  bag.updatedAt = Date.now();
  localStorage.setItem(BAG_KEY, JSON.stringify(clamp(bag)));
  if (typeof window !== "undefined") window.dispatchEvent(new Event("ise-progress"));
}

export function foeHealth(kind: "trainer" | "leader" | "rival" | "wild", _count: number, cityIndex: number) {
  if (kind === "wild") return 14 + cityIndex * 3;
  if (kind === "leader") return 52 + cityIndex * 8;
  if (kind === "rival") return 40 + cityIndex * 6;
  return 26 + cityIndex * 5;
}

/** Damage a wrong answer deals. Leaders hit hardest, and later towns hit harder. */
export function foeStrike(kind: "trainer" | "leader" | "rival" | "wild", cityIndex: number) {
  const base = kind === "leader" ? 8 : kind === "rival" ? 7 : kind === "wild" ? 3 : 5;
  return base + cityIndex;
}

export type Partner = { species: SpeciesId; stage: 0 | 1 | 2 | 3; name: string; move: string };

export const GYM_ACE: Record<string, Partner> = {
  stones: { species: "pebble", stage: 2, name: "Crag", move: "Stone Toss" },
  oncology: { species: "coal", stage: 3, name: "Drake", move: "Crownfire" },
  urogyn: { species: "dew", stage: 3, name: "Kraken", move: "Tidal" },
  core: { species: "pip", stage: 3, name: "Monarch", move: "Royal Bloom" },
  andrology: { species: "spark", stage: 3, name: "Tempest", move: "Stormcall" },
  peds: { species: "pip", stage: 2, name: "Arbor", move: "Vine Whip" },
  basic: { species: "wick", stage: 2, name: "Pyre", move: "Blaze" },
  obstruction: { species: "pebble", stage: 2, name: "Crag", move: "Ground Crack" },
};

export const GYM_GIFT: Record<string, Partner[]> = {
  stones: [
    { species: "pebble", stage: 2, name: "Crag", move: "Stone Toss" },
    { species: "coal", stage: 2, name: "Inferno", move: "Blaze" },
    { species: "spark", stage: 2, name: "Storm", move: "Thunder" },
  ],
  oncology: [
    { species: "coal", stage: 3, name: "Drake", move: "Crownfire" },
    { species: "wick", stage: 2, name: "Pyre", move: "Blaze" },
    { species: "dew", stage: 2, name: "Levi", move: "Tidal" },
  ],
  urogyn: [
    { species: "dew", stage: 3, name: "Kraken", move: "Tidal" },
    { species: "drop", stage: 2, name: "Tide", move: "Surge" },
    { species: "pip", stage: 2, name: "Arbor", move: "Vine Whip" },
  ],
  core: [
    { species: "pip", stage: 3, name: "Monarch", move: "Royal Bloom" },
    { species: "spark", stage: 2, name: "Storm", move: "Thunder" },
    { species: "pebble", stage: 2, name: "Crag", move: "Stone Toss" },
  ],
  andrology: [
    { species: "spark", stage: 3, name: "Tempest", move: "Stormcall" },
    { species: "coal", stage: 2, name: "Inferno", move: "Blaze" },
    { species: "wick", stage: 2, name: "Pyre", move: "Flare" },
  ],
  peds: [
    { species: "pip", stage: 2, name: "Arbor", move: "Vine Whip" },
    { species: "sprout", stage: 2, name: "Canopy", move: "Bloom Burst" },
    { species: "dew", stage: 1, name: "Coral", move: "Bubble" },
  ],
  basic: [
    { species: "wick", stage: 2, name: "Pyre", move: "Blaze" },
    { species: "sprout", stage: 2, name: "Canopy", move: "Bloom Burst" },
    { species: "drop", stage: 2, name: "Tide", move: "Surge" },
  ],
  obstruction: [
    { species: "pebble", stage: 2, name: "Crag", move: "Ground Crack" },
    { species: "drop", stage: 2, name: "Tide", move: "Surge" },
    { species: "coal", stage: 1, name: "Blaze", move: "Cinder" },
  ],
};

const TRAINER_POOL: Record<string, SpeciesId[]> = {
  stones: ["pebble", "sprout"],
  oncology: ["wick", "coal"],
  urogyn: ["drop", "dew"],
  core: ["pip", "spark"],
  andrology: ["spark", "wick"],
  peds: ["pip", "sprout"],
  basic: ["wick", "sprout"],
  obstruction: ["pebble", "drop"],
};

function nameHash(name: string) {
  let n = 0;
  for (let i = 0; i < name.length; i += 1) n += name.charCodeAt(i) * (i + 3);
  return n;
}

export function partnerFor(cityId: string, name: string, kind: "trainer" | "leader" | "rival" | "wild"): Partner {
  if (kind === "leader" && GYM_ACE[cityId]) return GYM_ACE[cityId];
  if (kind === "rival") return { species: "coal", stage: 2, name: "Inferno", move: "Cinder" };
  const pool = TRAINER_POOL[cityId] ?? ["sprout"];
  const species = pool[nameHash(name) % pool.length];
  const stage = (nameHash(name) % 2) as 0 | 1;
  const move = species === "pebble" ? "Stone Toss" : species === "spark" ? "Jolt" : species === "drop" || species === "dew" ? "Spray" : species === "wick" || species === "coal" ? "Flare" : "Leaf Cut";
  return { species, stage, name: lines[species].names[Math.min(stage, lines[species].names.length - 1)], move };
}

export function claimGift(cityId: string, pick: Partner, cityIndex: number): string {
  const bag = loadBag();
  const taken = bag.aces ?? [];
  if (taken.includes(cityId)) return "You already chose this gym's creature.";
  const floor = pick.stage >= 3 ? 28 : pick.stage === 2 ? 16 : 8;
  const creature = makeCreature(pick.species, Math.max(floor, 8 + cityIndex * 2), bag.hpBonus);
  if (bag.party.length < 6) bag.party.push(creature);
  else bag.box.push(creature);
  bag.aces = [...taken, cityId];
  saveBag(bag);
  const where = bag.party.includes(creature) ? "your party" : "the box";
  return `${pick.name} joins ${where} at level ${levelOf(creature.exp)}.`;
}

export function grantExp(creature: Creature, amount: number) {
  const beforeStage = stageOf(levelOf(creature.exp), creature.species);
  const beforeLevel = levelOf(creature.exp);
  creature.exp += amount;
  const afterLevel = levelOf(creature.exp);
  const afterStage = stageOf(afterLevel, creature.species);
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
  let note = `Bought ${item.name}.`;
  if (id === "hp") {
    bag.hpUps = (bag.hpUps ?? 0) + 1;
    note = "HP Up is in the bag. Use it outside a fight and max HP goes up.";
  }
  if (id === "protein") {
    bag.proteins = (bag.proteins ?? 0) + 1;
    note = "Protein is in the bag. Use it outside a fight and attack goes up.";
  }
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

export function useVitamin(kind: "hp" | "protein"): string {
  const bag = loadBag();
  if (kind === "hp") {
    if ((bag.hpUps ?? 0) <= 0) return "No HP Up in the bag.";
    bag.hpUps = (bag.hpUps ?? 0) - 1;
    bag.hpBonus += 6;
    for (const creature of [...bag.party, ...bag.box]) creature.hp += 6;
    saveBag(bag);
    const lead = bag.party[0];
    return lead ? `Max HP is ${maxHp(lead, bag)}. A wrong answer takes less of the bar.` : "Max HP went up.";
  }
  if ((bag.proteins ?? 0) <= 0) return "No Protein in the bag.";
  bag.proteins = (bag.proteins ?? 0) - 1;
  bag.power += 1;
  saveBag(bag);
  const lead = bag.party[0];
  return lead ? `${nameOf(lead)} hits for ${strike(lead, bag)} before the move.` : "Attack went up.";
}

export function primeItem(kind: "guard" | "xattack"): string {
  const bag = loadBag();
  if (kind === "guard") {
    if (bag.guards <= 0) return "No Guards.";
    bag.guards -= 1;
    bag.prime = "guard";
  } else {
    if (bag.xAttacks <= 0) return "No X Attacks.";
    bag.xAttacks -= 1;
    bag.prime = "boost";
  }
  saveBag(bag);
  return kind === "guard" ? "Guard is set for the next fight." : "The next fight hits harder.";
}

export function takePrime(): "guard" | "boost" | undefined {
  const bag = loadBag();
  const prime = bag.prime;
  if (!prime) return undefined;
  bag.prime = undefined;
  saveBag(bag);
  return prime;
}

export function drink(kind: "potion" | "super", index = 0): string {
  return useHeld(kind, index, false);
}

export function joyOf(creature: Creature) {
  return creature.joy ?? 230;
}

export function joyWord(joy: number) {
  if (joy >= 250) return "loves the Center";
  if (joy >= 200) return "very happy";
  if (joy >= 140) return "happy";
  return "okay";
}

export function healAll(bag: QuestBag) {
  for (const creature of [...bag.party, ...bag.box]) {
    creature.hp = maxHp(creature, bag);
    knownMoves(creature);
    for (const slot of creature.moves ?? []) {
      const def = moveDef(slot.id);
      if (def) slot.pp = def.pp;
    }
    creature.joy = Math.min(255, joyOf(creature) + 20);
  }
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
  if (isStarterSpecies(species)) return "That one only leaves with a new trainer.";
  const bag = loadBag();
  const creature = makeCreature(species, level, bag.hpBonus);
  const home = bag.party.length < 6 ? "party" : "box";
  if (home === "party") bag.party.push(creature);
  else bag.box.push(creature);
  saveBag(bag);
  return home === "party" ? `${nameOf(creature)} joined you.` : `${nameOf(creature)} went to the box.`;
}

export function pickStarter(species: SpeciesId) {
  if (!isStarterSpecies(species)) return loadBag();
  const bag = loadBag();
  if (bag.starter) return bag;
  const creature = makeCreature(species, 5, bag.hpBonus);
  creature.id = `starter-${species}`;
  creature.joy = 255;
  const onlyDefault = bag.party.length === 1 && bag.party[0]?.id === "starter-sprout" && bag.box.length === 0;
  if (onlyDefault || bag.party.length === 0) bag.party = [creature];
  else {
    bag.party.unshift(creature);
    if (bag.party.length > 6) {
      const extra = bag.party.pop();
      if (extra) bag.box.unshift(extra);
    }
  }
  bag.starter = species;
  saveBag(bag);
  return loadBag();
}

const NURSE_LINES: Record<string, string> = {
  "joy-1": "You walked all this way just to see me? Come here. I'll put everyone back together.",
  "joy-2": "There you are. I saved the quiet chair. Let me take care of you.",
  "joy-3": "That look. Fine. Full heal, and a little something if this is your first visit today.",
};

export function nurseLine(nurseId: string) {
  return NURSE_LINES[nurseId] ?? "Stay a minute. I'll take care of the whole party.";
}

export function nurseVisit(nurseId: string) {
  const bag = loadBag();
  healAll(bag);
  const day = new Date().toDateString();
  bag.nurseDay ??= {};
  let gift = "They already slipped you something today.";
  if (bag.nurseDay[nurseId] !== day) {
    bag.nurseDay[nurseId] = day;
    if (nurseId === "joy-2") {
      bag.supers += 1;
      gift = "Mina tucks a Super Potion into your bag.";
    } else if (nurseId === "joy-3") {
      bag.balls.great += 1;
      gift = "Lila adds a Great Ball.";
    } else {
      bag.potions += 1;
      gift = "Joy slips you a Potion.";
    }
  }
  saveBag(bag);
  return `Full HP. Full PP. ${gift}`;
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
    if (bag.party.length === 0) bag.party.push(creature);
    else bag.box.push(creature);
    owned.add(number);
    changed = true;
  }
  if (changed) saveBag(bag);
  return loadBag();
}

export function bringAlong(id: string) {
  const bag = loadBag();
  if (bag.party.some((creature) => creature.id === id)) return "Already with you.";
  if (bag.party.length >= 6) return "Six are already with you. Bench one first.";
  const index = bag.box.findIndex((creature) => creature.id === id);
  if (index < 0) return "That one is not in the box.";
  const [creature] = bag.box.splice(index, 1);
  bag.party.push(creature);
  saveBag(bag);
  return `${nameOf(creature)} is coming.`;
}

export function benchCreature(id: string) {
  const bag = loadBag();
  if (bag.party.length <= 1) return "Someone has to walk with you.";
  const index = bag.party.findIndex((creature) => creature.id === id);
  if (index < 0) return "That one is not with you.";
  const [creature] = bag.party.splice(index, 1);
  bag.box.unshift(creature);
  saveBag(bag);
  return `${nameOf(creature)} waits with the ones you have caught.`;
}

export function walkWith(id: string) {
  const bag = loadBag();
  const index = bag.party.findIndex((creature) => creature.id === id);
  if (index < 0) return "Only one of the six with you can walk.";
  if (index === 0) return `${nameOf(bag.party[0])} is already walking.`;
  const [creature] = bag.party.splice(index, 1);
  bag.party.unshift(creature);
  saveBag(bag);
  return `${nameOf(creature)} is walking and ready to fight.`;
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
    starter: newer.starter ?? older.starter,
    nurseDay: { ...(older.nurseDay ?? {}), ...(newer.nurseDay ?? {}) },
    party: party.slice(0, 6),
    box: [...box, ...party.slice(6), ...extras],
    hpBonus: Math.max(left.hpBonus, right.hpBonus),
    power: Math.max(left.power, right.power),
    mastersBought: Math.max(left.mastersBought, right.mastersBought),
    expShare: Boolean(left.expShare || right.expShare),
    charm: Boolean(left.charm || right.charm),
    candies: newer.candies ?? older.candies ?? 0,
  });
}

function asBag(value: unknown): QuestBag | null {
  if (!value || typeof value !== "object") return null;
  const bag = value as QuestBag;
  if (!Array.isArray(bag.party)) return null;
  return bag;
}
