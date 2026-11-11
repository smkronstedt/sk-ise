import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/desk/shell";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/fellowship")({
  component: FellowshipPage,
});

const mine = "shane.kronstedt@bcm.edu";

const timeline = [
  ["Registration opened", "November 9, 2026"],
  ["Programs: last day to withdraw without penalty", "December 15, 2026"],
  ["Applicant registration deadline", "April 15, 2027"],
  ["Rank list opens", "May 6, 2027"],
  ["Rank list deadline", "May 27, 2027, 4:30 p.m. ET"],
  ["Match results", "June 14, 2027"],
  ["Fellowship dates in the Baylor note", "July 2028 through June 2029"],
];

function FellowshipPage() {
  const session = authClient.useSession();
  const email = session.data?.user?.email?.toLowerCase() ?? "";
  if (email !== mine) {
    return (
      <Shell>
        <h1 className="font-serif text-3xl">Fellowship</h1>
        <p className="mt-2 text-sm text-muted">This page is not on your account.</p>
      </Shell>
    );
  }
  return (
    <Shell>
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Baylor · your account only</p>
      <h1 className="font-serif text-3xl tracking-tight">Andrology fellowship</h1>
      <p className="mt-2 max-w-3xl leading-relaxed">
        Male Reproductive Medicine and Surgery, under Drs. Larry Lipshultz and Mohit Khera. Baylor is in the AUA Andrology Fellowship Match. The note from Elizabeth Barrick says they will take applications for July 2028 through June 2029 once the match is open. Registration for the 2028 match is already open.
      </p>
      <h2 className="mt-6 font-serif text-2xl">What they asked for</h2>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>Baylor College of Medicine fellowship application. The email said it was attached. That file is not in this tab.</li>
        <li>Personal statement.</li>
        <li>Current curriculum vitae. The note says it was received from SNSNA.</li>
        <li>Two current letters of recommendation.</li>
      </ol>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed">
        Register with the AUA to be considered. You must finish an ACGME-approved residency before the fellowship. Fellows are selected after a direct interview. Registering for this match means you cannot stay in another match at the same time.
      </p>
      <h2 className="mt-6 font-serif text-2xl">2028 match dates</h2>
      <p className="mt-1 text-sm text-muted">From the AUA specialty-match timeline. Confirm there before you rank.</p>
      <table className="mt-3 w-full max-w-2xl border-collapse text-sm">
        <tbody>
          {timeline.map(([label, when]) => (
            <tr key={label} className="border-b border-line">
              <th className="py-2 pr-3 text-left font-semibold">{label}</th>
              <td className="py-2">{when}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex flex-col gap-2 text-sm">
        <a className="font-semibold underline" href="https://www.auanet.org/meetings-and-education/for-residents/urology-and-specialty-matches/specialty-match-timelines">
          AUA specialty match timelines
        </a>
        <a className="font-semibold underline" href="https://medmatch.auanet.org">
          Direct match link
        </a>
      </div>
      <p className="mt-6 text-sm leading-relaxed">
        Elizabeth Barrick
        <br />
        Business Operations Coordinator for Larry I. Lipshultz, MD
        <br />
        Scott Department of Urology
        <br />
        Baylor College of Medicine
      </p>
    </Shell>
  );
}
