import { useEffect, useRef, useState, type RefObject } from "react";
import { Badge } from "@/components/desk/badge";
import { TownTrial } from "@/components/desk/town-trial";
import { addCard } from "@/lib/cards";
import { drawQuestionIds } from "@/lib/desk/adapt";
import { noteRow } from "@/lib/desk/honors";
import { logActivity, logCorrect } from "@/lib/desk/activity";
import { getQuestion, loadCatalog } from "@/lib/desk/catalog";
import { rememberAnswer } from "@/lib/desk/original-bank";
import { useDesk } from "@/lib/desk/provider";
import { cities, isChampion, rivalBeaten, rivalTestName, type City, type Stop } from "@/lib/desk/route";
import { DEX, loadField, portraitFor } from "@/lib/desk/field-dex";
import { topics } from "@/lib/desk/topics";
import type { BlueprintId, DeskState, TestBlock } from "@/lib/desk/types";
import { drawActor, drawCreature, drawGround, drawProp, lookFor, PixelActor, TILE } from "@/components/desk/quest-art";
import { NlutdChart } from "@/components/desk/nlutd-chart";
import { DsdFigure, isDsdText } from "@/components/desk/dsd-figure";
import { isPopqText, PopqFigure } from "@/components/desk/popq-figure";
import { musicOn, setTownMusic } from "@/lib/desk/town-music";
import { questCash } from "@/lib/desk/purse";
import {
  BAG_KEY,
  buyItem,
  catchChance,
  drink,
  foeHealth,
  foeStrike,
  partnerFor,
  claimGift,
  GYM_GIFT,
  grantExp,
  healAll,
  joyOf,
  joyWord,
  keepCatch,
  levelOf,
  lines,
  loadBag,
  benchCreature,
  bringAlong,
  enrollGuide,
  walkWith,
  formNote,
  creatureSrc,
  evolutionMoment,
  expPace,
  forgetForPending,
  knownMoves,
  makeLead,
  markEvolutionSeen,
  moveDef,
  spendPp,
  nurseLine,
  nurseVisit,
  pickStarter,
  STARTERS,
  masterStock,
  maxHp,
  monSrc,
  nameOf,
  payExp,
  revive,
  saveBag,
  shopItems,
  speciesType,
  spendBattleItem,
  isStarterSpecies,
  stageOf,
  strike,
  swapBox,
  takeBall,
  useHeld,
  useRepel,
  effectiveness,
  wildSpecies,
  type Ball,
  type QuestBag,
  type SpeciesId,
  type Partner,
} from "@/lib/desk/quest-bag";

const COLS = 13;
const ROWS = 11;
const STEP = 0.16;
const RIVAL = "Reed Calder";

type Tile = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type Face = "up" | "down" | "left" | "right";
type Scene = "town" | "gym" | "route" | "center" | "home";

type Npc = {
  id: string;
  kind: "trainer" | "leader" | "rival" | "townsman";
  name: string;
  x: number;
  y: number;
  face: Face;
  sight: number;
  done: boolean;
  ready: boolean;
  count: number;
  need: number;
  adaptive: boolean;
  testName: string;
  blueprint: BlueprintId | "all";
  topics?: string[];
  rematch?: boolean;
  prostate?: boolean;
  line: string;
  foe: string;
  sprite?: string;
};

type World = { tiles: Tile[][]; npcs: Npc[]; start: { x: number; y: number } };

type Battle = {
  testId: string;
  ids: string[];
  index: number;
  you: number;
  youMax: number;
  foeHp: number;
  foeMax: number;
  right: number;
  foeName: string;
  foeKind: "trainer" | "leader" | "rival" | "wild";
  foeType: string;
  foeSpecies?: SpeciesId;
  foeStage?: 0 | 1 | 2 | 3;
  foeMove?: string;
  foePower?: number;
  title: string;
  need: number;
  reveal: { correct: boolean; note: string } | null;
  over: string | null;
  fainted: boolean;
  menu: "item" | "fight" | "party" | "ask" | null;
  moveId?: string;
  guard: boolean;
  boost: boolean;
  committed?: boolean;
  fromId?: string;
};


function blank(): Tile[][] {
  return sized(COLS, ROWS);
}

function sized(cols: number, rows: number): Tile[][] {
  return Array.from({ length: rows }, () => Array<Tile>(cols).fill(2));
}

function openGround(tiles: Tile[][]) {
  for (let y = 1; y < tiles.length - 1; y++) for (let x = 1; x < tiles[0].length - 1; x++) tiles[y][x] = 0;
}

function buildHome(): World {
  const tiles = sized(21, 17);
  openGround(tiles);
  for (let y = 2; y <= 5; y++) for (let x = 2; x <= 6; x++) tiles[y][x] = 8;
  tiles[5][4] = 4;
  for (let y = 2; y <= 5; y++) for (let x = 13; x <= 18; x++) tiles[y][x] = 8;
  tiles[5][15] = 0;
  for (let y = 6; y <= 15; y++) tiles[y][10] = 1;
  for (let x = 4; x <= 16; x++) tiles[8][x] = 1;
  tiles[15][10] = 5;
  tiles[16][10] = 5;
  tiles[7][3] = 2;
  tiles[7][7] = 2;
  tiles[10][4] = 3;
  tiles[10][16] = 3;
  tiles[12][6] = 2;
  tiles[12][14] = 2;
  return {
    tiles,
    start: { x: 10, y: 13 },
    npcs: [
      {
        id: "moka",
        kind: "townsman",
        name: "Professor Moka",
        x: 15,
        y: 6,
        face: "down",
        sight: 0,
        done: false,
        ready: false,
        count: 0,
        need: 1,
        adaptive: false,
        testName: "",
        blueprint: "basic",
        line: "Professor Moka: The south road is the trail. Quarry End and the rock gym are at the far end. Onco Harbor is only after that badge.",
        foe: "/quest/leader.png",
        sprite: "/quest/leader.png",
      },
    ],
  };
}

const gymPictures: Record<string, HTMLImageElement> = {};

function gymHall(src: string) {
  if (!gymPictures[src]) {
    const img = new Image();
    img.src = src;
    gymPictures[src] = img;
  }
  const img = gymPictures[src];
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function parkAtHome() {
  if (typeof localStorage === "undefined") return;
  const key = "callroom-quest-parked-home-v2";
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, "1");
  localStorage.setItem("callroom-quest-scene", "home");
  localStorage.removeItem("callroom-quest-city");
}
function topicIdsFor(blueprint: BlueprintId | "all") {
  if (blueprint === "all") return topics.map((topic) => topic.id);
  return topics.filter((topic) => topic.blueprintId === blueprint).map((topic) => topic.id);
}

function drawForQuest(state: DeskState, topicIds: string[], count: number, rematch: boolean) {
  const seen = new Set<string>();
  if (!rematch) {
    for (const test of state.tests) {
      if (!/^(Route|Gym|Rival|Wild): /.test(test.name)) continue;
      for (const [id, answer] of Object.entries(test.answers)) {
        if (answer?.submitted) seen.add(id);
      }
    }
  }
  const all = drawQuestionIds(state, topicIds, "all", 2000, false);
  const fresh = all.filter((id) => !seen.has(id));
  return (fresh.length && !rematch ? fresh : all).slice(0, count);
}

