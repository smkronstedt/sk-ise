import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { addCard } from "@/lib/cards";
import {
  emptyBankProgress,
  letters,
  loadBankProgress,
  optionText,
  saveBankProgress,
  type BankItem,
  type BankProgress,
} from "@/lib/desk/original-bank";

export const Route = createFileRoute("/bank")({
  component: BankPage,
});

type Status = "all" | "unused" | "incorrect" | "correct" | "marked";

function BankPage() {
  const [items, setItems] = useState<BankItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<"practice" | "points">("practice");
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState<Status>("all");
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [progress, setProgress] = useState<BankProgress>(emptyBankProgress);
  const [ready, setReady] = useState(false);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setProgress(loadBankProgress());
    setReady(true);
    setFailed(false);
    let cancel = false;
    const timer = window.setTimeout(() => {
      if (!cancel) setFailed(true);
    }, 20000);
    fetch("/bank/questions.json")
      .then((response) => {
        if (!response.ok) throw new Error("missing");
        return response.json() as Promise<BankItem[]>;
      })
      .then((data) => {
        if (!cancel) {
          setItems(data);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancel) setFailed(true);
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      cancel = true;
      window.clearTimeout(timer);
    };
  }, [attempt]);

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items ?? []) counts.set(item.topic, (counts.get(item.topic) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (items ?? []).filter((item) => {
      if (topic !== "all" && item.topic !== topic) return false;
      const saved = progress.answers[item.id];
      if (status === "unused" && saved) return false;
      if (status === "correct" && !saved?.correct) return false;
      if (status === "incorrect" && saved?.correct !== false) return false;
      if (status === "marked" && !progress.marks[item.id]) return false;
      if (!needle) return true;
      const blob = `${item.question} ${item.learning_point} ${item.source_ref} ${item.topic}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [items, progress.answers, progress.marks, query, status, topic]);

  useEffect(() => {
    setIndex(0);
    setPicked(null);
  }, [topic, status, query, view]);

  const write = (next: BankProgress) => {
    setProgress(next);
    saveBankProgress(next);
  };

  const answered = Object.keys(progress.answers).length;
  const correct = Object.values(progress.answers).filter((row) => row.correct).length;

  if (!items) {
    return (
      <Shell>
        <p>{failed ? "The question bank did not load. Your other progress is still saved on this device." : "Opening the original bank…"}</p>
        {failed ? (
          <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-3 min-h-11 rounded bg-navy px-4 font-semibold text-white">
            Try again
          </button>
        ) : null}
      </Shell>
    );
  }

  const item = filtered[Math.min(index, Math.max(filtered.length - 1, 0))];
  const saved = item ? progress.answers[item.id] : undefined;

  const submit = () => {
    if (!item || !picked || saved) return;
    const isCorrect = picked === item.answer;
    write({
      ...progress,
      answers: {
        ...progress.answers,
        [item.id]: { choice: picked, correct: isCorrect },
      },
    });
    if (!isCorrect) addCard(item, "auto");
  };

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-wide text-muted uppercase">Original items</p>
          <h1 className="font-serif text-3xl tracking-tight">Question bank</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {items.length} board-style items with learning points. Scores stay in this browser.
            {ready ? ` ${correct}/${answered || 0} correct so far.` : ""}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setView("practice")}
            className={`min-h-11 rounded px-3 text-sm font-semibold ${view === "practice" ? "bg-navy text-white" : "border border-line bg-paper"}`}
          >
            Practice
          </button>
          <button
            type="button"
            onClick={() => setView("points")}
            className={`min-h-11 rounded px-3 text-sm font-semibold ${view === "points" ? "bg-navy text-white" : "border border-line bg-paper"}`}
          >
            Learning points
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className="min-h-11 flex-1 rounded border border-line bg-paper px-3"
        >
          <option value="all">All topics ({items.length})</option>
          {topics.map(([name, count]) => (
            <option key={name} value={name}>
              {name} ({count})
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as Status)}
          className="min-h-11 rounded border border-line bg-paper px-3"
        >
          <option value="all">Any result</option>
          <option value="unused">Unused</option>
          <option value="incorrect">Missed</option>
          <option value="correct">Correct</option>
          <option value="marked">Marked</option>
        </select>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search stem or point"
          className="min-h-11 flex-1 rounded border border-line bg-paper px-3"
        />
      </div>

      {view === "points" ? (
        <Points items={filtered} />
      ) : filtered.length === 0 || !item ? (
        <p className="mt-4 rounded border border-line bg-paper px-4 py-3">Nothing matches those filters.</p>
      ) : (
        <Practice
          item={item}
          index={Math.min(index, filtered.length - 1)}
          total={filtered.length}
          picked={picked}
          saved={saved}
          marked={Boolean(progress.marks[item.id])}
          note={progress.notes[item.id] ?? ""}
          onPick={setPicked}
          onSubmit={submit}
          onJump={(next) => {
            setIndex(next);
            setPicked(null);
          }}
          onMark={() =>
            write({
              ...progress,
              marks: { ...progress.marks, [item.id]: !progress.marks[item.id] },
            })
          }
          onNote={(note) =>
            write({
              ...progress,
              notes: { ...progress.notes, [item.id]: note },
            })
          }
        />
      )}
    </Shell>
  );
}

function Practice({
  item,
  index,
  total,
  picked,
  saved,
  marked,
  note,
  onPick,
  onSubmit,
  onJump,
  onMark,
  onNote,
}: {
  item: BankItem;
  index: number;
  total: number;
  picked: string | null;
  saved: { choice: string; correct: boolean } | undefined;
  marked: boolean;
  note: string;
  onPick: (letter: string) => void;
  onSubmit: () => void;
  onJump: (index: number) => void;
  onMark: () => void;
  onNote: (note: string) => void;
}) {
  const revealed = Boolean(saved);
  const choice = revealed ? saved?.choice : picked;
  return (
    <article className="mt-4 rounded border border-line bg-paper p-4">
      <p className="text-sm text-muted">
        {index + 1} of {total}
        <span className="mx-2 text-faint">·</span>
        {item.topic}
        <span className="mx-2 text-faint">·</span>
        {item.id}
      </p>
      <p className="mt-2 leading-relaxed">{item.question}</p>
      <div className="mt-3 flex flex-col gap-2">
        {letters.map((letter) => {
          const text = optionText(item, letter);
          if (!text) return null;
          const selected = choice === letter;
          const isKey = item.answer === letter;
          let tone = "border-line bg-paper";
          if (revealed && isKey) tone = "border-correct bg-correct-bg";
          else if (revealed && selected && !isKey) tone = "border-wrong bg-wrong-bg";
          else if (selected) tone = "border-blue bg-blue-soft";
          return (
            <button
              key={letter}
              type="button"
              onClick={() => {
                if (!revealed) onPick(letter);
              }}
              className={`min-h-11 rounded border px-3 py-2 text-left ${tone}`}
            >
              <span className="mr-2 font-semibold">{letter}.</span>
              {text}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!picked || revealed}
          className="min-h-11 rounded bg-blue px-4 font-semibold text-white disabled:opacity-40"
        >
          Submit
        </button>
        <button type="button" onClick={onMark} className="min-h-11 rounded border border-line px-3 text-sm font-semibold">
          {marked ? "Unmark" : "Mark"}
        </button>
        <button
          type="button"
          onClick={() => addCard(item, "manual")}
          className="min-h-11 rounded border border-line px-3 text-sm font-semibold"
        >
          Add to Cards
        </button>
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onJump(index - 1)}
          className="min-h-11 rounded border border-line px-3 font-semibold disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={index >= total - 1}
          onClick={() => onJump(index + 1)}
          className="min-h-11 rounded border border-line px-3 font-semibold disabled:opacity-40"
        >
          Next
        </button>
      </div>
      {revealed ? (
        <div className="mt-4 border-t border-line pt-4">
          <p className={`font-semibold ${saved?.correct ? "text-correct" : "text-wrong"}`}>
            {saved?.correct ? "Correct" : "Incorrect"}. Answer {item.answer}. {optionText(item, item.answer)}
          </p>
          <p className="mt-3 leading-relaxed">{item.rationale}</p>
          <p className="mt-3 rounded border border-obj-line bg-obj px-3 py-2 text-sm">
            <span className="font-semibold">Learning point. </span>
            {item.learning_point}
          </p>
          {item.key_facts.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {item.key_facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-sm text-muted">{item.source_ref}</p>
        </div>
      ) : null}
      <label className="mt-4 block text-sm font-semibold">
        Note
        <textarea
          value={note}
          onChange={(event) => onNote(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded border border-line px-3 py-2 font-normal"
        />
      </label>
    </article>
  );
}

function Points({ items }: { items: BankItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  useEffect(() => {
    setOpen(items[0]?.id ?? null);
  }, [items]);
  if (!items.length) {
    return <p className="mt-4 rounded border border-line bg-paper px-4 py-3">No learning points match.</p>;
  }
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {items.map((item) => {
        const shown = open === item.id;
        return (
          <li key={item.id} className="rounded border border-line bg-paper">
            <button
              type="button"
              onClick={() => setOpen(shown ? null : item.id)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left"
            >
              <span className="min-w-16 text-sm font-semibold text-muted">{item.id.replace("UQB-", "")}</span>
              <span>
                <span className="block text-sm font-semibold text-blue">{item.topic}</span>
                {item.learning_point}
              </span>
            </button>
            {shown ? (
              <div className="border-t border-line px-4 py-3 text-sm">
                <ul className="list-disc space-y-1 pl-5">
                  {item.key_facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
                <p className="mt-2 text-muted">{item.source_ref}</p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
