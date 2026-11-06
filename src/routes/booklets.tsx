import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/desk/shell";
import { booklets, notesRoot, uploadsRoot } from "@/lib/desk/booklets";

export const Route = createFileRoute("/booklets")({
  component: BookletsPage,
});

function BookletsPage() {
  return (
    <Shell>
      <p className="text-sm font-semibold tracking-wide text-muted uppercase">Your Drive</p>
      <h1 className="font-serif text-3xl tracking-tight">SASP booklets</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Each link opens the file in your Google Drive. The questions stay there. This desk does not copy them, score them, or show the answers inside the trainer.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {booklets.map((book) => (
          <article key={book.year} className="rounded border border-line bg-paper p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-2xl">{book.year}</h2>
              <p className="text-sm text-muted">{book.note}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={book.questionsHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded bg-navy px-4 text-sm font-semibold text-white"
              >
                {book.questionsLabel}
              </a>
              {book.answersHref && book.answersLabel ? (
                <a
                  href={book.answersHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center rounded border border-line bg-paper px-4 text-sm font-semibold"
                >
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
        <a className="font-semibold text-blue" href={notesRoot} target="_blank" rel="noreferrer">
          Reddy’s notes
        </a>
        <span className="text-muted"> · </span>
        <a className="font-semibold text-blue" href={uploadsRoot} target="_blank" rel="noreferrer">
          All of Grok Uploads
        </a>
      </p>
    </Shell>
  );
}
