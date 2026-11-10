import { useEffect, useRef, useState, type RefObject } from "react";
import { Badge } from "@/components/desk/badge";
import { addCard } from "@/lib/cards";
import { drawQuestionIds } from "@/lib/desk/adapt";
import { logActivity, logCorrect } from "@/lib/desk/activity";
import { getQuestion, loadCatalog } from "@/lib/desk/catalog";
import { loadBankProgress, saveBankProgress } from "@/lib/desk/original-bank";
import { useDesk } from "@/lib/desk/provider";
import { cities, isChampion, rivalBeaten, rivalTestName, type City, type Stop } from "@/lib/desk/route";
import { DEX, loadField, portraitFor } from "@/lib/desk/field-dex";
import { topics } from "@/lib/desk/topics";
import type { BlueprintId, TestBlock } from "@/lib/desk/types";
import { drawActor, drawCreature, drawGround, drawProp, PixelActor, TILE } from "@/components/desk/quest-art";
import { questCash } from "@/lib/desk/purse";
import {
  BAG_KEY,
  buyItem,
  catchChance,
  drink,
  foeHealth,
  grantExp,
  healAll,
  keepCatch,
  levelOf,
  lines,
  loadBag,
  enrollGuide,
  creatureSrc,
  expPace,
  forgetForPending,
  knownMoves,
  makeLead,
  moveDef,
  spendPp,
  masterStock,
  maxHp,
  monSrc,
  nameOf,
  payExp,
  revive,
  saveBag,
  shopItems,
  spendBattleItem,
  stageOf,
  strike,
  swapBox,
  takeBall,
  useHeld,
  useRepel,
  wildSpecies,
  type Ball,
  type QuestBag,
  type SpeciesId,
} from "@/lib/desk/quest-bag";

const COLS = 13;
const ROWS = 11;
const STEP = 0.16;
const RIVAL = "Reed Calder";

type Tile = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type Face = "up" | "down" | "left" | "right";
type Scene = "town" | "gym" | "route";

type Npc = {
  id: string;
  kind: "trainer" | "leader" | "rival";
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
  line: string;
  foe: string;
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
  foeSpecies?: SpeciesId;
  title: string;
  need: number;
  reveal: { correct: boolean; note: string } | null;
  over: string | null;
  fainted: boolean;
  menu: "item" | "fight" | "party" | "ask" | null;
  moveId?: string;
  guard: boolean;
  boost: boolean;
};


function blank(): Tile[][] {
  return Array.from({ length: ROWS }, () => Array<Tile>(COLS).fill(2));
}

function openGround(tiles: Tile[][]) {
  for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) tiles[y][x] = 0;
}

function topicIdsFor(blueprint: BlueprintId | "all") {
  if (blueprint === "all") return topics.map((topic) => topic.id);
  return topics.filter((topic) => topic.blueprintId === blueprint).map((topic) => topic.id);
}

