import { topicSlug } from "./catalog";
import { topicById } from "./topics";
import type { BlueprintId } from "./types";

/** Trainer topic -> the bank topics that teach the same material. */
export const bankTopicsFor: Record<string, string[]> = {
  nmibc: ["Oncology-Bladder/Urothelial"],
  mibc: ["Oncology-Bladder/Urothelial"],
  utuc: ["Oncology-Bladder/Urothelial"],
  mh: ["Imaging/Radiation Safety"],
  pca: ["Oncology-Prostate"],
  "pca-adv": ["Oncology-Prostate"],
  renal: ["Oncology-Kidney"],
  adrenal: ["Oncology-Adrenal"],
  testis: ["Oncology-Testis"],
  penile: ["Oncology-Penis/Urethra"],
  diversion: ["Urinary Diversion"],
  "stones-med": ["Stones"],
  "stones-surg": ["Stones"],
  bph: ["BPH/LUTS"],
  "upper-obs": ["Laparoscopy/Robotics/Perioperative"],
  testosterone: ["Infertility/Andrology"],
  infertility: ["Infertility/Andrology"],
  ed: ["Sexual Dysfunction"],
  ejac: ["Sexual Dysfunction"],
  peyronie: ["Sexual Dysfunction"],
  fsd: ["Sexual Dysfunction"],
  nlutd: ["Neurogenic Bladder"],
  oab: ["Voiding Dysfunction/Incontinence", "Female Urology/Pelvic Floor"],
  ic: ["Female Urology/Pelvic Floor"],
  trauma: ["Trauma/Reconstruction"],
  stricture: ["Trauma/Reconstruction", "Oncology-Penis/Urethra"],
  imaging: ["Imaging/Radiation Safety"],
  basic: ["Anatomy/Embryology", "Transplant/Renal Physiology", "Pharmacology", "Ethics/Professionalism/Statistics"],
  crypt: ["Pediatrics"],
  vur: ["Pediatrics"],
  "peds-mass": ["Pediatrics"],
};

const slugBlueprint: Record<string, BlueprintId> = {};
for (const [topicId, names] of Object.entries(bankTopicsFor)) {
  const blueprintId = topicById[topicId]?.blueprintId;
  if (!blueprintId) continue;
  for (const name of names) {
    const slug = topicSlug(name);
    if (!slugBlueprint[slug]) slugBlueprint[slug] = blueprintId;
  }
}

export function bankSlugsFor(topicIds: string[]) {
  const slugs = new Set<string>();
  for (const id of topicIds) {
    for (const name of bankTopicsFor[id] ?? []) slugs.add(topicSlug(name));
  }
  return slugs;
}

export function blueprintForSlug(slug: string): BlueprintId | undefined {
  return slugBlueprint[slug];
}
