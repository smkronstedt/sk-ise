import { useEffect, useState } from "react";
import { stagingCards, stagingOrgans, type StagingCard } from "@/lib/desk/staging-deck";

export function StagingReview() {
  const [organ, setOrgan] = useState<(typeof stagingOrgans)[number] | "All">("All");
  const [queue, setQueue] = useState<StagingCard[]>(stagingCards);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const next = organ === "All" ? stagingCards : stagingCards.filter((card) => card.organ === organ);
    setQueue(next);
    setIndex(0);
    setRevealed(false);
  }, [organ]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      event.preventDefault();
      setRevealed((open) => {
        if (open) {
          setIndex((current) => (queue.length ? (current + 1) % queue.length : 0));
          return false;
        }
        return true;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [queue.length]);

  const card = queue[index];
  if (!card) return <p className="text-sm text-muted">No cards in that set.</p>;

  const again = () => {
    const atEnd = index >= queue.length - 1;
    setQueue((current) => {
      if (current.length < 2) return current;
      const copy = current.slice();
      const at = Math.min(index, copy.length - 1);
      const [item] = copy.splice(at, 1);
      copy.push(item);
      return copy;
    });
    if (atEnd) setIndex(0);
    setRevealed(false);
  };

  const next = () => {
    setIndex((current) => (current + 1) % queue.length);
    setRevealed(false);
  };

  return (
    <div>
      <p className="text-sm text-muted">Cutoffs that change the next step. Separate from the cards you already have due.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["All", ...stagingOrgans] as const).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setOrgan(name)}
            className={`min-h-11 rounded px-3 text-sm font-semibold ${organ === name ? "bg-navy text-white" : "border border-line bg-paper"}`}
          >
            {name}
          </button>
        ))}
      </div>
      <article className="mt-4 max-w-2xl rounded border border-line bg-paper p-6">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          {card.organ} · {index + 1} of {queue.length}
        </p>
        <p className="mt-2 text-lg font-semibold leading-relaxed">{card.front}</p>
        {revealed ? (
          <p className="mt-4 border-t border-line pt-4 leading-relaxed">{card.back}</p>
        ) : (
          <button type="button" onClick={() => setRevealed(true)} className="mt-6 min-h-11 rounded bg-navy px-4 font-semibold text-white">
            Show answer
          </button>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={again} className="min-h-11 rounded border border-line px-3 text-sm font-semibold">
            Again
          </button>
          <button type="button" onClick={next} className="min-h-11 rounded bg-navy px-4 text-sm font-semibold text-white">
            Next
          </button>
        </div>
        <p className="mt-3 text-sm text-muted">Space shows the answer. Space again goes to the next card.</p>
      </article>
    </div>
  );
}
