export type BlueprintId =
  | "core"
  | "basic"
  | "obstruction"
  | "stones"
  | "oncology"
  | "andrology"
  | "urogyn"
  | "peds";

export type Topic = {
  id: string;
  title: string;
  short: string;
  blueprintId: BlueprintId;
  blurb: string;
  guidelines: { label: string; href: string }[];
};

export type FigureId =
  | "retur"
  | "ph"
  | "bosniak"
  | "hpg"
  | "hct"
  | "diversion"
  | "explore"
  | "bcg"
  | "screen"
  | "swl"
  | "nlutd"
  | "bladder-stage";

export type LabRow = { name: string; value: string; abn?: boolean };

export type Question = {
  id: string;
  topicId: string;
  stem: string[];
  labs?: LabRow[];
  choices: string[];
  answer: number;
  explanation: string;
  wrong: string[];
  objective: string;
  hard?: boolean;
  figure?: FigureId;
  /** Scan or photo that belongs with the stem, when the bank item has one. */
  image?: string;
  /** Which AUA guideline this item teaches, when it is a statement question. */
  guide?: string;
  /** The recommendation being tested, in original wording. */
  statement?: string;
  /** Published AUA guideline statement number, when it matches this item. */
  statementNo?: string;
};

export type Pool = "all" | "unused" | "used" | "incorrect" | "correct" | "marked";
export type Mode = "tutor" | "timed";
export type Focus = "boost" | "hold" | "ease";

export type ItemAnswer = {
  choice: number | null;
  submitted: boolean;
};

export type TestBlock = {
  id: string;
  name: string;
  mode: Mode;
  adaptive: boolean;
  topicIds: string[];
  pool: Pool;
  questionIds: string[];
  index: number;
  answers: Record<string, ItemAnswer>;
  status: "open" | "done";
  createdAt: number;
  finishedAt?: number;
  secondsLeft: number;
  secondsTotal: number;
};

export type DeskState = {
  tests: TestBlock[];
  marks: Record<string, boolean>;
  notes: Record<string, string>;
  focus: Partial<Record<BlueprintId, Focus>>;
  /** Questions put back into the unused pile. Selection ignores older answers. */
  fresh?: Record<string, boolean>;
};
