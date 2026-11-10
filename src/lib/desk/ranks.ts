/** Shared ladder. Each step costs more correct answers than the one before it. */
const SHARED = [
  "Medical Student",
  "Intern",
  "Junior Resident (PGY-2)",
  "Junior Resident (PGY-3)",
  "Senior Resident",
  "Chief Resident",
  "Fellow",
  "Attending",
  "Assistant Professor",
  "Associate Professor",
  "Full Professor",
] as const;

const SHANE_TOP = ["Attending Navy SEAL Surgeon"] as const;
const PUBLIC_TOP = ["Endowed Professor of Surgery", "Chair of TMC"] as const;

const OLD = [
  "Medical Student",
  "Intern",
  "Junior Resident (PGY-2)",
  "Junior Resident (PGY-3)",
  "Senior Resident",
  "Chief Resident",
  "Fellow",
  "Attending",
  "Assistant Professor",
  "Associate Professor",
  "Full Professor",
  "MD PhD with research time",
  "MD PhD with your own lab",
  "Androgen Society President",
  "AUA South Central Section President",
  "SMSNA President",
  "SSMR President",
  "AUA President",
  "Navy SEAL Surgeon",
] as const;

export type RankGate = { title: string; at: number };

export function rankTitles(seal: boolean) {
  return seal ? [...SHARED, ...SHANE_TOP] : [...SHARED, ...PUBLIC_TOP];
}

function gatesFor(titles: readonly string[], total: number): RankGate[] {
  const bank = Math.max(titles.length, total);
  const steps = titles.length - 1;
  const ratio = 1.38;
  const weights = Array.from({ length: steps }, (_, index) => ratio ** index);
  const sum = weights.reduce((totalWeight, weight) => totalWeight + weight, 0);
  const gates: RankGate[] = [{ title: titles[0], at: 0 }];
  let used = 0;
  for (let index = 0; index < steps - 1; index += 1) {
    used += Math.max(8, Math.round((weights[index] / sum) * bank));
    gates.push({ title: titles[index + 1], at: Math.min(bank - (steps - index), used) });
  }
  gates.push({ title: titles[steps], at: bank });
  for (let index = 1; index < gates.length - 1; index += 1) {
    if (gates[index].at <= gates[index - 1].at) gates[index].at = gates[index - 1].at + 1;
  }
  gates[gates.length - 1].at = bank;
  return gates;
}

/** Later steps take a larger share of the bank. The last title still needs every item. */
export function rankGates(total: number, seal = false): RankGate[] {
  return gatesFor(rankTitles(seal), total);
}

export function oldRankGates(total: number): RankGate[] {
  return gatesFor(OLD, total);
}

function fromGates(correct: number, total: number, gates: RankGate[]) {
  const held = Math.max(0, Math.min(correct, Math.max(1, total)));
  let index = 0;
  for (let i = 0; i < gates.length; i += 1) {
    if (held >= gates[i].at) index = i;
  }
  const floor = gates[index].at;
  const next = gates[index + 1] ?? null;
  const span = next ? Math.max(1, next.at - floor) : 1;
  return {
    index,
    title: gates[index].title,
    next: next?.title ?? null,
    nextAt: next?.at ?? gates[index].at,
    floor,
    into: next ? (held - floor) / span : 1,
    left: next ? Math.max(0, next.at - held) : 0,
    gates,
  };
}

export function careerRank(correct: number, total: number, seal = false) {
  return fromGates(correct, total, rankGates(total, seal));
}

export function oldCareerRank(correct: number, total: number) {
  return fromGates(correct, total, oldRankGates(total));
}
