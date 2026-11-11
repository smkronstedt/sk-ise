export function isNlutdTopic(topic: string) {
  return /nlutd|neurogenic/i.test(topic);
}

export function NlutdChart() {
  return (
    <div className="mt-3 flex flex-col gap-3">
      <img
        src="/guidelines/nlutd-risk.png"
        alt="NLUTD risk stratification flowchart. Low, unknown, moderate, and high risk, and the surveillance that follows."
        className="max-h-[40rem] w-full bg-white object-contain"
      />
      <img
        src="/guidelines/nlutd-table.png"
        alt="Table 3. NLUTD risk stratification by renal function, PVR, imaging, and urodynamics."
        className="w-full bg-white object-contain"
      />
    </div>
  );
}
