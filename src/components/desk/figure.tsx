import type { FigureId } from "@/lib/desk/types";

export function Figure({ id }: { id: FigureId }) {
  return (
    <div className="my-3 overflow-hidden rounded border border-line bg-chip">
      {id === "ph" && <PhScale />}
      {id === "hpg" && <Hpg />}
      {id === "hct" && <Hct />}
      {id === "bosniak" && <Bosniak />}
      {id === "bcg" && <Bcg />}
      {id === "screen" && <Screen />}
      {id === "retur" && <Restage />}
      {id === "diversion" && <Diversion />}
      {id === "explore" && <Explore />}
      {id === "swl" && <Swl />}
      {id === "nlutd" && <Pressure />}
      {id === "bladder-stage" && <Bladder />}
    </div>
  );
}

function Caption({ children }: { children: string }) {
  return <p className="px-3 py-2 text-xs font-semibold tracking-wide text-muted uppercase">{children}</p>;
}

function PhScale() {
  const zones = [
    { label: "Uric acid", range: "pH < 5.5", tone: "bg-wrong-bg" },
    { label: "CaOx / cystine alkali target", range: "pH ~6.5–7", tone: "bg-blue-soft" },
    { label: "Distal RTA / CaP", range: "pH > 6.5", tone: "bg-mark-bg" },
  ];
  return (
    <div>
      <Caption>Urine pH and the stone it favors</Caption>
      <div className="grid gap-2 p-3 sm:grid-cols-3">
        {zones.map((zone) => (
          <div key={zone.label} className={`rounded border border-line px-3 py-2 ${zone.tone}`}>
            <p className="text-sm font-semibold">{zone.label}</p>
            <p className="text-sm text-muted">{zone.range}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hpg() {
  return (
    <div>
      <Caption>Axis when fertility matters</Caption>
      <svg viewBox="0 0 420 150" className="h-auto w-full">
        <rect x="16" y="28" width="110" height="36" rx="6" fill="#0c3b66" />
        <text x="71" y="51" textAnchor="middle" fill="#fff" fontSize="13">Hypothalamus</text>
        <rect x="155" y="28" width="110" height="36" rx="6" fill="#1565c0" />
        <text x="210" y="51" textAnchor="middle" fill="#fff" fontSize="13">Pituitary LH</text>
        <rect x="294" y="28" width="110" height="36" rx="6" fill="#1b7a3a" />
        <text x="349" y="51" textAnchor="middle" fill="#fff" fontSize="13">Leydig / sperm</text>
        <path d="M126 46 H155" stroke="#1b1e22" strokeWidth="1.5" />
        <path d="M265 46 H294" stroke="#1b1e22" strokeWidth="1.5" />
        <text x="210" y="100" textAnchor="middle" fontSize="13" fill="#b42318">Exogenous testosterone shuts this off</text>
        <text x="210" y="122" textAnchor="middle" fontSize="13" fill="#1b1e22">Clomiphene or hCG keeps the signal</text>
      </svg>
    </div>
  );
}

function Hct() {
  return (
    <div>
      <Caption>Hematocrit on testosterone</Caption>
      <div className="grid gap-2 p-3 sm:grid-cols-2">
        <div className="rounded border border-line bg-paper px-3 py-2">
          <p className="text-sm font-semibold">Under 54%</p>
          <p className="text-sm text-muted">Continue. Recheck on schedule.</p>
        </div>
        <div className="rounded border border-wrong bg-wrong-bg px-3 py-2">
          <p className="text-sm font-semibold">54% or higher</p>
          <p className="text-sm">High T: lower the dose. In-range T: stop and look for another cause.</p>
        </div>
      </div>
    </div>
  );
}

function Bosniak() {
  const rows = [
    ["I–II", "Leave alone"],
    ["IIF", "Follow"],
    ["III–IV", "Treat as surgical"],
  ];
  return (
    <div>
      <Caption>Bosniak, cystic lesions only</Caption>
      <div className="grid grid-cols-3 gap-2 p-3">
        {rows.map(([name, plan]) => (
          <div key={name} className="rounded border border-line bg-paper px-2 py-2 text-center">
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-muted">{plan}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bcg() {
  return (
    <div>
      <Caption>Adequate BCG, then the clock</Caption>
      <svg viewBox="0 0 520 88" className="h-auto w-full">
        <line x1="24" y1="40" x2="496" y2="40" stroke="#0c3b66" strokeWidth="3" />
        {[
          [40, "Induction"],
          [180, "Maintenance"],
          [340, "HG back ≤12 mo"],
          [470, "Unresponsive"],
        ].map(([x, label]) => (
          <g key={String(label)}>
            <circle cx={Number(x)} cy="40" r="7" fill="#c45c4a" />
            <text x={Number(x)} y="68" textAnchor="middle" fontSize="11" fill="#1b1e22">
              {label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Screen() {
  return (
    <div>
      <Caption>When to start the PSA talk</Caption>
      <div className="grid gap-2 p-3 sm:grid-cols-3">
        <div className="rounded border border-line bg-paper px-3 py-2">
          <p className="text-sm font-semibold">Higher risk</p>
          <p className="text-sm text-muted">About 40–45</p>
        </div>
        <div className="rounded border border-line bg-paper px-3 py-2">
          <p className="text-sm font-semibold">Average risk</p>
          <p className="text-sm text-muted">About 45–50</p>
        </div>
        <div className="rounded border border-line bg-paper px-3 py-2">
          <p className="text-sm font-semibold">After 70</p>
          <p className="text-sm text-muted">Only if life expectancy supports it</p>
        </div>
      </div>
    </div>
  );
}

function Restage() {
  return (
    <div>
      <Caption>High-grade T1 path</Caption>
      <p className="px-3 pb-3 text-sm">TURBT → restage in 4–6 weeks → then BCG, or cystectomy if muscle or very-high-risk features remain.</p>
    </div>
  );
}

function Diversion() {
  return (
    <div>
      <Caption>Bowel in contact with urine</Caption>
      <div className="grid gap-2 p-3 sm:grid-cols-3">
        <div className="rounded border border-line bg-paper px-3 py-2">
          <p className="text-sm font-semibold">Ileum / colon</p>
          <p className="text-sm text-muted">High Cl, low HCO3</p>
        </div>
        <div className="rounded border border-line bg-paper px-3 py-2">
          <p className="text-sm font-semibold">Jejunum</p>
          <p className="text-sm text-muted">Low Na, low Cl, acidosis</p>
        </div>
        <div className="rounded border border-line bg-paper px-3 py-2">
          <p className="text-sm font-semibold">Stomach</p>
          <p className="text-sm text-muted">Alkalosis</p>
        </div>
      </div>
    </div>
  );
}

function Explore() {
  return (
    <div>
      <Caption>Open the perinephric hematoma if</Caption>
      <ul className="list-disc px-8 pb-3 text-sm">
        <li>It is expanding or pulsatile</li>
        <li>The patient is unstable from the kidney</li>
        <li>A pedicle injury is suspected</li>
      </ul>
    </div>
  );
}

function Swl() {
  return (
    <div>
      <Caption>Shockwave resistance</Caption>
      <p className="px-3 pb-3 text-sm">Hardest: brushite, cystine, calcium oxalate monohydrate. Uric acid breaks more easily. A large staghorn is a PCNL because of size, not because struvite is the hardest stone.</p>
    </div>
  );
}

function Pressure() {
  return (
    <div>
      <Caption>Storage pressure</Caption>
      <div className="mx-3 mb-3 h-3 overflow-hidden rounded bg-line">
        <div className="h-full w-2/5 bg-correct" />
      </div>
      <p className="px-3 pb-3 text-sm">Detrusor leak-point pressure above 40 cm H2O is the threshold tied to upper-tract damage.</p>
    </div>
  );
}

function Bladder() {
  return (
    <div>
      <Caption>Poor trimodal candidates</Caption>
      <p className="px-3 pb-3 text-sm">Hydronephrosis, widespread CIS, incomplete resection, or a bladder that already fails. A mid-course check that still shows tumor means stop and remove the bladder.</p>
    </div>
  );
}
