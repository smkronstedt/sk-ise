import { getQuestion } from "./catalog";
import type { BlueprintId, TestBlock } from "./types";

export type City = {
  id: string;
  /** Question pool. Separate from id so a second town can teach the same subject. */
  blueprint: BlueprintId;
  element: string;
  city: string;
  leader: string;
  subject: string;
  hall: string;
  trainers: { name: string; count: number; topics?: string[]; label?: string }[];
  gymCount: number;
  /** Boss question topics, when they are not the whole blueprint. */
  gymTopics?: string[];
  /** Side ferry from Onco Harbor. Open without the main badge chain. */
  side?: boolean;
  prostate?: boolean;
};

export const cities: City[] = [
  {
    id: "stones",
    blueprint: "stones",
    element: "Rock",
    city: "Quarry End",
    leader: "Dr. Nicolette",
    subject: "Stones",
    hall: "/field/gym-rock.jpg",
    trainers: [
      { name: "Bram Holt", count: 6, label: "Medical stones", topics: ["stones-med"] },
      { name: "Nessa Flint", count: 6, label: "Surgical stones", topics: ["stones-surg"] },
      { name: "Cole Quarry", count: 6, label: "Surgical stones", topics: ["stones-surg"] },
      { name: "Ida Stone", count: 6, label: "Medical stones", topics: ["stones-med"] },
    ],
    gymCount: 10,
    gymTopics: ["stones-med", "stones-surg"],
  },
  {
    id: "oncology",
    blueprint: "oncology",
    element: "Fire",
    city: "Onco Harbor",
    leader: "Señor Guilherme",
    subject: "Oncology",
    hall: "/field/gym-fire.jpg",
    trainers: [
      { name: "Renal Ward", count: 8, label: "Kidney", topics: ["renal"] },
      { name: "Calyx Cut", count: 6, label: "Upper tract", topics: ["utuc", "mh"] },
      { name: "Cortex Shelf", count: 5, label: "Adrenal", topics: ["adrenal"] },
      { name: "Vesical Bay", count: 5, label: "Bladder", topics: ["nmibc", "mibc"] },
      { name: "Gleason Yard", count: 5, label: "Localized prostate", topics: ["pca"] },
      { name: "Castrate Ridge", count: 5, label: "Advanced prostate", topics: ["pca-adv"] },
      { name: "Orchid Lane", count: 5, label: "Testicular", topics: ["testis"] },
      { name: "Glans Gate", count: 5, label: "Penile", topics: ["penile"] },
      { name: "Conduit Yard", count: 6, label: "Diversion", topics: ["diversion"] },
    ],
    gymCount: 15,
    gymTopics: ["pca", "pca-adv", "renal", "adrenal", "nmibc", "mibc", "diversion", "testis", "penile", "utuc", "mh"],
    prostate: true,
  },
  {
    id: "urogyn",
    blueprint: "urogyn",
    element: "Water",
    city: "Blackwater Hold",
    leader: "Warden Calder",
    subject: "Voiding and reconstruction",
    hall: "/field/gym-water.jpg",
    trainers: [
      { name: "Reed Neuro", count: 10, label: "Neurourology", topics: ["uds"] },
      { name: "Moss Incontinent", count: 6, label: "OAB and bladder pain", topics: ["oab", "ic"] },
      { name: "Pearl Prolapse", count: 6, label: "Prolapse", topics: ["oab"] },
    ],
    gymCount: 12,
    gymTopics: ["uds", "oab", "ic", "diversion"],
  },
  {
    id: "core",
    blueprint: "core",
    element: "Psychic",
    city: "The Commons",
    leader: "Nima Sol",
    subject: "Core knowledge",
    hall: "/field/gym-psychic.jpg",
    trainers: [
      { name: "Clerk Office", count: 8, label: "Office urology", topics: ["imaging", "stricture"] },
      { name: "Ward Trauma", count: 8, label: "Postop and trauma", topics: ["trauma", "stricture"] },
      { name: "Film Ethics", count: 6, label: "Imaging and ethics", topics: ["imaging"] },
      { name: "Half Point", count: 5, label: "Transplant and statistics", topics: ["basic", "imaging"] },
    ],
    gymCount: 12,
    gymTopics: ["trauma", "stricture", "imaging", "basic"],
  },
  { id: "andrology", blueprint: "andrology", element: "Electric", city: "Spark Yard", leader: "Ives Harlan", subject: "Andrology", hall: "/field/gym-electric.jpg", trainers: [{ name: "Joss Kern", count: 6 }, { name: "Ada Volt", count: 6 }, { name: "Kit Arc", count: 6 }, { name: "Lumen Peck", count: 6 }], gymCount: 10 },
  { id: "peds", blueprint: "peds", element: "Grass", city: "Greenward", leader: "Lina Grove", subject: "Peds", hall: "/field/gym-grass.jpg", trainers: [{ name: "Pip Sorel", count: 6 }, { name: "June Hart", count: 6 }, { name: "Otto Leaf", count: 6 }, { name: "Bramble Nye", count: 6 }], gymCount: 10 },
  { id: "basic", blueprint: "basic", element: "Poison", city: "Vial Hollow", leader: "Vesper Quill", subject: "Physiology", hall: "/field/gym-poison.jpg", trainers: [{ name: "Rem Quin", count: 6 }, { name: "Sable Orth", count: 6 }, { name: "Vial Penn", count: 6 }, { name: "Moss Kerr", count: 6 }], gymCount: 10 },
  { id: "obstruction", blueprint: "obstruction", element: "Ground", city: "Claymarch", leader: "Holt Barrow", subject: "Obstruction", hall: "/field/gym-ground.jpg", trainers: [{ name: "Gus Pell", count: 6 }, { name: "Rory Dunn", count: 6 }, { name: "Clay Mott", count: 6 }, { name: "Fern Barrow", count: 6 }], gymCount: 10 },
  {
    id: "cinder",
    blueprint: "oncology",
    side: true,
    element: "Dragon",
    city: "Cinder Ward",
    leader: "Dr. Mara Voss",
    subject: "More oncology",
    hall: "/field/gym-fire.jpg",
    prostate: true,
    trainers: [
      { name: "Bay Deeper", count: 12, label: "More bladder", topics: ["nmibc", "mibc"] },
      { name: "Gleason Deeper", count: 12, label: "More prostate", topics: ["pca", "pca-adv"] },
      { name: "Renal Deeper", count: 10, label: "More kidney", topics: ["renal"] },
      { name: "Cortex Deeper", count: 8, label: "More adrenal", topics: ["adrenal"] },
      { name: "Orchid Deeper", count: 8, label: "More testis", topics: ["testis"] },
      { name: "Glans Deeper", count: 8, label: "More penis", topics: ["penile"] },
      { name: "Conduit Deeper", count: 8, label: "More diversion", topics: ["diversion"] },
      { name: "Tract Deeper", count: 8, label: "More upper tract", topics: ["utuc", "mh"] },
    ],
    gymCount: 15,
    gymTopics: ["pca", "pca-adv", "renal", "adrenal", "nmibc", "mibc", "diversion", "testis", "penile", "utuc", "mh"],
  },
  {
    id: "willow",
    blueprint: "peds",
    side: true,
    element: "Bug",
    city: "Willow Ward",
    leader: "Dr. Ames Holt",
    subject: "Pediatric urology",
    hall: "/field/gym-grass.jpg",
    trainers: [
      { name: "Orchid Udt", count: 10, label: "Cryptorchidism", topics: ["crypt"] },
      { name: "Reflux June", count: 10, label: "Reflux", topics: ["vur"] },
      { name: "Wilms Otto", count: 10, label: "Pediatric masses", topics: ["peds-mass"] },
      { name: "Valve Fern", count: 10, label: "Peds obstruction", topics: ["crypt", "vur", "peds-mass"] },
      { name: "Hydro Bram", count: 10, label: "Hydronephrosis", topics: ["crypt", "vur", "peds-mass"] },
      { name: "Dsd Sorel", count: 8, label: "DSD and the rest", topics: ["crypt", "vur", "peds-mass"] },
    ],
    gymCount: 12,
    gymTopics: ["crypt", "vur", "peds-mass"],
  },
  {
    id: "andro",
    blueprint: "andrology",
    side: true,
    element: "Steel",
    city: "Andro Court",
    leader: "Dr. Hale Quinn",
    subject: "Men's health and infertility",
    hall: "/field/gym-electric.jpg",
    trainers: [
      { name: "Azoo Hale", count: 10, label: "Infertility", topics: ["infertility"] },
      { name: "Axis Quinn", count: 8, label: "Testosterone", topics: ["testosterone"] },
      { name: "Couple Ada", count: 8, label: "Infertility cases", topics: ["infertility", "testosterone"] },
      { name: "Rise Ives", count: 8, label: "Erectile dysfunction", topics: ["ed"] },
      { name: "Peck Timing", count: 6, label: "Ejaculation", topics: ["ejac"] },
      { name: "Curve Kern", count: 6, label: "Peyronie", topics: ["peyronie"] },
    ],
    gymCount: 12,
    gymTopics: ["infertility", "testosterone", "ed", "ejac", "peyronie"],
  },
  {
    id: "serum",
    blueprint: "basic",
    side: true,
    element: "Ice",
    city: "Serum Hall",
    leader: "Dr. Sen Quill",
    subject: "Physiology and medications",
    hall: "/field/gym-poison.jpg",
    trainers: [
      { name: "Fluid Rem", count: 10, label: "Renal physiology", topics: ["phys"] },
      { name: "Axis Sable", count: 8, label: "More physiology", topics: ["phys", "anatomy"] },
      { name: "Vial Meds", count: 10, label: "Pharmacology", topics: ["meds"] },
      { name: "Penn Drug", count: 8, label: "More medications", topics: ["meds"] },
    ],
    gymCount: 12,
    gymTopics: ["phys", "anatomy", "meds"],
  },
];

