import { answerFigures } from "@/lib/desk/bank-figures";
import { isRoundHeadText, SpermPlan } from "@/components/desk/sperm-plan";

/** Why the right colic is the vessel that frees a Mainz pouch. */
function MainzReach() {
  return (
    <div className="mt-3 overflow-x-auto rounded border border-line">
      <p className="border-b border-line px-3 py-2 text-sm font-semibold">How to get the pouch to the urethra</p>
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="px-3 py-2 font-semibold">Vessel</th>
            <th className="px-3 py-2 font-semibold">What it feeds</th>
            <th className="px-3 py-2 font-semibold">What to do</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line align-top">
            <td className="px-3 py-2 font-semibold">Right colic</td>
            <td className="px-3 py-2">Hepatic flexure and ascending colon. This is the tether.</td>
            <td className="px-3 py-2">Divide it. The arc of Drummond backfills the cecum from the ileocolic side, and the pouch drops into the pelvis.</td>
          </tr>
          <tr className="border-b border-line align-top">
            <td className="px-3 py-2 font-semibold">Ileocolic</td>
            <td className="px-3 py-2">Cecum and terminal ileum. That is the Mainz pouch.</td>
            <td className="px-3 py-2">Leave it. Division infarcts the neobladder.</td>
          </tr>
          <tr className="border-b border-line align-top">
            <td className="px-3 py-2 font-semibold">Middle colic</td>
            <td className="px-3 py-2">Transverse colon, and often the later bowel anastomosis.</td>
            <td className="px-3 py-2">Leave it. Cutting it does not lengthen the right-colon mesentery.</td>
          </tr>
          <tr className="align-top">
            <td className="px-3 py-2 font-semibold">Conduit or cutaneous diversion</td>
            <td className="px-3 py-2">A different operation.</td>
            <td className="px-3 py-2">Only after the mesentery has actually been mobilized. Not the next step.</td>
          </tr>
        </tbody>
      </table>
      <p className="px-3 py-2 text-xs leading-relaxed text-muted">The right colic is inconstant. It usually comes off the superior mesenteric artery, but it can come off the middle colic or the ileocolic. Divide the vessel that is holding the pouch up, then check a bleeding edge, Doppler, or indocyanine green before you commit.</p>
    </div>
  );
}

/** Each wrong answer on the bilateral-oncocytoma item is a different syndrome. */
function RenalSyndromes() {
  const rows = [
    ["Facial fibrofolliculoma", "Birt-Hogg-Dubé", "Oncocytoma, hybrid, chromophobe"],
    ["Retinal angioma", "von Hippel-Lindau", "Clear cell"],
    ["Uterine fibroid", "Fumarate hydratase", "Papillary, aggressive"],
    ["Cutaneous melanoma", "BAP1", "Clear cell"],
    ["Cardiac rhabdomyoma", "Tuberous sclerosis", "Angiomyolipoma"],
  ];
  return (
    <div className="mt-3 overflow-x-auto rounded border border-line">
      <p className="border-b border-line px-3 py-2 text-sm font-semibold">What else comes with the renal tumor</p>
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="px-3 py-2 font-semibold">Finding</th>
            <th className="px-3 py-2 font-semibold">Syndrome</th>
            <th className="px-3 py-2 font-semibold">Renal tumor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([finding, syndrome, tumor]) => (
            <tr key={finding} className="border-b border-line align-top last:border-b-0">
              <td className="px-3 py-2 font-semibold">{finding}</td>
              <td className="px-3 py-2">{syndrome}</td>
              <td className="px-3 py-2">{tumor}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-2 text-xs leading-relaxed text-muted">Bilateral oncocytomas pick the first row. Lung cysts and pneumothorax come with it. The other four findings are the other four choices.</p>
    </div>
  );
}

/** Plates and tables that belong with the explanation, after the item is answered. */
export function AnswerExtra({ id, text }: { id: string; text: string }) {
  const plate = answerFigures[id];
  const round = isRoundHeadText(text);
  const mainz = id === "SASP2026-017";
  const syndromes = id === "SASP2026-047";
  if (!plate && !round && !mainz && !syndromes) return null;
  return (
    <>
      {plate ? (
        <figure className="my-3">
          <img src={plate.src} alt={plate.caption} className="max-h-[28rem] w-full rounded border border-line bg-white object-contain" />
          <figcaption className="mt-1 text-xs leading-relaxed text-muted">{plate.caption}</figcaption>
        </figure>
      ) : null}
      {mainz ? <MainzReach /> : null}
      {syndromes ? <RenalSyndromes /> : null}
      {round ? <SpermPlan /> : null}
    </>
  );
}
