import { useEffect, useRef, useState, type RefObject } from "react";
import { Badge } from "@/components/desk/badge";
import { addCard } from "@/lib/cards";
import { drawQuestionIds } from "@/lib/desk/adapt";
import { logActivity, logCorrect } from "@/lib/desk/activity";
import { getQuestion, loadCatalog } from "@/lib/desk/catalog";
import { loadBankProgress, saveBankProgress } from "@/lib/desk/original-bank";
import { useDesk } from "@/lib/desk/provider";
import { cities, isChampion, rivalBeaten, rivalTestName, type City, type Stop } from "@/lib/desk/route";
import { topics } from "@/lib/desk/topics";
import type { BlueprintId, TestBlock } from "@/lib/desk/types";

const COLS = 13;
const ROWS = 11;
const PX = 16;
const STEP = 0.16;
const RIVAL = "Reed Calder";

type Tile = 0 | 1 | 2 | 3 | 4 | 5 | 6;
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
  foeHp: number;
  right: number;
  foeName: string;
  foeKind: "trainer" | "leader" | "rival" | "wild";
  title: string;
  need: number;
  reveal: { correct: boolean; note: string } | null;
  over: string | null;
};

type Theme = {
  grass: string;
  grass2: string;
  dirt: string;
  dirt2: string;
  leaf: string;
  leaf2: string;
  trunk: string;
  roof: string;
  wall: string;
  door: string;
  water: string;
  water2: string;
  flower: string;
  line: string;
};

function themeFor(element?: string): Theme {
  const base: Theme = {
    grass: "#5eae45",
    grass2: "#498a36",
    dirt: "#e6c98a",
    dirt2: "#c9a45e",
    leaf: "#2f7a34",
    leaf2: "#1d5424",
    trunk: "#6d4524",
    roof: "#9a3b32",
    wall: "#efe6d2",
    door: "#5a3418",
    water: "#3d92c8",
    water2: "#2b74a4",
    flower: "#f4e27a",
    line: "#a78445",
  };
  if (element === "Rock") return { ...base, grass: "#8b9860", grass2: "#6f7c49", roof: "#6d6458", leaf: "#5c6848", dirt: "#d9c7a2" };
  if (element === "Water") return { ...base, grass: "#5ea58a", grass2: "#3e8670", roof: "#2f6f92", water: "#3aa0d0", flower: "#d7f4ff" };
  if (element === "Electric") return { ...base, roof: "#e2c03a", flower: "#fff1a8", dirt: "#efe0a4" };
  if (element === "Grass") return { ...base, grass: "#46a03a", grass2: "#2f7d28", leaf: "#1f6a22", roof: "#3d8a32" };
  if (element === "Poison") return { ...base, roof: "#6d3d86", flower: "#d7a6e8", leaf: "#3d6a48" };
  if (element === "Psychic") return { ...base, roof: "#6a5ac4", flower: "#d9d2ff", grass: "#6aa888" };
  if (element === "Fire") return { ...base, roof: "#b8432c", dirt: "#e7b07a", flower: "#ffd0a8", grass: "#c4a15a", grass2: "#a48442" };
  if (element === "Ground") return { ...base, grass: "#b39a5c", grass2: "#8f7740", dirt: "#d8b078", roof: "#7a5430", leaf: "#6d6840" };
  return base;
}

