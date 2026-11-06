export type BankItem = {
  id: string;
  topic: string;
  question: string;
  options: Record<string, string>;
  answer: string;
  rationale: string;
  learning_point: string;
  key_facts: string[];
  source_ref: string;
};

export type BankAnswer = { choice: string; correct: boolean };

export type BankProgress = {
  answers: Record<string, BankAnswer>;
  marks: Record<string, boolean>;
  notes: Record<string, string>;
};

const KEY = "callroom-original-bank-v1";

/** Items in public/bank/questions.json. The desk's 57 vignettes are separate. */
export const BANK_TOTAL = 1214;

export const letters = ["A", "B", "C", "D", "E"] as const;

export function emptyBankProgress(): BankProgress {
  return { answers: {}, marks: {}, notes: {} };
}

export function countBankCorrect(): number {
  return Object.values(loadBankProgress().answers).filter((row) => row.correct).length;
}

export function loadBankProgress(): BankProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyBankProgress();
    const parsed = JSON.parse(raw) as BankProgress;
    return {
      answers: parsed.answers ?? {},
      marks: parsed.marks ?? {},
      notes: parsed.notes ?? {},
    };
  } catch {
    return emptyBankProgress();
  }
}

export function saveBankProgress(progress: BankProgress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

export function optionText(item: BankItem, letter: string) {
  return item.options[letter] ?? "";
}