function buildWorld(scene: Scene, city: City | null, stops: Stop[], tests: TestBlock[]): World {
  if (scene === "home") return buildHome();
  let tiles = blank();
  const trainerDone = (name: string) => stops.some((stop) => stop.kind === "trainer" && stop.name === name && stop.done);
  const gymDone = city ? stops.some((stop) => stop.kind === "gym" && stop.city.id === city.id && stop.done) : false;
  const trainersBeaten = city ? city.trainers.every((trainer) => trainerDone(trainer.name)) : false;
  const rivalDone = city ? rivalBeaten(tests, city) : false;
  const npcs: Npc[] = [];

  if (!city) {
    openGround(tiles);
    for (let y = 1; y <= 8; y++) tiles[y][6] = 1;
    tiles[8][2] = 9;
    npcs.push({
      id: "league",
      kind: "leader",
      name: "The hall",
      x: 6,
      y: 3,
      face: "down",
      sight: 4,
      done: isChampion(tests),
      ready: true,
      count: 20,
      need: 0.8,
      adaptive: true,
      testName: "Championship",
      blueprint: "all",
      line: "Twenty harder questions. You need 80%.",
      foe: "/field/towns/trainer.jpg?v=2",
    });
    return { tiles, npcs, start: { x: 6, y: 8 } };
  }

  if (scene === "gym") {
    openGround(tiles);
    for (let y = 2; y <= 9; y++) tiles[y][6] = 1;
    tiles[9][6] = 4;
    npcs.push({
      id: city.id,
      kind: "leader",
      name: city.leader,
      x: 6,
      y: 3,
      face: "down",
      sight: 4,
      done: gymDone,
      ready: trainersBeaten,
      count: city.gymCount,
      need: 0.6,
      adaptive: true,
      testName: `Gym: ${city.element}`,
      blueprint: city.id,
      line: !trainersBeaten
        ? "Beat the trainers in town first."
        : city.id === "stones"
          ? "Dr. Nicolette. Medical and surgical stones. 8 questions. Need 60%."
          : city.id === "oncology"
            ? "Sera Voss mixes the harbor. Prostate weighs extra. 16 questions. Need 60%."
            : city.id === "urogyn"
              ? "Warden Calder. Urodynamics, incontinence, prolapse, and diversion. 12 questions. Need 60%."
              : city.id === "core"
                ? "Nima Sol. Office, trauma, imaging, plus a short transplant and statistics set. 10 questions. Need 60%."
                : `${city.subject}. ${city.gymCount} questions. Need 60%.`,
      topics: city.gymTopics,
      prostate: city.id === "oncology",
      foe: "/field/towns/trainer.jpg?v=2",
    });
    return { tiles, npcs, start: { x: 6, y: 8 } };
  }

  if (scene === "route") {
    const wide = sized(21, 15);
    const paint = (spots: readonly (readonly [number, number])[], tile: Tile) => {
      for (const [x, y] of spots) wide[y][x] = tile;
    };
    const pushSide = (npc: { id: string; name: string; x: number; y: number; topics: string[]; line: string; blueprint: BlueprintId }) => {
      npcs.push({
        id: npc.id,
        kind: "trainer",
        name: npc.name,
        x: npc.x,
        y: npc.y,
        face: "down",
        sight: 0,
        done: false,
        ready: true,
        count: 3,
        need: 0.6,
        adaptive: false,
        testName: `Side: ${npc.name}`,
        blueprint: npc.blueprint,
        topics: npc.topics,
        rematch: true,
        line: npc.line,
        foe: "/field/towns/walker.jpg?v=2",
      });
    };
    if (city.id === "stones") {
      openGround(wide);
      paint(
        [
          [10, 13], [10, 12], [10, 11], [9, 11], [8, 11], [8, 10], [8, 9], [9, 9], [10, 9], [11, 9],
          [11, 8], [11, 7], [10, 7], [9, 7], [8, 7], [7, 7], [7, 6], [7, 5], [8, 5], [9, 5], [10, 5],
          [10, 4], [10, 3], [10, 2], [10, 1],
          [7, 9], [6, 9], [5, 9], [4, 9],
          [12, 7], [13, 7], [14, 7], [15, 7], [16, 7],
          [11, 4], [12, 4], [13, 4], [14, 4], [15, 4],
        ],
        1,
      );
      wide[13][10] = 5;
      wide[14][10] = 5;
      wide[1][10] = 5;
      wide[0][10] = 5;
      paint(
        [
          [2, 3], [3, 3], [4, 3], [2, 4], [3, 4],
          [16, 11], [17, 11], [18, 11], [17, 12], [18, 12],
        ],
        3,
      );
      paint(
        [
          [4, 12], [5, 12], [6, 12], [4, 11],
          [13, 10], [14, 10], [13, 11], [14, 11],
          [5, 4], [6, 4], [5, 5], [6, 5],
          [15, 2], [16, 2], [15, 3],
        ],
        6,
      );
      paint([[2, 7], [3, 8], [2, 10], [18, 5], [17, 6], [18, 8], [3, 13], [16, 13], [6, 2], [13, 2], [12, 12]], 2);
      pushSide({ id: "side-lantern", name: "Lantern", x: 4, y: 8, topics: ["stones-med"], blueprint: "stones", line: "A lantern in the wood. Three medical-stone questions. You can walk away." });
      pushSide({ id: "side-moth", name: "Moth", x: 16, y: 6, topics: ["stones-surg"], blueprint: "stones", line: "Something bright in the grass. Three surgical-stone questions, then it lets you pass." });
      npcs.push({
        id: "side-glow",
        kind: "townsman",
        name: "Glow",
        x: 15,
        y: 3,
        face: "down",
        sight: 0,
        done: false,
        ready: false,
        count: 0,
        need: 1,
        adaptive: false,
        testName: "",
        blueprint: "stones",
        line: "Four lanterns. Light them in order.",
        foe: "/field/towns/walker.jpg?v=2",
      });
      return { tiles: wide, npcs, start: { x: 10, y: 12 } };
    }
    if (city.id === "oncology") {
      openGround(wide);
      for (let y = 1; y <= 13; y++) {
        wide[y][1] = 3;
        wide[y][2] = 3;
        wide[y][3] = 3;
        wide[y][17] = 3;
        wide[y][18] = 3;
        wide[y][19] = 3;
        wide[y][10] = 1;
      }
      wide[13][10] = 5;
      wide[14][10] = 5;
      wide[1][10] = 5;
      wide[0][10] = 5;
      paint([[9, 6], [8, 6], [7, 6], [11, 5], [12, 5], [13, 5], [14, 5]], 1);
      paint([[6, 3], [7, 3], [13, 8], [14, 8], [6, 10], [7, 10]], 6);
      paint([[8, 3], [12, 9], [7, 11], [13, 11], [6, 8]], 2);
      pushSide({ id: "side-wreck", name: "Wreck", x: 14, y: 4, topics: ["renal", "utuc"], blueprint: "oncology", line: "A hull on the sand. Three upper-tract questions. The north sign is the channel." });
      npcs.push({
        id: "side-tide",
        kind: "townsman",
        name: "Tide",
        x: 7,
        y: 5,
        face: "right",
        sight: 0,
        done: false,
        ready: false,
        count: 0,
        need: 1,
        adaptive: false,
        testName: "",
        blueprint: "oncology",
        line: "Time the channel. The marker has to sit in the green.",
        foe: "/field/towns/walker.jpg?v=2",
      });
      return { tiles: wide, npcs, start: { x: 10, y: 12 } };
    }
    if (city.id === "urogyn") {
      openGround(wide);
      for (let y = 1; y <= 13; y++) wide[y][10] = 1;
      wide[13][10] = 5;
      wide[14][10] = 5;
      wide[1][10] = 5;
      wide[0][10] = 5;
      paint([[4, 5], [5, 5], [4, 6], [15, 9], [16, 9], [16, 10]], 3);
      paint([[6, 3], [7, 3], [13, 3], [14, 3], [5, 12], [6, 12], [14, 12], [15, 12]], 6);
      paint([[8, 4], [12, 4], [7, 8], [13, 8], [8, 11], [12, 11], [6, 6], [14, 6]], 2);
      npcs.push({
        id: "side-cairn",
        kind: "townsman",
        name: "Cairn",
        x: 12,
        y: 7,
        face: "left",
        sight: 0,
        done: false,
        ready: false,
        count: 0,
        need: 1,
        adaptive: false,
        testName: "",
        blueprint: "urogyn",
        line: "A quiet span. Nothing here is required. North is The Commons.",
        foe: "/field/towns/walker.jpg?v=2",
      });
      return { tiles: wide, npcs, start: { x: 10, y: 12 } };
    }
    openGround(tiles);
    for (let y = 1; y <= 9; y++) tiles[y][6] = 1;
    tiles[0][6] = 5;
    tiles[10][6] = 5;
    const band = cities.findIndex((item) => item.id === city.id);
    if (band % 2 === 0) {
      tiles[4][3] = 6;
      tiles[4][4] = 6;
      tiles[7][8] = 2;
    } else {
      tiles[5][8] = 6;
      tiles[5][9] = 6;
      tiles[3][3] = 2;
    }
    return { tiles, npcs, start: { x: 6, y: 8 } };
  }

  if (scene === "center") {
    openGround(tiles);
    for (let x = 2; x <= 10; x++) tiles[2][x] = 8;
    tiles[1][5] = 8;
    tiles[1][6] = 8;
    tiles[1][7] = 8;
    tiles[5][1] = 8;
    tiles[5][11] = 8;
    tiles[6][1] = 8;
    tiles[6][2] = 8;
    tiles[6][10] = 8;
    tiles[6][11] = 8;
    tiles[9][6] = 4;
    const nurses = [
      { id: "joy-1", name: "Joy", x: 3, sprite: "/quest/joy-b.png", line: "Joy smiles. The whole party can rest here." },
      { id: "joy-2", name: "Mina", x: 6, sprite: "/quest/joy-a.png", line: "Mina keeps the lights low. They always perk up." },
      { id: "joy-3", name: "Lila", x: 9, sprite: "/quest/joy-b.png", line: "Lila already has the machine warmed up." },
    ];
    for (const nurse of nurses) {
      npcs.push({
        id: nurse.id,
        kind: "townsman",
        name: nurse.name,
        x: nurse.x,
        y: 3,
        face: "down",
        sight: 0,
        done: false,
        ready: false,
        count: 0,
        need: 1,
        adaptive: false,
        testName: "",
        blueprint: city.id,
        line: nurse.line,
        foe: nurse.sprite,
        sprite: nurse.sprite,
      });
    }
    return { tiles, npcs, start: { x: 6, y: 8 } };
  }

  tiles = sized(21, 17);
  openGround(tiles);
  const townIndex = cities.findIndex((item) => item.id === city.id);
  if (city.id === "urogyn") {
    for (let y = 1; y <= 15; y++) {
      tiles[y][1] = 3;
      tiles[y][2] = 3;
      tiles[y][18] = 3;
      tiles[y][19] = 3;
    }
    for (let x = 1; x <= 19; x++) {
      tiles[1][x] = 3;
      tiles[2][x] = 3;
      tiles[15][x] = 3;
    }
    for (let y = 4; y <= 12; y++) tiles[y][10] = 1;
    for (let x = 6; x <= 14; x++) tiles[8][x] = 1;
    tiles[3][9] = 8;
    tiles[3][10] = 4;
    tiles[3][11] = 8;
    tiles[4][6] = 8;
    tiles[4][14] = 8;
    tiles[12][6] = 8;
    tiles[12][14] = 8;
    tiles[6][8] = 8;
    tiles[6][12] = 8;
    tiles[11][8] = 8;
    tiles[11][12] = 8;
    tiles[8][4] = 7;
    tiles[7][4] = 8;
    tiles[9][4] = 8;
    tiles[8][16] = 9;
    tiles[7][16] = 8;
    tiles[9][16] = 8;
    tiles[14][10] = 1;
    for (let x = 3; x <= 17; x++) tiles[14][x] = 1;
    tiles[14][2] = 5;
    tiles[14][18] = 5;
    tiles[13][2] = 1;
    tiles[13][18] = 1;
  } else {
    for (let y = 1; y <= 15; y++) tiles[y][10] = 1;
    for (let x = 1; x <= 19; x++) {
      tiles[4][x] = 1;
      tiles[8][x] = 1;
      tiles[12][x] = 1;
    }
    tiles[1][9] = 8;
    tiles[1][10] = 4;
    tiles[1][11] = 8;
    tiles[8][1] = 7;
    tiles[7][1] = 8;
    tiles[9][1] = 8;
    tiles[8][19] = 9;
    tiles[7][19] = 8;
    tiles[9][19] = 8;
    tiles[3][3] = 2;
    tiles[3][17] = 2;
    tiles[6][4] = 2;
    tiles[6][16] = 2;
    tiles[10][5] = 2;
    tiles[10][15] = 2;
    tiles[14][6] = 3;
    tiles[14][14] = 3;
    tiles[15][10] = 5;
    tiles[16][10] = 5;
    if (townIndex < cities.length - 1) {
      tiles[15][18] = 5;
      tiles[16][18] = 5;
    }
    tiles[15][2] = 5;
    tiles[16][2] = 5;
    for (let x = 3; x <= 9; x++) tiles[15][x] = 1;
    if (townIndex < cities.length - 1) {
      for (let x = 11; x <= 17; x++) tiles[15][x] = 1;
    }
  }
  const spots: { x: number; y: number; face: Face }[] = city.id === "urogyn"
    ? [
        { x: 7, y: 6, face: "down" },
        { x: 13, y: 6, face: "down" },
        { x: 7, y: 10, face: "up" },
      ]
    : [
        { x: 4, y: 3, face: "up" },
        { x: 16, y: 3, face: "up" },
        { x: 4, y: 6, face: "down" },
        { x: 16, y: 6, face: "down" },
        { x: 4, y: 10, face: "up" },
        { x: 16, y: 10, face: "up" },
        { x: 7, y: 14, face: "left" },
        { x: 13, y: 6, face: "right" },
        { x: 13, y: 10, face: "left" },
      ];
  city.trainers.forEach((trainer, index) => {
    const spot = spots[index];
    if (!spot) return;
    npcs.push({
      id: trainer.name,
      kind: "trainer",
      name: trainer.label ?? trainer.name,
      x: spot.x,
      y: spot.y,
      face: spot.face,
      sight: 1,
      done: gymDone ? false : trainerDone(trainer.name),
      ready: true,
      count: trainer.count,
      need: 0.6,
      adaptive: false,
      testName: `Route: ${trainer.name}`,
      blueprint: city.id,
      topics: trainer.topics,
      rematch: gymDone,
      line: gymDone
        ? `Rematch. ${trainer.label ?? trainer.name}. ${trainer.count} questions.`
        : `${trainer.label ?? trainer.name}. ${trainer.count} questions. Need 60%.`,
      foe: "/field/towns/trainer.jpg?v=2",
    });
  });
  npcs.push({
    id: `town-${city.id}`,
    kind: "townsman",
    name: "Local",
    x: city.id === "urogyn" ? 9 : 4,
    y: city.id === "urogyn" ? 6 : 5,
    face: "down",
    sight: 0,
    done: false,
    ready: false,
    count: 0,
    need: 1,
    adaptive: false,
    testName: "",
    blueprint: city.id,
    line: city.id === "urogyn"
      ? "Blackwater Hold. Water on every side. The gym is the stone door north. West is the shop, east is the Center. The dock signs leave the island."
      : city.id === "stones"
        ? "Quarry End. Stone questions, and Dr. Nicolette keeps the rock gym. The south road is the trail home. After the badge, the east boat goes to Onco Harbor."
        : city.id === "oncology"
          ? "Onco Harbor. This town comes after Quarry End. The bottom-left road goes back to the rock gym, the trail, and home. The east dock is the peninsula."
          : city.id === "core"
            ? "The Commons. Office, trauma, imaging, and a short transplant and statistics set. The gym leader mixes them."
            : `${city.city}. The gym is north, the mart is west, and the Center is east. Trainers stay in their yards. ${townIndex === 0 ? "The bottom-left road goes home." : "The bottom-left road goes back."} The middle of the bottom road is the route.`,
    foe: "/field/towns/walker.jpg?v=2",
  });
  if (!rivalDone) {
    npcs.push({
      id: `rival-${city.id}`,
      kind: "rival",
      name: RIVAL,
      x: city.id === "urogyn" ? 16 : 18,
      y: city.id === "urogyn" ? 12 : 14,
      face: "left",
      sight: 1,
      done: false,
      ready: gymDone,
      count: 6,
      need: 0.6,
      adaptive: true,
      testName: rivalTestName(city),
      blueprint: city.id,
      line: gymDone ? "The road stays shut until you take the harder set." : "The gym is still standing. Come back after the badge.",
      foe: "/field/towns/walker.jpg?v=2",
    });
  }
  return { tiles, npcs, start: { x: 10, y: 14 } };
}

function canWalk(world: World, x: number, y: number) {
  const rows = world.tiles.length;
  const cols = world.tiles[0]?.length ?? 0;
  if (x < 0 || y < 0 || x >= cols || y >= rows) return false;
  const tile = world.tiles[y][x];
  if (tile === 2 || tile === 3 || tile === 8) return false;
  return !world.npcs.some((npc) => npc.x === x && npc.y === y);
}

function clearLane(world: World, npc: Npc, x: number, y: number) {
  const stepX = Math.sign(x - npc.x);
  const stepY = Math.sign(y - npc.y);
  let cx = npc.x + stepX;
  let cy = npc.y + stepY;
  while (cx !== x || cy !== y) {
    const tile = world.tiles[cy]?.[cx];
    if (tile === 2 || tile === 3 || tile === 8) return false;
    if (world.npcs.some((other) => other !== npc && other.x === cx && other.y === cy)) return false;
    cx += stepX;
    cy += stepY;
  }
  return true;
}

function seenBy(world: World, x: number, y: number) {
  for (const npc of world.npcs) {
    if (npc.done || !npc.ready) continue;
    const dx = x - npc.x;
    const dy = y - npc.y;
    const aligned =
      (npc.face === "left" && dy === 0 && dx < 0 && -dx <= npc.sight) ||
      (npc.face === "right" && dy === 0 && dx > 0 && dx <= npc.sight) ||
      (npc.face === "up" && dx === 0 && dy < 0 && -dy <= npc.sight) ||
      (npc.face === "down" && dx === 0 && dy > 0 && dy <= npc.sight);
    if (aligned && clearLane(world, npc, x, y)) return npc;
  }
  return null;
}

function drawCenter(ctx: CanvasRenderingContext2D, frame: number) {
  const width = COLS * TILE;
  const height = ROWS * TILE;
  ctx.fillStyle = "#f4b7c8";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#fff7f4";
  ctx.fillRect(TILE, TILE, width - TILE * 2, height - TILE * 2);
  ctx.strokeStyle = "#f3d0da";
  ctx.lineWidth = 1;
  for (let y = 1; y < ROWS - 1; y++) {
    for (let x = 1; x < COLS - 1; x++) ctx.strokeRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
  }
  ctx.fillStyle = "#f8e7c9";
  ctx.fillRect(3 * TILE, 5 * TILE, 7 * TILE, 3 * TILE);
  ctx.strokeStyle = "#e7a0b8";
  ctx.lineWidth = 3;
  ctx.strokeRect(3 * TILE + 4, 5 * TILE + 4, 7 * TILE - 8, 3 * TILE - 8);
  ctx.fillStyle = "#d7eef8";
  ctx.fillRect(2 * TILE, 6, 2 * TILE, TILE - 10);
  ctx.fillRect(9 * TILE, 6, 2 * TILE, TILE - 10);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(5 * TILE + 2, TILE + 8, 3 * TILE - 4, TILE - 12);
  ctx.fillStyle = "#f48fb1";
  const blink = frame % 2 ? 14 : 10;
  ctx.fillRect(6 * TILE + 12, TILE + blink, 8, 12);
  ctx.fillRect(6 * TILE + 8, TILE + blink + 4, 16, 5);
  ctx.fillStyle = `rgba(255, 214, 150, ${frame % 2 ? 0.22 : 0.12})`;
  ctx.beginPath();
  ctx.arc(6.5 * TILE, 2.4 * TILE, TILE * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(2 * TILE, 2 * TILE + 10, 9 * TILE, TILE - 8);
  ctx.fillStyle = "#f7b6c8";
  ctx.fillRect(2 * TILE, 2 * TILE + 10, 9 * TILE, 5);
  const couch = (x: number) => {
    ctx.fillStyle = "#e7a0b8";
    ctx.fillRect(x * TILE + 2, 6 * TILE + 8, TILE * 2 - 4, TILE - 10);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x * TILE + 6, 6 * TILE + 12, TILE * 2 - 12, 6);
  };
  couch(1);
  couch(10);
  const plant = (x: number, y: number) => {
    ctx.fillStyle = "#f7f1e8";
    ctx.fillRect(x * TILE + 10, y * TILE + 18, 12, 10);
    ctx.fillStyle = "#3f8f4a";
    ctx.beginPath();
    ctx.arc(x * TILE + 16, y * TILE + 14, 9, 0, Math.PI * 2);
    ctx.fill();
  };
  plant(1, 5);
  plant(11, 5);
  ctx.fillStyle = "#c98484";
  ctx.fillRect(6 * TILE + 4, 9 * TILE + 2, TILE - 8, TILE - 4);
  ctx.fillStyle = "#fff8dc";
  ctx.font = "bold 7px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("OUT", 6 * TILE + TILE / 2, 9 * TILE + 18);
}

