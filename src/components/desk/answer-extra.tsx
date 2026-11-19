import { answerFigures } from "@/lib/desk/bank-figures";
import { isRoundHeadText, SpermPlan } from "@/components/desk/sperm-plan";

/** Plates and tables that belong with the explanation, after the item is answered. */
export function AnswerExtra({ id, text }: { id: string; text: string }) {
  const plate = answerFigures[id];
  const round = isRoundHeadText(text);
  if (!plate && !round) return null;
  return (
    <>
      {plate ? (
        <figure className="my-3">
          <img src={plate.src} alt={plate.caption} className="max-h-[28rem] w-full rounded border border-line bg-white object-contain" />
          <figcaption className="mt-1 text-xs leading-relaxed text-muted">{plate.caption}</figcaption>
        </figure>
      ) : null}
      {round ? <SpermPlan /> : null}
    </>
  );
}
