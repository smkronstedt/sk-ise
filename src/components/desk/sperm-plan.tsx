import type { ReactNode } from "react";

export function isRoundHeadText(text: string) {
  return /round-headed|globozoospermia/i.test(text);
}

function Table({ title, headers, rows }: { title: string; headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded border border-line">
      <p className="border-b border-line px-3 py-2 text-sm font-semibold">{title}</p>
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-semibold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row[0])} className="border-b border-line last:border-0 align-top">
              {row.map((cell, index) => (
                <td key={index} className="px-3 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** What to do with round-headed sperm, and the patterns that are not this. */
export function SpermPlan() {
  return (
    <div className="mt-3">
      <Table
        title="Round heads are not one decision"
        headers={["What you see", "What it means", "What to do"]}
        rows={[
          ["Every sperm is round-headed. Count and motility are normal.", "Complete globozoospermia. No acrosome, so the sperm cannot bind the zona.", "ICSI. IUI, conventional IVF, waiting 3 months, and varicocele repair do not fix this."],
          ["Some oval heads remain.", "Partial globozoospermia. The normal forms still have an acrosome.", "Repeat the semen analysis. IUI or IVF is reasonable only if normal forms are really there. If none are, use ICSI."],
          ["Large heads, often more than one tail.", "Macrocephalic sperm. Often an AURKC mutation. The sperm are polyploid.", "This is not globozoospermia. Counsel before any ICSI. Donor sperm is often the discussion."],
          ["Normal heads. Low count or poor motility, plus a clinical varicocele.", "The varicocele can be the problem.", "Varicocele repair is a fair discussion. It is not the move when every head is round."],
        ]}
      />
      <Table
        title="Genes in complete globozoospermia"
        headers={["Gene", "How often", "What fails", "Does the next step change?"]}
        rows={[
          ["DPY19L2", "The usual gene", "The acrosome cannot anchor to the nucleus.", "No. Still ICSI."],
          ["SPATA16", "Rare", "The acrosome is never built.", "No. Still ICSI."],
          ["PICK1", "Rare", "Trafficking into the acrosome fails.", "No. Still ICSI."],
        ]}
      />
      <p className="mt-2 text-xs leading-relaxed text-muted">Fertilization can still fail at ICSI because these sperm are low in PLC-zeta, the signal that activates the egg. Assisted oocyte activation is sometimes added. That detail does not change the answer on this question.</p>
    </div>
  );
}
