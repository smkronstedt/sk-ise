import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { AnatomyFigure } from "@/components/desk/anatomy-figure";
import { isNlutdTopic, NlutdChart } from "@/components/desk/nlutd-chart";
import { DsdFigure, isDsdText } from "@/components/desk/dsd-figure";
import { isPopqText, PopqFigure } from "@/components/desk/popq-figure";
import { addCard, loadCards } from "@/lib/cards";
import { selectionStatus } from "@/lib/desk/adapt";
import { loadCatalog } from "@/lib/desk/catalog";
import { useDesk } from "@/lib/desk/provider";
import { logActivity, logCorrect } from "@/lib/desk/activity";
import { noteRow } from "@/lib/desk/honors";
import { linksForBankTopic } from "@/lib/desk/statements";
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

type Status = "unused" | "used" | "all" | "incorrect" | "correct" | "marked";

const PLACE = "ise-bank-place";

function savedPlace() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(PLACE) || "null") as {
      setName?: string;
      topic?: string;
      status?: Status;
      query?: string;
      hardOnly?: boolean;
      index?: number;
      hold?: string | null;
    } | null;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function BankPage() {
  const place = savedPlace();
  const [items, setItems] = useState<BankItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<"practice" | "points">("practice");
  const [setName, setSetName] = useState(place.setName || "sasp");
  const [topic, setTopic] = useState(place.topic || "all");
  const [status, setStatus] = useState<Status>(place.status || "unused");
  const [query, setQuery] = useState(place.query || "");
  const [hardOnly, setHardOnly] = useState(place.hardOnly === true);
  const [index, setIndex] = useState(place.index || 0);
  const [picked, setPicked] = useState<string | null>(null);
  const [hold, setHold] = useState<string | null>(place.hold ?? null);
  const [progress, setProgress] = useState<BankProgress>(emptyBankProgress);
  const [ready, setReady] = useState(false);
  const [banner, setBanner] = useState("");
  const [catalogReady, setCatalogReady] = useState(false);
  const desk = useDesk();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setProgress(loadBankProgress());
    setReady(true);
    setFailed(false);
    let cancel = false;
    void loadCatalog().finally(() => {
      if (!cancel) setCatalogReady(true);
    });
    const timer = window.setTimeout(() => {
      if (!cancel) setFailed(true);
    }, 20000);
    Promise.all([
      fetch("/bank/questions.json").then((response) => {
        if (!response.ok) throw new Error("missing");
        return response.json() as Promise<BankItem[]>;
      }),
      fetch("/bank/sasp.json").then((response) => (response.ok ? (response.json() as Promise<BankItem[]>) : [])),
    ])
      .then(([uqb, sasp]) => {
        if (!cancel) {
          setItems([...uqb, ...sasp]);
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
      if (setName === "uqb" && (item.id.startsWith("SASP") || item.id.startsWith("SIEGAL"))) return false;
      if (setName === "sasp" && !item.id.startsWith("SASP")) return false;
      if (setName === "siegal" && !item.id.startsWith("SIEGAL")) return false;
      if (/^\d{4}$/.test(setName) && !item.id.startsWith(`SASP${setName}`)) return false;
      if (topic !== "all" && item.topic !== topic) return false;
      const result = selectionStatus(desk.state, item.id);
      if (status === "unused" && result !== "unused") return false;
      if (status === "used" && result === "unused") return false;
      if (status === "correct" && result !== "correct") return false;
      if (status === "incorrect" && result !== "incorrect") return false;
      if (status === "marked" && !progress.marks[item.id]) return false;
      if (hardOnly && item.hard !== true) return false;
      const blob = `${item.question} ${item.learning_point} ${item.source_ref} ${item.topic}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [items, progress.answers, progress.marks, query, status, topic, setName, hardOnly, desk.state, catalogReady]);

  const shown = useMemo(() => {
    if (!hold || filtered.some((row) => row.id === hold)) return filtered;
    const pinned = (items ?? []).find((row) => row.id === hold);
    if (!pinned) return filtered;
    const next = filtered.slice();
    next.splice(Math.min(index, next.length), 0, pinned);
    return next;
  }, [filtered, hold, items, index]);

  const filters = useRef({ topic, status, query, view, hardOnly, setName });
  useEffect(() => {
    const prev = filters.current;
    const same =
      prev.topic === topic &&
      prev.status === status &&
      prev.query === query &&
      prev.view === view &&
      prev.hardOnly === hardOnly &&
      prev.setName === setName;
    filters.current = { topic, status, query, view, hardOnly, setName };
    if (same) return;
    setIndex(0);
    setPicked(null);
    setHold(null);
  }, [topic, status, query, view, hardOnly, setName]);

  useEffect(() => {
    try {
      sessionStorage.setItem(PLACE, JSON.stringify({ setName, topic, status, query, hardOnly, index, hold }));
    } catch {
      // The question stays on screen either way.
    }
  }, [setName, topic, status, query, hardOnly, index, hold]);

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

  const item = shown[Math.min(index, Math.max(shown.length - 1, 0))];
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
    logActivity("questions");
    if (isCorrect) logCorrect();
    noteRow(isCorrect);
    desk.consume(item.id);
    if (!isCorrect) addCard(item, "auto");
    setHold(item.id);
  };

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-wide text-muted uppercase">Original items</p>
          <h1 className="font-serif text-3xl tracking-tight">Question bank</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {items.length} items. The SASP years from your spreadsheet are in here, separate from the older board set. 2024 was not in the file, and 2025 has 14 questions.
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
          value={setName}
          onChange={(event) => setSetName(event.target.value)}
          className="min-h-11 rounded border border-line bg-paper px-3"
        >
          <option value="all">Every set</option>
          <option value="sasp">SASP, all years</option>
          <option value="siegal">Siegal 2026 peds</option>
          <option value="uqb">Older board set</option>
          {["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2025"].map((year) => (
            <option key={year} value={year}>
              SASP {year}
            </option>
          ))}
        </select>
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
          <option value="used">Used</option>
          <option value="incorrect">Missed</option>
          <option value="correct">Correct</option>
          <option value="marked">Marked</option>
        </select>
        <button
          type="button"
          onClick={() => setHardOnly((on) => !on)}
          className={`min-h-11 rounded px-3 text-sm font-semibold ${hardOnly ? "bg-navy text-white" : "border border-line bg-paper"}`}
        >
          Hard only
        </button>
        <button
          type="button"
          onClick={() => {
            const ids = (items ?? [])
              .filter((row) => (topic === "all" || row.topic === topic) && selectionStatus(desk.state, row.id) !== "unused")
              .map((row) => row.id);
            if (!ids.length) {
              setBanner("Nothing in Used for this topic.");
              return;
            }
            desk.recycle(ids);
            setStatus("unused");
            setBanner(`${ids.length} used questions are back in Unused.`);
          }}
          className="min-h-11 rounded border border-line bg-paper px-3 text-sm font-semibold"
        >
          Recycle used
        </button>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search stem or point"
          className="min-h-11 flex-1 rounded border border-line bg-paper px-3"
        />
        <button
          type="button"
          disabled={!filtered.length}
          onClick={() => {
            const label =
              [
                topic !== "all" ? topic : "",
                query.trim(),
                setName === "sasp" ? "SASP" : setName === "siegal" ? "Siegal 2026" : setName === "uqb" ? "Board set" : /^\d{4}$/.test(setName) ? `SASP ${setName}` : "",
              ]
                .filter(Boolean)
                .join(" · ") || "Bank deck";
            const id = desk.createFromIds(
              filtered.map((row) => row.id),
              label,
            );
            if (id) void navigate({ to: "/test/$id", params: { id } });
          }}
          className="min-h-11 rounded bg-blue px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          Start deck ({filtered.length})
        </button>
      </div>
      {banner ? <p className="mt-3 text-sm font-semibold">{banner}</p> : null}

      {view === "points" ? (
        <Points items={filtered} />
      ) : shown.length === 0 || !item ? (
        <p className="mt-4 rounded border border-line bg-paper px-4 py-3">Nothing matches those filters.</p>
      ) : (
        <Practice
          item={item}
          index={Math.min(index, shown.length - 1)}
          total={shown.length}
          picked={picked}
          saved={saved}
          marked={Boolean(progress.marks[item.id])}
          note={progress.notes[item.id] ?? ""}
          onPick={setPicked}
          onSubmit={submit}
          onJump={(delta) => {
            const stays = !hold || filtered.some((row) => row.id === hold);
            setHold(null);
            setPicked(null);
            setIndex((current) => (delta > 0 && !stays ? current : Math.max(0, current + delta)));
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
          onCard={() => {
            const already = loadCards().some((card) => card.sourceQuestionId === item.id && card.source !== "full");
            addCard(item, "manual");
            setHold(item.id);
            setBanner(already ? "Already in your cards. This question stays here." : "Added to cards. This question stays here.");
          }}
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
  onCard,
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
  onCard: () => void;
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
      <AnatomyFigure topic={item.topic} text={item.question} />
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
          {revealed ? "Answered" : "Submit"}
        </button>
        <button type="button" onClick={onMark} className="min-h-11 rounded border border-line px-3 text-sm font-semibold">
          {marked ? "Unmark" : "Mark"}
        </button>
        <button
          type="button"
          onClick={onCard}
          className="min-h-11 rounded border border-line px-3 text-sm font-semibold"
        >
          Add to Cards
        </button>
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onJump(-1)}
          className="min-h-11 rounded border border-line px-3 font-semibold disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={index >= total - 1}
          onClick={() => onJump(1)}
          className={`min-h-11 rounded px-4 font-semibold ${revealed ? "bg-navy text-white" : "border border-line"} disabled:opacity-40`}
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
          {isNlutdTopic(item.topic) ? <NlutdChart /> : null}
          {isDsdText(
            [item.question, item.rationale, item.learning_point, ...item.key_facts, ...Object.values(item.options)].join(" "),
          ) ? (
            <DsdFigure />
          ) : null}
          {isPopqText(
            [item.question, item.rationale, item.learning_point, ...item.key_facts, ...Object.values(item.options)].join(" "),
          ) ? (
            <PopqFigure />
          ) : null}
          <p className="mt-3 rounded border border-obj-line bg-obj px-3 py-2 text-sm">
            <span className="font-semibold">Learning point. </span>
            {item.learning_point}
          </p>
          <GuidelineNote topic={item.topic} />
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

function GuidelineNote({ topic }: { topic: string }) {
  const links = linksForBankTopic(topic);
  if (!links.length) return null;
  return (
    <div className="mt-3 rounded border border-line bg-paper px-3 py-2 text-sm">
      <p className="font-semibold">AUA guideline for this teaching point</p>
      <ul className="mt-1 flex flex-col gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} target="_blank" rel="noreferrer" className="font-semibold text-blue">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
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
