import { blueprint, blueprintById } from "./blueprint";
import { questionById, questions } from "./questions";
import { topicById } from "./topics";
import type { BlueprintId, DeskState, Focus, Pool, Question } from "./types";

export function focusOf(state: DeskState, id: BlueprintId): Focus {
  return state.focus[id] ?? "hold";
}

export function focusMultiplier(focus: Focus): number {
  if (focus === "boost") return 1.85;
  if (focus === "ease") return 0.35;
  return 1;
}

export function latestResult(
  state: DeskState,
  id: string,
): "unused" | "correct" | "incorrect" {
  for (let i = state.tests.length - 1; i >= 0; i--) {
    const answer = state.tests[i].answers[id];
    if (!answer?.submitted || answer.choice == null) continue;
    const question = questionById[id];
    if (!question) return "unused";
    return answer.choice === question.answer ? "correct" : "incorrect";
  }
  return "unused";
}

export type BucketStat = {
  id: BlueprintId;
  title: string;
  short: string;
  percent: number;
  detail: string;
  bank: number;
  attempted: number;
  correct: number;
  accuracy: number | null;
  focus: Focus;
  suggested: number;
};

export function bucketStats(state: DeskState): BucketStat[] {
  const rows = blueprint.map((bucket) => {
    const mine = questions.filter((q) => topicById[q.topicId]?.blueprintId === bucket.id);
    let attempted = 0;
    let correct = 0;
    for (const question of mine) {
      const result = latestResult(state, question.id);
      if (result === "unused") continue;
      attempted += 1;
      if (result === "correct") correct += 1;
    }
    const accuracy = attempted ? correct / attempted : null;
    const weakness = accuracy == null ? 1 : Math.max(0.12, 1 - accuracy);
    const weight = bucket.percent * weakness * focusMultiplier(focusOf(state, bucket.id));
    return {
      ...bucket,
      bank: mine.length,
      attempted,
      correct,
      accuracy,
      focus: focusOf(state, bucket.id),
      suggested: weight,
    };
  });
  const sum = rows.reduce((total, row) => total + row.suggested, 0) || 1;
  return rows.map((row) => ({ ...row, suggested: (row.suggested / sum) * 100 }));
}

function statusWeight(result: "unused" | "correct" | "incorrect", marked: boolean): number {
  let weight = result === "incorrect" ? 1.8 : result === "unused" ? 1.15 : 0.28;
  if (marked) weight += 0.45;
  return weight;
}

export function eligibleQuestions(state: DeskState, topicIds: string[], pool: Pool): Question[] {
  const allowed = new Set(topicIds);
  return questions.filter((question) => {
    if (!allowed.has(question.topicId)) return false;
    const result = latestResult(state, question.id);
    if (pool === "unused") return result === "unused";
    if (pool === "incorrect") return result === "incorrect";
    if (pool === "correct") return result === "correct";
    if (pool === "marked") return Boolean(state.marks[question.id]);
    return true;
  });
}

export function pickQuestionIds(
  state: DeskState,
  topicIds: string[],
  pool: Pool,
  count: number,
  adaptive: boolean,
): string[] {
  const poolQuestions = eligibleQuestions(state, topicIds, pool);
  if (!adaptive) {
    const shuffled = [...poolQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count).map((question) => question.id);
  }
  const stats = bucketStats(state);
  const share = Object.fromEntries(stats.map((row) => [row.id, row.suggested])) as Record<
    BlueprintId,
    number
  >;
  const weighted = poolQuestions.map((question) => {
    const bucket = topicById[question.topicId]?.blueprintId ?? "core";
    const result = latestResult(state, question.id);
    return {
      id: question.id,
      weight: Math.max(0.05, share[bucket] ?? 1) * statusWeight(result, Boolean(state.marks[question.id])),
    };
  });
  const picked: string[] = [];
  const rest = [...weighted];
  while (picked.length < count && rest.length) {
    const sum = rest.reduce((total, item) => total + item.weight, 0);
    let roll = Math.random() * sum;
    let index = 0;
    for (; index < rest.length; index++) {
      roll -= rest[index].weight;
      if (roll <= 0) break;
    }
    if (index >= rest.length) index = rest.length - 1;
    picked.push(rest[index].id);
    rest.splice(index, 1);
  }
  return picked;
}

export function scoreTest(state: DeskState, id: string) {
  const test = state.tests.find((item) => item.id === id);
  if (!test) return { correct: 0, answered: 0, total: 0 };
  let correct = 0;
  let answered = 0;
  for (const questionId of test.questionIds) {
    const answer = test.answers[questionId];
    if (!answer?.submitted || answer.choice == null) continue;
    answered += 1;
    if (answer.choice === questionById[questionId]?.answer) correct += 1;
  }
  return { correct, answered, total: test.questionIds.length };
}

export function bucketName(id: BlueprintId) {
  return blueprintById[id].short;
}
