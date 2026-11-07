import { useEffect, useRef, useState } from "react";
import { cities, type City, type Stop } from "@/lib/desk/route";
import type { BlueprintId } from "@/lib/desk/types";

const COLS = 14;
const ROWS = 11;
const TILE = 52;
const STEP = 0.14;

type Tile = 0 | 1 | 2 | 3 | 4 | 5;

type Actor = {
  id: string;
  kind: "trainer" | "gym" | "league";
  name: string;
  x: number;
  y: number;
};

type World = { tiles: Tile[][]; actors: Actor[]; start: { x: number; y: number } };

const WASH: Record<string, string> = {
  Rock: "rgba(110, 78, 40, 0.28)",
  Water: "rgba(30, 90, 170, 0.22)",
  Electric: "rgba(190, 150, 20, 0.2)",
  Grass: "rgba(20, 110, 30, 0.08)",
  Poison: "rgba(90, 30, 120, 0.28)",
  Psychic: "rgba(170, 70, 130, 0.22)",
  Fire: "rgba(170, 40, 20, 0.24)",
  Ground: "rgba(130, 90, 40, 0.32)",
};

function buildTown(city: City | null): World {
  const tiles = Array.from({ length: ROWS }, () => Array<Tile>(COLS).fill(0));
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) tiles[y][x] = 2;
    }
  }
  for (let y = 8; y >= 2; y--) tiles[y][6] = 1;
  for (let y = 8; y >= 2; y--) tiles[y][7] = 1;
  tiles[2][5] = 1;
  tiles[2][8] = 1;
  tiles[4][3] = 1;
  tiles[4][4] = 1;
  tiles[4][5] = 1;
  tiles[4][8] = 1;
  tiles[4][9] = 1;
  tiles[4][10] = 1;
  tiles[7][3] = 1;
  tiles[7][4] = 1;
  tiles[7][5] = 1;
  tiles[7][8] = 1;
  tiles[7][9] = 1;
  tiles[7][10] = 1;

  const element = city?.element ?? "Psychic";
  if (element === "Water") {
    for (let y = 3; y <= 5; y++) for (let x = 1; x <= 3; x++) tiles[y][x] = 3;
  } else if (element === "Grass" || element === "Poison") {
    tiles[3][2] = 2;
    tiles[3][11] = 2;
    tiles[6][2] = 2;
    tiles[6][11] = 2;
    tiles[8][4] = 2;
    tiles[8][9] = 2;
  } else if (element === "Electric") {
    tiles[3][2] = 4;
    tiles[3][11] = 4;
    tiles[6][2] = 4;
    tiles[6][11] = 4;
  } else if (element === "Rock" || element === "Ground" || element === "Fire") {
    tiles[3][2] = 2;
    tiles[6][11] = 2;
  }

  tiles[1][6] = 5;
  tiles[1][7] = 5;
  const actors: Actor[] = [];
  const spots = [
    { x: 3, y: 4 },
    { x: 10, y: 4 },
    { x: 3, y: 7 },
    { x: 10, y: 7 },
  ];
  if (city) {
    city.trainers.forEach((trainer, index) => {
      const spot = spots[index];
      if (!spot) return;
      tiles[spot.y][spot.x] = 1;
      actors.push({ id: trainer.name, kind: "trainer", name: trainer.name, x: spot.x, y: spot.y });
    });
    actors.push({ id: city.id, kind: "gym", name: city.city, x: 6, y: 1 });
  } else {
    actors.push({ id: "league", kind: "league", name: "League", x: 6, y: 1 });
  }
  return { tiles, actors, start: { x: 6, y: 9 } };
}

