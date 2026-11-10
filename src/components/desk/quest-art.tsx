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

function blit(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, w: number, h: number) {
  const img = sprite(name);
  if (!img) {
    ctx.fillStyle = name === "water" ? "#3d92c8" : name === "path" || name === "sign" ? "#d7b98a" : name === "wall" || name === "door" ? "#8d8a84" : "#4f9a3c";
    ctx.fillRect(x, y, w, h);
    return;
  }
  ctx.drawImage(img, x, y, w, h);
}

export function drawGround(ctx: CanvasRenderingContext2D, tile: QuestTile, x: number, y: number, building: boolean, frame: number) {
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
    return;
  }
  blit(ctx, ground, px, py, TILE, TILE);
}

export function drawProp(ctx: CanvasRenderingContext2D, tile: QuestTile, x: number, y: number, building: boolean) {
  const px = x * TILE;
  const py = y * TILE;
  if (tile === 2 && !building) blit(ctx, "tree", px - 6, py - TILE * 0.95, TILE + 12, TILE * 2);
  if (tile === 8) blit(ctx, "wall", px, py - TILE * 0.9, TILE, TILE * 1.9);
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
    ctx.fillStyle = "#f2d15a";
    ctx.beginPath();
    ctx.arc(px + TILE / 2, py - TILE * 0.35, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (tile === 5) blit(ctx, "sign", px + 2, py - TILE * 0.45, TILE - 4, TILE * 1.45);
}

export function drawActor(ctx: CanvasRenderingContext2D, tx: number, ty: number, kind: ActorKind, step: number, face: QuestFace) {
  const bob = step > 0 && Math.floor(step * 8) % 2 ? 3 : 0;
  const height = kind === "wild" ? TILE * 1.2 : TILE * 1.85;
  const width = height * 0.46;
  const baseX = tx * TILE;
  const baseY = ty * TILE;
  const x = baseX + (TILE - width) / 2;
  const y = baseY + TILE - height + 4 - bob;
  ctx.save();
  if (face === "left") {
    ctx.translate(baseX + TILE, 0);
    ctx.scale(-1, 1);
    ctx.translate(-baseX, 0);
  }
  blit(ctx, kind, x, y, width, height);
  ctx.restore();
}

export function drawCreature(ctx: CanvasRenderingContext2D, tx: number, ty: number, file: string, face: QuestFace, step: number) {
  const key = `mon:${file}`;
  if (!art[key]) {
    const img = new Image();
    img.src = file;
    art[key] = img;
  }
  const bob = step > 0 && Math.floor(step * 8) % 2 ? 2 : 0;
  const height = TILE * 1.7;
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

export function PixelActor({ kind }: { kind: ActorKind }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setReady(true);
    img.src = artSrc[kind];
  }, [kind]);
  return <img src={artSrc[kind]} alt="" className={`h-44 w-auto object-contain [image-rendering:pixelated] ${ready ? "" : "opacity-0"}`} />;
}
