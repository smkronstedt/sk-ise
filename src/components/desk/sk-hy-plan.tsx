import { topics } from "@/lib/desk/topics";

const days = [
  {
    id: "sun",
    label: "Sunday Nov 15 — Oncology",
    desc: "NMIBC, MIBC, prostate, renal, testis, UTUC, penile, diversion, adrenal. 15–20 unused adaptive questions.",
    topicIds: ["nmibc", "mibc", "utuc", "mh", "pca", "pca-adv", "renal", "adrenal", "testis", "penile", "diversion"],
    count: 18,
    name: "SK HY Sun — Oncology",
  },
  {
    id: "mon",
    label: "Monday Nov 16 — Core + Trauma",
    desc: "Trauma, imaging, stricture. 15 unused adaptive questions.",
    topicIds: ["trauma", "stricture", "imaging"],
    count: 15,
    name: "SK HY Mon — Core",
  },
  {
    id: "tue",
    label: "Tuesday Nov 17 — Stones + Obstruction",
    desc: "Stone meds/surgery, BPH, UPJ/RPF. 15–20 unused adaptive questions.",
    topicIds: ["stones-med", "stones-surg", "bph", "upper-obs"],
    count: 18,
    name: "SK HY Tue — Stones/Obs",
  },
  {
    id: "wed",
    label: "Wednesday Nov 18 — Urogyn + Andrology",
    desc: "OAB/SUI, UDS, IC/BPS, testosterone, ED, infertility. 15 unused adaptive questions.",
    topicIds: ["uds", "oab", "ic", "testosterone", "ed", "infertility", "ejac", "peyronie", "fsd"],
    count: 15,
    name: "SK HY Wed — Urogyn/Andro",
  },
  {
    id: "thu",
    label: "Thursday Nov 19 — Peds + Basic",
    desc: "Cryptorchidism, VUR, Wilms, physiology. 15 unused adaptive questions.",
    topicIds: ["crypt", "vur", "peds-mass", "basic"],
    count: 15,
    name: "SK HY Thu — Peds/Basic",
  },
  {
    id: "fri",
    label: "Friday Nov 20 — Mixed high-yield",
    desc: "All topics, prioritize remaining unused. 15–20 questions then rest.",
    topicIds: topics.map((t) => t.id),
    count: 18,
    name: "SK HY Fri — Mixed",
  },
];

export function SKHYPlan({
  onStart,
}: {
  onStart: (input: { name: string; adaptive: boolean; topicIds: string[]; count: number }) => void;
}) {
  return (
    <section className="mb-4 rounded border border-line bg-paper px-4 py-3">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Read this once</p>
      <h2 className="font-serif text-2xl tracking-tight">Sensitivity, specificity, predictive value</h2>
      <p className="mt-1 text-sm text-muted">
        A urine marker in 500 men. 100 have cancer. 80 of those test positive. 400 do not have cancer. 40 of those test positive.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full max-w-md text-left text-sm">
          <thead>
            <tr className="text-muted">
              <th className="py-1 pr-3 font-semibold" />
              <th className="py-1 pr-3 font-semibold">Cancer</th>
              <th className="py-1 pr-3 font-semibold">No cancer</th>
              <th className="py-1 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 pr-3 font-semibold">Positive</td>
              <td className="py-1 pr-3">80</td>
              <td className="py-1 pr-3">40</td>
              <td className="py-1">120</td>
            </tr>
            <tr>
              <td className="py-1 pr-3 font-semibold">Negative</td>
              <td className="py-1 pr-3">20</td>
              <td className="py-1 pr-3">360</td>
              <td className="py-1">380</td>
            </tr>
            <tr>
              <td className="py-1 pr-3 font-semibold">Total</td>
              <td className="py-1 pr-3">100</td>
              <td className="py-1 pr-3">400</td>
              <td className="py-1">500</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        <li><span className="font-semibold">Sensitivity 80%.</span> 80 of 100 with cancer are caught.</li>
        <li><span className="font-semibold">Specificity 90%.</span> 360 of 400 without cancer are cleared.</li>
        <li><span className="font-semibold">Positive predictive value 67%.</span> 80 of 120 positive tests are real.</li>
        <li><span className="font-semibold">Negative predictive value 95%.</span> 360 of 380 negative tests are truly clear.</li>
      </ul>
      <p className="mt-2 text-sm text-muted">
        Sensitivity and specificity stay put if you change who walks in. Predictive value does not. The same marker in a clinic where only 1% of men have cancer would make most positive tests false. That is the PSA problem. The question is in Physiology.
      </p>
      <p className="mt-6 text-xs font-semibold tracking-wide text-muted uppercase">SK HY Plan</p>
      <h2 className="font-serif text-2xl tracking-tight">Sunday → Friday night</h2>
      <p className="mt-1 text-sm text-muted">
        Highest-yield daily blocks. Each button starts an adaptive unused set for that day. Exam is Saturday Nov 21.
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {days.map((day) => (
          <li key={day.id} className="rounded border border-line bg-white px-3 py-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{day.label}</p>
                <p className="mt-0.5 text-sm text-muted">{day.desc}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStart({
                    name: day.name,
                    adaptive: true,
                    topicIds: day.topicIds,
                    count: day.count,
                  })
                }
                className="min-h-11 shrink-0 rounded bg-navy px-4 text-sm font-semibold text-white"
              >
                Start {day.count} Q
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
