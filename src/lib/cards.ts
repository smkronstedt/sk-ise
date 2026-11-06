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

export function createCard(q: any, source: 'auto' | 'manual' | 'full' = 'auto'): Card {
  return {
    id: crypto.randomUUID(),
    sourceQuestionId: q.id,
    topic: q.topic || 'Uncategorized',
    front: q.learning_point || q.statement || (q.question || '').slice(0, 200),
    back: `${q.answer || ''}\n\n${q.rationale || ''}\n\n${(q.key_facts || []).join('\n')}`,
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

export function addCard(q: any, source: 'auto' | 'manual' | 'full' = 'auto') {
  const cards = loadCards();
  if (cards.some((c) => c.sourceQuestionId === q.id && c.source !== 'full')) return;
  cards.push(createCard(q, source));
  saveCards(cards);
}

export async function generateTopicCards(topic: string | null): Promise<Card[]> {
  const res = await fetch('/bank/questions.json');
  const bank = await res.json();
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
