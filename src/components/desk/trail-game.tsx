import { useEffect, useRef, useState } from "react";
import { topics } from "@/lib/desk/topics";
import type { Topic } from "@/lib/desk/types";

const WORLD_W = 1400;
const WORLD_H = 6200;
const SPEED = 280;
const SAVE_KEY = "ise-trail-pos";

type Camp = { topic: Topic; x: number; y: number; prop: "tent" | "cairn" | "sign" };

const PROP_FOR: Record<string, Camp["prop"]> = {
  oncology: "tent",
  stones: "cairn",
  core: "cairn",
  basic: "sign",
};

function camps(): Camp[] {
  return topics.map((topic, i) => {
    const u = topics.length === 1 ? 0 : i / (topics.length - 1);
    return {
      topic,
      x: WORLD_W / 2 + Math.sin(u * Math.PI * 5) * 390,
      y: 260 + u * (WORLD_H - 520),
      prop: PROP_FOR[topic.blueprintId] ?? "sign",
    };
  });
}

const CAMPS = camps();

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Sprites = {
  hero: HTMLImageElement | null;
  grass: HTMLImageElement | null;
  dirt: HTMLImageElement | null;
  tent: HTMLImageElement | null;
  cairn: HTMLImageElement | null;
  tree: HTMLImageElement | null;
  sign: HTMLImageElement | null;
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function TrailGame({
  cleared,
  done,
  right,
  onEnter,
}: {
  cleared: Set<string>;
  done: number;
  right: number;
  onEnter: (topicId: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const clearedRef = useRef(cleared);
  const enterRef = useRef(onEnter);
  clearedRef.current = cleared;
  enterRef.current = onEnter;
  const [near, setNear] = useState<Camp | null>(null);
  const [hint, setHint] = useState(true);
  const joy = useRef({ x: 0, y: 0, id: -1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let alive = true;
    const sprites: Sprites = {
      hero: null,
      grass: null,
      dirt: null,
      tent: null,
      cairn: null,
      tree: null,
      sign: null,
    };

    const canvasEl = canvas;
    const wrapEl = wrap;
    const context = ctx;
    const keys = new Set<string>();
    let last = performance.now();
    let raf = 0;
    let saveAt = 0;
    const saved = readPos();
    const player = {
      x: saved?.x ?? CAMPS[0].x,
      y: saved?.y ?? CAMPS[0].y,
      facing: 1,
    };
    let grassPat: CanvasPattern | null = null;
    let dirtPat: CanvasPattern | null = null;

    const rand = mulberry(7);
    const trees = Array.from({ length: 70 }, () => ({
      x: 80 + rand() * (WORLD_W - 160),
      y: 80 + rand() * (WORLD_H - 160),
      s: 0.7 + rand() * 0.7,
    })).filter((tree) => {
      return !CAMPS.some((c) => Math.hypot(c.x - tree.x, c.y - tree.y) < 120);
    });

    const ponds = Array.from({ length: 8 }, () => ({
      x: 160 + rand() * (WORLD_W - 320),
      y: 400 + rand() * (WORLD_H - 800),
      rx: 70 + rand() * 90,
      ry: 36 + rand() * 40,
    }));

    const onKeyDown = (event: KeyboardEvent) => {
      if (isMove(event.code) || event.code === "Enter" || event.code === "KeyE") {
        event.preventDefault();
      }
      keys.add(event.code);
      if (event.code === "Enter" || event.code === "KeyE") tryEnter();
      setHint(false);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keys.delete(event.code);
    };

    function tryEnter() {
      const camp = nearest(player.x, player.y);
      if (camp && Math.hypot(camp.x - player.x, camp.y - player.y) < 86) {
        enterRef.current(camp.topic.id);
      }
    }

    function frame(now: number) {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let mx = joy.current.x;
      let my = joy.current.y;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
      if (keys.has("KeyW") || keys.has("ArrowUp")) my -= 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) my += 1;
      const mag = Math.hypot(mx, my);
      if (mag > 1) {
        mx /= mag;
        my /= mag;
      }
      if (mag > 0.05) {
        player.x += mx * SPEED * dt;
        player.y += my * SPEED * dt;
        if (Math.abs(mx) > Math.abs(my)) player.facing = mx < 0 ? -1 : 1;
      }
      player.x = Math.max(48, Math.min(WORLD_W - 48, player.x));
      player.y = Math.max(48, Math.min(WORLD_H - 48, player.y));

      const camp = nearest(player.x, player.y);
      const close = camp && Math.hypot(camp.x - player.x, camp.y - player.y) < 86 ? camp : null;
      setNear((prev) => (prev?.topic.id === close?.topic.id ? prev : close));

      if (now > saveAt) {
        saveAt = now + 800;
        localStorage.setItem(SAVE_KEY, JSON.stringify({ x: player.x, y: player.y }));
      }

      draw(dt, now);
      raf = requestAnimationFrame(frame);
    }

    function draw(_dt: number, now: number) {
      const bounds = wrapEl.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(320, bounds.width);
      const cssH = Math.max(420, bounds.height);
      if (canvasEl.width !== Math.floor(cssW * dpr) || canvasEl.height !== Math.floor(cssH * dpr)) {
        canvasEl.width = Math.floor(cssW * dpr);
        canvasEl.height = Math.floor(cssH * dpr);
        canvasEl.style.width = `${cssW}px`;
        canvasEl.style.height = `${cssH}px`;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const viewW = cssW;
      const viewH = cssH;
      const camX = clamp(player.x - viewW / 2, 0, Math.max(0, WORLD_W - viewW));
      const camY = clamp(player.y - viewH / 2, 0, Math.max(0, WORLD_H - viewH));

      context.clearRect(0, 0, viewW, viewH);
      if (sprites.grass && !grassPat) grassPat = context.createPattern(sprites.grass, "repeat");
      if (sprites.dirt && !dirtPat) dirtPat = context.createPattern(sprites.dirt, "repeat");
      if (grassPat) {
        context.fillStyle = grassPat;
        context.fillRect(0, 0, viewW, viewH);
      } else {
        context.fillStyle = "#3f7d45";
        context.fillRect(0, 0, viewW, viewH);
      }

      context.save();
      context.translate(-camX, -camY);

      for (const pond of ponds) {
        context.fillStyle = "rgba(46, 120, 158, 0.85)";
        context.beginPath();
        context.ellipse(pond.x, pond.y, pond.rx, pond.ry, 0, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = "rgba(214, 236, 214, 0.45)";
        context.lineWidth = 3;
        context.stroke();
      }

      context.lineJoin = "round";
      context.lineCap = "round";
      context.beginPath();
      CAMPS.forEach((camp, i) => {
        if (i === 0) context.moveTo(camp.x, camp.y);
        else context.lineTo(camp.x, camp.y);
      });
      context.lineWidth = 54;
      context.strokeStyle = dirtPat ?? "#c4a574";
      context.stroke();
      context.lineWidth = 4;
      context.strokeStyle = "rgba(90, 62, 32, 0.35)";
      context.stroke();

      for (const tree of trees) {
        drawSprite(context, sprites.tree, tree.x, tree.y, 78 * tree.s);
      }

      for (const camp of CAMPS) {
        const sprite = sprites[camp.prop];
        const doneCamp = clearedRef.current.has(camp.topic.id);
        if (doneCamp) {
          context.fillStyle = "rgba(232, 196, 74, 0.35)";
          context.beginPath();
          context.arc(camp.x, camp.y, 46, 0, Math.PI * 2);
          context.fill();
        }
        drawSprite(context, sprite, camp.x, camp.y - 8, 86);
        context.font = "600 13px 'Source Sans 3', sans-serif";
        context.textAlign = "center";
        context.fillStyle = "#102018";
        context.fillText(camp.topic.short, camp.x, camp.y + 52);
      }

      const bob = Math.sin(now / 140) * 2;
      context.save();
      context.translate(player.x, player.y + bob);
      context.scale(player.facing, 1);
      drawSprite(context, sprites.hero, 0, 0, 64);
      context.restore();
      context.restore();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const probe = {
      kind: "topdown" as const,
      get x() {
        return player.x;
      },
      get y() {
        return player.y;
      },
      nudge(ax: number, ay: number) {
        player.x += ax;
        player.y += ay;
      },
    };
    (window as unknown as { __controlsTest?: typeof probe }).__controlsTest = probe;

    void Promise.all([
      loadImage("/trail/hero.png"),
      loadImage("/trail/grass.png"),
      loadImage("/trail/dirt.png"),
      loadImage("/trail/tent.png"),
      loadImage("/trail/cairn.png"),
      loadImage("/trail/tree.png"),
      loadImage("/trail/sign.png"),
    ]).then(([hero, grass, dirt, tent, cairn, tree, sign]) => {
      if (!alive) return;
      sprites.hero = hero;
      sprites.grass = grass;
      sprites.dirt = dirt;
      sprites.tent = tent;
      sprites.cairn = cairn;
      sprites.tree = tree;
      sprites.sign = sign;
    });

    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const stick = (clientX: number, clientY: number, rect: DOMRect) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const max = rect.width / 2;
    const mag = Math.hypot(dx, dy) || 1;
    const scale = Math.min(1, mag / max);
    joy.current.x = (dx / mag) * scale;
    joy.current.y = (dy / mag) * scale;
  };

  return (
    <div className="overflow-hidden rounded border border-line bg-[#16351c]">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-navy px-3 py-2 text-white">
        <div>
          <p className="font-serif text-xl leading-none">Uro Trail</p>
          <p className="text-xs text-white/70">Walk to a camp. Enter the case.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span>
            {done} done
          </span>
          <span>{right} right</span>
          <span className="font-semibold">${right}</span>
          <span>
            {cleared.size}/{topics.length} camps
          </span>
        </div>
      </div>
      <div ref={wrapRef} className="relative h-[min(72vh,760px)] w-full touch-none">
        <canvas ref={canvasRef} className="block h-full w-full" />
        {hint ? (
          <p className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded bg-navy/85 px-3 py-2 text-center text-sm text-white">
            WASD or arrows to walk. Stand on a camp and press Enter.
          </p>
        ) : null}
        {near ? (
          <div className="absolute bottom-4 left-1/2 flex w-[min(92%,24rem)] -translate-x-1/2 flex-col gap-2 rounded border border-line bg-paper p-3 shadow-lg">
            <p className="font-semibold">{near.topic.short}</p>
            <p className="text-sm text-muted">{near.topic.blurb}</p>
            <button
              type="button"
              className="min-h-11 rounded bg-navy px-4 text-sm font-semibold text-white"
              onClick={() => onEnter(near.topic.id)}
            >
              {cleared.has(near.topic.id) ? "Replay case" : "Enter case"}
            </button>
          </div>
        ) : null}
        <div
          className="absolute bottom-4 left-4 h-28 w-28 rounded-full border border-white/40 bg-navy/35 sm:hidden"
          onPointerDown={(event) => {
            joy.current.id = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            stick(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
            setHint(false);
          }}
          onPointerMove={(event) => {
            if (joy.current.id !== event.pointerId) return;
            stick(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
          }}
          onPointerUp={() => {
            joy.current = { x: 0, y: 0, id: -1 };
          }}
          onPointerCancel={() => {
            joy.current = { x: 0, y: 0, id: -1 };
          }}
        />
      </div>
    </div>
  );
}

function nearest(x: number, y: number) {
  let best = CAMPS[0];
  let bestD = Infinity;
  for (const camp of CAMPS) {
    const d = Math.hypot(camp.x - x, camp.y - y);
    if (d < bestD) {
      best = camp;
      bestD = d;
    }
  }
  return best;
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  size: number,
) {
  if (!img) {
    ctx.fillStyle = "#f4efe4";
    ctx.beginPath();
    ctx.arc(x, y, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const w = size;
  const h = size * (img.height / img.width);
  ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isMove(code: string) {
  return (
    code === "KeyW" ||
    code === "KeyA" ||
    code === "KeyS" ||
    code === "KeyD" ||
    code === "ArrowUp" ||
    code === "ArrowLeft" ||
    code === "ArrowDown" ||
    code === "ArrowRight"
  );
}

function readPos(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { x?: number; y?: number };
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return null;
    return { x: parsed.x, y: parsed.y };
  } catch {
    return null;
  }
}
