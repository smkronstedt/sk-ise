import { gear, type Slot } from "@/lib/desk/ops";

const photo: Record<string, string> = {
  "nvg-green": "/ops/loadout/nvg.jpg",
  "nvg-white": "/ops/loadout/nvg-white.jpg",
  quad: "/ops/loadout/quad.jpg",
  gatorz: "/ops/loadout/glasses.jpg",
  oakley: "/ops/loadout/glasses.jpg",
  kevlar: "/ops/loadout/kevlar.jpg",
  halfshell: "/ops/loadout/halfshell.jpg",
  cap: "/ops/loadout/cap.jpg",
  armor: "/ops/loadout/carrier.jpg",
  carrier: "/ops/loadout/carrier.jpg",
  ranger: "/ops/loadout/shorts.jpg",
  arcteryx: "/ops/loadout/boots.jpg",
  salomon: "/ops/loadout/boots.jpg",
  alphafly: "/ops/loadout/racers.jpg",
  altra: "/ops/loadout/racers.jpg",
  adios: "/ops/loadout/racers.jpg",
  evo: "/ops/loadout/racers.jpg",
  puma: "/ops/loadout/racers.jpg",
  m4: "/ops/loadout/m4.jpg",
  launcher: "/ops/loadout/launcher.jpg",
  "staccato-c": "/ops/loadout/pistol.jpg",
  "staccato-p": "/ops/loadout/pistol.jpg",
  "staccato-xc": "/ops/loadout/pistol.jpg",
  grenades: "/ops/loadout/grenades.jpg",
  radio: "/ops/loadout/radio.jpg",
  ifak: "/ops/loadout/ifak.jpg",
  bob: "/ops/loadout/harley.jpg",
  moped: "/ops/loadout/moped.jpg",
  dog: "/ops/loadout/dog.jpg",
};

/** Planned spots on the full-body frame. The man is centered, head near the top, boots at the bottom. */
const place: Record<Slot, string> = {
  head: "top-[1%] left-1/2 w-[30%] -translate-x-1/2",
  eyes: "top-[13%] right-[3%] w-[24%]",
  plate: "top-[26%] left-1/2 w-[36%] -translate-x-1/2",
  uniform: "",
  workout: "bottom-[24%] right-[3%] w-[20%]",
  boots: "bottom-[1%] left-1/2 w-[32%] -translate-x-1/2",
  primary: "top-[32%] left-[1%] w-[34%]",
  sidearm: "top-[48%] right-[2%] w-[18%]",
  extra: "top-[58%] left-[3%] w-[18%]",
  ride: "bottom-[2%] right-[1%] w-[34%]",
  partner: "bottom-[8%] left-[1%] w-[30%]",
};

const blend = new Set<Slot>(["head", "plate"]);

export function CampLoadout({ equipped, owned }: { equipped: Partial<Record<Slot, string>>; owned: string[] }) {
  const uniform = equipped.uniform;
  const body = uniform === "crye" ? "/ops/loadout/crye.jpg" : uniform === "tank" ? "/ops/loadout/tank.jpg" : "/ops/loadout/base.jpg";
  const worn = (Object.keys(place) as Slot[])
    .map((slot) => {
      const item = gear.find((entry) => entry.id === equipped[slot]);
      if (!item || slot === "uniform" || !photo[item.id]) return null;
      return { slot, item, src: photo[item.id] };
    })
    .filter((entry) => entry !== null);
  const shelf = owned
    .map((id) => gear.find((item) => item.id === id))
    .filter((item) => item?.slot === "supply")
    .map((item) => item?.name ?? "");

  return (
    <div className="w-full">
      <div className="relative aspect-[2/3] overflow-hidden rounded border border-ops-amber bg-[#14140f]">
        <img src={body} alt="Operator at camp" className="h-full w-full object-cover object-center" />
        {worn.map((entry) => (
          <figure key={entry.slot} className={`absolute ${place[entry.slot]}`}>
            <img
              src={entry.src}
              alt={entry.item.name}
              className={`aspect-square w-full rounded object-contain shadow-lg ${blend.has(entry.slot) ? "mix-blend-lighten" : "bg-black/75 p-0.5"}`}
            />
            <figcaption className="truncate text-center text-[10px] font-semibold text-[#f3ecd8] drop-shadow">{entry.item.name}</figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-ops-olive">{shelf.length ? `Shelf: ${shelf.join(", ")}` : "Shelf is empty."}</p>
    </div>
  );
}
