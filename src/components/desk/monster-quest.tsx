import { useEffect, useRef, useState } from "react";
import { cities, type Stop } from "@/lib/desk/route";
import type { BlueprintId } from "@/lib/desk/types";

const COLS = 15;
const ROWS = 42;
const TILE = 64;
const STEP = 0.14;

type Tile = 0 | 1 | 2 | 3 | 4 | 5;

type Actor = {
  id: string;
  kind: "trainer" | "gym" | "league";
  name: string;
  x: number;
  y: number;
  cityId: BlueprintId | "league";
};

type World = { tiles: Tile[][]; actors: Actor[]; start: { x: number; y: number } };

function buildWorld(): World {
  const tiles = Array.from({ length: ROWS }, () => Array<Tile>(COLS).fill(0));
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) tiles[y][x] = 2;
      else if ((x < 2 || x > COLS - 3) && (x * 3 + y) % 2 === 0) tiles[y][x] = 2;
      else if ((x + y * 5) % 17 === 0 && x > 2 && x < COLS - 3) tiles[y][x] = 2;
    }
  }
  for (let y = 8; y < 12; y++) for (let x = 2; x < 5; x++) tiles[y][x] = 3;
  for (let y = 24; y < 28; y++) for (let x = 10; x < 13; x++) tiles[y][x] = 3;

  const path: { x: number; y: number }[] = [];
  let x = 7;
  for (let y = ROWS - 2; y >= 2; y--) {
    tiles[y][x] = 1;
    if (x > 1) tiles[y][x - 1] = 1;
    path.push({ x, y });
    if (y % 3 === 0) x = Math.max(3, Math.min(COLS - 5, x + (Math.floor(y / 3) % 2 === 0 ? 1 : -1)));
  }

  const actors: Actor[] = [];
  const span = Math.floor(path.length / (cities.length + 1));
  cities.forEach((city, index) => {
    city.trainers.forEach((trainer, trainerIndex) => {
      const cell = path[Math.min(path.length - 2, span * index + 2 + trainerIndex * 3)];
      actors.push({ id: trainer.name, kind: "trainer", name: trainer.name, x: cell.x, y: cell.y, cityId: city.id });
    });
    const gymCell = path[Math.min(path.length - 2, span * (index + 1) - 1)];
    const gx = Math.min(COLS - 2, gymCell.x + 2);
    tiles[gymCell.y][gx] = 5;
    if (tiles[gymCell.y][gx - 1] === 2) tiles[gymCell.y][gx - 1] = 0;
    actors.push({ id: city.id, kind: "gym", name: city.city, x: gx, y: gymCell.y, cityId: city.id });
    const tentX = Math.max(1, gymCell.x - 3);
    if (tiles[gymCell.y][tentX] === 0) tiles[gymCell.y][tentX] = 4;
  });
  const last = path[path.length - 1];
  tiles[last.y][Math.min(COLS - 2, last.x + 2)] = 5;
  actors.push({ id: "league", kind: "league", name: "League", x: Math.min(COLS - 2, last.x + 2), y: last.y, cityId: "league" });
  return { tiles, actors, start: path[0] };
}

const WORLD = buildWorld();

function walkable(x: number, y: number) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
  const tile = WORLD.tiles[y][x];
  if (tile !== 0 && tile !== 1) return false;
  return !WORLD.actors.some((actor) => actor.x === x && actor.y === y);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function cutGreen(img: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(img, 0, 0);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const r0 = frame.data[0];
  const g0 = frame.data[1];
  const b0 = frame.data[2];
  for (let i = 0; i < frame.data.length; i += 4) {
    const dr = frame.data[i] - r0;
    const dg = frame.data[i + 1] - g0;
    const db = frame.data[i + 2] - b0;
    if (dr * dr + dg * dg + db * db < 70 * 70) frame.data[i + 3] = 0;
  }
  ctx.putImageData(frame, 0, 0);
  return canvas;
}

