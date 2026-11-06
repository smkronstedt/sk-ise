import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell } from "@/components/desk/shell";
import { latestResult } from "@/lib/desk/adapt";
import { useDesk } from "@/lib/desk/provider";
import { guideLinks, statementQuestions } from "@/lib/desk/statements";
import type { Question } from "@/lib/desk/types";

export const Route = createFileRoute("/guidelines")({
  component: GuidelinesPage,
});

type Status = "all" | "unused" | "incorrect" | "correct";

function GuidelinesPage() {
  const desk = useDesk();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [open, setOpen] = useState<string | null>(null);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const order: string[] = [];
    const byGuide = new Map<string, Question[]>();
    for (const question of statementQuestions) {
      const guide = question.guide ?? "Other";
      const result = latestResult(desk.state, question.id);
      if (status === "unused" && result !== "unused") continue;
      if (status === "incorrect" && result !== "incorrect") continue;
      if (status === "correct" && result !== "correct") continue;
      const blob = `${guide} ${question.statement ?? ""} ${question.stem.join(" ")}`.toLowerCase();
      if (needle && !blob.includes(needle)) continue;
      if (!byGuide.has(guide)) {
        byGuide.set(guide, []);
        order.push(guide);
      }
      byGuide.get(guide)?.push(question);
    }
    return order.map((guide) => ({ guide, items: byGuide.get(guide) ?? [] }));
  }, [desk.state, query, status]);

  const start = (ids: string[], name: string) => {
    const id = desk.createFromIds(ids, name);
    if (id) void navigate({ to: "/test/$id", params: { id } });
  };

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-wide text-muted uppercase">One item per recommendation</p>
          <h1 className="font-serif text-3xl tracking-tight">Guideline statements</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            {statementQuestions.length} original questions, grouped by AUA guideline. Each one tests a single recommendation. After you answer, the statement and the official page are on the explanation. These are not SASP items.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a guideline or a statement"
          className="min-h-11 min-w-[16rem] flex-1 rounded border border-line px-3"
        />
        {(
          [
            ["all", "All"],
            ["unused", "Not done"],
            ["incorrect", "Missed"],
            ["correct", "Correct"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setStatus(id)}
            className={`min-h-11 rounded border px-3 text-sm font-semibold ${
              status === id ? "border-navy bg-navy text-white" : "border-line bg-paper"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {groups.length === 0 ? (
          <p className="rounded border border-line bg-paper px-4 py-6 text-sm text-muted">Nothing in that filter.</p>
        ) : (
          groups.map(({ guide, items }) => {
            const correct = items.filter((item) => latestResult(desk.state, item.id) === "correct").length;
            const answered = items.filter((item) => latestResult(desk.state, item.id) !== "unused").length;
            const expanded = open === guide || query.trim().length > 0;
            const link = guideLinks[guide];
            return (
              <section key={guide} className="rounded border border-line bg-paper">
                <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setOpen(expanded && open === guide ? null : guide)}
                    className="min-h-11 flex-1 text-left"
                  >
                    <span className="font-semibold">{guide}</span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {items.length} statements
                      {answered > 0 ? ` · ${correct}/${answered} correct on the last try` : " · not started"}
                    </span>
                  </button>
                  {link ? (
                    <a href={link.href} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue">
                      Guideline
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => start(items.map((item) => item.id), guide)}
                    className="min-h-11 rounded bg-navy px-4 text-sm font-semibold text-white"
                  >
                    Tutor this guideline
                  </button>
                </div>
                {expanded ? (
                  <ul className="divide-y divide-line border-t border-line">
                    {items.map((item, index) => {
                      const result = latestResult(desk.state, item.id);
                      return (
                        <li key={item.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
                          <p className="min-w-0 flex-1 text-sm">
                            <span className="font-semibold">{index + 1}. </span>
                            {item.statement}
                          </p>
                          <span
                            className={`text-sm font-semibold ${
                              result === "correct" ? "text-correct" : result === "incorrect" ? "text-wrong" : "text-muted"
                            }`}
                          >
                            {result === "unused" ? "Not done" : result === "correct" ? "Correct" : "Missed"}
                          </span>
                          <button
                            type="button"
                            onClick={() => start([item.id], `${guide} ${index + 1}`)}
                            className="min-h-11 rounded border border-line px-3 text-sm font-semibold"
                          >
                            Ask this one
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>
            );
          })
        )}
      </div>
    </Shell>
  );
}
