import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/desk/shell";
import { unlockBooklets, type BookletUnlock } from "@/lib/booklets-api";

const OPEN = "booklets-open";

export const Route = createFileRoute("/booklets")({
  component: BookletsPage,
});

function BookletsPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<BookletUnlock | null>(() => {
    try {
      const raw = sessionStorage.getItem(OPEN);
      return raw ? (JSON.parse(raw) as BookletUnlock) : null;
    } catch {
      return null;
    }
  });

  const submit = () => {
    setBusy(true);
    setError("");
    void unlockBooklets({ data: { password } })
      .then((result) => {
        sessionStorage.setItem(OPEN, JSON.stringify(result));
        setOpen(result);
        setPassword("");
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Wrong password."))
      .finally(() => setBusy(false));
  };

  return (
    <Shell>
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">Your Drive</p>
      <h1 className="font-serif text-3xl tracking-tight">SASP booklets</h1>
      {!open ? (
        <form
          className="mt-4 max-w-md rounded border border-line bg-paper p-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <p className="text-sm text-muted">This section is locked. Sign in, then enter the booklet password.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-3 min-h-11 w-full rounded border border-line px-3"
            autoComplete="current-password"
          />
          {error ? <p className="mt-2 text-sm text-wrong">{error}</p> : null}
          <button type="submit" disabled={busy} className="mt-3 min-h-11 rounded bg-navy px-4 text-sm font-semibold text-white disabled:opacity-50">
            Open booklets
          </button>
        </form>
      ) : (
        <>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Each link opens the file in your Google Drive. The questions stay there.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {open.booklets.map((book) => (
              <article key={book.year} className="rounded border border-line bg-paper p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-serif text-2xl">{book.year}</h2>
                  <p className="text-sm text-muted">{book.note}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={book.questionsHref} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded bg-navy px-4 text-sm font-semibold text-white">
                    {book.questionsLabel}
                  </a>
                  {book.answersHref && book.answersLabel ? (
                    <a href={book.answersHref} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded border border-line bg-paper px-4 text-sm font-semibold">
                      {book.answersLabel}
                    </a>
                  ) : (
                    <p className="self-center text-sm text-muted">Answers are in the same file.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm">
            <a className="font-semibold text-blue" href={open.notesRoot} target="_blank" rel="noreferrer">
              Reddy’s notes
            </a>
            <span className="text-muted"> · </span>
            <a className="font-semibold text-blue" href={open.uploadsRoot} target="_blank" rel="noreferrer">
              All of Grok Uploads
            </a>
          </p>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(OPEN);
              setOpen(null);
            }}
            className="mt-4 text-sm font-semibold text-muted"
          >
            Lock booklets
          </button>
        </>
      )}
    </Shell>
  );
}