const LEADER_COAT: Record<string, string> = {
  stones: "#8a6230",
  oncology: "#9a2430",
  urogyn: "#16324a",
  core: "#5c3d86",
  andrology: "#1c1c1c",
  peds: "#246b34",
  basic: "#4e2a62",
  obstruction: "#6d4524",
};

const TRAINER_COATS: Record<string, string[]> = {
  stones: ["#5c5348", "#8a4b32", "#3e4a38", "#c4a574"],
  oncology: ["#8d1d2c", "#1d3557", "#c45c4a", "#243044"],
  urogyn: ["#1d4e6a", "#2c3e50", "#5c7a8a", "#5c4632"],
  core: ["#1d3557", "#c45c4a", "#5a7a4a", "#243044"],
  andrology: ["#1a1a1a", "#3d6fd8", "#e23b3b", "#f2d15a"],
  peds: ["#3a7a28", "#e59866", "#1d3557", "#7dcea0"],
  basic: ["#6b4c7a", "#2a4a32", "#1a1a1a", "#c4a484"],
  obstruction: ["#8a5a32", "#5a4632", "#3a4a28", "#c4a574"],
};

function coatFor(kind: string, cityId: string, name: string) {
  if (kind === "rival") return "#2a3142";
  if (kind === "leader") return LEADER_COAT[cityId] ?? "#5c3d2e";
  if (kind === "townsman") return "#f4efe4";
  const row = TRAINER_COATS[cityId] ?? TRAINER_COATS.core;
  let n = 0;
  for (let i = 0; i < name.length; i += 1) n += name.charCodeAt(i) * (i + 3);
  return row[n % row.length];
}

