import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Shell } from '@/components/desk/shell';
import {
  loadCards,
  saveCards,
  schedule,
  generateTopicCards,
  addGenerated,
  type Card,
} from '@/lib/cards';

export const Route = createFileRoute('/cards')({
  component: CardsPage,
});

function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [mode, setMode] = useState<'my' | 'boards'>('my');
  const [current, setCurrent] = useState<Card | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);

  useEffect(() => {
    setCards(loadCards());
  }, []);

  const due = cards.filter((c) => c.due <= Date.now() && c.source !== 'full');

  const startReview = (list: Card[]) => {
    setCurrent(list[0] ?? null);
    setRevealed(false);
  };

  const rate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!current) return;
    const next = schedule(current, rating);
    const updated = cards.map((c) => (c.id === next.id ? next : c));
    setCards(updated);
    saveCards(updated);
    const remaining = updated.filter((c) => c.due <= Date.now() && c.source !== 'full');
    setCurrent(remaining[0] ?? null);
    setRevealed(false);
  };

  const startBoards = async () => {
    const generated = await generateTopicCards(topic);
    addGenerated(generated);
    const fresh = loadCards();
    setCards(fresh);
    const list = fresh.filter((c) => c.source === 'full' && (!topic || c.topic === topic));
    startReview(list);
  };

  return (
    <Shell>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode('my')}
          className={`px-3 py-2 rounded ${mode === 'my' ? 'bg-navy text-white' : 'border'}`}
        >
          My Cards
        </button>
        <button
          onClick={() => setMode('boards')}
          className={`px-3 py-2 rounded ${mode === 'boards' ? 'bg-navy text-white' : 'border'}`}
        >
          Boards Prep
        </button>
      </div>

      {mode === 'my' && (
        <div className="mb-4">
          <p className="text-sm text-muted">{due.length} due now</p>
          <button
            onClick={() => startReview(due)}
            disabled={!due.length}
            className="mt-2 px-4 py-2 bg-navy text-white rounded disabled:opacity-50"
          >
            Review due
          </button>
        </div>
      )}

      {mode === 'boards' && (
        <div className="mb-4">
          <select
            value={topic ?? ''}
            onChange={(e) => setTopic(e.target.value || null)}
            className="border rounded px-3 py-2"
          >
            <option value="">All topics</option>
            <option value="NMIBC">NMIBC</option>
            <option value="MIBC">MIBC</option>
            <option value="Stones">Stones</option>
            <option value="Prostate">Prostate</option>
            <option value="Andrology">Andrology</option>
            <option value="Peds">Peds</option>
          </select>
          <button
            onClick={startBoards}
            className="ml-2 px-4 py-2 bg-navy text-white rounded"
          >
            Start full review
          </button>
        </div>
      )}

      {current && (
        <div className="mt-6 rounded border border-line bg-paper p-4">
          <p className="font-semibold">{current.front}</p>
          {revealed && (
            <pre className="mt-3 whitespace-pre-wrap text-sm">{current.back}</pre>
          )}
          {!revealed ? (
            <button className="mt-4 px-4 py-2 border rounded" onClick={() => setRevealed(true)}>
              Reveal
            </button>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="bg-red-600 text-white px-3 py-2 rounded" onClick={() => rate('again')}>
                Again 25m
              </button>
              <button className="bg-amber-500 text-white px-3 py-2 rounded" onClick={() => rate('hard')}>
                Hard 12.2h
              </button>
              <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={() => rate('good')}>
                Good 1d
              </button>
              <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={() => rate('easy')}>
                Easy 3d
              </button>
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}
