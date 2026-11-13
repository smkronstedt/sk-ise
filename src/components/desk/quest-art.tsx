import { useEffect, useState } from "react";

export type QuestTile = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type QuestFace = "up" | "down" | "left" | "right";
export type ActorKind = "player" | "trainer" | "leader" | "rival" | "wild";

export const TILE = 32;

const artSrc: Record<string, string> = {
  grass: "/quest/grass.png",
  path: "/quest/path.png",
  water: "/quest/water.png",
  tall: "/quest/tall.png",
  wall: "/quest/wall.png",
  door: "/quest/door.png",
  sign: "/quest/sign.png",
  tree: "/quest/tree.png",
  player: "/quest/player.png",
  trainer: "/quest/trainer.png",
  leader: "/quest/leader.png",
  rival: "/quest/rival.png",
  wild: "/quest/wild.png",
};

const art: Record<string, HTMLImageElement> = {};

function sprite(name: string) {
  if (typeof window === "undefined") return null;
  if (!art[name]) {
    const img = new Image();
    img.src = artSrc[name];
    art[name] = img;
  }
  return art[name].complete && art[name].naturalWidth > 0 ? art[name] : null;
}

export type PlaceLook = {
  grass: string;
  path: string;
  roof: string;
  water: string;
  tree: string;
  tall: string;
};

export const PLACE: Record<string, PlaceLook> = {
  home: { grass: "#d7e8b8", path: "#f0ddb0", roof: "#f7f1e6", water: "#9fd0ea", tree: "#3f8a45", tall: "#8fbf55" },
  stones: { grass: "#c9c2a4", path: "#d9c7a4", roof: "#8d8478", water: "#8aa4b5", tree: "#6a7050", tall: "#b7b48a" },
  oncology: { grass: "#b7d7b0", path: "#e7d3b0", roof: "#8d2e2a", water: "#3d92c8", tree: "#2f7a48", tall: "#7fbf6a" },
  urogyn: { grass: "#8fb4b0", path: "#c5d0d4", roof: "#243246", water: "#1d4e6a", tree: "#1e4a44", tall: "#6a9a90" },
  core: { grass: "#d5e7b8", path: "#f3ead0", roof: "#f7f4ee", water: "#9fd4ef", tree: "#6aaa55", tall: "#b7d96a" },
  andrology: { grass: "#c6dd9a", path: "#e4dcc8", roof: "#e2c24a", water: "#6eb0d4", tree: "#4a8a38", tall: "#d2e06a" },
  peds: { grass: "#b6e8a8", path: "#f0ddb4", roof: "#7dcea0", water: "#8ed4ef", tree: "#2f9a48", tall: "#9adf62" },
  basic: { grass: "#c5d2a4", path: "#d9c8aa", roof: "#6b4c7a", water: "#7a9a88", tree: "#4a6840", tall: "#a8b86a" },
  obstruction: { grass: "#d2c096", path: "#c9a36a", roof: "#8a5430", water: "#8a9470", tree: "#6a7038", tall: "#c4a85a" },
};

export function lookFor(id: string) {
  return PLACE[id] ?? PLACE.core;
}

