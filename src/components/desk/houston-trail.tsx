import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { houstonStops, type HoustonStop } from "@/lib/desk/houston";
import { useDesk } from "@/lib/desk/provider";
import { getQuestion } from "@/lib/desk/catalog";
import type { TestBlock } from "@/lib/desk/types";

const AT = "houston-trail-at";

function passed(name: string, tests: TestBlock[]) {
  return tests.some((test) => {
    if (test.name !== name || test.status !== "done" || !test.questionIds.length) return false;
    let right = 0;
    for (const id of test.questionIds) {
      const answer = test.answers[id];
      if (answer?.submitted && answer.choice != null && answer.choice === getQuestion(id)?.answer) right += 1;
    }
    return right / test.questionIds.length >= 0.6;
  });
}

function roadFor(dest: HoustonStop) {
  if (dest.id === "hermann") return "/houston/road-rice.jpg";
  if (dest.id === "helix") return "/houston/road-park.jpg";
  return "/houston/road-tmc.jpg";
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
    if (dr * dr + dg * dg + db * db < 80 * 80) frame.data[i + 3] = 0;
  }
  ctx.putImageData(frame, 0, 0);
  return canvas;
}

function RoadWalk({ dest, onArrive }: { dest: HoustonStop; onArrive: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const arriveRef = useRef(onArrive);
  arriveRef.current = onArrive;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let alive = true;
    let raf = 0;
    const keys = new Set<string>();
    const player = { x: 0.5, y: 0.86 };
    let scene: HTMLImageElement | null = null;
    let hero: CanvasImageSource | null = null;
    let arrived = false;

    const onKey = (event: KeyboardEvent) => {
      const move = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
      if (move.includes(event.key.toLowerCase())) event.preventDefault();
      if (event.type === "keydown") keys.add(event.key.toLowerCase());
      else keys.delete(event.key.toLowerCase());
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    const resize = () => {
      const width = Math.min(520, wrap.clientWidth || 420);
      canvas.width = width;
      canvas.height = Math.round(width * 1.25);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);

    void Promise.all([loadImage(roadFor(dest)), loadImage("/field/towns/walker.jpg")]).then(([road, walker]) => {
      if (!alive) return;
      scene = road;
      hero = walker ? cutGreen(walker) : null;
    });

    const draw = () => {
      if (!alive) return;
      let dx = 0;
      let dy = 0;
      if (keys.has("arrowup") || keys.has("w")) dy -= 1;
      if (keys.has("arrowdown") || keys.has("s")) dy += 1;
      if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
      if (keys.has("arrowright") || keys.has("d")) dx += 1;
      if ((dx || dy) && !arrived) {
        const scale = dx && dy ? 0.7 : 1;
        player.x = Math.min(0.68, Math.max(0.32, player.x + dx * 0.006 * scale));
        player.y = Math.min(0.9, Math.max(0.08, player.y + dy * 0.006 * scale));
        if (player.y <= 0.12) {
          arrived = true;
          arriveRef.current();
        }
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (scene) ctx.drawImage(scene, 0, 0, canvas.width, canvas.height);
      else {
        ctx.fillStyle = "#8ea572";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      const px = player.x * canvas.width;
      const py = player.y * canvas.height;
      const w = canvas.width * 0.16;
      if (hero) ctx.drawImage(hero, px - w / 2, py - w, w, w * 1.15);
      else {
        ctx.fillStyle = "#f7f4ee";
        ctx.fillRect(px - 10, py - 28, 20, 32);
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
    };
  }, [dest.id]);

  return (
    <div ref={wrapRef} className="bg-[#1c2416]">
      <canvas ref={canvasRef} className="mx-auto block max-h-[70vh] w-full" />
      <p className="bg-[#f4efe4] px-4 py-3 text-sm text-[#24180f]">Walking to {dest.name}. Arrow keys or WASD. Walk to the top of the path.</p>
    </div>
  );
}

export function HoustonTrail() {
  const desk = useDesk();
  const navigate = useNavigate();
  const [at, setAt] = useState(() => {
    const saved = Number(localStorage.getItem(AT) ?? "0");
    return Number.isFinite(saved) ? Math.min(houstonStops.length - 1, Math.max(0, saved)) : 0;
  });
  const [walking, setWalking] = useState(false);
  const [map, setMap] = useState(false);
  const [pace, setPace] = useState<"steady" | "hurried">("steady");
  const [log, setLog] = useState("");
  const stop = houstonStops[at];
  const next = houstonStops[at + 1];
  const cleared = stop.kind !== "hospital" || passed(`Houston: ${stop.name}`, desk.state.tests);
  const miles = at * 0.6;

  const go = (nextIndex: number) => {
    const index = Math.min(houstonStops.length - 1, Math.max(0, nextIndex));
    localStorage.setItem(AT, String(index));
    setAt(index);
    setWalking(false);
    setMap(false);
  };

  const study = () => {
    const count = pace === "hurried" ? Math.min(12, stop.count + 2) : stop.count;
    const id = desk.createTest({
      mode: "tutor",
      adaptive: false,
      topicIds: stop.topics,
      pool: "all",
      count,
      name: `Houston: ${stop.name}`,
    });
    if (id) void navigate({ to: "/test/$id", params: { id } });
  };

  if (walking && next) {
    return (
      <section className="overflow-hidden rounded border border-line bg-[#f4efe4]">
        <RoadWalk dest={next} onArrive={() => go(at + 1)} />
      </section>
    );
  }

  return (
    <section className="relative min-h-[40rem] overflow-hidden rounded border border-line bg-black text-[#24180f]">
      {map ? (
        <div className="grid min-h-[40rem] gap-0 bg-[#f4efe4] lg:grid-cols-[minmax(0,1.2fr)_18rem]">
          <img src="/houston/map.png" alt="Texas Medical Center and Rice" className="h-full max-h-[40rem] w-full object-cover" />
          <ol className="max-h-[40rem] overflow-auto">
            {houstonStops.map((row, index) => {
              const done = row.kind !== "hospital" || passed(`Houston: ${row.name}`, desk.state.tests);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    disabled={index > at}
                    onClick={() => go(index)}
                    className={`flex w-full items-baseline justify-between gap-2 px-3 py-2 text-left text-sm ${index === at ? "bg-[#24180f] text-[#f4efe4]" : ""} disabled:opacity-40`}
                  >
                    <span>{row.name}</span>
                    <span>{done ? "Clear" : index === at ? "Here" : ""}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <img src={stop.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className={`absolute inset-x-0 bottom-0 border-t-4 border-[#24180f] bg-[#f4efe4] p-4 ${map ? "lg:left-auto lg:w-72" : ""}`}>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-serif text-2xl">{stop.name}</h1>
          <p className="text-xs font-semibold">
            Mile {miles.toFixed(1)} · {pace}
          </p>
        </div>
        <p className="text-sm leading-relaxed">{stop.note}</p>
        {log ? <p className="mt-2 text-sm font-semibold">{log}</p> : null}
        {stop.kind === "hospital" && !cleared ? <p className="mt-2 text-sm">The road ahead is closed until this post is passed at 60%.</p> : null}
        {cleared && stop.kind === "hospital" ? <p className="mt-2 text-sm font-semibold">This post is cleared. The path is open.</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {stop.topics.length > 0 ? (
            <button type="button" onClick={study} className="min-h-11 rounded bg-[#24180f] px-3 text-sm font-semibold text-[#f4efe4]">
              {pace === "hurried" ? "Study at a hurry" : "Study here"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLog(stop.id === "rice" ? "You ran the outer loop and caught your breath." : stop.id === "hermann" ? "You ran the park. The zoo is on your way south." : "You cross into the medical center.")}
              className="min-h-11 rounded bg-[#24180f] px-3 text-sm font-semibold text-[#f4efe4]"
            >
              {stop.kind === "rest" ? "Rest and run" : "Look around"}
            </button>
          )}
          <button
            type="button"
            disabled={!cleared || !next}
            onClick={() => {
              setLog("");
              setMap(false);
              setWalking(true);
            }}
            className="min-h-11 rounded border border-[#24180f] px-3 text-sm font-semibold disabled:opacity-40"
          >
            {next ? `Walk to ${next.name}` : "End of the trail"}
          </button>
          <button type="button" onClick={() => setMap((open) => !open)} className="min-h-11 rounded border border-[#24180f]/30 px-3 text-sm font-semibold">
            {map ? "Back to the landmark" : "Look at the map"}
          </button>
          <button
            type="button"
            onClick={() => setPace((current) => (current === "steady" ? "hurried" : "steady"))}
            className="min-h-11 rounded border border-[#24180f]/30 px-3 text-sm font-semibold"
          >
            Pace: {pace}
          </button>
        </div>
      </div>
    </section>
  );
}
