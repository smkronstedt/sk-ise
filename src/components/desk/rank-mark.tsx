export function RankMark({ title, on }: { title: string; on: boolean }) {
  const ink = on ? "#1d3557" : "#b7b1a6";
  const gold = on ? "#c9a15b" : "#d9d3c7";
  const bars = title.startsWith("Junior") ? 2 : title.startsWith("Senior") ? 3 : title.startsWith("Chief") ? 4 : title === "Intern" ? 1 : 0;
  return (
    <svg viewBox="0 0 36 36" aria-hidden className="h-9 w-9 shrink-0">
      <rect x="1" y="1" width="34" height="34" rx="4" fill={on ? "#f7f1e4" : "#f3f1ea"} stroke={gold} strokeWidth="2" />
      {bars > 0
        ? Array.from({ length: bars }, (_, index) => (
            <rect key={index} x={8 + index * 6} y="8" width="4" height="20" rx="1" fill={ink} />
          ))
        : null}
      {title === "Medical Student" ? <circle cx="18" cy="18" r="6" fill="none" stroke={ink} strokeWidth="2" /> : null}
      {title === "Fellow" ? <polygon points="18,7 21,15 29,15 23,20 25,28 18,23 11,28 13,20 7,15 15,15" fill={gold} stroke={ink} strokeWidth="1" /> : null}
      {title === "Attending" ? (
        <>
          <polygon points="18,8 20,14 26,14 21,18 23,24 18,20 13,24 15,18 10,14 16,14" fill={gold} stroke={ink} strokeWidth="1" />
          <rect x="8" y="27" width="20" height="3" rx="1" fill={ink} />
        </>
      ) : null}
      {title.includes("Professor") && title !== "Endowed Professor of Surgery" ? (
        <>
          <path d="M8 24 L18 10 L28 24" fill="none" stroke={ink} strokeWidth="2" />
          <path d="M12 24 H24" stroke={ink} strokeWidth="2" />
        </>
      ) : null}
      {title === "Endowed Professor of Surgery" ? (
        <>
          <path d="M8 22 C12 12 24 12 28 22" fill="none" stroke={gold} strokeWidth="2" />
          <path d="M10 24 L18 14 L26 24" fill="none" stroke={ink} strokeWidth="2" />
        </>
      ) : null}
      {title === "Chair of TMC" ? (
        <>
          <rect x="8" y="26" width="20" height="3" fill={ink} />
          <rect x="11" y="12" width="3" height="14" fill={ink} />
          <rect x="22" y="12" width="3" height="14" fill={ink} />
          <rect x="10" y="9" width="16" height="3" fill={gold} />
        </>
      ) : null}
      {title.includes("SEAL") ? (
        <>
          <path d="M18 6 V16 M12 12 H24 M10 20 L18 30 L26 20" fill="none" stroke={ink} strokeWidth="2" />
          <circle cx="18" cy="16" r="2" fill={gold} />
        </>
      ) : null}
      {title.includes("President") ? <polygon points="18,8 21,15 28,15 22,19 24,26 18,22 12,26 14,19 8,15 15,15" fill={gold} stroke={ink} strokeWidth="1" /> : null}
      {title.startsWith("MD PhD") ? (
        <>
          <rect x="12" y="10" width="12" height="16" rx="1" fill="none" stroke={ink} strokeWidth="2" />
          <path d="M15 16 H21 M18 13 V19" stroke={gold} strokeWidth="2" />
        </>
      ) : null}
    </svg>
  );
}
