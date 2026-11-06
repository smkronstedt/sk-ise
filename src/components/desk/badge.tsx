const mark: Record<string, string> = {
  Rock: "🪨",
  Water: "💧",
  Electric: "⚡",
  Grass: "🍃",
  Poison: "🟣",
  Psychic: "🔮",
  Fire: "🔥",
  Ground: "⛰️",
};

export function Badge({ element, earned }: { element: string; earned: boolean }) {
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-lg ${
        earned ? "border-amber-500 bg-amber-100" : "border-neutral-300 bg-neutral-100 grayscale"
      }`}
      title={earned ? `${element} badge` : `${element} badge locked`}
    >
      {mark[element] ?? "•"}
    </div>
  );
}
