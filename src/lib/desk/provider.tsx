import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { pickQuestionIds } from "./adapt";
import { questionById } from "./questions";
import { topicById } from "./topics";
import type { BlueprintId, DeskState, Focus, Mode, Pool, TestBlock } from "./types";

const KEY = "callroom-desk-v1";

function empty(): DeskState {
  return { tests: [], marks: {}, notes: {}, focus: {} };
}

function load(): DeskState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as DeskState;
    return {
      tests: parsed.tests ?? [],
      marks: parsed.marks ?? {},
      notes: parsed.notes ?? {},
      focus: parsed.focus ?? {},
    };
  } catch {
    return empty();
  }
}

type DeskApi = {
  ready: boolean;
  state: DeskState;
  setFocus: (id: BlueprintId, focus: Focus) => void;
  setFocusMap: (focus: Partial<Record<BlueprintId, Focus>>) => void;
  toggleMark: (questionId: string) => void;
  setNote: (questionId: string, note: string) => void;
  createTest: (input: {
    name?: string;
    mode: Mode;
    adaptive: boolean;
    topicIds: string[];
    pool: Pool;
    count: number;
  }) => string | null;
  createFromIds: (ids: string[], name: string) => string | null;
  patchTest: (id: string, recipe: (test: TestBlock) => TestBlock) => void;
  removeTest: (id: string) => void;
};

const DeskContext = createContext<DeskApi | null>(null);

export function DeskProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DeskState | null>(null);

  useEffect(() => {
    setState(load());
  }, []);

  const commit = (recipe: (current: DeskState) => DeskState) => {
    setState((prev) => {
      const next = recipe(prev ?? load());
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const api: DeskApi = {
    ready: state !== null,
    state: state ?? empty(),
    setFocus: (id, focus) => commit((current) => ({ ...current, focus: { ...current.focus, [id]: focus } })),
    setFocusMap: (focus) => commit((current) => ({ ...current, focus: { ...current.focus, ...focus } })),
    toggleMark: (questionId) =>
      commit((current) => ({
        ...current,
        marks: { ...current.marks, [questionId]: !current.marks[questionId] },
      })),
    setNote: (questionId, note) =>
      commit((current) => ({ ...current, notes: { ...current.notes, [questionId]: note } })),
    createTest: (input) => {
      const base = state ?? load();
      const ids = pickQuestionIds(base, input.topicIds, input.pool, input.count, input.adaptive);
      if (!ids.length) return null;
      const seconds = input.mode === "timed" ? ids.length * 90 : 0;
      const labels = [
        ...new Set(ids.map((id) => topicById[questionById[id]?.topicId ?? ""]?.short).filter(Boolean)),
      ];
      const test: TestBlock = {
        id: crypto.randomUUID(),
        name:
          input.name?.trim() ||
          (input.adaptive ? "Adaptive block" : labels.slice(0, 3).join(", ") || "Custom block"),
        mode: input.mode,
        adaptive: input.adaptive,
        topicIds: input.topicIds,
        pool: input.pool,
        questionIds: ids,
        index: 0,
        answers: {},
        status: "open",
        createdAt: Date.now(),
        secondsLeft: seconds,
        secondsTotal: seconds,
      };
      commit((current) => ({ ...current, tests: [...current.tests, test] }));
      return test.id;
    },
    createFromIds: (ids, name) => {
      if (!ids.length) return null;
      const test: TestBlock = {
        id: crypto.randomUUID(),
        name,
        mode: "tutor",
        adaptive: false,
        topicIds: [],
        pool: "all",
        questionIds: ids,
        index: 0,
        answers: {},
        status: "open",
        createdAt: Date.now(),
        secondsLeft: 0,
        secondsTotal: 0,
      };
      commit((current) => ({ ...current, tests: [...current.tests, test] }));
      return test.id;
    },
    patchTest: (id, recipe) =>
      commit((current) => ({
        ...current,
        tests: current.tests.map((test) => (test.id === id ? recipe(test) : test)),
      })),
    removeTest: (id) =>
      commit((current) => ({ ...current, tests: current.tests.filter((test) => test.id !== id) })),
  };

  return <DeskContext.Provider value={api}>{children}</DeskContext.Provider>;
}

export function useDesk() {
  const ctx = useContext(DeskContext);
  if (!ctx) throw new Error("Desk missing");
  return ctx;
}
