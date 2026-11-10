import { useEffect, useState } from "react";
import type { City } from "@/lib/desk/route";
import { markTrial, trialDone } from "@/lib/desk/honors";

export function TownTrial({ city, onClose }: { city: City; onClose: () => void }) {
  const [won, setWon] = useState(trialDone(city.id));
  const [note, setNote] = useState(trialDone(city.id) ? "You already have this town's badge." : "A short trial. One badge.");
  const [order, setOrder] = useState<number[]>([]);
  const [next, setNext] = useState(1);
  const [bar, setBar] = useState(0);
  const [hold, setHold] = useState(0);
  const [lit, setLit] = useState(0);
  const [hits, setHits] = useState(0);

  useEffect(() => {
    setOrder([1, 2, 3, 4].sort(() => Math.random() - 0.5));
  }, [city.id]);

  useEffect(() => {
    if (won) return;
    const timer = window.setInterval(() => setBar((value) => (value + 4) % 100), 40);
    return () => window.clearInterval(timer);
  }, [won, city.id]);

  const finish = () => {
    markTrial(city.id);
    setWon(true);
    setNote(`${city.city} badge earned.`);
  };

  const tapOrder = (value: number) => {
    if (value !== next) {
      setNext(1);
      setNote("Start again at 1.");
      return;
    }
    if (value === 4) finish();
    else {
      setNext(value + 1);
      setNote(`Next is ${value + 1}.`);
    }
  };

  return (
    <div className="absolute inset-x-0 top-16 z-20 border-4 border-black bg-[#f8f8d8] p-3 text-black">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">{city.city} trial</p>
        <button type="button" onClick={onClose} className="min-h-11 border-4 border-black bg-black px-3 text-sm font-bold text-[#fff4a8]">Close</button>
      </div>
      <p className="mt-1 text-sm">{note}</p>
      {won ? null : city.element === "Rock" || city.element === "Ground" ? (
        <div className="mt-3 flex gap-2">
          {order.map((value) => (
            <button key={value} type="button" onClick={() => tapOrder(value)} className="min-h-14 min-w-14 border-4 border-black bg-white text-lg font-bold">{value}</button>
          ))}
        </div>
      ) : city.element === "Water" || city.element === "Fire" ? (
        <div className="mt-3">
          <div className="relative h-8 border-4 border-black bg-white">
            <div className="absolute inset-y-0 left-1/3 w-1/3 bg-[#b7e4a8]" />
            <div className="absolute top-0 h-full w-2 bg-black" style={{ left: `${bar}%` }} />
          </div>
          <button type="button" onClick={() => (bar > 33 && bar < 66 ? finish() : setNote("The mark has to sit in the green."))} className="mt-2 min-h-11 border-4 border-black bg-white px-3 text-sm font-bold">Stop</button>
        </div>
      ) : city.element === "Electric" ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5].map((cell) => (
            <button
              key={cell}
              type="button"
              onClick={() => {
                if (cell !== lit) return;
                const count = hits + 1;
                setHits(count);
                setLit((cell + 2) % 6);
                if (count >= 5) finish();
              }}
              className={`min-h-14 border-4 border-black ${cell === lit ? "bg-[#f2d15a]" : "bg-white"}`}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <button
            type="button"
            onPointerDown={() => {
              const started = Date.now();
              const timer = window.setInterval(() => {
                const gone = Date.now() - started;
                setHold(gone);
                if (gone >= 1500) {
                  window.clearInterval(timer);
                  finish();
                }
              }, 50);
              const up = () => {
                window.clearInterval(timer);
                window.removeEventListener("pointerup", up);
              };
              window.addEventListener("pointerup", up);
            }}
            className="min-h-14 border-4 border-black bg-white px-3 text-sm font-bold"
          >
            Hold {Math.min(1500, hold)} / 1500
          </button>
        </div>
      )}
    </div>
  );
}