function ratio(test: TestBlock) {
  if (test.status !== "done" || !test.questionIds.length) return 0;
  let right = 0;
  for (const id of test.questionIds) {
    const answer = test.answers[id];
    if (answer?.submitted && answer.choice != null && answer.choice === getQuestion(id)?.answer) right += 1;
  }
  return right / test.questionIds.length;
}

function passed(test: TestBlock) {
  return ratio(test) >= 0.6;
}

export function isChampion(tests: TestBlock[]) {
  return tests.some((test) => test.name === "Championship" && ratio(test) >= 0.8);
}

export function passedNames(tests: TestBlock[]) {
  return new Set(tests.filter(passed).map((test) => test.name));
}

export function badgeElements(tests: TestBlock[]) {
  const names = passedNames(tests);
  return cities.filter((city) => names.has(`Gym: ${city.element}`)).map((city) => city.element);
}

export type Stop =
  | { kind: "trainer"; name: string; count: number; open: boolean; done: boolean; city: City }
  | { kind: "gym"; open: boolean; done: boolean; city: City };

export function rivalTestName(city: City) {
  return `Rival: ${city.city}`;
}

export function rivalBeaten(tests: TestBlock[], city: City) {
  return passedNames(tests).has(rivalTestName(city));
}

export function nextCity(id: string, dir: 1 | -1): City | null {
  const city = cities.find((item) => item.id === id);
  if (!city) return null;
  if (city.side) {
    const side = cities.filter((item) => item.side);
    const index = side.findIndex((item) => item.id === id);
    if (dir < 0) return index <= 0 ? cities.find((item) => item.id === "oncology") ?? null : side[index - 1];
    return side[index + 1] ?? null;
  }
  const main = cities.filter((item) => !item.side);
  const index = main.findIndex((item) => item.id === id);
  return main[index + dir] ?? null;
}

export function routeStops(tests: TestBlock[]): Stop[] {
  const names = passedNames(tests);
  const stops: Stop[] = [];
  const walk = (list: City[], gated: boolean) => {
    list.forEach((city, index) => {
      const prev = index === 0 ? null : list[index - 1];
      const previous = !gated || !prev || names.has(`Gym: ${prev.element}`);
      const trainersDone = city.trainers.every((trainer) => names.has(`Route: ${trainer.name}`));
      for (const trainer of city.trainers) {
        stops.push({
          kind: "trainer",
          name: trainer.name,
          count: trainer.count,
          open: previous,
          done: names.has(`Route: ${trainer.name}`),
          city,
        });
      }
      stops.push({ kind: "gym", open: previous && trainersDone, done: names.has(`Gym: ${city.element}`), city });
    });
  };
  walk(cities.filter((city) => !city.side), true);
  walk(cities.filter((city) => city.side), false);
  return stops;
}
