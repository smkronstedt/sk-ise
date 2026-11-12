import { questionById, questions } from "./questions";
import type { BlueprintId, Question } from "./types";
import type { BankItem } from "./original-bank";
import { guideLinks, linksForBankTopic } from "./statements";
import { bankFigures } from "./bank-figures";

export type CatalogTopic = {
  id: string;
  title: string;
  count: number;
};

const extra: Record<string, Question> = {};
let bankQuestions: Question[] = [];
let bankTopics: CatalogTopic[] = [];
let loading: Promise<void> | null = null;

export function topicSlug(topic: string) {
  return `bank-${topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function getQuestion(id: string): Question | undefined {
  return questionById[id] ?? extra[id];
}

export function trainerTopics(): CatalogTopic[] {
  const counts = new Map<string, number>();
  for (const question of questions) counts.set(question.topicId, (counts.get(question.topicId) ?? 0) + 1);
  return [...counts.entries()].map(([id, count]) => ({ id, title: id, count }));
}

function toQuestion(item: BankItem): Question {
  const letters = ["A", "B", "C", "D", "E"].filter((letter) => item.options[letter]);
  const choices = letters.map((letter) => item.options[letter]);
  const answer = Math.max(0, letters.indexOf(item.answer));
  const facts = item.key_facts?.filter(Boolean).join(" ") ?? "";
  return {
    id: item.id,
    topicId: topicSlug(item.topic),
    stem: [item.question],
    choices,
    answer,
    explanation: [item.rationale, facts].filter(Boolean).join(" "),
    wrong: choices.map(() => ""),
    objective: item.learning_point || item.source_ref || item.topic,
    hard: item.hard === true,
    guide: Object.entries(guideLinks).find(([, link]) => link.href === linksForBankTopic(item.topic)[0]?.href)?.[0],
    image: bankFigures[item.id],
  };
}

export function loadCatalog() {
  if (bankQuestions.length) return Promise.resolve();
  if (!loading) {
    loading = Promise.all([
      fetch("/bank/questions.json").then((response) => response.json() as Promise<BankItem[]>),
      fetch("/bank/sasp.json").then((response) => (response.ok ? (response.json() as Promise<BankItem[]>) : [])),
    ])
      .then(([uqb, sasp]) => {
        const counts = new Map<string, { title: string; count: number }>();
        bankQuestions = [...uqb, ...sasp].map((item) => {
          const question = toQuestion(item);
          extra[question.id] = question;
          const row = counts.get(question.topicId) ?? { title: item.topic, count: 0 };
          row.count += 1;
          counts.set(question.topicId, row);
          return question;
        });
        bankTopics = [...counts.entries()]
          .map(([id, row]) => ({ id, title: row.title, count: row.count }))
          .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
      })
      .catch(() => {
        loading = null;
      });
  }
  return loading;
}

export function bankList() {
  return bankQuestions;
}

export function bankTopicList() {
  return bankTopics;
}

/** Bank topic labels mapped onto the in-service sections. */
const bankBlueprint: Record<string, BlueprintId> = {
  "Oncology-Bladder/Urothelial": "oncology",
  "Oncology-Prostate": "oncology",
  "Oncology-Kidney": "oncology",
  "Oncology-Adrenal": "oncology",
  "Oncology-Testis": "oncology",
  "Oncology-Penis/Urethra": "oncology",
  "Urinary Diversion": "oncology",
  Stones: "stones",
  "BPH/LUTS": "obstruction",
  Pediatrics: "peds",
  "Infertility/Andrology": "andrology",
  "Sexual Dysfunction": "andrology",
  "Female Urology/Pelvic Floor": "urogyn",
  "Voiding Dysfunction/Incontinence": "urogyn",
  "Neurogenic Bladder": "urogyn",
  "Transplant/Renal Physiology": "core",
  "Trauma/Reconstruction": "core",
  "Infection/Inflammation": "core",
  "Laparoscopy/Robotics/Perioperative": "core",
  "Imaging/Radiation Safety": "core",
  "Ethics/Professionalism/Statistics": "core",
  "Anatomy/Embryology": "basic",
  Pharmacology: "basic",
  Other: "core",
};

/** How many bank questions sit in each in-service section. Empty until the catalog has loaded. */
export function blueprintBankCounts(): Partial<Record<BlueprintId, number>> {
  const counts: Partial<Record<BlueprintId, number>> = {};
  for (const topic of bankTopics) {
    const bucket = bankBlueprint[topic.title];
    if (!bucket) continue;
    counts[bucket] = (counts[bucket] ?? 0) + topic.count;
  }
  return counts;
}
