import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Figure } from "@/components/desk/figure";
import { Shell } from "@/components/desk/shell";
import { scoreTest } from "@/lib/desk/adapt";
import { AnatomyFigure } from "@/components/desk/anatomy-figure";
import { logActivity, logCorrect } from "@/lib/desk/activity";
import { noteRow } from "@/lib/desk/honors";
import { getQuestion, loadCatalog } from "@/lib/desk/catalog";
import { useDesk } from "@/lib/desk/provider";
import { loadBankProgress, saveBankProgress } from "@/lib/desk/original-bank";
import { guideLinks } from "@/lib/desk/statements";
import { topicById } from "@/lib/desk/topics";
import type { TestBlock } from "@/lib/desk/types";
import { addCard } from "@/lib/cards";

export const Route = createFileRoute("/test/$id")({
  component: TestPage,
});

const letters = "ABCDEFGHIJ";

function TestPage() {
  const { id } = Route.useParams();
  const desk = useDesk();
  const test = desk.state.tests.find((item) => item.id === id);
  const [bankReady, setBankReady] = useState(false);
  const [cardAdded, setCardAdded] = useState(false);
  const [savedNote, setSavedNote] = useState("");

  useEffect(() => {
    void loadCatalog().finally(() => setBankReady(true));
  }, []);

  useEffect(() => {
    if (!test || test.status !== "open" || test.mode !== "timed") return;
    const timer = window.setInterval(() => {
      desk.patchTest(test.id, (current) => {
        if (current.status !== "open") return current;
        const secondsLeft = Math.max(0, current.secondsLeft - 1);
        if (secondsLeft === 0) {
          return { ...current, secondsLeft, status: "done", finishedAt: Date.now() };
        }
        return { ...current, secondsLeft };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [desk, test]);

  if (!desk.ready) {
    return (
      <Shell>
        <p>Opening the block…</p>
      </Shell>
    );
  }
  if (!test) {
    return (
      <Shell>
        <p>That block is not on this desk.</p>
        <Link to="/" className="mt-3 inline-flex min-h-11 items-center font-semibold text-blue">
          Back to the desk
        </Link>
      </Shell>
    );
  }

  const questionId = test.questionIds[test.index];
  const question = getQuestion(questionId);
  if (!question) {
    return (
      <Shell>
        <p>{bankReady ? "This item is missing." : "Opening the block…"}</p>
      </Shell>
    );
  }

  const answer = test.answers[questionId] ?? { choice: null, submitted: false };
  const revealed = test.status === "done" || (test.mode === "tutor" && answer.submitted);
  const guide = topicById[question.topicId];
  const score = scoreTest(desk.state, test.id);

  const choose = (choice: number) => {
    if (revealed && test.mode === "tutor") return;
    if (test.status === "done") return;
    desk.patchTest(test.id, (current) => ({
      ...current,
      answers: {
        ...current.answers,
        [questionId]: { choice, submitted: current.answers[questionId]?.submitted ?? false },
      },
    }));
  };

  const submit = () => {
    if (answer.choice == null || answer.submitted) return;
    desk.patchTest(test.id, (current) => ({
      ...current,
      answers: {
        ...current.answers,
        [questionId]: { choice: answer.choice, submitted: true },
      },
    }));
    if (questionId.startsWith("UQB-") && answer.choice != null) {
      const progress = loadBankProgress();
      progress.answers[questionId] = {
        choice: letters[answer.choice],
        correct: answer.choice === question.answer,
      };
      saveBankProgress(progress);
    }
    logActivity("questions");
    if (answer.choice === question.answer) logCorrect();
    noteRow(answer.choice === question.answer);
  };

  const jump = (index: number) => {
    desk.patchTest(test.id, (current) => ({ ...current, index }));
    setCardAdded(false);
  };

  const endBlock = () => {
    desk.patchTest(test.id, (current) => ({
      ...current,
      status: "done",
      finishedAt: Date.now(),
    }));
  };

  const flagToCards = () => {
    addCard(
      {
        id: question.id,
        topic: guide?.short ?? question.topicId,
        question: question.stem.join("\n\n"),
        answer: question.choices[question.answer],
        rationale: question.explanation,
        key_facts: question.wrong.filter(Boolean),
      },
      "manual",
    );
    setCardAdded(true);
  };

  return (
    <Shell>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">
            {test.name} · {test.mode}
            {test.adaptive ? " · adaptive" : ""} · item {test.index + 1} of {test.questionIds.length}
          </p>
          <h1 className="truncate font-serif text-2xl">{guide?.title}</h1>
        </div>
        {test.mode === "timed" && test.status === "open" ? (
          <p className="rounded bg-navy px-3 py-2 font-semibold text-white">{formatTime(test.secondsLeft)}</p>
        ) : null}
        <Link to="/" className="min-h-11 rounded border border-line bg-paper px-3 text-sm font-semibold">
          Home
        </Link>
        <Link to="/tests" className="min-h-11 rounded border border-line bg-paper px-3 text-sm font-semibold">
          Tests
        </Link>
        {test.status === "open" ? (
          <button
            type="button"
            onClick={() => setSavedNote("Saved on this device. Open Tests to resume this block.")}
            className="min-h-11 rounded bg-navy px-3 text-sm font-semibold text-white"
          >
            Save
          </button>
        ) : null}
        <button type="button" onClick={endBlock} className="min-h-11 rounded border border-line bg-paper px-3 text-sm font-semibold" disabled={test.status === "done"}>
          {test.status === "done" ? "Block ended" : "End block"}
        </button>
      </div>
      {savedNote ? <p className="mb-3 text-sm font-semibold text-correct">{savedNote}</p> : null}

      {test.status === "done" ? (
        <div className="mb-3 rounded border border-line bg-obj px-3 py-2 text-sm">
          <p>
            Score {score.correct} / {score.answered} answered ({score.total} in the block). This test stays under Tests.
          </p>
          <div className="mt-3">
            <Link to="/" className="inline-flex min-h-11 items-center rounded bg-navy px-4 text-sm font-semibold text-white">
              Home
            </Link>
          </div>
          <ul className="mt-2 flex flex-col gap-1">
            {test.questionIds.map((itemId, index) => {
              const itemAnswer = test.answers[itemId];
              const submitted = Boolean(itemAnswer?.submitted && itemAnswer.choice != null);
              const right = submitted && itemAnswer?.choice === getQuestion(itemId)?.answer;
              return (
                <li key={itemId}>
                  <button type="button" onClick={() => jump(index)} className="text-left">
                    <span className={right ? "font-semibold text-correct" : submitted ? "font-semibold text-wrong" : "text-muted"}>
                      {index + 1}. {right ? "Correct" : submitted ? "Missed" : "Not answered"}
                    </span>
                    <span className="text-muted"> · {getQuestion(itemId)?.stem[0].slice(0, 90)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="mb-3 text-sm text-muted">
          Answers save as you submit. Use the numbers to look back at one you already did, or leave and resume this block from Tests.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
        <ol className="grid h-max grid-cols-5 gap-1 lg:grid-cols-1">
          {test.questionIds.map((itemId, index) => {
            const itemAnswer = test.answers[itemId];
            const known = test.status === "done" || (test.mode === "tutor" && itemAnswer?.submitted);
            const right = known && itemAnswer?.choice === getQuestion(itemId)?.answer;
            const wrong = known && itemAnswer?.submitted && itemAnswer.choice != null && !right;
            return (
              <li key={itemId}>
                <button
                  type="button"
                  onClick={() => jump(index)}
                  className={`min-h-11 min-w-11 rounded border text-sm font-semibold ${
                    index === test.index
                      ? "border-blue bg-blue text-white"
                      : right
                        ? "border-correct bg-correct-bg text-correct"
                        : wrong
                          ? "border-wrong bg-wrong-bg text-wrong"
                          : "border-line bg-paper"
                  }`}
                >
                  {index + 1}
                  {desk.state.marks[itemId] ? " •" : ""}
                </button>
              </li>
            );
          })}
        </ol>

        <article className="rounded border border-line bg-paper p-4">
          {question.stem.map((paragraph) => (
            <p key={paragraph} className="mb-3 text-base leading-relaxed">
              {paragraph}
            </p>
          ))}
          {question.image ? <img src={question.image} alt="Figure shown with this question" className="mb-3 max-h-96 w-full bg-white object-contain" /> : null}
          <AnatomyFigure topic={question.topicId} text={question.stem.join(" ")} />
          {question.labs ? (
            <table className="mb-3 w-full border-collapse text-sm">
              <tbody>
                {question.labs.map((lab) => (
                  <tr key={lab.name} className="border-t border-line">
                    <th className="py-1 pr-3 text-left font-semibold">{lab.name}</th>
                    <td className={lab.abn ? "font-semibold text-wrong" : ""}>{lab.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          <div className="flex flex-col gap-2">
            {question.choices.map((choice, index) => {
              const selected = answer.choice === index;
              const isKey = question.answer === index;
              let tone = "border-line bg-paper";
              if (revealed && isKey) tone = "border-correct bg-correct-bg";
              else if (revealed && selected && !isKey) tone = "border-wrong bg-wrong-bg";
              else if (selected) tone = "border-blue bg-blue-soft";
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => choose(index)}
                  className={`min-h-11 rounded border px-3 py-2 text-left ${tone}`}
                >
                  <span className="mr-2 font-semibold">{letters[index]}.</span>
                  {choice}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => desk.toggleMark(question.id)} className="min-h-11 rounded border border-line px-3 text-sm font-semibold">
              {desk.state.marks[question.id] ? "Unmark" : "Mark"}
            </button>
            <button
              type="button"
              onClick={flagToCards}
              disabled={cardAdded}
              className="min-h-11 rounded border border-amber-500 bg-amber-50 px-3 text-sm font-semibold text-amber-800 disabled:opacity-50"
            >
              {cardAdded ? "Added to Cards" : "Add to Cards"}
            </button>
            {test.mode === "tutor" && test.status === "open" ? (
              <button
                type="button"
                onClick={submit}
                disabled={answer.choice == null || answer.submitted}
                className="min-h-11 rounded bg-blue px-4 font-semibold text-white disabled:opacity-40"
              >
                Submit
              </button>
            ) : null}
            <button type="button" disabled={test.index === 0} onClick={() => jump(test.index - 1)} className="min-h-11 rounded border border-line px-3 font-semibold disabled:opacity-40">
              Previous
            </button>
            <button
              type="button"
              disabled={test.index >= test.questionIds.length - 1}
              onClick={() => jump(test.index + 1)}
              className="min-h-11 rounded border border-line px-3 font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>

          {revealed ? <Explanation test={test} questionId={questionId} /> : null}

          <label className="mt-4 block text-sm font-semibold">
            Note
            <textarea
              value={desk.state.notes[question.id] ?? ""}
              onChange={(event) => desk.setNote(question.id, event.target.value)}
              rows={3}
              className="mt-1 w-full rounded border border-line px-3 py-2 font-normal"
            />
          </label>
        </article>
      </div>
    </Shell>
  );
}

function Explanation({ test, questionId }: { test: TestBlock; questionId: string }) {
  const question = getQuestion(questionId);
  if (!question) return null;
  const answer = test.answers[questionId];
  const picked = answer?.choice;
  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="font-semibold text-correct">
        Correct answer: {letters[question.answer]}. {question.choices[question.answer]}
      </p>
      {picked != null && picked !== question.answer ? (
        <p className="mt-1 text-sm text-wrong">You chose {letters[picked]}.</p>
      ) : null}
      <p className="mt-3 leading-relaxed">{question.explanation}</p>
      {question.figure ? <Figure id={question.figure} /> : null}
      {question.wrong.some((line) => line) ? (
        <div className="mt-3">
          <p className="text-sm font-semibold">Why the others are wrong</p>
          <ul className="mt-1 flex flex-col gap-1 text-sm">
            {question.choices.map((choice, index) =>
              index === question.answer || !question.wrong[index] ? null : (
                <li key={choice}>
                  <span className="font-semibold">{letters[index]}.</span> {question.wrong[index]}
                </li>
              ),
            )}
          </ul>
        </div>
      ) : null}
      {question.statement ? (
        <p className="mt-3 rounded border border-obj-line bg-obj px-3 py-2 text-sm">
          <span className="font-semibold">Guideline statement. </span>
          {question.guide ? `${question.guide}. ` : ""}
          {question.statement}
        </p>
      ) : null}
      <p className="mt-3 rounded border border-obj-line bg-obj px-3 py-2 text-sm">
        <span className="font-semibold">Teaching point. </span>
        {question.objective}
      </p>
      <GuidelineLinks question={question} />
    </div>
  );
}

function GuidelineLinks({ question }: { question: { topicId: string; guide?: string } }) {
  const named = question.guide ? guideLinks[question.guide] : undefined;
  const links = named
    ? [{ label: named.label, href: named.href }]
    : (topicById[question.topicId]?.guidelines ?? []);
  return (
    <div className="mt-3 rounded border border-line bg-paper px-3 py-2 text-sm">
      <p className="font-semibold">AUA guideline</p>
      {links.length ? (
        <ul className="mt-1 flex flex-col gap-1">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noreferrer" className="font-semibold text-blue">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-muted">AUA has not published a guideline for this topic.</p>
      )}
    </div>
  );
}

function formatTime(total: number) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