function dye(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number, alpha: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

const sheets: Record<string, HTMLCanvasElement> = {};

function clothesSheet(name: string, color: string) {
  const key = `${name}|${color}`;
  if (sheets[key]) return sheets[key];
  const base = sprite(name);
  if (!base || typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = base.naturalWidth;
  canvas.height = base.naturalHeight;
  const pen = canvas.getContext("2d");
  if (!pen) return null;
  pen.drawImage(base, 0, 0);
  pen.globalCompositeOperation = "source-atop";
  pen.fillStyle = color;
  pen.globalAlpha = name === "leader" ? 0.78 : 0.58;
  const top = name === "leader" ? 0.22 : 0.4;
  pen.fillRect(0, canvas.height * top, canvas.width, canvas.height * (1 - top));
  if (name === "leader") {
    pen.globalAlpha = 0.9;
    pen.fillRect(canvas.width * 0.28, canvas.height * 0.16, canvas.width * 0.44, canvas.height * 0.06);
  }
  sheets[key] = canvas;
  return canvas;
}

function blit(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, w: number, h: number) {
  const img = sprite(name);
  if (!img) {
    ctx.fillStyle = name === "water" ? "#3d92c8" : name === "path" || name === "sign" ? "#d7b98a" : name === "wall" || name === "door" ? "#8d8a84" : "#4f9a3c";
    ctx.fillRect(x, y, w, h);
    return;
  }
  ctx.drawImage(img, x, y, w, h);
}

export function drawGround(ctx: CanvasRenderingContext2D, tile: QuestTile, x: number, y: number, building: boolean, frame: number, look?: PlaceLook) {
  const px = x * TILE;
  const py = y * TILE;
  const ground = tile === 1 || tile === 5 ? "path" : tile === 3 ? "water" : tile === 6 ? "tall" : tile === 4 || tile === 7 || tile === 8 || tile === 9 || (tile === 2 && building) ? "wall" : "grass";
  if (ground === "water" || ground === "tall") {
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, TILE, TILE);
    ctx.clip();
    blit(ctx, ground, px - (frame % 2 ? 4 : 0), py, TILE + 6, TILE);
    ctx.restore();
  } else {
    blit(ctx, ground, px, py, TILE, TILE);
  }
  if (!look) return;
  const color = ground === "path" ? look.path : ground === "water" ? look.water : ground === "tall" ? look.tall : ground === "wall" ? look.roof : look.grass;
  dye(ctx, color, px, py, TILE, TILE, ground === "wall" ? 0.62 : 0.5);
}

export function drawProp(ctx: CanvasRenderingContext2D, tile: QuestTile, x: number, y: number, building: boolean, look?: PlaceLook) {
  const px = x * TILE;
  const py = y * TILE;
  if (tile === 2 && !building) {
    blit(ctx, "tree", px - 6, py - TILE * 0.95, TILE + 12, TILE * 2);
    if (look) dye(ctx, look.tree, px - 6, py - TILE * 0.95, TILE + 12, TILE * 2, 0.4);
  }
  if (tile === 8) {
    blit(ctx, "wall", px, py - TILE * 0.9, TILE, TILE * 1.9);
    if (look) dye(ctx, look.roof, px, py - TILE * 0.9, TILE, TILE * 1.9, 0.55);
  }
  if (tile === 4 || tile === 7 || tile === 9) blit(ctx, "door", px, py - TILE * 0.9, TILE, TILE * 1.9);
  if (tile === 7) {
    ctx.fillStyle = "#e23b3b";
    ctx.fillRect(px + 4, py - TILE * 0.72, TILE - 8, 6);
  }
  if (tile === 9) {
    ctx.fillStyle = "#e23b3b";
    ctx.fillRect(px + 12, py - TILE * 0.55, 8, 18);
    ctx.fillRect(px + 6, py - TILE * 0.4, 20, 8);
  }
  if (tile === 4) {
    ctx.fillStyle = look?.roof ?? "#f2d15a";
    ctx.beginPath();
    ctx.arc(px + TILE / 2, py - TILE * 0.35, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (tile === 5) blit(ctx, "sign", px + 2, py - TILE * 0.45, TILE - 4, TILE * 1.45);
}

export function drawActor(ctx: CanvasRenderingContext2D, tx: number, ty: number, kind: ActorKind, step: number, face: QuestFace, coat?: string) {
  const bob = step > 0 && Math.floor(step * 8) % 2 ? 3 : 0;
  const height = kind === "wild" ? TILE * 1.2 : kind === "leader" ? TILE * 2.05 : TILE * 1.85;
  const width = height * (kind === "leader" ? 0.5 : 0.46);
  const baseX = tx * TILE;
  const baseY = ty * TILE;
  const x = baseX + (TILE - width) / 2;
  const y = baseY + TILE - height + 4 - bob;
  const sheet = coat ? clothesSheet(kind, coat) : null;
  ctx.save();
  if (face === "left") {
    ctx.translate(baseX + TILE, 0);
    ctx.scale(-1, 1);
    ctx.translate(-baseX, 0);
  }
  if (sheet) ctx.drawImage(sheet, x, y, width, height);
  else blit(ctx, kind, x, y, width, height);
  ctx.restore();
}

export function drawCreature(ctx: CanvasRenderingContext2D, tx: number, ty: number, file: string, face: QuestFace, step: number, evolved = false) {
  const key = `mon:${file}`;
  if (!art[key]) {
    const img = new Image();
    img.src = file;
    art[key] = img;
  }
  const bob = step > 0 && Math.floor(step * 8) % 2 ? 2 : 0;
  // Player is TILE * 1.85. Base forms ~20% smaller. Evolved forms grow closer to player size.
  const height = evolved ? TILE * 1.75 : TILE * 1.48;
  const width = height * 0.85;
  const baseX = tx * TILE;
  const baseY = ty * TILE;
  const x = baseX + (TILE - width) / 2;
  const y = baseY + TILE - height + 2 - bob;
  const img = art[key].complete && art[key].naturalWidth > 0 ? art[key] : null;
  ctx.save();
  if (face === "left") {
    ctx.translate(baseX + TILE, 0);
    ctx.scale(-1, 1);
    ctx.translate(-baseX, 0);
  }
  if (img) ctx.drawImage(img, x, y, width, height);
  ctx.restore();
}

export function PixelActor({ kind, className = "h-32" }: { kind: ActorKind; className?: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setReady(true);
    img.src = artSrc[kind];
  }, [kind]);
  return <img src={artSrc[kind]} alt="" className={`${className} w-auto max-w-none object-contain object-bottom [image-rendering:pixelated] ${ready ? "" : "opacity-0"}`} />;
}
