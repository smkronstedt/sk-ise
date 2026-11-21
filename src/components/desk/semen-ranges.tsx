/** WHO 2021 lower reference limits. Shown with semen-analysis questions, not with every andrology item. */
export function isSemenQuestion(topic: string, text: string) {
  const blob = `${topic}\n${text}`.toLowerCase();
  return /semen analysis|\bsemen\b|azoosperm|oligosperm|astheno|terato|globozoosperm|round-headed|sperm count|sperm concentration|sperm motility|sperm morphology|total motility|progressive motility|normal forms|\bejaculate\b/.test(
    blob,
  );
}

const limits = [
  ["Semen volume", "≥ 1.4 mL", "1.3–1.5"],
  ["Sperm concentration", "≥ 16 million/mL", "15–18"],
  ["Total sperm number", "≥ 39 million / ejaculate", "35–40"],
  ["Total motility", "≥ 42%", "40–43"],
  ["Progressive motility", "≥ 30%", "29–31"],
  ["Vitality", "≥ 54% live", "50–56"],
  ["Normal morphology", "≥ 4%", "3.9–4.0"],
];

export function SemenRanges() {
  return (
    <div className="mt-3 overflow-x-auto rounded border border-line">
      <p className="border-b border-line px-3 py-2 text-sm font-semibold">WHO 2021 lower reference limits</p>
      <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="px-3 py-2 font-semibold">Parameter</th>
            <th className="px-3 py-2 font-semibold">Limit</th>
            <th className="px-3 py-2 font-semibold">95% CI</th>
          </tr>
        </thead>
        <tbody>
          {limits.map((row) => (
            <tr key={row[0]} className="border-b border-line last:border-0">
              {row.map((cell) => (
                <td key={cell} className="px-3 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="list-disc space-y-1 px-8 py-2 text-sm text-muted">
        <li>pH typically ≥ 7.2, often 7.2–7.8.</li>
        <li>White cells under 1 million/mL.</li>
        <li>Viscosity under 2 cm after liquefaction. Opaque, cream or whitish-gray, no agglutination.</li>
      </ul>
    </div>
  );
}
