const VUR =
  /\bVUR\b|vesicou?reteral|reflux nephropathy|grade\s+(?:I{1,3}|IV|V|[1-5])\s+reflux|\breflux is grade\b/i;

export function isVurQuestion(topic: string, text: string) {
  if (/^vur$/i.test(topic) || /vesicoureteral reflux/i.test(topic)) return true;
  return VUR.test(`${topic}\n${text}`);
}

export function VurFigure() {
  return (
    <figure className="mt-3">
      <img
        src="/guidelines/vur-grades.png"
        alt="International vesicoureteral reflux grades. I reaches the ureter only. II fills the pelvis and calyces without dilation. III dilates and blunts the calyces. IV dilates the pelvis and ureter. V is massive dilation with a tortuous ureter."
        className="max-h-[40rem] w-full bg-white object-contain"
      />
      <figcaption className="mt-1 text-sm text-muted">
        International reflux grades I–V. I is ureter only. II fills the pelvis without dilation. III blunts the calyces. IV dilates and twists the ureter. V is massive dilation.
      </figcaption>
    </figure>
  );
}
