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
  if (element === "Rock") {
    return (
      <g fill={color}>
        <ellipse cx="24" cy="27" rx="10" ry="5" />
        <ellipse cx="21" cy="21" rx="7" ry="4.5" />
        <ellipse cx="27" cy="16" rx="4.5" ry="3.2" />
      </g>
    );
  }
  if (element === "Fire") {
    return <path d="M24 8c1 5 8 7 8 14a8 8 0 0 1-16 0c0-4 3-6 4-9 1 3 2 4 4-5z" fill={color} />;
  }
  if (element === "Water") {
    return (
      <g fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round">
        <path d="M10 16c2.4 0 2.4-3 4.8-3s2.4 3 4.8 3 2.4-3 4.8-3 2.4 3 4.8 3" />
        <path d="M10 22c2.4 0 2.4-3 4.8-3s2.4 3 4.8 3 2.4-3 4.8-3 2.4 3 4.8 3" />
        <path d="M10 28c2.4 0 2.4-3 4.8-3s2.4 3 4.8 3 2.4-3 4.8-3 2.4 3 4.8 3" />
      </g>
    );
  }
  if (element === "Electric") return <path d="M27 8h-8l-3 11h6l-3 12 12-15h-7z" fill={color} />;
  if (element === "Grass") {
    return (
      <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <circle cx="24" cy="16" r="8" />
        <path d="M24 8v16M16 16h16M18.5 10.5l11 11M29.5 10.5l-11 11" />
        <path d="M24 24v8M20 32h8" />
      </g>
    );
  }
  if (element === "Psychic") {
    return (
      <g fill="none" stroke={color} strokeWidth="2">
        <circle cx="24" cy="20" r="8" />
        <circle cx="24" cy="20" r="3" fill={color} stroke="none" />
        <path d="M16 28c3 3 5 4 8 4s5-1 8-4" />
      </g>
    );
  }
  if (element === "Poison") {
    return (
      <g fill={color}>
        <path d="M20 10h8l-1 6h3l-6 14-6-14h3z" />
        <circle cx="18" cy="28" r="2" />
        <circle cx="30" cy="27" r="1.6" />
      </g>
    );
  }
  if (element === "Ground") {
    return (
      <g fill="none" stroke={color} strokeWidth="2">
        <circle cx="24" cy="21" r="9" />
        <path d="M15 21h18M24 12c2 3 2 6 0 9s-2 6 0 9M24 12c-2 3-2 6 0 9s2 6 0 9" />
      </g>
    );
  }
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