function fill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, theme: Theme, frame: number, building: boolean) {
  const px = x * PX;
  const py = y * PX;
  if (tile === 1 || tile === 5) {
    fill(ctx, px, py, PX, PX, theme.dirt);
    fill(ctx, px, py, PX, 1, theme.line);
    fill(ctx, px, py + 15, PX, 1, theme.line);
    fill(ctx, px + 2, py + 3, 5, 3, theme.dirt2);
    fill(ctx, px + 9, py + 8, 5, 3, theme.dirt2);
    if (tile === 5) {
      fill(ctx, px + 7, py + 3, 2, 10, theme.trunk);
      fill(ctx, px + 3, py + 1, 10, 5, theme.flower);
      fill(ctx, px + 4, py + 2, 8, 3, "#fff8dc");
    }
    return;
  }
  if (tile === 3) {
    fill(ctx, px, py, PX, PX, theme.water);
    const shift = (frame % 4) * 2;
    fill(ctx, px + ((1 + shift) % 12), py + 4, 6, 2, theme.water2);
    fill(ctx, px + ((6 + shift) % 10), py + 10, 6, 2, "#d9f4ff");
    return;
  }
  if (tile === 6) {
    fill(ctx, px, py, PX, PX, theme.grass2);
    const sway = frame % 2;
    for (let blade = 0; blade < 4; blade++) {
      const bx = px + 1 + blade * 4 + (sway && blade % 2 ? 1 : 0);
      fill(ctx, bx, py + 4, 2, 9, theme.leaf);
      fill(ctx, bx, py + 2, 2, 3, theme.leaf2);
    }
    return;
  }
  if (tile === 2 && building) {
    fill(ctx, px, py, PX, PX, theme.wall);
    fill(ctx, px, py, PX, 4, theme.roof);
    fill(ctx, px + 2, py + 7, 4, 4, "#9ec0d4");
    fill(ctx, px + 10, py + 7, 4, 4, "#9ec0d4");
    fill(ctx, px, py + 15, PX, 1, "#c8bba6");
    return;
  }
  if (tile === 4) {
    fill(ctx, px, py, PX, PX, theme.wall);
    fill(ctx, px, py, PX, 4, theme.roof);
    fill(ctx, px + 4, py + 5, 8, 11, theme.door);
    fill(ctx, px + 10, py + 10, 1, 2, theme.flower);
    return;
  }
  fill(ctx, px, py, PX, PX, theme.grass);
  fill(ctx, px + 2, py + 4, 2, 2, theme.grass2);
  fill(ctx, px + 9, py + 10, 2, 2, theme.grass2);
  fill(ctx, px + 12, py + 3, 2, 1, theme.grass2);
  if ((x + y) % 7 === 0) {
    fill(ctx, px + 6, py + 11, 2, 2, theme.flower);
    fill(ctx, px + 7, py + 10, 1, 1, "#fff");
  }
  if (tile === 2) {
    fill(ctx, px + 6, py + 9, 4, 7, theme.trunk);
    fill(ctx, px + 2, py + 4, 12, 7, theme.leaf);
    fill(ctx, px + 4, py + 1, 8, 5, theme.leaf);
    fill(ctx, px + 3, py + 5, 3, 2, theme.leaf2);
    fill(ctx, px + 9, py + 3, 3, 2, "#b6e07a");
  }
}

function drawActor(ctx: CanvasRenderingContext2D, tx: number, ty: number, kind: "player" | "trainer" | "leader" | "rival" | "wild", step: number, face: Face) {
  const baseX = Math.round(tx * PX);
  const baseY = Math.round(ty * PX);
  ctx.save();
  if (face === "left") {
    ctx.translate(baseX + PX, 0);
    ctx.scale(-1, 1);
    ctx.translate(-baseX, 0);
  }
  fill(ctx, baseX + 3, baseY + 13, 10, 2, "rgba(20,30,20,.35)");
  if (kind === "wild") {
    fill(ctx, baseX + 3, baseY + 4, 10, 8, "#3d8f45");
    fill(ctx, baseX + 2, baseY + 6, 3, 5, "#2f7034");
    fill(ctx, baseX + 11, baseY + 6, 3, 5, "#2f7034");
    fill(ctx, baseX + 5, baseY + 6, 2, 2, "#1a1a1a");
    fill(ctx, baseX + 9, baseY + 6, 2, 2, "#1a1a1a");
    fill(ctx, baseX + 6, baseY + 2, 4, 3, "#f2e27a");
    ctx.restore();
    return;
  }
  const bob = step > 0 ? (Math.floor(step * 8) % 2) : 0;
  const x = baseX + 3;
  const y = baseY - 6 - bob;
  const hat = kind === "player" ? "#234e8a" : kind === "rival" ? "#1c1c1c" : kind === "leader" ? "#e2b33a" : "#a33b32";
  const shirt = kind === "player" ? "#d24b40" : kind === "rival" ? "#5b3d86" : kind === "leader" ? "#f4efe2" : "#3e7a4a";
  const legs = kind === "leader" ? "#3a3128" : "#243044";
  fill(ctx, x + 1, y, 8, 3, hat);
  fill(ctx, x, y + 2, 10, 2, hat);
  fill(ctx, x + 2, y + 4, 6, 4, "#f0c8a0");
  const eye = face === "up" ? y + 4 : y + 5;
  fill(ctx, x + 3, eye, 1, 1, "#1a1a1a");
  fill(ctx, x + 6, eye, 1, 1, "#1a1a1a");
  fill(ctx, x + 1, y + 8, 8, 5, shirt);
  fill(ctx, x + 1, y + 8, 2, 3, kind === "player" ? "#f0c8a0" : shirt);
  fill(ctx, x + 7, y + 8, 2, 3, kind === "player" ? "#f0c8a0" : shirt);
  const swing = step > 0 ? Math.floor(step * 8) % 2 : 0;
  fill(ctx, x + 2, y + 13, 2, 3 + swing, legs);
  fill(ctx, x + 6, y + 13, 2, 4 - swing, legs);
  ctx.restore();
}

