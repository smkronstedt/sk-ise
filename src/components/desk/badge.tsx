const tone: Record<string, { rim: string; face: string; mark: string }> = {
  Rock: { rim: "#6e5428", face: "#e8d2a2", mark: "#3d2c14" },
  Fire: { rim: "#8d2430", face: "#ffb15a", mark: "#5a1218" },
  Water: { rim: "#1d4e6a", face: "#9fd4ef", mark: "#14384a" },
  Psychic: { rim: "#5c3d86", face: "#e4d4f6", mark: "#3a2460" },
  Electric: { rim: "#8a6a10", face: "#ffe56a", mark: "#3a3008" },
  Grass: { rim: "#246b34", face: "#b6e8a8", mark: "#143c1c" },
  Poison: { rim: "#5a3470", face: "#d7b6e8", mark: "#2e1840" },
  Ground: { rim: "#6d4524", face: "#e0b88a", mark: "#3a2412" },
};

function Mark({ element, color }: { element: string; color: string }) {
  if (element === "Fire") return <path d="M24 12c2 4 6 5 6 10a6 6 0 1 1-12 0c0-3 2-4 3-7 1 2 2 3 3-3z" fill={color} />;
  if (element === "Water") return <path d="M24 12c4 5 8 8 8 13a8 8 0 1 1-16 0c0-5 4-8 8-13z" fill={color} />;
  if (element === "Electric") return <path d="M26 11h-6l-2 9h5l-2 10 9-13h-6z" fill={color} />;
  if (element === "Grass") return <path d="M24 12c-6 4-8 10-8 14 4-2 6-2 8 2 2-4 4-4 8-2 0-4-2-10-8-14z" fill={color} />;
  if (element === "Psychic") return <circle cx="24" cy="21" r="5" fill="none" stroke={color} strokeWidth="2.5" />;
  if (element === "Poison") return <circle cx="24" cy="20" r="5" fill={color} />;
  if (element === "Ground") return <path d="M14 26h20l-3-6-4 3-3-5-4 4-3-2z" fill={color} />;
  return <path d="M24 13l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z" fill={color} />;
}

export function Badge({ element, earned, size = "md" }: { element: string; earned: boolean; size?: "sm" | "md" }) {
  const paint = tone[element] ?? tone.Rock;
  const px = size === "sm" ? 28 : 48;
  const rim = earned ? paint.rim : "#9a968c";
  const face = earned ? paint.face : "#e4e0d6";
  const mark = earned ? paint.mark : "#b0aca2";
  return (
    <svg width={px} height={px} viewBox="0 0 48 52" role="img" aria-label={earned ? `${element} badge` : `${element} badge, not yet`} className="shrink-0">
      <path d="M18 34l6-4 6 4v12l-6-3-6 3z" fill={rim} />
      <circle cx="24" cy="22" r="16" fill={face} stroke={rim} strokeWidth="4" />
      <circle cx="24" cy="22" r="12" fill="none" stroke={rim} strokeWidth="1.5" opacity="0.7" />
      <Mark element={element} color={mark} />
    </svg>
  );
}

export function BadgeRow({ elements, size = "sm" }: { elements: string[]; size?: "sm" | "md" }) {
  if (!elements.length) return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      {elements.map((element) => (
        <Badge key={element} element={element} earned size={size} />
      ))}
    </span>
  );
}
