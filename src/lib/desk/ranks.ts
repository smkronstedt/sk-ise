/** Career ladder. Early titles come faster. The last title still needs every item. */
export const RANKS = [
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

export type RankGate = { title: (typeof RANKS)[number]; at: number };

const EARLY = [0, 15, 40, 80, 150, 250, 400, 600, 900, 1300, 1800];

export function rankGates(total: number): RankGate[] {
  const bank = Math.max(1, total);
  const gates = RANKS.map((title, index) => {
    if (index === RANKS.length - 1) return { title, at: bank };
    if (index < EARLY.length) return { title, at: Math.min(EARLY[index], Math.max(0, bank - 1)) };
    const start = Math.min(EARLY[EARLY.length - 1], Math.max(0, bank - 1));
    const span = RANKS.length - EARLY.length;
    const step = index - (EARLY.length - 1);
    return { title, at: Math.min(bank - 1, Math.round(start + ((bank - start) * step) / (span + 1))) };
  });
  for (let index = 1; index < gates.length - 1; index += 1) {
    if (gates[index].at <= gates[index - 1].at) gates[index].at = gates[index - 1].at + 1;
  }
  gates[gates.length - 1].at = bank;
  return gates;
}

export function careerRank(correct: number, total: number) {
  const gates = rankGates(total);
  const held = Math.max(0, Math.min(correct, Math.max(1, total)));
  let index = 0;
  for (let i = 0; i < gates.length; i++) {
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