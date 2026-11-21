const ADVANCED =
  /\bmCSPC\b|\bmHSPC\b|\bmCRPC\b|\bnmCRPC\b|hormone-sensitive prostate|castration-resistant|abiraterone|apalutamide|enzalutamide|darolutamide|degarelix|relugolix|intensification/i;

export function isAdvancedPca(topic: string, text: string) {
  if (topic === "pca-adv" || /advanced prostate/i.test(topic)) return true;
  return ADVANCED.test(`${topic}\n${text}`);
}

const castration = [
  ["Leuprolide, goserelin, triptorelin, histrelin", "GnRH agonist", "Flare for 1–2 weeks. Lead with an antiandrogen if the cord is compressed or pain is severe."],
  ["Degarelix, relugolix", "GnRH antagonist", "No flare. Relugolix is the oral one. Use this when a flare would hurt."],
  ["Bilateral orchiectomy", "Surgery", "Immediate castration. No flare."],
  ["Bicalutamide 50 mg, flutamide, nilutamide", "Old antiandrogen", "Flare cover only. Not intensification. Not a metastatic regimen alone."],
];

const added = [
  ["mCSPC / mHSPC", "ADT plus abiraterone with prednisone, apalutamide, enzalutamide, or darolutamide. Add docetaxel for selected high-volume disease. A fit high-volume triplet is ADT + docetaxel + darolutamide, or ADT + docetaxel + abiraterone.", "ADT alone. Docetaxel with no ADT. Bicalutamide 50 mg."],
  ["nmCRPC, doubling time ≤ 10 months", "Keep ADT. Add apalutamide, enzalutamide, or darolutamide.", "Stop ADT. Abiraterone is not the drug for this state."],
  ["mCRPC", "Keep ADT for life. Then a drug he has not already had: abiraterone with prednisone, enzalutamide, or docetaxel. Cabazitaxel after docetaxel. Radium-223 for symptomatic bone-only disease. Olaparib for BRCA / HRR. Lutetium PSMA after an ARPI and a taxane.", "Stopping ADT. Radium plus abiraterone."],
];

export function AdtTable() {
  return (
    <div className="mt-3 overflow-x-auto rounded border border-line">
      <p className="border-b border-line px-3 py-2 text-sm font-semibold">ADT and advanced prostate cancer drugs</p>
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="px-3 py-2 font-semibold">Drug</th>
            <th className="px-3 py-2 font-semibold">Class</th>
            <th className="px-3 py-2 font-semibold">How to use it</th>
          </tr>
        </thead>
        <tbody>
          {castration.map((row) => (
            <tr key={row[0]} className="border-b border-line">
              {row.map((cell) => (
                <td key={cell} className="px-3 py-2 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <table className="w-full min-w-[36rem] border-collapse border-t border-line text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="px-3 py-2 font-semibold">Setting</th>
            <th className="px-3 py-2 font-semibold">Add to ADT</th>
            <th className="px-3 py-2 font-semibold">Not the regimen</th>
          </tr>
        </thead>
        <tbody>
          {added.map((row) => (
            <tr key={row[0]} className="border-b border-line last:border-0">
              {row.map((cell) => (
                <td key={cell} className="px-3 py-2 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
