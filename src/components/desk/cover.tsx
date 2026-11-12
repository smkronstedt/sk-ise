import { Link } from "@tanstack/react-router";

const points = [
  { title: "Question bank", body: "1,295 UQB items plus SASP booklets. Tutor mode, topic filters, missed and marked, and a separate hard set." },
  { title: "Guidelines", body: "A trainer built from the statements, so the explanation points at the recommendation you are supposed to know." },
  { title: "Cards", body: "Misses and flags become cards. They come back on a schedule instead of sitting in a list." },
  { title: "Monster Quest", body: "Walk the towns, battle trainers with questions, catch creatures, and climb ranks while you study." },
  { title: "Your record", body: "Questions, money, and prizes stay on the account that was approved. They do not mix with anyone else’s." },
];

export function Cover() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Urology in-service</p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">A desk for the exam, not a group worksheet.</h1>
      <p className="mt-3 max-w-2xl text-base text-muted">
        ISE Team Room is a private study desk. You ask for an account with your name. It stays closed until it is approved. After that, the bank, the cards, the ranks, and the prizes belong to that profile.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {points.map((point) => (
          <div key={point.title} className="rounded border border-line bg-paper p-4">
            <h2 className="font-semibold">{point.title}</h2>
            <p className="mt-1 text-sm text-muted">{point.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/login" search={{ mode: "signup" }} className="inline-flex min-h-11 items-center rounded bg-navy px-4 font-semibold text-white">
          Create an account
        </Link>
        <Link to="/login" search={{ mode: "signin" }} className="inline-flex min-h-11 items-center rounded border border-line bg-paper px-4 font-semibold">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export function Waiting({ name }: { name: string }) {
  return (
    <div className="mx-auto max-w-lg rounded border border-line bg-paper p-6">
      <h1 className="font-serif text-3xl tracking-tight">Waiting for approval</h1>
      <p className="mt-2 text-sm text-muted">
        {name ? `${name}, your` : "Your"} account is in. The desk stays closed until it is approved. When it opens, your questions, money, and prizes stay on this profile.
      </p>
    </div>
  );
}