function PixelActor({ kind }: { kind: "player" | "trainer" | "leader" | "rival" | "wild" }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 64, 64);
    ctx.save();
    ctx.scale(3, 3);
    drawActor(ctx, 0.4, 1.15, kind, 0, "down");
    ctx.restore();
  }, [kind]);
  return <canvas ref={ref} className="h-24 w-24 [image-rendering:pixelated]" />;
}

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
    for (let y = 1; y <= 9; y++) tiles[y][6] = 1;
    tiles[1][6] = 5;
    for (let y = 3; y <= 7; y++) {
      tiles[y][4] = 6;
      tiles[y][5] = 6;
      tiles[y][7] = 6;
      tiles[y][8] = 6;
    }
    return { tiles, npcs, start: { x: 6, y: 9 } };
  }

  openGround(tiles);
  for (let y = 1; y <= 9; y++) tiles[y][6] = 1;
  for (let x = 2; x <= 10; x++) tiles[5][x] = 1;
  for (let x = 4; x <= 8; x++) tiles[1][x] = 2;
  tiles[1][6] = 4;
  tiles[3][3] = 1;
  tiles[3][4] = 1;
  tiles[3][5] = 1;
  tiles[3][7] = 1;
  tiles[3][8] = 1;
  tiles[3][9] = 1;
  tiles[7][3] = 1;
  tiles[7][4] = 1;
  tiles[7][5] = 1;
  tiles[7][7] = 1;
  tiles[7][8] = 1;
  tiles[7][9] = 1;
  for (let y = 1; y <= 9; y++) tiles[y][11] = 2;
  if (rivalDone) tiles[5][11] = 5;

  const spots: { x: number; y: number; face: Face }[] = [
    { x: 3, y: 3, face: "right" },
    { x: 9, y: 3, face: "left" },
    { x: 3, y: 7, face: "right" },
    { x: 9, y: 7, face: "left" },
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
  if (tile === 2 || tile === 3) return false;
  return !world.npcs.some((npc) => npc.x === x && npc.y === y);
}