function canWalk(world: World, x: number, y: number) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
  const tile = world.tiles[y][x];
  if (tile !== 0 && tile !== 1) return false;
  return !world.actors.some((actor) => actor.kind === "trainer" && actor.x === x && actor.y === y);
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
  const [inside, setInside] = useState(false);
  const [gate, setGate] = useState("");
  const townIndex = cities.findIndex((city) => !stops.some((stop) => stop.kind === "gym" && stop.city.id === city.id && stop.done));
  const city = townIndex === -1 ? null : cities[townIndex];
  const world = buildTown(city);
  const need = city?.trainers.length ?? 0;
  const beaten = city ? city.trainers.filter((trainer) => stops.some((stop) => stop.kind === "trainer" && stop.name === trainer.name && stop.done)).length : need;
  const ready = !city || beaten >= need;
  const chosen = stops.find((stop) => (stop.kind === "trainer" ? stop.name === picked : stop.city.id === picked && stop.kind === "gym"));
  const hall = !city ? "/field/league.jpg" : city.hall;
  const pickRef = useRef(onPick);
  const readyRef = useRef(ready);
  const needRef = useRef(need);
  const beatenRef = useRef(beaten);
  const worldRef = useRef(world);
  pickRef.current = onPick;
  readyRef.current = ready;
  needRef.current = need;
  beatenRef.current = beaten;
  worldRef.current = world;

  useEffect(() => {
    setInside(false);
    setGate("");
  }, [city?.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || inside) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const map = worldRef.current;
    let alive = true;
    const keys = new Set<string>();
    const player = { x: map.start.x, y: map.start.y, fromX: map.start.x, fromY: map.start.y };
    let moving = 0;
    let last = performance.now();
    let raf = 0;
    const art: Record<string, CanvasImageSource | null> = {};

    const approach = (actor: Actor) => {
      pickRef.current(actor.id);
      if (actor.kind === "trainer") {
        setGate("");
        return;
      }
      if (!readyRef.current) {
        setGate(`Come back after you defeat more trainers. ${beatenRef.current} of ${needRef.current}.`);
        return;
      }
      setGate("");
      setInside(true);
    };

    const onKey = (event: KeyboardEvent) => {
      const move = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
      if (move.includes(event.key.toLowerCase())) event.preventDefault();
      if (event.type === "keydown") keys.add(event.key.toLowerCase());
      else keys.delete(event.key.toLowerCase());
      if (event.type === "keydown" && (event.key === "Enter" || event.key === " ")) {
        const hit = map.actors.find((actor) => Math.abs(actor.x - player.x) + Math.abs(actor.y - player.y) === 1);
        if (hit) approach(hit);
      }
    };
    const onClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scale = rect.width / canvas.width;
      const tx = Math.floor((event.clientX - rect.left) / scale / TILE);
      const ty = Math.floor((event.clientY - rect.top) / scale / TILE);
      const hit =
        map.actors.find((actor) => actor.kind !== "trainer" && Math.abs(actor.x - tx) <= 1 && Math.abs(actor.y - ty) <= 1) ??
        map.actors.find((actor) => actor.x === tx && actor.y === ty);
      if (hit) approach(hit);
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
      const width = Math.min(COLS * TILE, wrap.clientWidth || COLS * TILE);
      canvas.width = width;
      canvas.height = Math.round(width * (ROWS / COLS));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);

    void Promise.all([
      loadImage("/field/quest/grass.jpg"),
      loadImage("/field/quest/path.jpg"),
      loadImage("/field/quest/tree.jpg"),
      loadImage("/field/quest/tent.jpg"),
      loadImage(hall),
      loadImage("/field/quest/hero.jpg"),
      loadImage("/field/quest/trainer.jpg"),
    ]).then(([grass, path, tree, tent, hallImg, hero, trainer]) => {
      if (!alive) return;
      art.grass = grass;
      art.path = path;
      art.tree = tree ? cutGreen(tree) : null;
      art.tent = tent ? cutGreen(tent) : null;
      art.hall = hallImg;
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
        if (step && canWalk(map, player.x + step[0], player.y + step[1])) {
          player.fromX = player.x;
          player.fromY = player.y;
          player.x += step[0];
          player.y += step[1];
          moving = STEP;
        }
      }
      const t = moving === 0 ? 1 : 1 - moving / STEP;
      const drawX = player.fromX + (player.x - player.fromX) * t;
      const drawY = player.fromY + (player.y - player.fromY) * t;
      const scale = canvas.width / (COLS * TILE);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, COLS * TILE, ROWS * TILE);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const tile = map.tiles[y][x];
          const dx = x * TILE;
          const dy = y * TILE;
          if (tile === 3) {
            ctx.fillStyle = "#3c8dbe";
            ctx.fillRect(dx, dy, TILE, TILE);
          } else if (tile === 1 && art.path) ctx.drawImage(art.path, dx, dy, TILE, TILE);
          else if (art.grass) ctx.drawImage(art.grass, dx, dy, TILE, TILE);
          else {
            ctx.fillStyle = tile === 1 ? "#c4a574" : "#7dae45";
            ctx.fillRect(dx, dy, TILE, TILE);
          }
          const prop = tile === 2 ? art.tree : tile === 4 ? art.tent : null;
          if (prop) ctx.drawImage(prop, dx - 6, dy - TILE * 0.35, TILE + 12, TILE * 1.35);
        }
      }
      ctx.fillStyle = WASH[city?.element ?? "Psychic"] ?? "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, COLS * TILE, ROWS * TILE);
      const gym = map.actors.find((actor) => actor.kind !== "trainer");
      if (gym && art.hall) {
        ctx.drawImage(art.hall, (gym.x - 0.2) * TILE, (gym.y - 0.8) * TILE, TILE * 2.4, TILE * 1.8);
        ctx.fillStyle = "#111";
        ctx.fillRect(gym.x * TILE + 8, gym.y * TILE + TILE - 6, 72, 18);
        ctx.fillStyle = "#fff4a8";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(gym.kind === "league" ? "HALL" : "GYM", gym.x * TILE + 28, gym.y * TILE + TILE + 7);
      }
      for (const actor of map.actors) {
        if (actor.kind !== "trainer") continue;
        const dx = actor.x * TILE;
        const dy = actor.y * TILE;
        if (art.trainer) ctx.drawImage(art.trainer, dx - 4, dy - TILE * 0.25, TILE + 8, TILE * 1.15);
        else {
          ctx.fillStyle = "#f3d48a";
          ctx.fillRect(dx + 14, dy + 8, 24, 32);
        }
      }
      if (art.hero) ctx.drawImage(art.hero, drawX * TILE - 4, drawY * TILE - TILE * 0.25, TILE + 8, TILE * 1.15);
      else {
        ctx.fillStyle = "#f7f4ee";
        ctx.fillRect(drawX * TILE + 14, drawY * TILE + 8, 24, 32);
      }
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
  }, [inside, city?.id, hall]);

  if (inside) {
    return (
      <div className="relative min-h-[40rem] overflow-hidden bg-black">
        <img src={hall} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <button type="button" onClick={() => setInside(false)} className="absolute top-3 left-3 min-h-11 border-4 border-black bg-[#fff4a8] px-3 text-sm font-bold text-black">
          Town
        </button>
        <div className="absolute inset-x-0 bottom-0 border-t-4 border-black bg-[#fff4a8] p-4 text-black">
          <QuestDialog
            picked={city ? city.id : "league"}
            chosen={city ? stops.find((stop) => stop.kind === "gym" && stop.city.id === city.id) : undefined}
            badges={badges}
            champion={champion}
            startRoute={startRoute}
            startChampionship={startChampionship}
          />
        </div>
      </div>
    );
  }

  const place = city ? `${city.city} · ${city.element}` : "Championship";
  const next = city && townIndex < cities.length - 1 ? cities[townIndex + 1].city : "the Championship";

  return (
    <div ref={wrapRef} className="bg-[#1e3a24]">
      <div className="flex items-baseline justify-between gap-3 border-b-4 border-black bg-[#fff4a8] px-3 py-2 text-black">
        <h2 className="font-serif text-xl">{place}</h2>
        <p className="text-sm font-bold">{city ? `${beaten}/${need} trainers` : `${badges}/${cities.length} badges`}</p>
      </div>
      <canvas ref={canvasRef} className="block w-full cursor-pointer" />
      <div className="border-t-4 border-black bg-[#fff4a8] p-4 text-black">
        <p className="mb-2 text-xs font-bold">
          {city
            ? `Four trainers in this town. Click one to battle. Click the gym at the top after they are beaten, and the road opens to ${next}.`
            : "Every gym is down. Click the hall."}
        </p>
        {gate ? <p className="mb-2 text-sm font-bold">{gate}</p> : null}
        <QuestDialog
          picked={picked}
          chosen={chosen}
          badges={badges}
          champion={champion}
          startRoute={startRoute}
          startChampionship={startChampionship}
          blocked={Boolean(city) && !ready && (picked === city?.id || !chosen)}
        />
      </div>
    </div>
  );
}

