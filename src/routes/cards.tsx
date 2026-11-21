import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { Shell } from '@/components/desk/shell';
import { AnatomyFigure } from '@/components/desk/anatomy-figure';
import { textOnlyBank } from '@/lib/desk/bank-figures';
import { isNlutdTopic, NlutdChart } from '@/components/desk/nlutd-chart';
import { DsdFigure, isDsdText, isPopqText, PopqFigure } from '@/components/desk/dsd-figure';
import {
  loadCards,
  saveCards,
  schedule,
  generateTopicCards,
  addGenerated,
  updateCard,
  removeCard,
  refreshQuizCards,
  makeBlankCard,
  type Card,
} from '@/lib/cards';
import { getQuestion, loadCatalog } from '@/lib/desk/catalog';
import { StagingReview } from '@/components/desk/staging-review';
import { isSemenQuestion, SemenRanges } from '@/components/desk/semen-ranges';
import { isVurQuestion, VurFigure } from '@/components/desk/vur-figure';
import { AdtTable, isAdvancedPca } from '@/components/desk/adt-table';
import { logActivity } from '@/lib/desk/activity';

export const Route = createFileRoute('/cards')({
  component: CardsPage,
});

function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [mode, setMode] = useState<'my' | 'boards' | 'staging' | 'edit'>('my');
  const [current, setCurrent] = useState<Card | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [boardNote, setBoardNote] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const reviewRef = useRef({
    mode,
    editing,
    current,
    revealed,
    rate: (_rating: 'again' | 'hard' | 'good' | 'easy') => {},
  });

  useEffect(() => {
    let cancel = false;
    void loadCatalog().finally(() => {
      if (!cancel) setCards(refreshQuizCards((id) => getQuestion(id)));
    });
    return () => {
      cancel = true;
    };
  }, []);

  const due = cards.filter((c) => c.due <= Date.now() && c.source !== "full" && c.front.trim());

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
    logActivity('cards');
    const remaining = updated.filter((c) => c.due <= Date.now() && c.source !== "full" && c.front.trim());
    setCurrent(remaining[0] ?? null);
    setRevealed(false);
  };

  reviewRef.current = { mode, editing, current, revealed, rate };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      const now = reviewRef.current;
      if (now.mode === 'edit' || now.mode === 'staging' || now.editing || !now.current) return;
      event.preventDefault();
      if (!now.revealed) {
        reviewRef.current = { ...now, revealed: true };
        setRevealed(true);
        return;
      }
      reviewRef.current = { ...now, revealed: false };
      now.rate('good');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const startBoards = async () => {
    if (!topic) {
      setBoardNote("Pick a topic first.");
      return;
    }
    try {
      const generated = await generateTopicCards(topic);
      if (generated.length) addGenerated(generated);
      const fresh = loadCards();
      setCards(fresh);
      const list = fresh.filter((c) => c.source === "full" && (!topic || c.topic === topic));
      if (!list.length) {
        setBoardNote("Nothing in that topic.");
        setCurrent(null);
        return;
      }
      setBoardNote(`${list.length} cards`);
      startReview(list);
    } catch {
      setBoardNote("That set did not open. Try one topic, not every set.");
    }
  };

  const mine = cards.filter((card) => card.source !== 'full');
  const shown = mine.filter((card) => {
    const hay = `${card.front} ${card.back} ${card.topic}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });
  const picked = mine.find((card) => card.id === selected) ?? null;

  const changeCard = (id: string, patch: Partial<Pick<Card, 'front' | 'back' | 'topic'>>) => {
    const updated = updateCard(id, patch);
    setCards(updated);
    setCurrent((card) => (card && card.id === id ? { ...card, ...patch } : card));
  };

  const addBlank = () => {
    const card = makeBlankCard();
    setCards(loadCards());
    setSelected(card.id);
    setCurrent(null);
    setMode("edit");
  };

  return (
    <Shell>
      <div className="mb-4 flex flex-wrap gap-2">
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
        <button
          onClick={() => setMode('staging')}
          className={`px-3 py-2 rounded ${mode === 'staging' ? 'bg-navy text-white' : 'border'}`}
        >
          Staging
        </button>
        <button
          onClick={() => setMode('edit')}
          className={`px-3 py-2 rounded ${mode === 'edit' ? 'bg-navy text-white' : 'border'}`}
        >
          Edit
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
          <button
            type="button"
            onClick={addBlank}
            className="ml-2 mt-2 px-4 py-2 rounded border border-navy font-semibold"
          >
            New card
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
            <option value="">Pick a topic</option>
            <option value="NMIBC">NMIBC</option>
            <option value="MIBC">MIBC</option>
            <option value="Oncology-Prostate">Prostate</option>
            <option value="Oncology-Testis">Testis</option>
            <option value="Oncology-Kidney">Kidney</option>
            <option value="Oncology-Penis/Urethra">Penis</option>
            <option value="Stones">Stones</option>
            <option value="Andrology">Infertility / andrology</option>
            <option value="Peds">Pediatrics</option>
          </select>
          <button
            onClick={startBoards}
            disabled={!topic}
            className="ml-2 px-4 py-2 bg-navy text-white rounded disabled:opacity-50"
          >
            Start full review
          </button>
          {boardNote ? <p className="mt-2 text-sm text-muted">{boardNote}</p> : null}
        </div>
      )}

      {mode === 'staging' && <StagingReview />}

      {mode === 'edit' && (
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your cards"
              className="min-h-11 w-full rounded border border-line px-3"
            />
            <p className="mt-2 text-sm text-muted">{mine.length} cards you added</p>
            <button type="button" onClick={addBlank} className="mt-2 min-h-11 rounded border border-navy px-3 text-sm font-semibold">
              New card
            </button>
            <ul className="mt-2 max-h-[32rem] overflow-auto rounded border border-line bg-paper">
              {shown.map((card) => (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(card.id)}
                    className={`block w-full px-3 py-2 text-left text-sm ${selected === card.id ? 'bg-navy text-white' : ''}`}
                  >
                    <span className="font-semibold">{card.topic}</span>
                    <span className="mt-0.5 block truncate">{card.front || "Empty card"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {picked ? (
            <div className="rounded border border-line bg-paper p-4">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">{picked.topic}</p>
              <label className="mt-3 block text-sm font-semibold">Topic</label>
              <input
                value={picked.topic}
                onChange={(event) => changeCard(picked.id, { topic: event.target.value })}
                className="mt-1 min-h-11 w-full rounded border border-line px-3"
              />
              <label className="mt-3 block text-sm font-semibold">Front</label>
              <textarea
                value={picked.front}
                onChange={(event) => changeCard(picked.id, { front: event.target.value })}
                className="mt-1 min-h-28 w-full rounded border border-line px-3 py-2"
              />
              <label className="mt-3 block text-sm font-semibold">Back</label>
              <textarea
                value={picked.back}
                onChange={(event) => changeCard(picked.id, { back: event.target.value })}
                className="mt-1 min-h-48 w-full rounded border border-line px-3 py-2"
              />
              <p className="mt-2 text-sm text-muted">Saved as you type.</p>
              <button
                type="button"
                onClick={() => {
                  setCards(removeCard(picked.id));
                  setSelected(null);
                }}
                className="mt-3 min-h-11 rounded border border-line px-3 text-sm font-semibold"
              >
                Delete card
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted">Pick a card to edit it.</p>
          )}
        </div>
      )}

      {mode !== 'edit' && mode !== 'staging' && current && (
        <div className="mt-6 rounded border border-line bg-paper p-6 max-w-2xl">
          {editing ? null : (
            <>
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Question</p>
              <p className="mt-1 text-lg font-semibold whitespace-pre-wrap">{current.front}</p>
              {textOnlyBank(current.sourceQuestionId) ? null : <AnatomyFigure topic={current.topic} text={current.front} />}
            </>
          )}
          {!revealed && !editing ? (
            <>
              <button
                className="mt-6 px-5 py-2.5 bg-navy text-white rounded font-semibold"
                onClick={() => setRevealed(true)}
              >
                Show answer
              </button>
              <p className="mt-3 text-sm text-muted">Space shows the answer. Space again is Good, 1 day.</p>
            </>
          ) : editing ? (
            <div className="mt-4">
              <textarea
                value={current.front}
                onChange={(event) => changeCard(current.id, { front: event.target.value })}
                className="min-h-24 w-full rounded border border-line px-3 py-2"
              />
              <textarea
                value={current.back}
                onChange={(event) => changeCard(current.id, { back: event.target.value })}
                className="mt-2 min-h-36 w-full rounded border border-line px-3 py-2"
              />
              <p className="mt-2 text-sm text-muted">Saved as you type.</p>
              <button type="button" className="mt-2 text-sm font-semibold" onClick={() => setEditing(false)}>
                Done editing
              </button>
            </div>
          ) : (
            <>
              <div className="mt-4 border-t border-line pt-4 text-sm leading-relaxed whitespace-pre-wrap">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Answer</p>
                <p className="mt-1">{current.back}</p>
                {isSemenQuestion(current.topic, `${current.front} ${current.back}`) ? <SemenRanges /> : null}
                {isVurQuestion(current.topic, `${current.front} ${current.back}`) ? <VurFigure /> : null}
                {isAdvancedPca(current.topic, `${current.front} ${current.back}`) ? <AdtTable /> : null}
              </div>
              {textOnlyBank(current.sourceQuestionId) ? null : (
                <>
              {isNlutdTopic(current.topic) || /neurogenic bladder|\bnlutd\b/i.test(`${current.front} ${current.back}`) ? <NlutdChart /> : null}
              {isDsdText(`${current.front} ${current.back}`) ? <DsdFigure /> : null}
              {isPopqText(`${current.front} ${current.back}`) ? <PopqFigure /> : null}
                </>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
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
              <p className="mt-3 text-sm text-muted">Space shows the answer. Space again is Good, 1 day.</p>
              <button type="button" className="mt-3 text-sm font-semibold" onClick={() => setEditing(true)}>
                Edit this card
              </button>
            </>
          )}
        </div>
      )}
    </Shell>
  );
}
