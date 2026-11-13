import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { answerChallenge, challengeTitle, duelVerdict, type ChallengeRow } from "@/lib/challenges-api";
import { useDesk } from "@/lib/desk/provider";

const duelName = (id: string) => `Duel ${id}`;

export function ChallengeCard({ row, me, onChange }: { row: ChallengeRow; me: string; onChange: () => void }) {
  const desk = useDesk();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const verdict = duelVerdict(row, me);
  const existing = desk.state.tests.find((test) => test.name === duelName(row.id));
  const canStart = row.kind === "duel" && row.status === "accepted" && (row.questionIds?.length ?? 0) > 0;
  const startLabel = existing?.status === "done" ? "Review duel" : existing ? "Resume duel" : "Start duel";

  const start = () => {
    if (existing) {
      void navigate({ to: "/test/$id", params: { id: existing.id } });
      return;
    }
    if (!row.questionIds?.length) return;
    const id = desk.createFromIds(row.questionIds, duelName(row.id));
    if (id) void navigate({ to: "/test/$id", params: { id } });
  };

  return (
    <li className="rounded border border-white/80 bg-white/80 px-3 py-2 text-sm">
      <p className="font-semibold">{row.fromId === me ? `You challenged ${row.toName}` : `${row.fromName} challenged you`}</p>
      <p>
        {challengeTitle(row.kind, row.count)} · {row.status}
      </p>
      {verdict ? <p className="mt-1 text-[#1d3557]">{verdict}</p> : null}
      {error ? <p className="mt-1 text-wrong">{error}</p> : null}
      {row.toId === me && row.status === "pending" ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              void answerChallenge({ data: { id: row.id, accept: true } })
                .then(onChange)
                .catch((reason: Error) => setError(reason.message))
            }
            className="min-h-11 rounded bg-[#1d3557] px-3 text-sm font-semibold text-white"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() =>
              void answerChallenge({ data: { id: row.id, accept: false } })
                .then(onChange)
                .catch((reason: Error) => setError(reason.message))
            }
            className="min-h-11 rounded border border-[#c9a15b] px-3 text-sm font-semibold"
          >
            Decline
          </button>
        </div>
      ) : null}
      {canStart ? (
        <button type="button" onClick={start} className="mt-2 min-h-11 rounded bg-[#1d3557] px-3 text-sm font-semibold text-white">
          {startLabel}
        </button>
      ) : null}
    </li>
  );
}