export function MonsterQuest({
  stops,
  picked,
  onPick,
  badges,
  champion,
  startRoute,
  startChampionship,
}: {
  stops: Stop[];
  picked: string;
  onPick: (id: string) => void;
  badges: number;
  champion: boolean;
  startRoute: (name: string, blueprintId: BlueprintId, count: number, gym: boolean) => void;
  startChampionship: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stopsRef = useRef(stops);
  const pickRef = useRef(onPick);
  stopsRef.current = stops;
  pickRef.current = onPick;
  const [inside, setInside] = useState(false);
  const [hint, setHint] = useState(true);

  const chosen = stops.find((stop) => (stop.kind === "trainer" ? stop.name === picked : stop.city.id === picked && stop.kind === "gym"));
  const hall = picked === "league" || !chosen || chosen.kind !== "gym" ? "/field/league.jpg" : chosen.city.hall;
  const lockedHall = picked === "league" ? badges < cities.length : chosen?.kind === "gym" ? !chosen.open && !chosen.done : false;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || inside) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let alive = true;
    const keys = new Set<string>();
    const camera = { x: 0, y: 0 };
    const player = { x: WORLD.start.x, y: WORLD.start.y, fromX: WORLD.start.x, fromY: WORLD.start.y, facing: 0 };
    let moving = 0;
    let last = performance.now();
    let raf = 0;
    const art: Record<string, CanvasImageSource | null> = {};

    const onKey = (event: KeyboardEvent) => {
      const move = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
      if (move.includes(event.key.toLowerCase())) event.preventDefault();
      if (event.type === "keydown") keys.add(event.key.toLowerCase());
      else keys.delete(event.key.toLowerCase());
      if (event.type === "keydown" && (event.key === "Enter" || event.key === " ")) {
        const hit = beside(player.x, player.y);
        if (hit) pickRef.current(hit.id);
      }
    };
    const onClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scale = rect.width / canvas.width;
      const wx = (event.clientX - rect.left) / scale + camera.x;
      const wy = (event.clientY - rect.top) / scale + camera.y;
      const tx = Math.floor(wx / TILE);
      const ty = Math.floor(wy / TILE);
      const hit = WORLD.actors.find((actor) => Math.abs(actor.x - tx) <= 1 && Math.abs(actor.y - ty) <= 1);
      if (hit) pickRef.current(hit.id);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    canvas.addEventListener("click", onClick);

    const dir = () => {
      if (keys.has("arrowup") || keys.has("w")) return [0, -1];
      if (keys.has("arrowdown") || keys.has("s")) return [0, 1];
      if (keys.has("arrowleft") || keys.has("a")) return [-1, 0];
      if (keys.has("arrowright") || keys.has("d")) return [1, 0];
      return null;
    };

    const resize = () => {
      const width = Math.min(960, wrap.clientWidth || 640);
      canvas.width = width;
      canvas.height = Math.min(640, Math.round(width * 0.72));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);

    void Promise.all([
      loadImage("/field/quest/grass.jpg"),
      loadImage("/field/quest/path.jpg"),
      loadImage("/field/quest/tree.jpg"),
      loadImage("/field/quest/tent.jpg"),
      loadImage("/field/quest/hall.jpg"),
      loadImage("/field/quest/hero.jpg"),
      loadImage("/field/quest/trainer.jpg"),
    ]).then(([grass, path, tree, tent, hallImg, hero, trainer]) => {
      if (!alive) return;
      art.grass = grass;
      art.path = path;
      art.tree = tree ? cutGreen(tree) : null;
      art.tent = tent ? cutGreen(tent) : null;
      art.hall = hallImg ? cutGreen(hallImg) : null;
      art.hero = hero ? cutGreen(hero) : null;
      art.trainer = trainer ? cutGreen(trainer) : null;
    });

    const draw = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (moving > 0) moving = Math.max(0, moving - dt);
      else {
        const step = dir();
        if (step && walkable(player.x + step[0], player.y + step[1])) {
          player.fromX = player.x;
          player.fromY = player.y;
          player.x += step[0];
          player.y += step[1];
          moving = STEP;
          const hit = beside(player.x, player.y);
          if (hit) pickRef.current(hit.id);
        }
      }
      const t = moving === 0 ? 1 : 1 - moving / STEP;
      const drawX = player.fromX + (player.x - player.fromX) * t;
      const drawY = player.fromY + (player.y - player.fromY) * t;

      camera.x = Math.max(0, Math.min(COLS * TILE - canvas.width, drawX * TILE - canvas.width / 2));
      camera.y = Math.max(0, Math.min(ROWS * TILE - canvas.height, drawY * TILE - canvas.height / 2));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const x0 = Math.max(0, Math.floor(camera.x / TILE) - 1);
      const y0 = Math.max(0, Math.floor(camera.y / TILE) - 1);
      const x1 = Math.min(COLS, Math.ceil((camera.x + canvas.width) / TILE) + 1);
      const y1 = Math.min(ROWS, Math.ceil((camera.y + canvas.height) / TILE) + 1);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const tile = WORLD.tiles[y][x];
          const dx = x * TILE - camera.x;
          const dy = y * TILE - camera.y;
          const ground = tile === 1 ? art.path : art.grass;
          if (tile === 3) {
            ctx.fillStyle = "#3c8dbe";
            ctx.fillRect(dx, dy, TILE, TILE);
          } else if (ground) ctx.drawImage(ground, dx, dy, TILE, TILE);
          else {
            ctx.fillStyle = tile === 1 ? "#c4a574" : "#7dae45";
            ctx.fillRect(dx, dy, TILE, TILE);
          }
          const prop = tile === 2 ? art.tree : tile === 4 ? art.tent : null;
          if (prop) ctx.drawImage(prop, dx - 8, dy - TILE * 0.45, TILE + 16, TILE * 1.45);
        }
      }
      const drawActor = (ax: number, ay: number, sprite: CanvasImageSource | null, fallback: string) => {
        const dx = ax * TILE - camera.x;
        const dy = ay * TILE - camera.y;
        if (sprite) ctx.drawImage(sprite, dx - 6, dy - TILE * 0.35, TILE + 12, TILE * 1.25);
        else {
          ctx.fillStyle = fallback;
          ctx.fillRect(dx + 16, dy + 12, 32, 40);
        }
      };
      for (const actor of WORLD.actors) {
        drawActor(actor.x, actor.y, actor.kind === "trainer" ? art.trainer : art.hall, actor.kind === "trainer" ? "#f3d48a" : "#f4efe4");
      }
      drawActor(drawX, drawY, art.hero, "#f7f4ee");
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      canvas.removeEventListener("click", onClick);
    };
  }, [inside]);

  if (inside) {
    return (
      <div className="relative min-h-[40rem] overflow-hidden bg-black">
        <img src={hall} alt="" className={`absolute inset-0 h-full w-full object-cover ${lockedHall ? "grayscale" : ""}`} />
        <button type="button" onClick={() => setInside(false)} className="absolute top-3 left-3 min-h-11 border-4 border-black bg-[#fff4a8] px-3 text-sm font-bold text-black">
          Map
        </button>
        <div className="absolute inset-x-0 bottom-0 border-t-4 border-black bg-[#fff4a8] p-4 text-black">
          <QuestDialog
            picked={picked}
            chosen={chosen}
            badges={badges}
            champion={champion}
            startRoute={startRoute}
            startChampionship={startChampionship}
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="bg-[#1e3a24]">
      <canvas ref={canvasRef} className="block w-full cursor-pointer" />
      <div className="border-t-4 border-black bg-[#fff4a8] p-4 text-black">
        {hint ? <p className="mb-2 text-xs font-bold">Arrow keys or WASD to walk. Click a trainer, or walk up and press Enter.</p> : null}
        <QuestDialog
          picked={picked}
          chosen={chosen}
          badges={badges}
          champion={champion}
          startRoute={startRoute}
          startChampionship={startChampionship}
          onInside={() => {
            setHint(false);
            setInside(true);
          }}
        />
      </div>
    </div>
  );
}