function clearLane(world: World, npc: Npc, x: number, y: number) {
  const stepX = Math.sign(x - npc.x);
  const stepY = Math.sign(y - npc.y);
  let cx = npc.x + stepX;
  let cy = npc.y + stepY;
  while (cx !== x || cy !== y) {
    const tile = world.tiles[cy]?.[cx];
    if (tile === 2 || tile === 3) return false;
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
  const [battle, setBattle] = useState<Battle | null>(null);
  const [notice, setNotice] = useState("");

  const frontier = cities.findIndex((city, index) => {
    const trainer = stops.find((stop) => stop.kind === "trainer" && stop.city.id === city.id);
    const open = index === 0 || Boolean(trainer?.open);
    return open && !rivalBeaten(desk.state.tests, city);
  });
  const city = hold ? (cities.find((item) => item.id === hold) ?? null) : frontier === -1 ? null : cities[frontier];
  cityRef.current = city;
  pausedRef.current = caseOpen || Boolean(battle);

  const go = (next: Scene, x: number, y: number) => {
    posRef.current = { x, y, scene: next, cityId: city?.id ?? "league" };
    setScene(next);
    setLine(next === "route" ? "Tall grass is one unused question." : next === "gym" ? "The aisle is the leader's line of sight." : "Walk across a trainer's line. They will see you.");
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
    setLine(npc.line);
    setBattle({
      testId,
      ids,
      index: 0,
      you: ids.length,
      foeHp: ids.length,
      right: 0,
      foeName: npc.name,
      foeKind: npc.kind,
      title: npc.testName,
      need: npc.need,
      reveal: null,
      over: null,
    });
  };

  const startWild = async () => {
    if (!city || busyRef.current) return;
    busyRef.current = true;
    await loadCatalog();
    const ids = drawQuestionIds(desk.state, topicIdsFor(city.id), "unused", 1, false);
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
      count: 1,
      questionIds: ids,
    });
    if (!testId) {
      busyRef.current = false;
      return;
    }
    setBattle({
      testId,
      ids,
      index: 0,
      you: 1,
      foeHp: 1,
      right: 0,
      foeName: "Wild question",
      foeKind: "wild",
      title: "Tall grass",
      need: 1,
      reveal: null,
      over: null,
    });
  };

  apiRef.current.talk = (npc) => void startBattle(npc);
  apiRef.current.wild = () => void startWild();
  apiRef.current.enter = (tile) => {
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

  const grade = (choice: number) => {
    if (!battle || battle.reveal || battle.over) return;
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
    const right = battle.right + (correct ? 1 : 0);
    const you = battle.you - (correct ? 0 : 1);
    const foeHp = battle.foeHp - (correct ? 1 : 0);
    const last = battle.index + 1 >= battle.ids.length;
    if (last) {
      desk.patchTest(battle.testId, (current) => ({
        ...current,
        index: battle.index,
        answers: { ...current.answers, [id]: { choice, submitted: true } },
        status: "done",
        finishedAt: Date.now(),
      }));
    }
    const won = right / battle.ids.length >= battle.need;
    setBattle({
      ...battle,
      right,
      you,
      foeHp,
      reveal: { correct, note: correct ? "Hit." : "The other side hit you." },
      over: last ? (won ? "You won." : "Not enough. You can try again.") : null,
    });
  };

  const advance = () => {
    if (!battle?.reveal) return;
    if (battle.over) {
      const wonRival = battle.over === "You won." && battle.title.startsWith("Rival:");
      busyRef.current = false;
      setBattle(null);
      if (wonRival && city) {
        setHold(city.id);
        go("route", 6, 9);
      }
      return;
    }
    setBattle({ ...battle, index: battle.index + 1, reveal: null });
  };

  const run = () => {
    if (!battle) return;
    desk.patchTest(battle.testId, (current) => ({ ...current, status: "done", finishedAt: Date.now() }));
    busyRef.current = false;
    setBattle(null);
    setLine("You got away.");
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
    canvas.width = COLS * PX;
    canvas.height = ROWS * PX;
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
            if (tile === 4 || tile === 5) apiRef.current.enter(tile, player.x, player.y);
            else {
              if (tile === 6) {
                grassSteps += 1;
                if (grassSteps >= 3 && Math.random() < 0.2) {
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
      const theme = themeFor(here?.element);
      const frame = Math.floor(now / 280);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, COLS * PX, ROWS * PX);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const tile = map.tiles[y][x];
          const building = scene === "gym" || (scene === "town" && y === 1 && tile === 2);
          drawTile(ctx, tile, x, y, theme, frame, building);
        }
      }
      const stepPhase = moving > 0 ? walked + t : 0;
      for (const npc of map.npcs) {
        drawActor(ctx, npc.x, npc.y, npc.kind === "leader" ? "leader" : npc.kind === "rival" ? "rival" : "trainer", 0, npc.face);
        if (bang && bang.id === npc.id && now < bangUntil) {
          fill(ctx, npc.x * PX + 3, npc.y * PX - 14, 10, 12, "#fff8dc");
          fill(ctx, npc.x * PX + 7, npc.y * PX - 11, 2, 5, "#1a1a1a");
          fill(ctx, npc.x * PX + 7, npc.y * PX - 5, 2, 2, "#1a1a1a");
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
    };
  }, [battle, scene, city?.id]);

  const question = battle ? getQuestion(battle.ids[battle.index] ?? "") : undefined;
  const maxHp = battle?.ids.length ?? 1;

  return (
    <div ref={wrapRef} className="bg-[#1e3a24]">
      <div className="flex items-center justify-between gap-3 border-b-4 border-black bg-[#fff4a8] px-3 py-2 text-black">
        <h2 className="font-serif text-xl">{city ? `${city.city} · ${city.element}` : "Championship"}</h2>
        <button type="button" onClick={() => setCaseOpen((open) => !open)} className="min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">
          Start
        </button>
      </div>
      {battle ? (
        <div>
        <div className="relative overflow-hidden bg-[#7ec8e3] px-3 pt-4 pb-2 text-black">
          <div className="absolute inset-x-0 bottom-0 h-28 bg-[#5eae45]" />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-[#498a36]" />
          <div className="relative grid grid-cols-[1fr_auto] items-end gap-2">
            <div className="border-4 border-black bg-[#f8f8d8] p-2">
              <p className="text-xs font-bold uppercase">{battle.foeName}</p>
              <div className="mt-1 h-3 border-2 border-black bg-white">
                <div className="h-full bg-[#3a7a28]" style={{ width: `${Math.max(0, (battle.foeHp / maxHp) * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs">HP {Math.max(0, battle.foeHp)}/{maxHp}</p>
            </div>
            <div className="flex flex-col items-center">
              <PixelActor kind={battle.foeKind} />
              <div className="h-3 w-16 rounded-[100%] bg-[#2f6a32]" />
            </div>
          </div>
          <div className="relative mt-2 grid grid-cols-[auto_1fr] items-end gap-2">
            <div className="flex flex-col items-center">
              <PixelActor kind="player" />
              <div className="h-3 w-16 rounded-[100%] bg-[#2f6a32]" />
            </div>
            <div className="border-4 border-black bg-[#f8f8d8] p-2">
              <p className="text-xs font-bold uppercase">You</p>
              <div className="mt-1 h-3 border-2 border-black bg-white">
                <div className="h-full bg-[#3a7a28]" style={{ width: `${Math.max(0, (battle.you / maxHp) * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs">HP {Math.max(0, battle.you)}/{maxHp}</p>
            </div>
          </div>
        </div>
          <div className="mt-3 border-4 border-double border-black bg-[#f8f8d8] p-3">
            <p className="text-xs font-bold uppercase">{battle.title}</p>
            {question ? <p className="mt-2 text-sm leading-relaxed">{question.stem.join(" ")}</p> : <p className="mt-2 text-sm">Opening the question…</p>}
            {battle.reveal ? <p className="mt-2 text-sm font-bold">{battle.reveal.correct ? "Hit." : "Miss."} {battle.reveal.note}</p> : null}
            {battle.reveal && question ? <p className="mt-1 max-h-24 overflow-auto text-xs leading-relaxed">{question.explanation}</p> : null}
            {battle.over ? <p className="mt-2 text-sm font-bold">{battle.over} {battle.right}/{battle.ids.length}.</p> : null}
            {!battle.reveal && question ? (
              <div className="mt-3 flex flex-col gap-2">
                {question.choices.map((choice, index) => (
                  <button key={choice} type="button" onClick={() => grade(index)} className="min-h-11 border-4 border-black bg-white px-3 text-left text-sm font-bold">
                    {"ABCDE"[index]}. {choice}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="mt-3 flex gap-2">
              {battle.reveal ? (
                <button type="button" onClick={advance} className="min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">
                  {battle.over ? "Back" : "Next"}
                </button>
              ) : (
                <button type="button" onClick={run} className="min-h-11 border-4 border-black bg-white px-3 text-sm font-bold">
                  Run
                </button>
              )}
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
          <p className="mt-1 text-xs">Wasd or the pad. A talks. Start, or M, opens the badge case. {badges}/{cities.length} badges.{champion ? " Champion." : ""}</p>
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
      {caseOpen ? (
        <div className="border-t-4 border-black bg-[#f8f8d8] p-3 text-black">
          <p className="text-xs font-bold tracking-wide uppercase">Badge case</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {cities.map((item) => {
              const earned = stops.some((stop) => stop.kind === "gym" && stop.city.id === item.id && stop.done);
              return <Badge key={item.id} element={item.element} earned={earned} />;
            })}
          </div>
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