function QuestDialog({
  picked,
  chosen,
  badges,
  champion,
  startRoute,
  startChampionship,
  blocked,
}: {
  picked: string;
  chosen: Stop | undefined;
  badges: number;
  champion: boolean;
  startRoute: (name: string, blueprintId: BlueprintId, count: number, gym: boolean) => void;
  startChampionship: () => void;
  blocked?: boolean;
}) {
  if (picked === "league" || (!chosen && !blocked)) {
    return (
      <div>
        <p className="text-xs font-bold tracking-wide uppercase">Championship</p>
        <h2 className="font-serif text-2xl">The hall</h2>
        <p className="mt-1 text-sm">Twenty harder questions. You need 80%. Badges {badges}/{cities.length}.</p>
        {champion ? <p className="mt-2 text-sm font-bold">Champion</p> : null}
        {!champion && badges === cities.length ? (
          <button type="button" onClick={startChampionship} className="mt-3 min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">
            Enter the Championship
          </button>
        ) : null}
      </div>
    );
  }
  if (blocked || (chosen?.kind === "gym" && !chosen.open && !chosen.done)) {
    return (
      <div>
        <p className="text-xs font-bold tracking-wide uppercase">{chosen?.kind === "gym" ? chosen.city.element : "Gym"}</p>
        <h2 className="font-serif text-2xl">{chosen?.kind === "gym" ? chosen.city.leader : "The gym"}</h2>
        <p className="mt-1 text-sm font-bold">Come back after you defeat more trainers.</p>
      </div>
    );
  }
  if (!chosen) return null;
  if (chosen.kind === "trainer") {
    return (
      <div>
        <p className="text-xs font-bold tracking-wide uppercase">Trainer</p>
        <h2 className="font-serif text-2xl">{chosen.name}</h2>
        <p className="text-sm">{chosen.city.city}. {chosen.count} questions. Need 60%.</p>
        {chosen.open && !chosen.done ? (
          <button type="button" onClick={() => startRoute(`Route: ${chosen.name}`, chosen.city.id, chosen.count, false)} className="mt-3 min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">
            Battle {chosen.name}
          </button>
        ) : null}
        {chosen.done ? <p className="mt-2 text-sm font-bold">Beaten</p> : null}
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs font-bold tracking-wide uppercase">{chosen.city.element} gym</p>
      <h2 className="font-serif text-2xl">{chosen.city.leader}</h2>
      <p className="text-sm">{chosen.city.city}. {chosen.city.subject}. {chosen.city.gymCount} questions. Need 60%.</p>
      {chosen.open && !chosen.done ? (
        <button type="button" onClick={() => startRoute(`Gym: ${chosen.city.element}`, chosen.city.id, chosen.city.gymCount, true)} className="mt-3 min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">
          Challenge {chosen.city.leader}
        </button>
      ) : null}
      {chosen.done ? <p className="mt-2 text-sm font-bold">Badge earned. The next town is open.</p> : null}
    </div>
  );
}
