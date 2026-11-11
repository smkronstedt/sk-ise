import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/desk/shell";
import { questions } from "@/lib/desk/questions";
import { logActivity, logCorrect } from "@/lib/desk/activity";

export const Route = createFileRoute("/uds")({
  component: UdsPage,
});

const stations = [
  {
    id: "cmg",
    title: "CMG",
    body: "Cystometry is the filling limb. Pdet is Pves minus Pabd. A phasic rise in Pdet is detrusor overactivity. A steady climb is poor compliance. Detrusor leak point pressure is the storage pressure at leak without a push and without a detrusor contraction. About 40 cm of water is the classic upper-tract danger line. A single bladder catheter cannot prove the rise came from the detrusor.",
  },
  {
    id: "vuds",
    title: "VUDS",
    body: "Videourodynamics is the same pressure study plus fluoroscopy. You see if the bladder neck opens, if the sphincter snaps shut, and if contrast refluxes. Detrusor sphincter dyssynergia is a neurogenic detrusor contraction against the sphincter. A closed neck with a quiet sphincter is bladder neck obstruction, not dyssynergia.",
  },
  {
    id: "pfs",
    title: "Pressure-flow",
    body: "A free flow cannot diagnose obstruction. High detrusor pressure and low flow is obstruction. Low pressure and low flow is a weak bladder. BOOI = Pdet at Qmax minus 2 times Qmax. Above 40 is obstructed. Below 20 is not.",
  },
] as const;

function UdsPage() {
  const [station, setStation] = useState(0);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const current = stations[station];
  const items = questions.filter((question) => question.id.startsWith(`uds-${current.id === "pfs" ? "pfs" : current.id === "vuds" ? "vud" : "cmg"}`));
  const item = items[index];
  const revealed = picked != null;

  const next = () => {
    setPicked(null);
    if (index < items.length - 1) setIndex(index + 1);
    else if (station < stations.length - 1) {
      setStation(station + 1);
      setIndex(0);
    }
  };

  return (
    <Shell>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Urodynamics</p>
      <h1 className="font-serif text-3xl tracking-tight">Bootcamp</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Three stations. Read the board, then answer. The trace stays hidden until you choose.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {stations.map((row, number) => (
          <button
            key={row.id}
            type="button"
            onClick={() => {
              setStation(number);
              setIndex(0);
              setPicked(null);
            }}
            className={`min-h-11 rounded px-3 text-sm font-semibold ${station === number ? "bg-navy text-white" : "border border-line bg-paper"}`}
          >
            {row.title}
          </button>
        ))}
        <Link to="/create" className="min-h-11 rounded border border-line bg-paper px-3 py-2 text-sm font-semibold">
          Build a longer set
        </Link>
      </div>
      <article className="mt-4 rounded border border-line bg-paper p-4">
        <h2 className="font-serif text-2xl">{current.title}</h2>
        <p className="mt-2 max-w-3xl leading-relaxed">{current.body}</p>
      </article>
      {item ? (
        <article className="mt-4 rounded border border-line bg-paper p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            {current.title} · {index + 1} of {items.length}
          </p>
          {item.stem.map((line) => (
            <p key={line} className="mt-2 leading-relaxed">
              {line}
            </p>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            {item.choices.map((choice, choiceIndex) => {
              const tone =
                !revealed ? "border-line bg-paper" : choiceIndex === item.answer ? "border-correct bg-correct-bg" : picked === choiceIndex ? "border-wrong bg-wrong-bg" : "border-line bg-paper";
              return (
                <button
                  key={choice}
                  type="button"
                  disabled={revealed}
                  onClick={() => {
                    setPicked(choiceIndex);
                    logActivity("questions");
                    if (choiceIndex === item.answer) logCorrect();
                  }}
                  className={`min-h-11 rounded border px-3 py-2 text-left ${tone}`}
                >
                  <span className="mr-2 font-semibold">{"ABCDE"[choiceIndex]}.</span>
                  {choice}
                </button>
              );
            })}
          </div>
          {revealed ? (
            <div className="mt-4 border-t border-line pt-4">
              <p className="leading-relaxed">{item.explanation}</p>
              <p className="mt-3 rounded border border-obj-line bg-obj px-3 py-2 text-sm">
                <span className="font-semibold">Teaching point. </span>
                {item.objective}
              </p>
              <button type="button" onClick={next} className="mt-3 min-h-11 rounded bg-navy px-4 font-semibold text-white">
                {index === items.length - 1 && station === stations.length - 1 ? "Done" : "Next"}
              </button>
            </div>
          ) : null}
        </article>
      ) : null}
    </Shell>
  );
}
