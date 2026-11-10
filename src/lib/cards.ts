export type CardState = 'new' | 'learning' | 'review';
export type Card = {
  id: string;
  sourceQuestionId: string;
  topic: string;
  front: string;
  back: string;
  due: number;
  interval: number;
  ease: number;
  state: CardState;
  reps: number;
  lapses: number;
  source: 'auto' | 'manual' | 'full';
  custom?: boolean;
};

const INTERVALS = {
  again: 25 * 60 * 1000,
  hard: 12.2 * 60 * 60 * 1000,
  good: 1 * 24 * 60 * 60 * 1000,
  easy: 3 * 24 * 60 * 60 * 1000,
} as const;

export function schedule(card: Card, rating: keyof typeof INTERVALS): Card {
  const now = Date.now();
  let nextInterval = INTERVALS[rating];
  let state = card.state;
  let lapses = card.lapses;

  if (rating === 'again') {
    state = 'learning';
    lapses += 1;
    nextInterval = INTERVALS.again;
  } else if (card.state === 'learning' && (rating === 'good' || rating === 'easy')) {
    state = 'review';
  }

  return {
    ...card,
    due: now + nextInterval,
    interval: nextInterval,
    state,
    reps: card.reps + 1,
    lapses,
  };
}

export function quizFace(q: any): { front: string; back: string } {
  const front =
    (typeof q.question === "string" && q.question) ||
    (Array.isArray(q.stem) ? q.stem.join("\n\n") : "") ||
    q.learning_point ||
    q.statement ||
    "";
  const answerLine =
    Array.isArray(q.choices) && typeof q.answer === "number"
      ? q.choices[q.answer]
      : q.options && typeof q.answer === "string"
        ? q.options[q.answer] || ""
        : typeof q.answer === "string"
          ? q.answer
          : "";
  const back = [answerLine, q.rationale || q.explanation, ...(q.key_facts || [])].filter(Boolean).join("\n\n");
  return { front, back };
}

export function createCard(q: any, source: 'auto' | 'manual' | 'full' = 'auto'): Card {
  const face = quizFace(q);
  return {
    id: crypto.randomUUID(),
    sourceQuestionId: q.id,
    topic: q.topic || 'Uncategorized',
    front: face.front,
    back: face.back,
    due: Date.now(),
    interval: 0,
    ease: 2.5,
    state: 'new',
    reps: 0,
    lapses: 0,
    source,
  };
}

const KEY = 'callroom-cards-v1';

export function loadCards(): Card[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCards(cards: Card[]) {
  localStorage.setItem(KEY, JSON.stringify(cards));
}

/** Old cards stored a learning-point sentence. Rewrite those into the question and the answer. */
export function refreshQuizCards(lookup: (id: string) => any | undefined): Card[] {
  const cards = loadCards();
  let changed = false;
  const next = cards.map((card) => {
    if (card.custom) return card;
    const source = lookup(card.sourceQuestionId);
    if (!source) return card;
    const face = quizFace(source);
    if (!face.front || (card.front === face.front && card.back === face.back)) return card;
    changed = true;
    return { ...card, front: face.front, back: face.back || card.back };
  });
  if (changed) saveCards(next);
  return next;
}

export function addCard(q: any, source: 'auto' | 'manual' | 'full' = 'auto') {
  const cards = loadCards();
  if (cards.some((c) => c.sourceQuestionId === q.id && c.source !== 'full')) return;
  cards.push(createCard(q, source));
  saveCards(cards);
}

export async function generateTopicCards(topic: string | null): Promise<Card[]> {
  const [uqb, sasp] = await Promise.all([
    fetch("/bank/questions.json").then((res) => res.json()),
    fetch("/bank/sasp.json").then((res) => (res.ok ? res.json() : [])),
  ]);
  const bank = [...uqb, ...sasp];
  const existing = loadCards();
  const existingIds = new Set(existing.map((c) => c.sourceQuestionId));
  const items = topic ? bank.filter((q: any) => q.topic === topic) : bank;
  return items
    .filter((q: any) => !existingIds.has(q.id))
    .map((q: any) => createCard(q, 'full'));
}

export function addGenerated(cards: Card[]) {
  const current = loadCards();
  saveCards([...current, ...cards]);
}

export function updateCard(id: string, patch: Partial<Pick<Card, "front" | "back" | "topic">>) {
  const cards = loadCards().map((card) => (card.id === id ? { ...card, ...patch, custom: true } : card));
  saveCards(cards);
  return cards;
}

export function removeCard(id: string) {
  const cards = loadCards().filter((card) => card.id !== id);
  saveCards(cards);
  return cards;
}

