/** Career ladder. The last title requires every bank item correct. */
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

export function rankGates(total: number): RankGate[] {
  const steps = RANKS.length - 1;
  const bank = Math.max(1, total);
  return RANKS.map((title, index) => ({
    title,
    at: index === 0 ? 0 : index === steps ? bank : Math.ceil((index / steps) * bank),
  }));
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
