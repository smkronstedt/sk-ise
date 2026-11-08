import { anatomyPlate } from "@/lib/desk/anatomy";

export function AnatomyFigure({ topic, text }: { topic: string; text: string }) {
  const plate = anatomyPlate(topic, text);
  if (!plate) return null;
  return (
    <figure className="my-3">
      <img src={plate.src} alt={plate.caption} className="max-h-96 w-full rounded border border-line bg-white object-contain" />
      <figcaption className="mt-1 text-xs leading-relaxed text-muted">{plate.caption}</figcaption>
    </figure>
  );
}