function buildWorld(scene: Scene, city: City | null, stops: Stop[], tests: TestBlock[]): World {
  const tiles = blank();
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
      line: trainersBeaten ? `${city.subject}. ${city.gymCount} questions. Need 60%.` : "Beat the trainers in town first.",
      foe: "/field/towns/trainer.jpg?v=2",
    });
    return { tiles, npcs, start: { x: 6, y: 8 } };
  }

  if (scene === "route") {
    openGround(tiles);
    for (let y = 1; y <= 9; y++) tiles[y][6] = 1;
    tiles[1][6] = 5;
    const band = cities.findIndex((item) => item.id === city.id);
    if (band % 3 !== 2) {
      for (let y = 4; y <= 7; y++) {
        tiles[y][3] = 6;
        tiles[y][4] = 6;
      }
      tiles[3][4] = 2;
      tiles[8][3] = 2;
    } else {
      tiles[6][8] = 6;
      tiles[6][9] = 6;
      tiles[7][8] = 6;
      tiles[4][3] = 2;
      tiles[8][9] = 2;
    }
    if (band % 2 === 0) {
      tiles[3][8] = 6;
      tiles[4][8] = 6;
      tiles[4][9] = 6;
    } else {
      tiles[3][9] = 2;
      tiles[7][9] = 2;
      tiles[8][8] = 2;
    }
    return { tiles, npcs, start: { x: 6, y: 9 } };
  }

  openGround(tiles);
  for (let y = 1; y <= 9; y++) tiles[y][6] = 1;
  for (let x = 1; x <= 11; x++) {
    tiles[3][x] = 1;
    tiles[5][x] = 1;
    tiles[7][x] = 1;
  }
  tiles[1][5] = 8;
  tiles[1][6] = 4;
  tiles[1][7] = 8;
  tiles[4][1] = 8;
  tiles[4][2] = 8;
  tiles[4][3] = 7;
  tiles[4][9] = 9;
  tiles[4][10] = 8;
  tiles[8][2] = 8;
  tiles[8][3] = 8;
  tiles[2][9] = 8;
  tiles[2][10] = 8;
  tiles[8][9] = 8;
  tiles[8][10] = 8;
  tiles[2][4] = 2;
  tiles[6][9] = 2;
  const townIndex = cities.findIndex((item) => item.id === city.id);
  if (townIndex % 2 === 0) {
    tiles[9][8] = 3;
    tiles[9][9] = 3;
    tiles[8][8] = 3;
  }
  tiles[5][11] = rivalDone ? 5 : 8;

  const spots: { x: number; y: number; face: Face }[] = [
    { x: 2, y: 3, face: "right" },
    { x: 10, y: 3, face: "left" },
    { x: 2, y: 7, face: "right" },
    { x: 10, y: 7, face: "left" },
  ];
  city.trainers.forEach((trainer, index) => {
    const spot = spots[index];
    if (!spot) return;
    npcs.push({
      id: trainer.name,
      kind: "trainer",
      name: trainer.name,
      x: spot.x,
      y: spot.y,
      face: spot.face,
      sight: 2,
      done: trainerDone(trainer.name),
      ready: true,
      count: trainer.count,
      need: 0.6,
      adaptive: false,
      testName: `Route: ${trainer.name}`,
      blueprint: city.id,
      line: `${trainer.count} questions. Need 60%.`,
      foe: "/field/towns/trainer.jpg?v=2",
    });
  });
  if (!rivalDone) {
    npcs.push({
      id: `rival-${city.id}`,
      kind: "rival",
      name: RIVAL,
      x: 10,
      y: 5,
      face: "left",
      sight: 3,
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
  return { tiles, npcs, start: { x: 6, y: 9 } };
}

function canWalk(world: World, x: number, y: number) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
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
  const posRef = useRef({ x: 6, y: 9, scene: "town" as Scene, cityId: "stones" });
  const cityRef = useRef<City | null>(null);
  const apiRef = useRef({ talk: (_npc: Npc) => {}, wild: () => {}, enter: (_tile: Tile, _x: number, _y: number) => {} });
  const [scene, setScene] = useState<Scene>("town");
  const [hold, setHold] = useState<string | null>(null);
  const [line, setLine] = useState("Walk across a trainer's line. They will see you.");
  const [caseOpen, setCaseOpen] = useState(false);
  const [sheet, setSheet] = useState<"party" | "dex" | null>(null);
  const [nurse, setNurse] = useState(false);
  const [battle, setBattle] = useState<Battle | null>(null);
  const [notice, setNotice] = useState("");
  const [bag, setBag] = useState<QuestBag | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const bagRef = useRef<QuestBag | null>(null);
  const followRef = useRef<string | null>(null);
  const repelRef = useRef(0);
  bagRef.current = bag;
  followRef.current = bag?.party[0] ? creatureSrc(bag.party[0]) : null;

  useEffect(() => {
    const next = loadBag();
    if (!localStorage.getItem(BAG_KEY)) saveBag(next);
    setBag(enrollGuide());
    repelRef.current = loadBag().repelLeft;
  }, []);

  useEffect(() => {
    if (battle) sessionStorage.setItem("ise-battle", "1");
    else sessionStorage.removeItem("ise-battle");
    return () => sessionStorage.removeItem("ise-battle");
  }, [battle]);

  const frontier = cities.findIndex((city, index) => {
    const trainer = stops.find((stop) => stop.kind === "trainer" && stop.city.id === city.id);
    const open = index === 0 || Boolean(trainer?.open);
    return open && !rivalBeaten(desk.state.tests, city);
  });
  const city = hold ? (cities.find((item) => item.id === hold) ?? null) : frontier === -1 ? null : cities[frontier];
  cityRef.current = city;
  pausedRef.current = caseOpen || shopOpen || Boolean(battle) || Boolean(sheet) || nurse;

  const go = (next: Scene, x: number, y: number) => {
    posRef.current = { x, y, scene: next, cityId: city?.id ?? "league" };
    setScene(next);
    setLine(next === "route" ? "Grass shows up in patches. A correct answer weakens a wild one. Then throw a ball." : next === "gym" ? "The aisle is the leader's line of sight." : "The west door is the shop. Trainers watch the streets.");
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
    const ids = drawQuestionIds(desk.state, topicIdsFor(npc.blueprint), "unused", npc.count, npc.adaptive);
    if (!ids.length) {
      busyRef.current = false;
      setNotice("No unused questions left in that set. On Build, open Used and hit Recycle used.");
      return;
    }
    const testId = desk.createTest({
      name: npc.testName,
      mode: "tutor",
      adaptive: npc.adaptive,
      topicIds: topicIdsFor(npc.blueprint),
      pool: "unused",
      count: ids.length,
      questionIds: ids,
    });
    if (!testId) {
      busyRef.current = false;
      return;
    }
    const foeMax = foeHealth(npc.kind, ids.length, Math.max(0, cities.findIndex((item) => item.id === city?.id)));
    setLine(npc.line);
    setBattle({
      testId,
      ids,
      index: 0,
      you: ready.lead.hp,
      youMax: maxHp(ready.lead, ready.current),
      foeHp: foeMax,
      foeMax,
      right: 0,
      foeName: npc.name,
      foeKind: npc.kind,
      title: npc.testName,
      need: npc.need,
      reveal: null,
      over: null,
      fainted: false,
      menu: null,
      guard: false,
      boost: false,
    });
  };

  const startWild = async () => {
    if (!city || busyRef.current) return;
    const ready = readyLead();
    if (!ready) return;
    busyRef.current = true;
    await loadCatalog();
    const ids = drawQuestionIds(desk.state, topicIdsFor(city.id), "unused", 3, false);
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
      foeSpecies: species,
      title: "Tall grass",
      need: 1,
      reveal: null,
      over: null,
      fainted: false,
      menu: null,
      guard: false,
      boost: false,
    });
  };

  apiRef.current.talk = (npc) => void startBattle(npc);
  apiRef.current.wild = () => void startWild();
  apiRef.current.enter = (tile) => {
    if (tile === 9) {
      setNurse(true);
      setLine("Welcome to the Center.");
      return;
    }
    if (tile === 7 && scene === "town") {
      setShopOpen(true);
      setLine("Shop. Buying here spends Quest money only.");
      return;
    }
    if (tile === 4 && scene === "town") go("gym", 6, 8);
    else if (tile === 4 && scene === "gym") go("town", 6, 2);
    else if (tile === 5 && scene === "town") go("route", 6, 9);
    else if (tile === 5 && scene === "route") {
      setHold(null);
      posRef.current = { x: 6, y: 9, scene: "town", cityId: "next" };
      setScene("town");
      setLine("Next town.");
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
    if (id.startsWith("UQB-")) {
      const progress = loadBankProgress();
      progress.answers[id] = { choice: "ABCDEFGHIJ"[choice] ?? "A", correct };
      saveBankProgress(progress);
    }
    logActivity("questions");
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
    const spent = move ? spendPp(lead, move.id) : true;
    const dealtBase = correct && spent ? (strike(lead, current) + (move?.power ?? 0)) * (battle.boost ? 2 : 1) : 0;
    const foeHp = Math.max(0, battle.foeHp - dealtBase);
    let grew = "";
    let hp = battle.you;
    let youMax = battle.youMax;
    if (correct) {
      grew = grantExp(lead, 5);
      if (current.expShare) {
        for (const other of current.party.slice(1)) {
          const shared = grantExp(other, 2);
          if (shared.includes("evolved")) grew = [grew, shared].filter(Boolean).join(" ");
        }
      }
      youMax = maxHp(lead, current);
      hp = Math.min(youMax, hp + Math.max(0, youMax - battle.youMax));
    } else hp = Math.max(0, hp - (battle.guard ? 1 : 4));
    lead.hp = hp;
    let prize = "";
    const wonFight = hp > 0 && battle.foeKind !== "wild" && (foeHp <= 0 || (battle.index + 1 >= battle.ids.length && (battle.right + (correct ? 1 : 0)) / battle.ids.length >= battle.need));
    const wildDown = hp > 0 && battle.foeKind === "wild" && foeHp <= 0;
    if (wonFight || wildDown) {
      const amount = wonFight ? 16 + (battle.right + (correct ? 1 : 0)) * 2 : 10;
      prize = payExp(current, amount);
      youMax = maxHp(lead, current);
      hp = Math.min(youMax, lead.hp);
      lead.hp = hp;
    }
    if (hp <= 0) {
      const bench = current.party.slice(1).find((creature) => creature.hp > 0);
      if (bench) {
        current.party = [bench, ...current.party.filter((creature) => creature.id !== bench.id)];
        hp = bench.hp;
        youMax = maxHp(bench, current);
        grew = [grew, `${nameOf(lead)} fainted. ${nameOf(bench)} stepped in.`].filter(Boolean).join(" ");
      }
    }
    saveBag(current);
    setBag(loadBag());
    const right = battle.right + (correct ? 1 : 0);
    const last = battle.index + 1 >= battle.ids.length;
    const fainted = hp <= 0;
    const ko = foeHp <= 0;
    const accurate = right / battle.ids.length >= battle.need;
    let over: string | null = null;
    if (!fainted && battle.foeKind !== "wild" && (ko || (last && accurate))) {
      seal(true);
      over = prize ? `You won. ${prize}` : "You won.";
    } else if (!fainted && battle.foeKind === "wild" && ko) {
      seal(false);
      over = prize ? `It fainted. ${prize} Throw a ball while it still has HP.` : "It fainted. Throw a ball while it still has HP.";
    } else if (!fainted && last && battle.foeKind !== "wild") {
      seal(false);
      over = "Not enough. You can try again.";
    }
    const hit = !spent
      ? "No PP left."
      : correct
        ? move?.power === 0
          ? `${nameOf(lead)} used ${move.name}. Brace is up.`
          : `${nameOf(lead)} used ${move?.name ?? "Bash"}. Hit for ${dealtBase}.`
        : battle.guard
          ? "The Guard held."
          : "The other side hit you.";
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
      reveal: { correct, note: [hit, grew, prize].filter(Boolean).join(" ") },
      over,
    });
  };

  const advance = () => {
    if (!battle?.reveal) return;
    if (battle.fainted && !battle.over) return;
    if (battle.over) {
      const wonRival = battle.over.startsWith("You won") && battle.title.startsWith("Rival:");
      busyRef.current = false;
      setBattle(null);
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
    setBattle({ ...battle, index: battle.index + 1, reveal: null, menu: null });
  };

  const run = () => {
    if (!battle) return;
    if (battle.foeKind !== "wild") {
      setNotice("No. You can't run from a trainer.");
      setBattle({ ...battle, menu: null });
      return;
    }
    desk.patchTest(battle.testId, (current) => ({ ...current, status: "done", finishedAt: Date.now() }));
    busyRef.current = false;
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
      posRef.current = { x: 9, y: 5, scene: "town", cityId: city.id };
      setScene("town");
    } else {
      posRef.current = { x: 2, y: 7, scene: "town", cityId: "league" };
    }
    setLine("You woke up at the Center. Everyone is healed.");
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
    const id = here?.id ?? "league";
    if (posRef.current.cityId !== id || posRef.current.scene !== scene) {
      const start = scene === "gym" ? { x: 6, y: 8 } : scene === "route" ? { x: 6, y: 9 } : { x: 6, y: here ? 9 : 8 };
      posRef.current = { x: start.x, y: start.y, scene, cityId: id };
    }
    const map = buildWorld(scene, here, stopsRef.current, testsRef.current);
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

    const onKey = (event: KeyboardEvent) => {
      const move = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
      if (move.includes(event.key.toLowerCase())) event.preventDefault();
      if (event.type === "keydown") keysRef.current.add(event.key.toLowerCase());
      else keysRef.current.delete(event.key.toLowerCase());
      if (event.type === "keydown" && !event.repeat && (event.key === "Enter" || event.key === " ")) interactRef.current = true;
      if (event.type === "keydown" && event.key.toLowerCase() === "m") setCaseOpen((open) => !open);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    canvas.width = COLS * TILE;
    canvas.height = ROWS * TILE;
    ctx.imageSmoothingEnabled = false;

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
          else setCaseOpen((open) => !open);
        } else {
          const step = dir();
          if (step && canWalk(map, player.x + step[0], player.y + step[1])) {
            player.fromX = player.x;
            player.fromY = player.y;
            player.face = step[1] < 0 ? "up" : step[1] > 0 ? "down" : step[0] < 0 ? "left" : "right";
            player.x += step[0];
            player.y += step[1];
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
            if (tile === 4 || tile === 5 || tile === 7 || tile === 9) apiRef.current.enter(tile, player.x, player.y);
            else {
              if (tile === 6 && repelRef.current <= 0) {
                grassSteps += 1;
                if (grassSteps >= 4 && Math.random() < 0.22) {
                  grassSteps = 0;
                  apiRef.current.wild();
                }
              }
              const npc = seenBy(map, player.x, player.y);
              if (npc) spot(npc);
            }
          }
        }
      }
      const t = moving === 0 ? 1 : 1 - moving / STEP;
      const drawX = player.fromX + (player.x - player.fromX) * t;
      const drawY = player.fromY + (player.y - player.fromY) * t;
      const frame = Math.floor(now / 280);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, COLS * TILE, ROWS * TILE);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const tile = map.tiles[y][x];
          const building = scene === "gym" || (scene === "town" && y === 1 && tile === 2);
          drawGround(ctx, tile, x, y, building, frame);
        }
      }
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const tile = map.tiles[y][x];
          const building = scene === "gym" || (scene === "town" && y === 1 && tile === 2);
          drawProp(ctx, tile, x, y, building);
        }
      }
      const stepPhase = moving > 0 ? walked + t : 0;
      const follow = followRef.current;
      if (follow) {
        const behindX = player.face === "left" ? 0.8 : player.face === "right" ? -0.8 : 0;
        const behindY = player.face === "up" ? 0.85 : player.face === "down" ? -0.85 : 0;
        drawCreature(ctx, drawX + behindX, drawY + behindY, follow, player.face, stepPhase);
      }
      for (const npc of map.npcs) {
        drawActor(ctx, npc.x, npc.y, npc.kind === "leader" ? "leader" : npc.kind === "rival" ? "rival" : "trainer", 0, npc.face);
        if (bang && bang.id === npc.id && now < bangUntil) {
          ctx.fillStyle = "#fff8dc";
          ctx.fillRect(npc.x * TILE + 8, npc.y * TILE - 18, 16, 18);
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(npc.x * TILE + 14, npc.y * TILE - 14, 4, 8);
          ctx.fillRect(npc.x * TILE + 14, npc.y * TILE - 4, 4, 3);
        }
      }
      drawActor(ctx, drawX, drawY, "player", stepPhase, player.face);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
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
    <div ref={wrapRef} className="bg-[#1e3a24]">
      <div className="flex items-center justify-between gap-3 border-b-4 border-black bg-[#fff4a8] px-3 py-2 text-black">
        <h2 className="font-serif text-xl">{city ? `${city.city} · ${city.element}` : "Championship"}</h2>
        <button type="button" onClick={() => setSheet((open) => (open ? null : "party"))} className="min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">
          Start
        </button>
      </div>
      {battle ? (
        <div>
        <div className="relative bg-[#7ec8e3] px-3 pt-3 pb-2 text-black">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[#5eae45]" />
          <div className="absolute inset-x-0 bottom-0 h-8 bg-[#498a36]" />
          <div className="relative grid grid-cols-[1fr_8rem] items-end gap-2">
            <div className="mb-10 border-4 border-black bg-[#f8f8d8] p-2">
              <p className="text-xs font-bold uppercase">{battle.foeName}</p>
              <div className="mt-1 h-3 border-2 border-black bg-white">
                <div className="h-full bg-[#3a7a28]" style={{ width: `${Math.max(0, (battle.foeHp / battle.foeMax) * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs">HP {Math.max(0, battle.foeHp)}/{battle.foeMax}</p>
            </div>
            <div className="flex flex-col items-center">
              {battle.foeKind === "wild" && battle.foeSpecies ? (
                <img src={monSrc(battle.foeSpecies, stageOf(3 + Math.max(0, cities.findIndex((item) => item.id === city?.id))))} alt="" className="h-28 w-auto bg-transparent object-contain" />
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
              <p className="mt-1 text-xs">HP {Math.max(0, battle.you)}/{battle.youMax}</p>
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
            {battle.menu === "ask" && question ? <p className="mt-2 text-sm leading-relaxed">{question.stem.join(" ")}</p> : null}
            {!battle.menu && !battle.reveal ? <p className="mt-2 text-sm font-bold">What will {lead ? nameOf(lead) : "you"} do?</p> : null}
            {battle.reveal ? <p className="mt-2 text-sm font-bold">{battle.reveal.correct ? "Hit." : "Miss."} {battle.reveal.note}</p> : null}
            {battle.reveal && question ? <p className="mt-1 max-h-24 overflow-auto text-xs leading-relaxed">{question.explanation}</p> : null}
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
                    onClick={() => setBattle({ ...battle, menu: "ask", moveId: move.id })}
                    className="min-h-14 border-4 border-black bg-white px-2 text-left text-sm font-bold disabled:opacity-40"
                  >
                    {move.def.name}
                    <span className="block text-[11px] font-normal">{move.def.kind} · PP {move.pp}/{move.def.pp}</span>
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
        <canvas ref={canvasRef} className="block w-full [image-rendering:pixelated]" />
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
      {shopOpen ? (
        <div className="border-t-4 border-black bg-[#f8f8d8] p-3 text-black">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold tracking-wide uppercase">Town shop · Quest ${questCash()}</p>
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
      {nurse ? (
        <div className="border-t-4 border-black bg-[#f8f8d8] p-3 text-black">
          <p className="text-sm font-bold">We can heal your party. Shall we?</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const rested = loadBag();
                healAll(rested);
                saveBag(rested);
                setBag(loadBag());
                setNurse(false);
                setLine("Your party is fighting fit. We hope to see you again.");
              }}
              className="min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]"
            >
              Yes
            </button>
            <button type="button" onClick={() => setNurse(false)} className="min-h-11 border-4 border-black bg-white px-3 text-sm font-bold">Not now</button>
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
              <p className="text-xs">{levelOf(creature.exp) >= 16 ? "Final form." : levelOf(creature.exp) >= 8 ? "Evolves at level 16." : "Evolves at level 8."}</p>
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
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {DEX.map((creature) => {
            const owned = field.caught.includes(creature.number);
            return (
              <div key={creature.number} className={`border-4 p-1 text-center ${owned ? "border-black bg-white" : "border-[#c8b56a] bg-[#efe6c0]"}`}>
                <p className="text-[10px]">#{String(creature.number).padStart(3, "0")}</p>
                {owned ? <img src={portraitFor(creature.number, field.rare.includes(creature.number))} alt="" className="mx-auto h-12 w-12 rounded-full object-cover" /> : <div className="mx-auto h-12 w-12 rounded-full bg-black/10" />}
                <p className="truncate text-[11px] font-bold">{owned ? creature.name : "—"}</p>
              </div>
            );
          })}
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