function paintPlace(ctx: CanvasRenderingContext2D, scene: Scene, cityId: string, frame: number) {
  const glow = (x: number, y: number, color: string, r: number) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  if (scene === "town" || scene === "home") {
    const rock = (sx: number, sy: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(sx * TILE, sy * TILE + 18);
      ctx.lineTo(sx * TILE + 8, sy * TILE + 2);
      ctx.lineTo(sx * TILE + 20, sy * TILE + 18);
      ctx.fill();
    };
    const lamp = (sx: number, sy: number, color: string) => {
      ctx.fillStyle = "#5c4632";
      ctx.fillRect(sx * TILE + 14, sy * TILE, 4, 16);
      glow(sx * TILE + 16, sy * TILE - 2, color, frame % 2 ? 5 : 4);
    };
    if (cityId === "home") {
      lamp(3, 6, "#ffd27a");
      lamp(16, 6, "#ffd27a");
    } else if (cityId === "stones") {
      rock(2, 11, "#9a9186");
      rock(17, 11, "#6e675e");
      rock(3, 6, "#b7aea0");
      rock(16, 6, "#8a8176");
    } else if (cityId === "oncology") {
      ctx.fillStyle = "#8d2e2a";
      for (const sx of [3, 6, 13, 16]) ctx.fillRect(sx * TILE, 2 * TILE, 10, 4);
      lamp(5, 5, "#ffb347");
      lamp(15, 5, "#ffb347");
    } else if (cityId === "urogyn") {
      ctx.fillStyle = frame % 2 ? "#1d3557" : "#16324a";
      ctx.fillRect(8 * TILE, 2 * TILE, 8, 22);
      ctx.fillStyle = "#8d1d2c";
      ctx.fillRect(12 * TILE, 2 * TILE, 8, 22);
    } else if (cityId === "core") {
      for (const [sx, sy] of [[3, 6], [6, 11], [14, 6], [17, 11]] as const) glow(sx * TILE, sy * TILE, "#fff", 3);
    } else if (cityId === "andrology") {
      lamp(4, 5, "#ffe14a");
      lamp(15, 5, "#ffe14a");
      lamp(8, 11, "#fff4a8");
    } else if (cityId === "peds") {
      for (const [sx, sy, color] of [[3, 7, "#ff8fab"], [6, 12, "#ffe14a"], [15, 7, "#9ae66e"], [17, 12, "#8ec8ff"]] as const) glow(sx * TILE, sy * TILE, color, 4);
    } else if (cityId === "basic") {
      ctx.fillStyle = "#6b4c7a";
      ctx.fillRect(3 * TILE + 8, 6 * TILE, 6, 14);
      ctx.fillRect(16 * TILE + 8, 11 * TILE, 6, 14);
      ctx.fillStyle = "#c9b6e0";
      ctx.fillRect(3 * TILE + 9, 6 * TILE + 3, 4, 6);
      ctx.fillRect(16 * TILE + 9, 11 * TILE + 3, 4, 6);
    } else if (cityId === "obstruction") {
      rock(2, 12, "#a06a3a");
      rock(16, 12, "#8a5430");
      rock(4, 7, "#c48a4a");
    }
  }
  if (scene === "route" && cityId === "stones") {
    ctx.fillStyle = "rgba(255, 236, 170, 0.9)";
    ctx.beginPath();
    ctx.arc(TILE * 2.2, TILE * 1.7, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(70, 48, 120, 0.45)";
    ctx.beginPath();
    ctx.arc(TILE * 2.5, TILE * 1.5, 11, 0, Math.PI * 2);
    ctx.fill();
    const flies = [
      [3.2, 6.2],
      [5.5, 3.4],
      [14.2, 3.2],
      [17.2, 7.4],
      [6.4, 11.2],
      [12.6, 9.4],
      [9.2, 6.6],
    ];
    flies.forEach(([fx, fy], index) => {
      glow(fx * TILE + Math.sin(frame / 2 + index) * 6, fy * TILE + Math.cos(frame / 3 + index) * 4, index % 2 ? "#ffe27a" : "#d7b4ff", 2.4);
    });
    const caps = [
      [2.2, 8.4, "#c45c4a"],
      [17.4, 4.2, "#7d5cff"],
      [15.2, 12.4, "#c45c4a"],
      [4.6, 6.6, "#7d5cff"],
    ] as const;
    for (const [sx, sy, color] of caps) {
      ctx.fillStyle = "#f4efe4";
      ctx.fillRect(sx * TILE, sy * TILE + 6, 4, 8);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(sx * TILE + 2, sy * TILE + 6, 8, 5, 0, Math.PI, 0);
      ctx.fill();
    }
  }
  if (scene === "route" && cityId === "oncology") {
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    for (let y = 2; y <= 12; y += 2) {
      const bob = frame % 2 ? 4 : 8;
      ctx.fillRect(2 * TILE + 10, y * TILE + bob, 12, 3);
      ctx.fillRect(18 * TILE + 4, y * TILE + (12 - bob), 12, 3);
    }
  }
  if (scene === "route" && cityId === "urogyn") {
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(0, (frame % 5) * 18, 21 * TILE, 26);
    ctx.fillRect(0, 80 + (frame % 4) * 22, 21 * TILE, 18);
  }
  if (scene === "town" && cityId === "urogyn") {
    const flicker = frame % 2 ? 6 : 4;
    for (const tx of [8, 12]) {
      ctx.fillStyle = "#5c4632";
      ctx.fillRect(tx * TILE + 13, 2 * TILE + 8, 5, 18);
      ctx.fillStyle = frame % 2 ? "#ffb347" : "#ff7a3c";
      glow(tx * TILE + 15, 2 * TILE + 6, frame % 2 ? "#ffb347" : "#ff7a3c", flicker);
    }
    ctx.fillStyle = "#1d3557";
    ctx.fillRect(7 * TILE + 10, 4 * TILE - 26, 7, 22);
    ctx.fillStyle = "#8d1d2c";
    ctx.fillRect(13 * TILE + 14, 4 * TILE - 26, 7, 22);
  }
}

function TrailPlay({ kind, onClose }: { kind: "glow" | "tide"; onClose: (won: boolean) => void }) {
  const [order, setOrder] = useState<number[]>([]);
  const [next, setNext] = useState(1);
  const [note, setNote] = useState(kind === "glow" ? "Light the lanterns from 1 to 4." : "Stop the marker while it sits in the green.");
  const [bar, setBar] = useState(0);
  const [won, setWon] = useState(false);
  useEffect(() => {
    setOrder([1, 2, 3, 4].sort(() => Math.random() - 0.5));
  }, [kind]);
  useEffect(() => {
    if (kind !== "tide" || won) return;
    const timer = window.setInterval(() => setBar((value) => (value + 3) % 100), 30);
    return () => window.clearInterval(timer);
  }, [kind, won]);
  return (
    <div className={`absolute inset-x-0 top-16 z-20 border-4 border-black p-3 text-black ${kind === "glow" ? "bg-[#efe6ff]" : "bg-[#e5f4f8]"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">{kind === "glow" ? "Glow shrine" : "Tide mark"}</p>
        <button type="button" onClick={() => onClose(false)} className="min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">
          Leave
        </button>
      </div>
      <p className="mt-1 text-sm">{note}</p>
      {won ? (
        <button type="button" onClick={() => onClose(true)} className="mt-3 min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">
          Take it
        </button>
      ) : kind === "glow" ? (
        <div className="mt-3 flex gap-2">
          {order.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                if (value !== next) {
                  setNext(1);
                  setNote("Start again at 1.");
                  return;
                }
                if (value === 4) {
                  setWon(true);
                  setNote("The lanterns stay lit. The first time, the wood leaves a Potion and a Ball.");
                } else {
                  setNext(value + 1);
                  setNote(`Next is ${value + 1}.`);
                }
              }}
              className="min-h-14 min-w-14 border-4 border-black bg-[#fff4a8] text-lg font-bold"
            >
              {value}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <div className="relative h-8 border-4 border-black bg-white">
            <div className="absolute inset-y-0 left-[38%] w-[24%] bg-[#8fd0c6]" />
            <div className="absolute top-0 h-full w-2 bg-black" style={{ left: `${bar}%` }} />
          </div>
          <button
            type="button"
            onClick={() => {
              if (bar > 38 && bar < 62) {
                setWon(true);
                setNote("The channel holds. The first time, it leaves a Repel.");
              } else setNote("Too early or too late. Wait for the green.");
            }}
            className="mt-2 min-h-11 border-4 border-black bg-white px-3 text-sm font-bold"
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );
}

export function MonsterQuest({
  stops,
  picked: _picked,
  onPick: _onPick,
  badges,
  champion,
  startRoute: _startRoute,
  startChampionship: _startChampionship,
}: {
  stops: Stop[];
  picked: string;
  onPick: (id: string) => void;
  badges: number;
  champion: boolean;
  startRoute: (name: string, blueprintId: BlueprintId, count: number, gym: boolean) => void;
  startChampionship: () => void;
}) {
  const desk = useDesk();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopsRef = useRef(stops);
  const testsRef = useRef(desk.state.tests);
  stopsRef.current = stops;
  testsRef.current = desk.state.tests;
  const keysRef = useRef(new Set<string>());
  const interactRef = useRef(false);
  const pausedRef = useRef(false);
  const busyRef = useRef(false);
  const posRef = useRef({ x: 10, y: 13, scene: "home" as Scene, cityId: "home" });
  const cityRef = useRef<City | null>(null);
  const apiRef = useRef({ talk: (_npc: Npc) => {}, wild: () => {}, enter: (_tile: Tile, _x: number, _y: number) => {} });
  const [scene, setScene] = useState<Scene>(() => {
    if (typeof localStorage === "undefined") return "home";
    parkAtHome();
    const saved = localStorage.getItem("callroom-quest-scene");
    if (saved === "home" || saved === "town" || saved === "gym" || saved === "route" || saved === "center") return saved;
    return localStorage.getItem("callroom-quest-city") ? "town" : "home";
  });
  const [tune, setTune] = useState(false);
  const [hold, setHold] = useState<string | null>(() => {
    if (typeof localStorage === "undefined") return null;
    parkAtHome();
    return localStorage.getItem("callroom-quest-city");
  });
  const [line, setLine] = useState("Walk across a trainer's line. They will see you.");
  const [caseOpen, setCaseOpen] = useState(false);
  const [sheet, setSheet] = useState<"party" | "dex" | null>(null);
  const [nurse, setNurse] = useState<string | null>(null);
  const [trialOpen, setTrialOpen] = useState(false);
  const [play, setPlay] = useState<"glow" | "tide" | null>(null);
  const [battle, setBattle] = useState<Battle | null>(null);
  const [notice, setNotice] = useState("");
  const [evo, setEvo] = useState<ReturnType<typeof evolutionMoment>>(null);
  const [bag, setBag] = useState<QuestBag | null>(null);
  const [offer, setOffer] = useState<SpeciesId | null>(null);
  const [gift, setGift] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const bagRef = useRef<QuestBag | null>(null);
  const followRef = useRef<string | null>(null);
  const repelRef = useRef(0);
  const fleeRef = useRef<string | null>(null);
  const calmRef = useRef(0);
  bagRef.current = bag;
  followRef.current = bag?.party[0] ? creatureSrc(bag.party[0]) : null;

  useEffect(() => {
    const next = loadBag();
    if (!localStorage.getItem(BAG_KEY)) saveBag(next);
    setBag(enrollGuide());
    repelRef.current = loadBag().repelLeft;
    const pull = () => setBag(loadBag());
    window.addEventListener("ise-progress", pull);
    return () => window.removeEventListener("ise-progress", pull);
  }, []);

  useEffect(() => {
    if (!bag || evo) return;
    const due = [...bag.party, ...bag.box].map((creature) => evolutionMoment(creature)).find(Boolean) ?? null;
    if (due) setEvo(due);
  }, [bag, evo]);

  useEffect(() => {
    sessionStorage.setItem("ise-playing", "1");
    return () => {
      sessionStorage.removeItem("ise-playing");
      sessionStorage.removeItem("ise-battle");
      sessionStorage.removeItem("ise-sync-refresh");
    };
  }, []);

  useEffect(() => {
    if (battle) sessionStorage.setItem("ise-battle", "1");
    else sessionStorage.removeItem("ise-battle");
  }, [battle]);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    if (localStorage.getItem("callroom-quest-parked-home-v2") !== "1") return;
    localStorage.setItem("callroom-quest-parked-home-v2", "done");
    posRef.current = { x: 10, y: 13, scene: "home", cityId: "home" };
    setHold(null);
    setScene("home");
    setLine("Home. The south road is the trail. Quarry End is at the far end.");
  }, []);

  const gymBeaten = (id: string) => stops.some((stop) => stop.kind === "gym" && stop.city.id === id && stop.done);
  const savedIndex = hold ? cities.findIndex((item) => item.id === hold) : 0;
  const city = cities[savedIndex >= 0 ? savedIndex : 0];
  cityRef.current = city;
  useEffect(() => {
    if (!musicOn()) return;
    setTownMusic(true, "canyon");
  }, [city?.id]);
  pausedRef.current = caseOpen || shopOpen || Boolean(battle) || Boolean(sheet) || Boolean(nurse) || Boolean(bag && !bag.starter) || Boolean(play) || trialOpen || Boolean(gift);

  const sail = (dir: 1 | -1) => {
    if (!city) return;
    const index = cities.findIndex((item) => item.id === city.id);
    const next = cities[index + dir];
    if (!next) {
      setLine(dir > 0 ? "Open water. No further world yet." : "This is the first shore.");
      return;
    }
    if (dir > 0 && !gymBeaten(city.id)) {
      setLine("The way on stays shut until you beat the gym leader. The road back is open.");
      return;
    }
    localStorage.setItem("callroom-quest-city", next.id);
    setHold(next.id);
    posRef.current = { x: 6, y: 8, scene: "town", cityId: next.id };
    setScene("town");
    setLine(dir > 0 ? `The boat crosses to ${next.city}. ${city.city} is still behind you.` : `The boat goes back to ${next.city}.`);
  };

  const go = (next: Scene, x: number, y: number) => {
    const cityId = next === "home" ? "home" : city?.id ?? "stones";
    posRef.current = { x, y, scene: next, cityId };
    setScene(next);
    localStorage.setItem("callroom-quest-scene", next);
    setLine(next === "home" ? "Home. Your house is on the left. Professor Moka is in the lab." : next === "route" ? "Grass shows up in patches. A correct answer weakens a wild one. Then throw a ball." : next === "gym" ? "The aisle is the leader's line of sight." : next === "center" ? "The Center is warm and quiet. Talk to a nurse. HP and PP come back here. Not at midnight." : "The west door is the shop. Trainers stay off the main road.");
  };

  const readyLead = () => {
    const current = loadBag();
    const lead = current.party[0];
    if (!lead || lead.hp <= 0) {
      busyRef.current = false;
      setNotice("Your lead is out of HP. Heal it, or switch who is in front.");
      return null;
    }
    return { current, lead };
  };

  const startBattle = async (npc: Npc) => {
    if (npc.kind === "townsman") {
      setLine(npc.line);
      return;
    }
    if (busyRef.current) return;
    if (npc.done) {
      setLine(`${npc.name}: Nothing left to prove.`);
      return;
    }
    if (!npc.ready) {
      setLine(npc.line);
      return;
    }
    const ready = readyLead();
    if (!ready) return;
    busyRef.current = true;
    setNotice("");
    await loadCatalog();
    const topicIds = npc.topics?.length ? npc.topics : topicIdsFor(npc.blueprint);
    let ids = npc.prostate
      ? [
          ...drawForQuest(desk.state, ["pca", "pca-adv"], Math.ceil(npc.count / 2), Boolean(npc.rematch)),
          ...drawForQuest(desk.state, topicIds, npc.count, Boolean(npc.rematch)),
        ].filter((id, index, all) => all.indexOf(id) === index).slice(0, npc.count)
      : drawForQuest(desk.state, topicIds, npc.count, Boolean(npc.rematch));
    if (!ids.length) {
      busyRef.current = false;
      setNotice("No unused questions left in that set. On Build, open Used and hit Recycle used.");
      return;
    }
    const testId = desk.createTest({
      name: npc.testName,
      mode: "tutor",
      adaptive: npc.adaptive,
      topicIds,
      pool: "unused",
      count: ids.length,
      questionIds: ids,
    });
    if (!testId) {
      busyRef.current = false;
      return;
    }
    const cityIndex = Math.max(0, cities.findIndex((item) => item.id === city?.id));
    const partner = partnerFor(city?.id ?? "stones", npc.kind === "leader" ? npc.name : npc.id, npc.kind);
    const foeMax = foeHealth(npc.kind, ids.length, cityIndex);
    setLine(npc.kind === "leader" ? `${npc.name} sends out ${partner.name}. Knock it out. A wrong answer and ${partner.move} hits you.` : npc.line);
    setBattle({
      testId,
      ids,
      index: 0,
      you: ready.lead.hp,
      youMax: maxHp(ready.lead, ready.current),
      foeHp: foeMax,
      foeMax,
      right: 0,
      foeName: partner.name,
      foeKind: npc.kind,
      foeType: speciesType[partner.species],
      foeSpecies: partner.species,
      foeStage: partner.stage,
      foeMove: partner.move,
      foePower: foeStrike(npc.kind, cityIndex),
      title: npc.testName,
      need: npc.need,
      reveal: null,
      over: null,
      fainted: false,
      menu: null,
      guard: false,
      boost: false,
      committed: false,
      fromId: npc.id,
    });
  };

  const startWild = async () => {
    if (!city || busyRef.current) return;
    const ready = readyLead();
    if (!ready) return;
    busyRef.current = true;
    await loadCatalog();
    const ids = drawForQuest(desk.state, topicIdsFor(city.id), 3, false);
    if (!ids.length) {
      busyRef.current = false;
      setLine("The grass is quiet. Recycle used questions from Build.");
      return;
    }
    const testId = desk.createTest({
      name: `Wild: ${city.city}`,
      mode: "tutor",
      adaptive: false,
      topicIds: topicIdsFor(city.id),
      pool: "unused",
      count: ids.length,
      questionIds: ids,
    });
    if (!testId) {
      busyRef.current = false;
      return;
    }
    const cityIndex = Math.max(0, cities.findIndex((item) => item.id === city.id));
    const species = wildSpecies(cityIndex);
    const level = 3 + cityIndex;
    const foeMax = foeHealth("wild", ids.length, cityIndex);
    setBattle({
      testId,
      ids,
      index: 0,
      you: ready.lead.hp,
      youMax: maxHp(ready.lead, ready.current),
      foeHp: foeMax,
      foeMax,
      right: 0,
      foeName: lines[species].names[stageOf(level)],
      foeKind: "wild",
      foeType: speciesType[species],
      foeSpecies: species,
      foeStage: stageOf(level),
      foeMove: "Bash",
      foePower: foeStrike("wild", cityIndex),
      title: "Tall grass",
      need: 1,
      reveal: null,
      over: null,
      fainted: false,
      menu: null,
      guard: false,
      boost: false,
      committed: false,
    });
  };

  apiRef.current.talk = (npc) => {
    if (npc.id.startsWith("joy")) {
      setNurse(npc.id);
      setLine(npc.line);
      return;
    }
    if (npc.id === "side-glow") {
      setPlay("glow");
      return;
    }
    if (npc.id === "side-tide") {
      setPlay("tide");
      return;
    }
    if (npc.kind === "townsman") {
      setLine(npc.line);
      return;
    }
    void startBattle(npc);
  };
  apiRef.current.wild = () => void startWild();
  apiRef.current.enter = (tile, x, y) => {
    if (tile === 9) {
      go("center", 6, 8);
      return;
    }
    if (tile === 4 && scene === "home") {
      setLine("Your house. The lights are on, and it is quiet.");
      return;
    }
    if (tile === 5 && scene === "home") {
      localStorage.setItem("callroom-quest-city", "stones");
      setHold("stones");
      posRef.current = { x: 10, y: 12, scene: "route", cityId: "stones" };
      setScene("route");
      localStorage.setItem("callroom-quest-scene", "route");
      setLine("The trail. North is Quarry End and the rock gym. South comes back home.");
      return;
    }
    if (tile === 4 && scene === "center") {
      go("town", city?.id === "urogyn" ? 15 : 18, 8);
      setLine("They look back at the door. Come again.");
      return;
    }
    if (tile === 7 && scene === "town") {
      setShopOpen(true);
      setLine("Shop. Buying here spends Quest money only.");
      return;
    }
    if (tile === 4 && scene === "town") go("gym", 6, 8);
    else if (tile === 4 && scene === "gym") go("town", 10, city?.id === "urogyn" ? 12 : 2);
    else if (tile === 5 && scene === "town" && (y ?? 0) >= 14 && (x ?? 0) <= 3) {
      if (city?.id === "stones") {
        go("route", 10, 2);
        setLine("The trail home. South leaves the wood. North comes back to Quarry End.");
      } else sail(-1);
    } else if (tile === 5 && scene === "town") {
      const east = (x ?? 0) >= 16;
      if (city?.id === "stones") {
        if (east) {
          if (!gymBeaten(city.id)) {
            setLine("The road to Onco Harbor stays shut until Dr. Nicolette falls. The trail home is open.");
            return;
          }
          sail(1);
          return;
        }
        go("route", 10, 2);
        setLine("The trail. South goes home. North is Quarry End.");
        return;
      }
      const trail = city && (city.id === "oncology" || city.id === "urogyn");
      if (trail) {
        go("route", -1, -1);
        setLine(
          city.id === "oncology"
            ? "Peninsula. South goes back to Onco Harbor. North walks on to the next town."
            : "The span. South goes back. North walks on to the next town.",
        );
      } else if (east) sail(1);
      else go("route", -1, -1);
    } else if (tile === 5 && scene === "route") {
      if (city?.id === "stones") {
        if ((y ?? 0) >= 8) {
          go("home", 10, 13);
          setLine("Home. The trail north goes back to Quarry End.");
          return;
        }
        go("town", 10, 14);
        setLine("Quarry End. The rock gym is north. Stone trainers are in the yards.");
        return;
      }
      if ((y ?? 0) >= 8) {
        go("town", 10, city?.id === "urogyn" ? 13 : 14);
        setLine("Back in town. No badge needed to come back.");
        return;
      }
      if (!city || !gymBeaten(city.id)) {
        setLine("That sign goes to the next town. It stays shut until the gym badge. South goes back.");
        return;
      }
      sail(1);
    }
  };

  const seal = (win: boolean) => {
    if (!battle) return;
    desk.patchTest(battle.testId, (current) => {
      const answered = battle.ids.filter((id) => current.answers[id]?.submitted);
      return {
        ...current,
        questionIds: win && answered.length ? answered : current.questionIds,
        status: "done",
        finishedAt: Date.now(),
      };
    });
  };

  const grade = (choice: number) => {
    if (!battle || battle.reveal || battle.over || battle.fainted) return;
    const id = battle.ids[battle.index];
    const question = getQuestion(id);
    if (!question) return;
    const correct = choice === question.answer;
    desk.patchTest(battle.testId, (current) => ({
      ...current,
      index: battle.index,
      answers: { ...current.answers, [id]: { choice, submitted: true } },
    }));
    rememberAnswer(id, choice, correct);
    logActivity("questions");
    noteRow(correct);
    if (correct) logCorrect();
    else {
      addCard(
        {
          id: question.id,
          topic: question.topicId,
          question: question.stem.join("\n\n"),
          choices: question.choices,
          answer: question.answer,
          explanation: question.explanation,
          wrong: question.wrong,
        },
        "auto",
      );
    }
    desk.consume(id);
    const current = loadBag();
    const lead = current.party[0];
    if (!lead) return;
    const move = battle.moveId ? moveDef(battle.moveId) : undefined;
    const spent = move ? spendPp(lead, move.id) : false;
    const mult = move ? effectiveness(move.kind, battle.foeType) : 1;
    const dealtBase = correct && spent ? Math.round((strike(lead, current) + (move?.power ?? 0)) * (battle.boost ? 2 : 1) * mult) : 0;
    const foeHp = Math.max(0, battle.foeHp - dealtBase);
    const incoming = battle.foePower ?? 4;
    const taken = battle.guard ? Math.max(1, Math.floor(incoming / 2)) : incoming;
    let grew = "";
    let hp = battle.you;
    let youMax = battle.youMax;
    if (correct) {
      grew = grantExp(lead, 10);
      if (current.expShare) {
        for (const other of current.party.slice(1)) {
          const shared = grantExp(other, 2);
          if (shared.includes("evolved")) grew = [grew, shared].filter(Boolean).join(" ");
        }
      }
      youMax = maxHp(lead, current);
      hp = Math.min(youMax, hp + Math.max(0, youMax - battle.youMax));
    } else hp = Math.max(0, hp - taken);
    lead.hp = hp;
    const right = battle.right + (correct ? 1 : 0);
    const last = battle.index + 1 >= battle.ids.length;
    let prize = "";
    let fainted = false;
    const knocked = foeHp <= 0 && hp > 0;
    const wonFight = knocked && battle.foeKind !== "wild";
    const wildDown = knocked && battle.foeKind === "wild";
    if (wonFight || wildDown) {
      const amount = wonFight ? 16 + right * 2 : 10;
      prize = payExp(current, amount);
      youMax = maxHp(lead, current);
      hp = Math.min(youMax, lead.hp);
      lead.hp = hp;
    }
    if (hp <= 0 && !knocked) {
      const bench = current.party.slice(1).find((creature) => creature.hp > 0);
      if (bench) {
        current.party = [bench, ...current.party.filter((creature) => creature.id !== bench.id)];
        hp = bench.hp;
        youMax = maxHp(bench, current);
        grew = [grew, `${nameOf(lead)} fainted. ${nameOf(bench)} stepped in.`].filter(Boolean).join(" ");
      } else fainted = true;
    }
    saveBag(current);
    setBag(loadBag());
    let over: string | null = null;
    if (wonFight) {
      seal(true);
      over = prize ? `You won. ${battle.foeName} fainted. ${prize}` : `You won. ${battle.foeName} fainted.`;
    } else if (wildDown) {
      seal(false);
      over = prize ? `It fainted. ${prize} Throw a ball while it still has HP.` : "It fainted. Throw a ball while it still has HP.";
    } else if (fainted) {
      seal(false);
      over = "You fainted. Their attack landed.";
    } else if (last && battle.foeKind !== "wild") {
      if (!prize) {
        prize = payExp(current, 8);
        saveBag(current);
        setBag(loadBag());
      }
      seal(false);
      over = prize ? `${battle.foeName} is still standing. ${prize}` : `${battle.foeName} is still standing.`;
    } else if (last) {
      seal(false);
      over = "It got away.";
    }
    const hit = !correct
      ? `${battle.foeName} used ${battle.foeMove ?? "Bash"}. ${taken} damage.${battle.guard ? " Guard cut it." : ""}`
      : !move
        ? "Pick an attack. Nothing landed."
        : !spent
          ? `${move.name} is out of PP. Nothing landed.`
          : move.power === 0
            ? `${nameOf(lead)} used ${move.name}. Brace is up.`
            : `${nameOf(lead)} used ${move.name}. Attack ${strike(lead, current)} + ${move.power}. Hit for ${dealtBase}.${mult > 1 ? " Super effective." : mult < 1 && mult > 0 ? " Not very effective." : mult === 0 ? " No effect." : ""}`;
    setBattle({
      ...battle,
      right,
      you: hp,
      youMax,
      foeHp,
      fainted,
      guard: correct && move?.power === 0 ? true : correct ? battle.guard : false,
      boost: correct ? false : battle.boost,
      menu: null,
      moveId: undefined,
      reveal: {
        correct,
        note: [hit, grew, prize, `Correct: ${"ABCDE"[question.answer]}. ${question.choices[question.answer]}`].filter(Boolean).join(" "),
      },
      over,
    });
  };

  const advance = () => {
    if (!battle?.reveal) return;
    if (battle.over) {
      const wonLeader = battle.foeKind === "leader" && battle.over.startsWith("You won");
      const wonRival = battle.over.startsWith("You won") && battle.title.startsWith("Rival:");
      busyRef.current = false;
      setBattle(null);
      if (wonLeader && city && !(loadBag().aces ?? []).includes(city.id)) setGift(city.id);
      if (wonRival && city) {
        setHold(city.id);
        go("route", 6, 9);
      }
      return;
    }
    if (battle.index + 1 >= battle.ids.length) {
      seal(false);
      setBattle({ ...battle, over: battle.foeKind === "wild" ? "It got away." : "Not enough. You can try again.", menu: null });
      return;
    }
    setBattle({ ...battle, index: battle.index + 1, reveal: null, menu: "fight", moveId: undefined, committed: false });
  };

  const run = () => {
    if (!battle) return;
    fleeRef.current = battle.fromId ?? null;
    calmRef.current = 8;
    desk.patchTest(battle.testId, (current) => ({ ...current, status: "done", finishedAt: Date.now() }));
    busyRef.current = false;
    setNotice("");
    setBattle(null);
    setLine("You got away.");
  };

  const giveUp = () => {
    if (!battle) return;
    seal(false);
    busyRef.current = false;
    setBattle(null);
    const rested = loadBag();
    healAll(rested);
    saveBag(rested);
    setBag(loadBag());
    if (city) {
      posRef.current = { x: 18, y: 8, scene: "town", cityId: city.id };
      setScene("town");
    } else {
      posRef.current = { x: 2, y: 7, scene: "town", cityId: "league" };
    }
    setLine("You woke up at the Center. HP and PP are full. They are glad to be here.");
  };

  const throwBall = (ball: Ball) => {
    if (!battle || battle.over) return;
    if (battle.foeKind !== "wild" || !battle.foeSpecies) {
      setNotice("Balls are for wild ones.");
      return;
    }
    if (battle.foeHp <= 0) {
      setNotice("It already fainted.");
      return;
    }
    if (!takeBall(ball)) {
      setNotice("You don't have that ball.");
      setBag(loadBag());
      return;
    }
    setBag(loadBag());
    const chance = catchChance(ball, battle.foeHp, battle.foeMax, Boolean(loadBag().charm));
    if (Math.random() <= chance) {
      const cityIndex = Math.max(0, cities.findIndex((item) => item.id === city?.id));
      const note = keepCatch(battle.foeSpecies, 3 + cityIndex);
      seal(false);
      setBag(loadBag());
      setBattle({ ...battle, menu: null, over: "Caught.", reveal: { correct: true, note } });
      return;
    }
    setNotice("It broke free.");
    setBattle({ ...battle, menu: null });
  };

  const wakeLead = (kind: "revive" | "max") => {
    const note = revive(kind, 0);
    const next = loadBag();
    setBag(next);
    setNotice(note);
    const front = next.party[0];
    if (!battle || !front) return;
    setBattle({
      ...battle,
      you: front.hp,
      youMax: maxHp(front, next),
      fainted: front.hp <= 0,
      menu: null,
    });
  };

  const arm = (kind: "guard" | "xattack") => {
    if (!battle || battle.over) return;
    if (!spendBattleItem(kind)) {
      setNotice(kind === "guard" ? "No Guards." : "No X Attacks.");
      return;
    }
    setBag(loadBag());
    setBattle({ ...battle, guard: kind === "guard" ? true : battle.guard, boost: kind === "xattack" ? true : battle.boost, menu: null });
    setNotice(kind === "guard" ? "The next hit will be weaker." : "Your next hit will be harder.");
  };

  const spray = () => {
    const note = useRepel();
    const next = loadBag();
    repelRef.current = next.repelLeft;
    setBag(next);
    setNotice(note);
  };

  const healLead = (kind: "potion" | "super") => {
    const note = drink(kind, 0);
    const next = loadBag();
    setBag(next);
    setNotice(note);
    const front = next.party[0];
    if (!battle || !front) return;
    setBattle({
      ...battle,
      you: front.hp,
      youMax: maxHp(front, next),
      fainted: front.hp <= 0,
      menu: null,
    });
  };

  useEffect(() => {
    if (battle) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const here = cityRef.current;
    const id = scene === "home" ? "home" : here?.id ?? "league";
    const map = buildWorld(scene, here, stopsRef.current, testsRef.current);
    const cols = map.tiles[0]?.length ?? COLS;
    const rows = map.tiles.length || ROWS;
    const stood = map.tiles[posRef.current.y]?.[posRef.current.x];
    const samePlace = posRef.current.cityId === id && posRef.current.scene === scene;
    const blocked = stood == null || stood === 2 || stood === 3 || stood === 8;
    if (!samePlace || blocked) posRef.current = { x: map.start.x, y: map.start.y, scene, cityId: id };
    if (map.tiles[posRef.current.y]?.[posRef.current.x] === 5) {
      const ny = posRef.current.y <= 2 ? posRef.current.y + 1 : posRef.current.y - 1;
      if (canWalk(map, posRef.current.x, ny)) posRef.current = { x: posRef.current.x, y: ny, scene, cityId: id };
    }
    let alive = true;
    let moving = 0;
    let last = performance.now();
    let raf = 0;
    let bangUntil = 0;
    let bang: Npc | null = null;
    let grassSteps = 0;
    let timer = 0;
    const player = { x: posRef.current.x, y: posRef.current.y, fromX: posRef.current.x, fromY: posRef.current.y, face: "up" as Face };
    let walked = 0;

    const spot = (npc: Npc) => {
      if (busyRef.current) return;
      busyRef.current = true;
      bang = npc;
      bangUntil = performance.now() + 650;
      timer = window.setTimeout(() => {
        busyRef.current = false;
        if (alive) apiRef.current.talk(npc);
      }, 650);
    };

    let path: { x: number; y: number }[] = [];
    let pending: Npc | null = null;

    const routeTo = (tx: number, ty: number) => {
      const key = (x: number, y: number) => `${x},${y}`;
      const prev = new Map<string, string | null>();
      const queue = [{ x: player.x, y: player.y }];
      prev.set(key(player.x, player.y), null);
      let found = false;
      while (queue.length) {
        const cur = queue.shift();
        if (!cur) break;
        if (cur.x === tx && cur.y === ty) {
          found = true;
          break;
        }
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
          const nx = cur.x + dx;
          const ny = cur.y + dy;
          const id = key(nx, ny);
          if (prev.has(id) || !canWalk(map, nx, ny)) continue;
          prev.set(id, key(cur.x, cur.y));
          queue.push({ x: nx, y: ny });
        }
      }
      if (!found) return;
      const steps: { x: number; y: number }[] = [];
      let cursor: string | null = key(tx, ty);
      while (cursor && cursor !== key(player.x, player.y)) {
        const [sx, sy] = cursor.split(",").map(Number);
        steps.push({ x: sx, y: sy });
        cursor = prev.get(cursor) ?? null;
      }
      path = steps.reverse();
    };

    const onKey = (event: KeyboardEvent) => {
      const move = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
      if (move.includes(event.key.toLowerCase())) event.preventDefault();
      if (event.type === "keydown") {
        keysRef.current.add(event.key.toLowerCase());
        path = [];
        pending = null;
      } else keysRef.current.delete(event.key.toLowerCase());
      if (event.type === "keydown" && !event.repeat && (event.key === "Enter" || event.key === " ")) interactRef.current = true;
      if (event.type === "keydown" && event.key.toLowerCase() === "m") setCaseOpen((open) => !open);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    const release = () => keysRef.current.clear();
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    const onMap = (event: PointerEvent) => {
      keysRef.current.clear();
      path = [];
      pending = null;
      if (pausedRef.current || busyRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.min(cols - 1, Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * cols)));
      const y = Math.min(rows - 1, Math.max(0, Math.floor(((event.clientY - rect.top) / rect.height) * rows)));
      const person = map.npcs.find((one) => one.x === x && one.y - y >= 0 && one.y - y <= 1);
      if (person && Math.abs(person.x - player.x) + Math.abs(person.y - player.y) <= 1) {
        apiRef.current.talk(person);
        return;
      }
      if (person) {
        const nextTo = [[0, -1], [0, 1], [-1, 0], [1, 0]]
          .map(([dx, dy]) => ({ x: person.x + dx, y: person.y + dy }))
          .filter((spot) => canWalk(map, spot.x, spot.y))
          .sort((a, b) => Math.abs(a.x - player.x) + Math.abs(a.y - player.y) - (Math.abs(b.x - player.x) + Math.abs(b.y - player.y)))[0];
        if (nextTo) {
          pending = person;
          routeTo(nextTo.x, nextTo.y);
        }
        return;
      }
      const tile = map.tiles[y]?.[x];
      if (tile === 4 || tile === 5 || tile === 7 || tile === 9) {
        if (Math.abs(x - player.x) + Math.abs(y - player.y) <= 1) apiRef.current.enter(tile, x, y);
        else routeTo(x, y);
        return;
      }
      routeTo(x, y);
    };
    canvas.addEventListener("pointerdown", onMap);
    canvas.width = cols * TILE * 2;
    canvas.height = rows * TILE * 2;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.imageSmoothingEnabled = true;

    const dir = () => {
      const keys = keysRef.current;
      if (keys.has("arrowup") || keys.has("w")) return [0, -1] as const;
      if (keys.has("arrowdown") || keys.has("s")) return [0, 1] as const;
      if (keys.has("arrowleft") || keys.has("a")) return [-1, 0] as const;
      if (keys.has("arrowright") || keys.has("d")) return [1, 0] as const;
      return null;
    };

    const draw = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!pausedRef.current && bangUntil < now) {
        if (moving > 0) moving = Math.max(0, moving - dt);
        else if (interactRef.current) {
          interactRef.current = false;
          const near = map.npcs.find((npc) => Math.abs(npc.x - player.x) + Math.abs(npc.y - player.y) === 1);
          if (near) apiRef.current.talk(near);
          else setLine("Stand next to someone, or click them.");
        } else {
          const keyed = dir();
          const queued = !keyed && path[0] ? ([path[0].x - player.x, path[0].y - player.y] as const) : null;
          const step = keyed ?? (queued && Math.abs(queued[0]) + Math.abs(queued[1]) === 1 ? queued : null);
          if (keyed) {
            path = [];
            pending = null;
          }
          if (step && canWalk(map, player.x + step[0], player.y + step[1])) {
            player.fromX = player.x;
            player.fromY = player.y;
            player.face = step[1] < 0 ? "up" : step[1] > 0 ? "down" : step[0] < 0 ? "left" : "right";
            player.x += step[0];
            player.y += step[1];
            if (path[0]?.x === player.x && path[0]?.y === player.y) path.shift();
            moving = STEP;
            walked += 1;
            posRef.current.x = player.x;
            posRef.current.y = player.y;
            const tile = map.tiles[player.y][player.x];
            if (repelRef.current > 0) {
              repelRef.current -= 1;
              if (repelRef.current === 0) {
                const worn = loadBag();
                worn.repelLeft = 0;
                saveBag(worn);
                setLine("The Repel wore off.");
                setBag(loadBag());
              }
            }
            if (calmRef.current > 0) calmRef.current -= 1;
            if (tile === 4 || tile === 5 || tile === 7 || tile === 9) apiRef.current.enter(tile, player.x, player.y);
            else {
              if (tile === 6 && repelRef.current <= 0 && calmRef.current <= 0) {
                grassSteps += 1;
                if (grassSteps >= 4 && Math.random() < 0.22) {
                  grassSteps = 0;
                  apiRef.current.wild();
                }
              }
              const npc = seenBy(map, player.x, player.y);
              if (!npc) fleeRef.current = null;
              else if (npc.id !== fleeRef.current) {
                fleeRef.current = null;
                spot(npc);
              }
              if (!npc && pending && path.length === 0 && Math.abs(pending.x - player.x) + Math.abs(pending.y - player.y) === 1) {
                const who = pending;
                pending = null;
                apiRef.current.talk(who);
              }
            }
          }
        }
      }
      const t = moving === 0 ? 1 : 1 - moving / STEP;
      const drawX = player.fromX + (player.x - player.fromX) * t;
      const drawY = player.fromY + (player.y - player.fromY) * t;
      const frame = Math.floor(now / 280);
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, cols * TILE, rows * TILE);
      const place = lookFor(scene === "home" ? "home" : id);
      if (scene === "center") drawCenter(ctx, frame);
      else if (scene === "gym" && here?.hall && gymHall(here.hall)) {
        ctx.drawImage(gymHall(here.hall) as HTMLImageElement, 0, 0, cols * TILE, rows * TILE);
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (map.tiles[y][x] === 4) drawProp(ctx, 4, x, y, true);
          }
        }
      } else {
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const tile = map.tiles[y][x];
            const building = scene === "gym" || ((scene === "town" || scene === "home") && tile === 8);
            drawGround(ctx, tile, x, y, building, frame, scene === "gym" ? undefined : place);
          }
        }
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const tile = map.tiles[y][x];
            const building = scene === "gym" || ((scene === "town" || scene === "home") && tile === 8);
            drawProp(ctx, tile, x, y, building, scene === "gym" ? undefined : place);
            const label =
              scene === "town" || scene === "home"
                ? tile === 7
                  ? "MART"
                  : tile === 9
                    ? "CENTER"
                    : tile === 4 && scene === "home"
                      ? "HOUSE"
                      : tile === 4
                        ? "GYM"
                        : tile === 5 && scene === "home"
                          ? "ROAD"
                          : tile === 5 && x <= 3
                            ? cityRef.current?.id === "stones"
                              ? "HOME"
                              : "BACK"
                            : tile === 5 && x >= 16
                              ? cityRef.current?.id === "stones"
                                ? "BOAT"
                                : cityRef.current && ["oncology", "urogyn"].includes(cityRef.current.id)
                                  ? "TRAIL"
                                  : "BOAT"
                              : tile === 5
                                ? cityRef.current && ["stones", "oncology", "urogyn"].includes(cityRef.current.id)
                                  ? "TRAIL"
                                  : "ROUTE"
                                : ""
                : scene === "route" && tile === 5
                  ? cityRef.current?.id === "stones"
                    ? y <= 2
                      ? "QUARRY"
                      : "HOME"
                    : y <= 2
                      ? "ONWARD"
                      : "BACK"
                  : "";
            if (label) {
              ctx.fillStyle = "#1a1208";
              ctx.font = "bold 8px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(label, x * TILE + TILE / 2, y * TILE + 14);
            }
          }
        }
        paintPlace(ctx, scene, id, frame);
      }
      const stepPhase = moving > 0 ? walked + t : 0;
      const follow = followRef.current;
      if (follow) {
        const behindX = player.face === "left" ? 0.8 : player.face === "right" ? -0.8 : 0;
        const behindY = player.face === "up" ? 0.85 : player.face === "down" ? -0.85 : 0;
        const leadJoy = bagRef.current?.party[0];
        const grown = leadJoy ? stageOf(levelOf(leadJoy.exp), leadJoy.species) >= 2 : false;
        drawCreature(ctx, drawX + behindX, drawY + behindY, follow, player.face, stepPhase, grown);
        if (scene === "center" && leadJoy && joyOf(leadJoy) >= 200) {
          ctx.fillStyle = "#ff6b93";
          const hx = (drawX + behindX) * TILE + TILE / 2 - 3;
          const hy = (drawY + behindY) * TILE - 8;
          ctx.fillRect(hx, hy + 2, 3, 3);
          ctx.fillRect(hx + 4, hy + 2, 3, 3);
          ctx.fillRect(hx + 1, hy + 4, 5, 3);
          ctx.fillRect(hx + 2, hy + 7, 3, 2);
        }
      }
      for (const npc of map.npcs) {
        if (npc.sprite) drawCreature(ctx, npc.x, npc.y, npc.sprite, npc.face, 0);
        else {
          const actor = npc.kind === "leader" ? "leader" : npc.kind === "rival" ? "rival" : "trainer";
          drawActor(ctx, npc.x, npc.y, actor, 0, npc.face, coatFor(npc.kind, id, npc.name));
        }
        if (bang && bang.id === npc.id && now < bangUntil) {
          ctx.fillStyle = "#fff8dc";
          ctx.fillRect(npc.x * TILE + 8, npc.y * TILE - 18, 16, 18);
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(npc.x * TILE + 14, npc.y * TILE - 14, 4, 8);
          ctx.fillRect(npc.x * TILE + 14, npc.y * TILE - 4, 4, 3);
        }
      }
      drawActor(ctx, drawX, drawY, "player", stepPhase, player.face);
      const washIndex = Math.max(0, cities.findIndex((item) => item.id === id));
      let wash = ["#d7b98a", "#7eb6d6", "#f0e27a", "#7dcea0", "#c39bd3", "#e6d5f2", "#e59866", "#c4a484"][washIndex % 8];
      let washAlpha = scene === "center" || scene === "gym" || scene === "town" || scene === "home" ? 0 : scene === "route" ? 0.08 : 0.05;
      if (scene === "route" && id === "stones") {
        wash = "#241433";
        washAlpha = 0.34;
      } else if (scene === "route" && id === "oncology") {
        wash = "#14384a";
        washAlpha = 0.16;
      } else if (scene === "route" && id === "urogyn") {
        wash = "#e7eef3";
        washAlpha = 0.28;
      } else if (scene === "town" && id === "urogyn") {
        wash = "#5e6d7a";
        washAlpha = 0.2;
      }
      ctx.fillStyle = wash;
      ctx.globalAlpha = washAlpha;
      ctx.fillRect(0, 0, cols * TILE, rows * TILE);
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      canvas.removeEventListener("pointerdown", onMap);
      keysRef.current.clear();
      const left = repelRef.current;
      const stored = loadBag();
      if (stored.repelLeft !== left) {
        stored.repelLeft = left;
        saveBag(stored);
      }
    };
  }, [battle, scene, city?.id]);

  const question = battle ? getQuestion(battle.ids[battle.index] ?? "") : undefined;
  const lead = bag?.party[0];

  return (
    <div ref={wrapRef} className="relative bg-[#1e3a24]">
      {evo && bag ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#f8f8d8]/95 p-6 text-center text-black">
          {(() => {
            const creature = [...bag.party, ...bag.box].find((row) => row.id === evo.id);
            return creature ? <img src={creatureSrc(creature)} alt="" className="h-48 w-auto" /> : null;
          })()}
          <p className="mt-3 font-serif text-2xl">{evo.name} evolved.</p>
          <p className="mt-1 text-sm">Level {evo.level}. {evo.to >= 3 ? "Fully evolved." : evo.to >= 2 ? (isStarterSpecies(evo.species) ? "One more form at level 28." : "Final form.") : "The next form is at level 14."} Written in the record.</p>
          <button
            type="button"
            onClick={() => {
              setBag(markEvolutionSeen(evo.id));
              setEvo(null);
            }}
            className="mt-4 min-h-11 border-4 border-black bg-black px-4 text-sm font-bold text-[#fff4a8]"
          >
            OK
          </button>
        </div>
      ) : null}
      <div className="border-b-4 border-black bg-[#fff4a8] px-3 py-2 text-black">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {cities.map((item) => {
            const earned = stops.some((stop) => stop.kind === "gym" && stop.city.id === item.id && stop.done);
            return (
              <div
                key={item.id}
                title={earned ? `${item.element} badge. ${item.leader} is beaten.` : `${item.element} badge. ${item.leader} is still standing.`}
                className={`shrink-0 border-4 px-2 py-1 text-xs font-bold ${earned ? "border-black bg-white" : "border-[#c8b56a] bg-[#efe6c0] text-black/40"}`}
              >
                {item.element}{earned ? " · got" : ""}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl">
            {scene === "home"
              ? "Home"
              : scene === "center" && city
                ? `${city.city} Center`
                : scene === "route" && city?.id === "stones"
                  ? "The trail"
                  : scene === "route" && city?.id === "oncology"
                    ? "Peninsula"
                    : scene === "route" && city?.id === "urogyn"
                      ? "The Span"
                      : city
                        ? `${city.city} · ${city.element}`
                        : "Championship"}
          </h2>
          {scene === "home" ? <p className="text-xs">Your house is on the left. Professor Moka is in the lab. The south road is the trail to Quarry End.</p> : null}
          {scene === "route" && city?.id === "stones" ? <p className="text-xs">South sign goes home. North sign goes to Quarry End. Neither needs a badge.</p> : null}
          {scene === "route" && city?.id === "oncology" ? <p className="text-xs">South sign goes back. The north sign needs the gym badge before the next town.</p> : null}
          {scene === "route" && city?.id === "urogyn" ? <p className="text-xs">South sign goes back. The north sign needs the gym badge before the next town.</p> : null}
          {scene === "route" && city && city.id !== "stones" && city.id !== "oncology" && city.id !== "urogyn" ? <p className="text-xs">South sign goes back. The north sign needs the gym badge before the next town.</p> : null}
          {scene === "town" && city?.id === "urogyn" ? <p className="text-xs">West dock goes back. East dock needs the badge before the next town.</p> : null}
          {scene === "town" && city?.id === "stones" ? <p className="text-xs">South road is the trail home. The east road needs the rock badge before Onco Harbor.</p> : null}
          {scene === "town" && city?.id === "oncology" ? <p className="text-xs">Bottom-left goes back to Quarry End. The far sign needs the badge before the next town.</p> : null}
          {city && scene === "town" && city.id !== "urogyn" && city.id !== "stones" && city.id !== "oncology" ? (
            <p className="text-xs">Bottom-left goes back. The east road needs the gym badge before the next town.</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          {city && scene === "town" && !battle ? (
            <button type="button" onClick={() => setTrialOpen(true)} className="min-h-11 border-4 border-black bg-white px-3 text-sm font-bold">Trial</button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("callroom-quest-scene", "home");
              localStorage.removeItem("callroom-quest-city");
              posRef.current = { x: 10, y: 13, scene: "home", cityId: "home" };
              setHold(null);
              setScene("home");
              setLine("Home. The south road is the trail. Quarry End is at the far end.");
            }}
            className="min-h-11 border-4 border-black bg-white px-3 text-sm font-bold"
          >
            Home
          </button>
          <button type="button" onClick={() => setSheet((open) => (open ? null : "party"))} className="min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">
            Start
          </button>
          <button
            type="button"
            onClick={() => setTune(setTownMusic(!musicOn(), "canyon"))}
            className="min-h-11 border-4 border-black bg-white px-3 text-sm font-bold"
          >
            {tune || musicOn() ? "Music on" : "Music"}
          </button>
          <div className="flex gap-0.5">
            <button type="button" aria-label="Left" onPointerDown={() => keysRef.current.add("arrowleft")} onPointerUp={() => keysRef.current.delete("arrowleft")} onPointerLeave={() => keysRef.current.delete("arrowleft")} className="min-h-11 min-w-11 border-4 border-black bg-white text-sm font-bold">←</button>
            <button type="button" aria-label="Up" onPointerDown={() => keysRef.current.add("arrowup")} onPointerUp={() => keysRef.current.delete("arrowup")} onPointerLeave={() => keysRef.current.delete("arrowup")} className="min-h-11 min-w-11 border-4 border-black bg-white text-sm font-bold">↑</button>
            <button type="button" aria-label="Down" onPointerDown={() => keysRef.current.add("arrowdown")} onPointerUp={() => keysRef.current.delete("arrowdown")} onPointerLeave={() => keysRef.current.delete("arrowdown")} className="min-h-11 min-w-11 border-4 border-black bg-white text-sm font-bold">↓</button>
            <button type="button" aria-label="Right" onPointerDown={() => keysRef.current.add("arrowright")} onPointerUp={() => keysRef.current.delete("arrowright")} onPointerLeave={() => keysRef.current.delete("arrowright")} className="min-h-11 min-w-11 border-4 border-black bg-white text-sm font-bold">→</button>
          </div>
        </div>
        </div>
      </div>
      {battle ? (
        <div>
        <div className="relative bg-[#7ec8e3] px-3 pt-3 pb-2 text-black">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[#5eae45]" />
          <div className="absolute inset-x-0 bottom-0 h-8 bg-[#498a36]" />
          <div className="relative grid grid-cols-[1fr_8rem] items-end gap-2">
            <div className="mb-10 border-4 border-black bg-[#f8f8d8] p-2">
              <p className="text-xs font-bold uppercase">{battle.foeName} · {battle.foeType}</p>
              <div className="mt-1 h-3 border-2 border-black bg-white">
                <div className="h-full bg-[#3a7a28]" style={{ width: `${Math.max(0, (battle.foeHp / battle.foeMax) * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs">HP {Math.max(0, battle.foeHp)}/{battle.foeMax} · {battle.foeMove ?? "Bash"} hits for {battle.foePower ?? 4}</p>
            </div>
            <div className="flex flex-col items-center">
              {battle.foeSpecies ? (
                <img src={monSrc(battle.foeSpecies, battle.foeStage ?? 0)} alt="" className="h-28 w-auto bg-transparent object-contain" />
              ) : (
                <PixelActor kind={battle.foeKind} className="h-28" />
              )}
              <div className="h-3 w-16 rounded-[100%] bg-[#2f6a32]" />
            </div>
          </div>
          <div className="relative mt-1 grid grid-cols-[8rem_1fr] items-end gap-2">
            <div className="flex flex-col items-center">
              {lead ? <img src={creatureSrc(lead)} alt="" className="h-16 w-auto bg-transparent object-contain" /> : null}
              <PixelActor kind="player" className="h-24" />
              <div className="h-3 w-16 rounded-[100%] bg-[#2f6a32]" />
            </div>
            <div className="border-4 border-black bg-[#f8f8d8] p-2">
              <p className="text-xs font-bold uppercase">{lead ? `${nameOf(lead)} · Lv ${levelOf(lead.exp)}` : "You"}</p>
              <div className="mt-1 h-3 border-2 border-black bg-white">
                <div className="h-full bg-[#3a7a28]" style={{ width: `${Math.max(0, (battle.you / battle.youMax) * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs">HP {Math.max(0, battle.you)}/{battle.youMax} · Atk {lead ? strike(lead, bag ?? loadBag()) : 0}</p>
              {lead ? (
                <div className="mt-1 h-2 border-2 border-black bg-white">
                  <div className="h-full bg-[#3d6fd8]" style={{ width: `${Math.min(100, (expPace(lead.exp).into / expPace(lead.exp).need) * 100)}%` }} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
          <div className="mt-3 border-4 border-double border-black bg-[#f8f8d8] p-3">
            <p className="text-xs font-bold uppercase">{battle.title}</p>
            {(battle.menu === "ask" || battle.menu === "fight") && question ? <p className="mt-2 text-sm leading-relaxed">{question.stem.join(" ")}</p> : null}
            {question?.image && (battle.menu === "ask" || battle.menu === "fight" || battle.reveal) ? (
              <img src={question.image} alt="Arteries to the testis" className="mt-2 max-h-56 w-full bg-white object-contain" />
            ) : null}
            {!battle.menu && !battle.reveal && !battle.over ? <p className="mt-2 text-sm font-bold">Pick an attack for this question, or run.</p> : null}
            {battle.reveal ? <p className="mt-2 text-sm font-bold">{battle.reveal.correct ? "Hit." : "Miss."} {battle.reveal.note}</p> : null}
            {battle.reveal && question ? (
              <p className="mt-2 text-sm font-bold">Correct answer: {"ABCDE"[question.answer]}. {question.choices[question.answer]}</p>
            ) : null}
            {battle.reveal && question ? <p className="mt-1 max-h-24 overflow-auto text-xs leading-relaxed">{question.explanation}</p> : null}
            {battle.reveal && question?.topicId === "nlutd" ? <NlutdChart /> : null}
            {battle.reveal && question && isDsdText([question.stem.join(" "), question.explanation, question.objective, ...question.choices].join(" ")) ? <DsdFigure /> : null}
            {battle.reveal && question && isPopqText([question.stem.join(" "), question.explanation, question.objective, ...question.choices].join(" ")) ? <PopqFigure /> : null}
            {battle.reveal && question?.objective ? (
              <p className="mt-2 rounded border border-obj-line bg-obj px-3 py-2 text-sm">
                <span className="font-semibold">Teaching point. </span>
                {question.objective}
              </p>
            ) : null}
            {battle.over ? <p className="mt-2 text-sm font-bold">{battle.over} {battle.right}/{battle.ids.length}.</p> : null}
            {!battle.reveal && !battle.fainted && !battle.over && !battle.menu ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setBattle({ ...battle, menu: "fight" })} className="min-h-14 border-4 border-black bg-white text-sm font-bold">Fight</button>
                <button type="button" onClick={run} className="min-h-14 border-4 border-black bg-white text-sm font-bold">Run</button>
              </div>
            ) : null}
            {!battle.reveal && !battle.fainted && battle.menu === "fight" && lead ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {knownMoves(lead).map((move) => (
                  <button
                    key={move.id}
                    type="button"
                    disabled={move.pp <= 0}
                    onClick={() => setBattle({ ...battle, committed: false, menu: "ask", moveId: move.id })}
                    className="min-h-14 border-4 border-black bg-white px-2 text-left text-sm font-bold disabled:opacity-40"
                  >
                    {move.def.name}
                    <span className="block text-[11px] font-normal">{move.def.kind} · power {move.def.power} · PP {move.pp}/{move.def.pp}</span>
                  </button>
                ))}
                <button type="button" onClick={() => setBattle({ ...battle, menu: null })} className="min-h-14 border-4 border-black bg-black text-sm font-bold text-[#fff4a8]">Back</button>
              </div>
            ) : null}
            {!battle.reveal && !battle.fainted && question && battle.menu === "ask" ? (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-xs font-bold">{battle.moveId ? moveDef(battle.moveId)?.name : "Fight"}</p>
                {question.choices.map((choice, index) => (
                  <button key={choice} type="button" onClick={() => grade(index)} className="min-h-11 border-4 border-black bg-white px-3 text-left text-sm font-bold">
                    {"ABCDE"[index]}. {choice}
                  </button>
                ))}
              </div>
            ) : null}
            {!battle.reveal && !battle.fainted && battle.menu === "party" ? (
              <div className="mt-3 flex flex-col gap-2">
                {bag?.party.map((creature, index) => (
                  <button
                    key={creature.id}
                    type="button"
                    disabled={creature.hp <= 0}
                    onClick={() => {
                      if (index > 0) makeLead(index);
                      const swapped = loadBag();
                      const out = swapped.party[0];
                      setBag(swapped);
                      if (out) setBattle({ ...battle, menu: null, you: out.hp, youMax: maxHp(out, swapped) });
                    }}
                    className="min-h-11 border-4 border-black bg-white px-3 text-left text-sm font-bold disabled:opacity-40"
                  >
                    {index === 0 ? "Out · " : "Switch · "}{nameOf(creature)} Lv {levelOf(creature.exp)} · HP {creature.hp}/{maxHp(creature, bag)}
                  </button>
                ))}
                <button type="button" onClick={() => setBattle({ ...battle, menu: null })} className="min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">Back</button>
              </div>
            ) : null}
            {battle.menu === "item" ? (
              <div className="mt-3 flex flex-col gap-2">
                <button type="button" onClick={() => healLead("potion")} className="min-h-11 border-4 border-black bg-white px-3 text-left text-sm font-bold">Potion ×{bag?.potions ?? 0} · heals 12</button>
                <button type="button" onClick={() => healLead("super")} className="min-h-11 border-4 border-black bg-white px-3 text-left text-sm font-bold">Super Potion ×{bag?.supers ?? 0} · full heal</button>
                <button type="button" onClick={() => wakeLead("revive")} className="min-h-11 border-4 border-black bg-white px-3 text-left text-sm font-bold">Revive ×{bag?.revives ?? 0} · half, if fainted</button>
                <button type="button" onClick={() => wakeLead("max")} className="min-h-11 border-4 border-black bg-white px-3 text-left text-sm font-bold">Max Revive ×{bag?.maxRevives ?? 0} · full, if fainted</button>
                <button type="button" onClick={() => arm("guard")} className="min-h-11 border-4 border-black bg-white px-3 text-left text-sm font-bold">Guard ×{bag?.guards ?? 0}{battle.guard ? " · up" : ""}</button>
                <button type="button" onClick={() => arm("xattack")} className="min-h-11 border-4 border-black bg-white px-3 text-left text-sm font-bold">X Attack ×{bag?.xAttacks ?? 0}{battle.boost ? " · up" : ""}</button>
                {(["ball", "great", "ultra", "master"] as const).map((ball) => (
                  <button key={ball} type="button" onClick={() => throwBall(ball)} className="min-h-11 border-4 border-black bg-white px-3 text-left text-sm font-bold">
                    {ball === "ball" ? "Ball" : ball === "great" ? "Great Ball" : ball === "ultra" ? "Ultra Ball" : "Master Ball"} ×{bag?.balls[ball] ?? 0}
                  </button>
                ))}
                <button type="button" onClick={() => setBattle({ ...battle, menu: null })} className="min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">Back</button>
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {battle.reveal && !battle.fainted ? (
                <button type="button" onClick={advance} className="min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">
                  {battle.over ? "Back" : "Next"}
                </button>
              ) : null}
              {battle.fainted && !battle.over ? (
                <button type="button" onClick={giveUp} className="min-h-11 border-4 border-black bg-white px-3 text-sm font-bold">Black out</button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <canvas ref={canvasRef} className="block w-full" />
      )}
      {!battle ? (
        <div className="border-t-4 border-black bg-[#fff4a8] p-3 text-black">
          <p className="text-sm font-bold">{line}</p>
          {notice ? <p className="mt-1 text-sm">{notice}</p> : null}
          <p className="mt-1 text-xs">West door is the shop. The door with the red cross is the Center. It heals everyone, free. {bag?.repelLeft ? `Repel ${bag.repelLeft}. ` : ""}{badges}/{cities.length} badges.{champion ? " Champion." : ""}</p>
          <p className="mt-2 text-xs font-bold">Out follows you and fights. Tap Switch to change who is out. One Rare Candy is shared. You have {bag?.candies ?? 0}.</p>
          {bag ? (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {bag.party.map((creature, index) => (
                <div key={creature.id} className={`min-w-28 border-4 bg-[#f8f8d8] p-1 ${index === 0 ? "border-black" : "border-[#c8b56a]"}`}>
                  <img src={creatureSrc(creature)} alt="" className="mx-auto h-14 w-14 rounded-full object-cover" />
                  <p className="truncate text-[11px] font-bold">{nameOf(creature)} Lv {levelOf(creature.exp)}</p>
                  <p className="text-[11px]">HP {creature.hp}/{maxHp(creature, bag)}</p>
                  <button type="button" onClick={() => { makeLead(index); setBag(loadBag()); }} className="mt-1 min-h-11 w-full border-4 border-black bg-white text-[11px] font-bold">
                    {index === 0 ? "Out" : "Switch"}
                  </button>
                  <button
                    type="button"
                    disabled={bag.candies <= 0}
                    onClick={() => { setNotice(useHeld("candy", index, false)); setBag(loadBag()); }}
                    className="mt-1 min-h-11 w-full border-4 border-black bg-[#fff4a8] text-[11px] font-bold disabled:opacity-40"
                  >
                    Candy
                  </button>
                </div>
              ))}
              {bag.box.map((creature, index) => (
                <div key={creature.id} className="min-w-28 border-4 border-[#c8b56a] bg-white p-1">
                  <img src={creatureSrc(creature)} alt="" className="mx-auto h-14 w-14 rounded-full object-cover" />
                  <p className="truncate text-[11px] font-bold">{nameOf(creature)} Lv {levelOf(creature.exp)}</p>
                  <p className="text-[11px]">HP {creature.hp}/{maxHp(creature, bag)}</p>
                  <button type="button" onClick={() => { swapBox(index); setBag(loadBag()); }} className="mt-1 min-h-11 w-full border-4 border-black bg-white text-[11px] font-bold">
                    Send out
                  </button>
                  <button
                    type="button"
                    disabled={bag.candies <= 0}
                    onClick={() => { setNotice(useHeld("candy", index, true)); setBag(loadBag()); }}
                    className="mt-1 min-h-11 w-full border-4 border-black bg-[#fff4a8] text-[11px] font-bold disabled:opacity-40"
                  >
                    Candy
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {bag && lead && (lead.hp < maxHp(lead, bag) || bag.repels > 0) ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {lead.hp < maxHp(lead, bag) ? <button type="button" onClick={() => healLead("potion")} className="min-h-11 border-4 border-black bg-white px-2 text-xs font-bold">Potion ×{bag.potions}</button> : null}
              {lead.hp < maxHp(lead, bag) ? <button type="button" onClick={() => healLead("super")} className="min-h-11 border-4 border-black bg-white px-2 text-xs font-bold">Super ×{bag.supers}</button> : null}
              {bag.repels > 0 ? <button type="button" onClick={spray} className="min-h-11 border-4 border-black bg-white px-2 text-xs font-bold">Repel ×{bag.repels}</button> : null}
              {lead.hp <= 0 ? <button type="button" onClick={() => wakeLead("revive")} className="min-h-11 border-4 border-black bg-white px-2 text-xs font-bold">Revive ×{bag.revives}</button> : null}
              {lead.hp <= 0 ? <button type="button" onClick={() => wakeLead("max")} className="min-h-11 border-4 border-black bg-white px-2 text-xs font-bold">Max Revive ×{bag.maxRevives}</button> : null}
            </div>
          ) : null}
          <div className="mt-3 flex items-end gap-4">
            <div className="grid grid-cols-3 gap-1">
              <span />
              <Pad label="W" code="w" keysRef={keysRef} />
              <span />
              <Pad label="A" code="a" keysRef={keysRef} />
              <button type="button" onClick={() => { interactRef.current = true; }} className="min-h-11 border-4 border-black bg-black text-sm font-bold text-[#fff4a8]">
                Talk
              </button>
              <Pad label="D" code="d" keysRef={keysRef} />
              <span />
              <Pad label="S" code="s" keysRef={keysRef} />
              <span />
            </div>
          </div>
        </div>
      ) : null}
      {gift && GYM_GIFT[gift] ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
          <div className="w-full max-w-lg border-4 border-black bg-[#f8f8d8] p-3 text-black">
            <p className="font-serif text-xl">The badge comes with a choice.</p>
            <p className="mt-1 text-sm">Pick one. It is strong, and this gym will not offer another.</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {GYM_GIFT[gift].map((pick) => (
                <button
                  key={pick.name}
                  type="button"
                  onClick={() => {
                    const note = claimGift(gift, pick, Math.max(0, cities.findIndex((item) => item.id === gift)));
                    setBag(loadBag());
                    setLine(note);
                    setGift(null);
                  }}
                  className="border-4 border-black bg-white p-2 text-left"
                >
                  <img src={monSrc(pick.species, pick.stage)} alt="" className="mx-auto h-20 w-20 object-contain" />
                  <p className="text-sm font-bold">{pick.name}</p>
                  <p className="text-xs">{speciesType[pick.species]} · {pick.move}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {shopOpen ? (
        <div className="absolute inset-x-0 top-16 z-20 max-h-[70vh] overflow-auto border-4 border-black bg-[#f8f8d8] p-3 text-black">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold tracking-wide uppercase">Town shop · Quest ${questCash()} · max HP {bag?.party[0] ? maxHp(bag.party[0], bag) : 0} · HP Up +{bag?.hpBonus ?? 0}</p>
            <button type="button" onClick={() => setShopOpen(false)} className="min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">Close</button>
          </div>
          <ul className="mt-2 flex flex-col gap-2">
            {shopItems.map((item) => {
              const stock = item.id === "master" ? masterStock(bag ?? loadBag(), badges) : null;
              return (
                <li key={item.id} className="flex items-center justify-between gap-2 border-4 border-black bg-white px-2 py-1">
                  <span className="text-sm"><span className="font-bold">{item.name}</span> ${item.price}. {item.note}{stock != null ? ` Stock ${stock}.` : ""}</span>
                  <button type="button" onClick={() => { setNotice(buyItem(item.id, badges)); setBag(loadBag()); }} className="min-h-11 shrink-0 border-4 border-black bg-[#fff4a8] px-2 text-sm font-bold">Buy</button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {bag && !bag.starter ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
          <div className="w-full max-w-lg border-4 border-black bg-[#f8f8d8] p-3 text-black">
            <div className="flex gap-3">
              <img src="/quest/leader.png" alt="" className="h-28 w-auto shrink-0 object-contain" />
              <p className="text-sm font-bold leading-relaxed">
                {offer
                  ? `${lines[offer].names[0]}? It evolves at 6, again at 14, then into ${lines[offer].names[3]} at 28. That last form is the big one. Take it?`
                  : "You're just starting out. I'm Professor Moka. These four will not show up in the grass. Each one becomes something big at level 28. Pick the one that travels with you."}
              </p>
            </div>
            {offer ? (
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => { setBag(pickStarter(offer)); setOffer(null); }} className="min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">I'll take {lines[offer].names[0]}</button>
                <button type="button" onClick={() => setOffer(null)} className="min-h-11 border-4 border-black bg-white px-3 text-sm font-bold">Let me look again</button>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter.id}
                    type="button"
                    onClick={() => setOffer(starter.id)}
                    className="border-4 border-black bg-white p-2 text-left"
                  >
                    <span className="flex items-end justify-center gap-1">
                      <img src={monSrc(starter.id, 0)} alt="" className="h-16 w-16 object-contain" />
                      <img src={monSrc(starter.id, 3)} alt="" className="h-20 w-20 object-contain" />
                    </span>
                    <p className="text-sm font-bold">{lines[starter.id].names[0]} · {starter.type}</p>
                    <p className="text-xs">{starter.line}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
      {trialOpen && city ? <TownTrial city={city} onClose={() => setTrialOpen(false)} /> : null}
      {play ? (
        <TrailPlay
          kind={play}
          onClose={(won) => {
            if (won) {
              const key = play === "glow" ? "callroom-trail-glow" : "callroom-trail-tide";
              if (!localStorage.getItem(key)) {
                const next = loadBag();
                if (play === "glow") {
                  next.potions += 1;
                  next.balls.ball += 1;
                } else next.repels += 1;
                saveBag(next);
                localStorage.setItem(key, "1");
                setBag(loadBag());
                setLine(play === "glow" ? "The wood leaves a Potion and a Ball." : "The channel leaves a Repel.");
              } else setLine(play === "glow" ? "The lanterns are already quiet." : "The tide has nothing left to give.");
            }
            setPlay(null);
          }}
        />
      ) : null}
      {nurse ? (
        <div className="absolute inset-x-0 top-16 z-20 border-4 border-black bg-[#f8f8d8] p-3 text-black">
          <div className="flex gap-3">
            <img src={nurse === "joy-2" ? "/quest/joy-a.png" : "/quest/joy-b.png"} alt="" className="h-28 w-auto object-contain" />
            <div>
              <p className="text-sm font-bold">{nurseLine(nurse)}</p>
              <p className="mt-1 text-xs">HP and every move's PP come back. The first visit each day also comes with a gift.</p>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setLine(nurseVisit(nurse));
                setBag(loadBag());
                setNurse(null);
              }}
              className="min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]"
            >
              Stay a minute
            </button>
            <button type="button" onClick={() => setNurse(null)} className="min-h-11 border-4 border-black bg-white px-3 text-sm font-bold">Not now</button>
          </div>
        </div>
      ) : null}
      {sheet ? (
        <FieldSheet
          sheet={sheet}
          bag={bag}
          onSheet={setSheet}
          onBadges={() => {
            setSheet(null);
            setCaseOpen(true);
          }}
          onChange={() => setBag(loadBag())}
          onNote={setNotice}
        />
      ) : null}
      {caseOpen && bag ? (
        <div className="border-t-4 border-black bg-[#f8f8d8] p-3 text-black">
          <p className="text-xs font-bold tracking-wide uppercase">Badge case</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {cities.map((item) => {
              const earned = stops.some((stop) => stop.kind === "gym" && stop.city.id === item.id && stop.done);
              return <Badge key={item.id} element={item.element} earned={earned} />;
            })}
          </div>
          {bag.box.length ? (
            <div className="mt-3">
              <p className="text-xs font-bold uppercase">Box</p>
              <div className="mt-1 flex flex-col gap-1">
                {bag.box.map((creature, index) => (
                  <button key={creature.id} type="button" onClick={() => { swapBox(index); setBag(loadBag()); }} className="min-h-11 border-4 border-black bg-white px-2 text-left text-sm font-bold">
                    {nameOf(creature)} Lv {levelOf(creature.exp)} · swap with lead
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FieldSheet({
  sheet,
  bag,
  onSheet,
  onBadges,
  onChange,
  onNote,
}: {
  sheet: "party" | "dex";
  bag: QuestBag | null;
  onSheet: (sheet: "party" | "dex" | null) => void;
  onBadges: () => void;
  onChange: () => void;
  onNote: (note: string) => void;
}) {
  const field = loadField();
  return (
    <div className="border-t-4 border-black bg-[#f8f8d8] p-3 text-black">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onSheet("party")} className={`min-h-11 border-4 border-black px-3 text-sm font-bold ${sheet === "party" ? "bg-black text-[#fff4a8]" : "bg-white"}`}>Party</button>
        <button type="button" onClick={() => onSheet("dex")} className={`min-h-11 border-4 border-black px-3 text-sm font-bold ${sheet === "dex" ? "bg-black text-[#fff4a8]" : "bg-white"}`}>Dex</button>
        <button type="button" onClick={onBadges} className="min-h-11 border-4 border-black bg-white px-3 text-sm font-bold">Badges</button>
        <button type="button" onClick={() => onSheet(null)} className="min-h-11 border-4 border-black bg-white px-3 text-sm font-bold">Close</button>
      </div>
      {sheet === "party" && bag ? (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs font-bold">Rare Candy left: {bag.candies}. One stack for everyone. Using it spends one.</p>
          {[...bag.party, ...bag.box].map((creature, index) => (
            <div key={creature.id} className="border-4 border-black bg-white p-2">
              <p className="text-sm font-bold">{index < bag.party.length ? `${index + 1}. ` : "Box · "}{nameOf(creature)} · Lv {levelOf(creature.exp)} · HP {creature.hp}/{maxHp(creature, bag)}</p>
              <p className="text-xs">{formNote(creature)} Mood: {joyWord(joyOf(creature))}.</p>
              <p className="text-xs">{knownMoves(creature).map((move) => `${move.def.name} ${move.pp}/${move.def.pp}`).join(" · ")}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {bag.candies > 0 ? (
                  <button type="button" onClick={() => { onNote(useHeld("candy", index < bag.party.length ? index : index - bag.party.length, index >= bag.party.length)); onChange(); }} className="min-h-11 border-4 border-black bg-[#fff4a8] px-2 text-xs font-bold">
                    Use candy
                  </button>
                ) : null}
                {bag.potions > 0 ? (
                  <button type="button" onClick={() => { onNote(useHeld("potion", index < bag.party.length ? index : index - bag.party.length, index >= bag.party.length)); onChange(); }} className="min-h-11 border-4 border-black bg-white px-2 text-xs font-bold">
                    Potion ×{bag.potions}
                  </button>
                ) : null}
                {bag.supers > 0 ? (
                  <button type="button" onClick={() => { onNote(useHeld("super", index < bag.party.length ? index : index - bag.party.length, index >= bag.party.length)); onChange(); }} className="min-h-11 border-4 border-black bg-white px-2 text-xs font-bold">
                    Super ×{bag.supers}
                  </button>
                ) : null}
                {creature.hp <= 0 && bag.revives > 0 ? (
                  <button type="button" onClick={() => { onNote(useHeld("revive", index < bag.party.length ? index : index - bag.party.length, index >= bag.party.length)); onChange(); }} className="min-h-11 border-4 border-black bg-white px-2 text-xs font-bold">
                    Revive ×{bag.revives}
                  </button>
                ) : null}
              </div>
              {creature.pending && moveDef(creature.pending) ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  <p className="w-full text-xs font-bold">Forget a move to learn {moveDef(creature.pending)?.name}.</p>
                  {knownMoves(creature).map((move, slot) => (
                    <button key={move.id} type="button" onClick={() => { onNote(forgetForPending(creature.id, slot)); onChange(); }} className="min-h-11 border-4 border-black bg-[#fff4a8] px-2 text-xs font-bold">
                      Forget {move.def.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {sheet === "dex" ? (
        <div className="mt-3 grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="max-h-[28rem] overflow-auto border-4 border-black bg-white">
            {DEX.map((creature) => {
              const owned = field.caught.includes(creature.number);
              const next = creature.into ? DEX[creature.into - 1] : undefined;
              return (
                <div key={creature.number} className={`flex items-center gap-2 border-b border-black/10 px-2 py-1 ${creature.stage > 0 ? "pl-6" : ""}`}>
                  <span className="w-8 font-mono text-[10px]">#{String(creature.number).padStart(3, "0")}</span>
                  {owned ? <img src={portraitFor(creature.number, field.rare.includes(creature.number))} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-black/10" />}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{creature.name}</p>
                    <p className="truncate text-[10px]">{next ? `Next #${String(next.number).padStart(3, "0")} ${next.name}` : "Final form"}{owned ? " · Caught" : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {bag ? (
            <div className="border-4 border-black bg-white p-2">
              <p className="text-sm font-bold">With you {bag.party.length}/6</p>
              <p className="text-[10px]">The first one walks and fights.</p>
              {bag.party.map((creature, index) => (
                <div key={creature.id} className="mt-2 flex flex-wrap items-center gap-1">
                  <img src={creatureSrc(creature)} alt="" className="h-8 w-8 object-contain" />
                  <p className="min-w-0 flex-1 truncate text-xs font-bold">{index === 0 ? "Walking · " : ""}{nameOf(creature)}</p>
                  {index > 0 ? <button type="button" onClick={() => { onNote(walkWith(creature.id)); onChange(); }} className="min-h-11 border-4 border-black bg-white px-2 text-[10px] font-bold">Walk</button> : null}
                  <button type="button" onClick={() => { onNote(benchCreature(creature.id)); onChange(); }} className="min-h-11 border-4 border-black bg-white px-2 text-[10px] font-bold">Bench</button>
                </div>
              ))}
              <p className="mt-3 text-sm font-bold">Caught</p>
              {bag.box.map((creature) => (
                <div key={creature.id} className="mt-2 flex items-center gap-1">
                  <img src={creatureSrc(creature)} alt="" className="h-8 w-8 object-contain" />
                  <p className="min-w-0 flex-1 truncate text-xs">{nameOf(creature)}</p>
                  <button type="button" disabled={bag.party.length >= 6} onClick={() => { onNote(bringAlong(creature.id)); onChange(); }} className="min-h-11 border-4 border-black bg-[#fff4a8] px-2 text-[10px] font-bold disabled:opacity-40">Bring</button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Pad({ label, code, keysRef }: { label: string; code: string; keysRef: RefObject<Set<string>> }) {
  return (
    <button
      type="button"
      onPointerDown={(event) => {
        event.preventDefault();
        keysRef.current?.add(code);
      }}
      onPointerUp={() => keysRef.current?.delete(code)}
      onPointerLeave={() => keysRef.current?.delete(code)}
      className="min-h-11 min-w-11 border-4 border-black bg-white text-sm font-bold"
    >
      {label}
    </button>
  );
}
