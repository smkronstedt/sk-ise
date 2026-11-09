import { gear, type Slot } from "@/lib/desk/ops";

const anchors: Record<Slot, { x: number; y: number }> = {
  head: { x: 100, y: 36 },
  eyes: { x: 100, y: 58 },
  plate: { x: 100, y: 118 },
  uniform: { x: 100, y: 150 },
  workout: { x: 168, y: 168 },
  boots: { x: 100, y: 292 },
  primary: { x: 168, y: 150 },
  sidearm: { x: 32, y: 168 },
  extra: { x: 32, y: 128 },
  ride: { x: 32, y: 250 },
  partner: { x: 168, y: 230 },
};

export function CampLoadout({ equipped, owned }: { equipped: Partial<Record<Slot, string>>; owned: string[] }) {
  const worn = (slot: Slot) => gear.find((item) => item.id === equipped[slot]);
  const head = worn("head");
  const eyes = worn("eyes");
  const plate = worn("plate");
  const uniform = worn("uniform");
  const workout = worn("workout");
  const boots = worn("boots");
  const primary = worn("primary");
  const sidearm = worn("sidearm");
  const extra = worn("extra");
  const ride = worn("ride");
  const partner = worn("partner");
  const shelf = owned
    .map((id) => gear.find((item) => item.id === id))
    .filter((item) => item?.slot === "supply")
    .map((item) => item?.name ?? "");
  const crye = uniform?.id === "crye";
  const tank = uniform?.id === "tank";
  const torso = tank ? "#c4a574" : crye ? "#6d5a3c" : "#8a7048";

  return (
    <div className="w-full">
      <svg viewBox="0 0 200 340" className="w-full rounded border border-ops-amber bg-[#1a1c16]" role="img" aria-label="Loadout">
        <text x="100" y="16" textAnchor="middle" fill="#d6c7a1" fontSize="9" fontWeight="700">
          LOADOUT
        </text>
        {partner ? <Dog name={partner.name} /> : null}
        {ride ? <Chip x={anchors.ride.x} y={anchors.ride.y} text={ride.name} /> : null}
        <g>
          <ellipse cx="100" cy="308" rx="28" ry="6" fill="#000" opacity="0.35" />
          <path d="M86 250 L78 300 L92 300 L96 250 Z" fill={boots ? "#2a241c" : "#3a3228"} />
          <path d="M114 250 L122 300 L108 300 L104 250 Z" fill={boots ? "#2a241c" : "#3a3228"} />
          <path d="M78 292 L96 292 L98 304 L74 304 Z" fill={boots ? "#111" : "#222"} />
          <path d="M122 292 L104 292 L102 304 L126 304 Z" fill={boots ? "#111" : "#222"} />
          <path d="M86 118 L72 168 L78 250 L98 250 L100 160 Z" fill={torso} />
          <path d="M114 118 L128 168 L122 250 L102 250 L100 160 Z" fill={torso} />
          {workout ? <path d="M80 176 L76 214 L98 214 L100 176 Z M120 176 L124 214 L102 214 L100 176 Z" fill="#1d3a28" /> : null}
          <path d="M86 122 L58 150 L64 196 L78 176 Z" fill={torso} />
          <path d="M114 122 L142 150 L136 196 L122 176 Z" fill={torso} />
          {crye ? (
            <g fill="#3d3426">
              <rect x="70" y="154" width="16" height="10" rx="2" />
              <rect x="114" y="154" width="16" height="10" rx="2" />
              <rect x="80" y="214" width="14" height="8" rx="2" />
              <rect x="106" y="214" width="14" height="8" rx="2" />
            </g>
          ) : null}
          {plate ? <path d="M84 112 L116 112 L120 168 L80 168 Z" fill={plate.id === "carrier" ? "#4a463c" : "#3e4a34"} stroke="#d6c7a1" strokeWidth="1" /> : null}
          <circle cx="100" cy="78" r="22" fill="#c9a27a" />
          {head?.id === "cap" ? <path d="M76 70 Q100 48 124 70 L128 76 L72 76 Z" fill="#1d3a28" /> : null}
          {head && head.id !== "cap" ? <path d="M74 72 Q100 42 126 72 L122 86 Q100 74 78 86 Z" fill={head.id === "kevlar" ? "#3c4634" : "#5c5346"} /> : null}
          {eyes ? <rect x="84" y="74" width="32" height="8" rx="3" fill={eyes.id === "quad" ? "#111" : eyes.id.startsWith("nvg") ? "#1a3a22" : "#222"} /> : null}
          {primary?.id === "launcher" ? <rect x="138" y="124" width="14" height="70" rx="2" fill="#2a2a28" /> : null}
          {primary?.id === "m4" ? <path d="M136 132 L186 118 L188 126 L140 148 Z" fill="#2a2a28" /> : null}
          {sidearm ? <rect x="58" y="168" width="16" height="22" rx="2" fill="#1a1a1a" /> : null}
          {extra ? <rect x="78" y="176" width="12" height="16" rx="2" fill="#5a3a28" /> : null}
        </g>
        {head ? <Chip x={anchors.head.x} y={anchors.head.y} text={short(head.name)} /> : null}
        {eyes ? <Chip x={anchors.eyes.x} y={48} text={short(eyes.name)} /> : null}
        {plate ? <Chip x={148} y={112} text={short(plate.name)} /> : null}
        {uniform ? <Chip x={36} y={150} text={short(uniform.name)} /> : null}
        {boots ? <Chip x={100} y={326} text={short(boots.name)} /> : null}
        {primary ? <Chip x={168} y={108} text={short(primary.name)} /> : null}
        {sidearm ? <Chip x={28} y={196} text={short(sidearm.name)} /> : null}
        {extra ? <Chip x={28} y={112} text={short(extra.name)} /> : null}
        {workout ? <Chip x={168} y={188} text={short(workout.name)} /> : null}
      </svg>
      <p className="mt-2 text-center text-xs text-ops-olive">{shelf.length ? `Shelf: ${shelf.join(", ")}` : "Shelf is empty."}</p>
    </div>
  );
}

function short(name: string) {
  return name.length > 18 ? `${name.slice(0, 16)}…` : name;
}

function Chip({ x, y, text }: { x: number; y: number; text: string }) {
  const width = Math.max(46, text.length * 4.4);
  return (
    <g>
      <rect x={x - width / 2} y={y - 7} width={width} height="12" rx="2" fill="#111" opacity="0.85" />
      <text x={x} y={y + 2} textAnchor="middle" fill="#f3ecd8" fontSize="7">
        {text}
      </text>
    </g>
  );
}

function Dog({ name }: { name: string }) {
  return (
    <g>
      <ellipse cx="168" cy="248" rx="16" ry="8" fill="#6b4a2a" />
      <circle cx="182" cy="240" r="6" fill="#6b4a2a" />
      <rect x="160" y="242" width="14" height="8" fill="#3a3a32" />
      <Chip x={168} y={268} text={short(name)} />
    </g>
  );
}