function beside(x: number, y: number) {
  return WORLD.actors.find((actor) => Math.abs(actor.x - x) + Math.abs(actor.y - y) === 1) ?? null;
}

function QuestDialog({
  picked,
  chosen,
  badges,
  champion,
  startRoute,
  startChampionship,
  onInside,
}: {
  picked: string;
  chosen: Stop | undefined;
  badges: number;
  champion: boolean;
  startRoute: (name: string, blueprintId: BlueprintId, count: number, gym: boolean) => void;
  startChampionship: () => void;
  onInside?: () => void;
}) {
  if (picked === "league" || !chosen) {
    return (
      <div>
        <p className="text-xs font-bold tracking-wide uppercase">Championship</p>
        <h2 className="font-serif text-2xl">The hall</h2>
        <p className="mt-1 text-sm">Twenty harder questions. You need 80%. Badges {badges}/{cities.length}.</p>
        {champion ? <p className="mt-2 text-sm font-bold">Champion</p> : null}
        {onInside ? (
          <button type="button" onClick={onInside} className="mt-3 min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">
            Go inside
          </button>
        ) : null}
        {!champion && badges === cities.length && !onInside ? (
          <button type="button" onClick={startChampionship} className="mt-3 min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">
            Enter the Championship
          </button>
        ) : null}
      </div>
    );
  }
  if (chosen.kind === "trainer") {
    return (
      <div>
        <p className="text-xs font-bold tracking-wide uppercase">Trainer</p>
        <h2 className="font-serif text-2xl">{chosen.name}</h2>
        <p className="text-sm">On the road to {chosen.city.city}. {chosen.count} questions. Need 60%.</p>
        {chosen.open && !chosen.done ? (
          <button type="button" onClick={() => startRoute(`Route: ${chosen.name}`, chosen.city.id, chosen.count, false)} className="mt-3 min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">
            Battle {chosen.name}
          </button>
        ) : null}
        {chosen.done ? <p className="mt-2 text-sm font-bold">Beaten</p> : null}
        {!chosen.open && !chosen.done ? <p className="mt-2 text-sm">The road is closed.</p> : null}
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs font-bold tracking-wide uppercase">{chosen.city.element} gym</p>
      <h2 className="font-serif text-2xl">{chosen.city.leader}</h2>
      <p className="text-sm">{chosen.city.city}. {chosen.city.subject}. {chosen.city.gymCount} questions. Need 60%.</p>
      {!chosen.open ? <p className="mt-1 text-sm">Beat the trainers on the road first.</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {onInside ? (
          <button type="button" onClick={onInside} className="min-h-11 border-4 border-black bg-[#fff4a8] px-3 text-sm font-bold">
            Go inside
          </button>
        ) : null}
        {chosen.open && !chosen.done && !onInside ? (
          <button type="button" onClick={() => startRoute(`Gym: ${chosen.city.element}`, chosen.city.id, chosen.city.gymCount, true)} className="min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">
            Challenge {chosen.city.leader}
          </button>
        ) : null}
        {chosen.done ? <p className="self-center text-sm font-bold">Badge earned</p> : null}
      </div>
    </div>
  );
}
