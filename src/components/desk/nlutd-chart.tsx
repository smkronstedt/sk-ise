export function isNlutdTopic(topic: string) {
  return /nlutd|neurogenic/i.test(topic);
}

export function NlutdChart() {
  return (
    <figure className="mt-3">
      <img
        src="/guidelines/nlutd-risk.png"
        alt="NLUTD risk stratification. Low, unknown, moderate, and high risk, and the surveillance that follows."
        className="max-h-[40rem] w-full bg-white object-contain"
      />
    </figure>
  );
}
