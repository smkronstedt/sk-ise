import { getQuestion } from "./catalog";
import type { BlueprintId, TestBlock } from "./types";

export type City = {
  id: BlueprintId;
  element: string;
  city: string;
  leader: string;
  subject: string;
  hall: string;
  trainers: { name: string; count: number; topics?: string[]; label?: string }[];
  gymCount: number;
  /** Boss question topics, when they are not the whole blueprint. */
  gymTopics?: string[];
};

export const cities: City[] = [
  { id: "stones", element: "Rock", city: "Quarry End", leader: "Petra Vale", subject: "Stones", hall: "/field/gym-rock.jpg", trainers: [{ name: "Bram Holt", count: 4 }, { name: "Nessa Flint", count: 4 }, { name: "Cole Quarry", count: 4 }, { name: "Ida Stone", count: 4 }], gymCount: 8 },
  {
    id: "oncology",
    element: "Fire",
    city: "Onco Harbor",
    leader: "Sera Voss",
    subject: "Oncology",
    hall: "/field/gym-fire.jpg",
    trainers: [
      { name: "Renal Ward", count: 4, label: "Kidney", topics: ["renal", "adrenal"] },
      { name: "Vesical Bay", count: 4, label: "Bladder", topics: ["nmibc", "mibc", "diversion"] },
      { name: "Gleason Yard", count: 4, label: "Localized prostate", topics: ["pca"] },
      { name: "Castrate Ridge", count: 4, label: "Advanced prostate", topics: ["pca-adv"] },
      { name: "Orchid Lane", count: 4, label: "Testicular", topics: ["testis"] },
      { name: "Glans Gate", count: 4, label: "Penile", topics: ["penile"] },
      { name: "Calyx Cut", count: 4, label: "Upper tract", topics: ["utuc", "mh"] },
    ],
    gymCount: 16,
    gymTopics: ["pca", "pca-adv", "renal", "adrenal", "nmibc", "mibc", "diversion", "testis", "penile", "utuc", "mh"],
  },
  { id: "urogyn", element: "Water", city: "Tidewell", leader: "Maris Calder", subject: "Urogyn", hall: "/field/gym-water.jpg", trainers: [{ name: "Cal Derrow", count: 4 }, { name: "Willa Fen", count: 4 }, { name: "Ned Shore", count: 4 }, { name: "Pearl Moss", count: 4 }], gymCount: 8 },
  { id: "andrology", element: "Electric", city: "Spark Yard", leader: "Ives Harlan", subject: "Andrology", hall: "/field/gym-electric.jpg", trainers: [{ name: "Joss Kern", count: 4 }, { name: "Ada Volt", count: 4 }, { name: "Kit Arc", count: 4 }, { name: "Lumen Peck", count: 4 }], gymCount: 8 },
  { id: "peds", element: "Grass", city: "Greenward", leader: "Lina Grove", subject: "Peds", hall: "/field/gym-grass.jpg", trainers: [{ name: "Pip Sorel", count: 4 }, { name: "June Hart", count: 4 }, { name: "Otto Leaf", count: 4 }, { name: "Bramble Nye", count: 4 }], gymCount: 8 },
  { id: "basic", element: "Poison", city: "Vial Hollow", leader: "Vesper Quill", subject: "Physiology", hall: "/field/gym-poison.jpg", trainers: [{ name: "Rem Quin", count: 4 }, { name: "Sable Orth", count: 4 }, { name: "Vial Penn", count: 4 }, { name: "Moss Kerr", count: 4 }], gymCount: 8 },
  { id: "core", element: "Psychic", city: "Stillmind", leader: "Nima Sol", subject: "Core", hall: "/field/gym-psychic.jpg", trainers: [{ name: "Ivo Lane", count: 4 }, { name: "Thea Mind", count: 4 }, { name: "Sol Wren", count: 4 }, { name: "Pia Glass", count: 4 }], gymCount: 8 },
  { id: "obstruction", element: "Ground", city: "Claymarch", leader: "Holt Barrow", subject: "Obstruction", hall: "/field/gym-ground.jpg", trainers: [{ name: "Gus Pell", count: 4 }, { name: "Rory Dunn", count: 4 }, { name: "Clay Mott", count: 4 }, { name: "Fern Barrow", count: 4 }], gymCount: 8 },
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

export function routeStops(tests: TestBlock[]): Stop[] {
  const names = passedNames(tests);
  const stops: Stop[] = [];
  cities.forEach((city, index) => {
    const prev = index === 0 ? null : cities[index - 1];
    const previous = !prev || names.has(`Gym: ${prev.element}`);
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
  return stops;
}
