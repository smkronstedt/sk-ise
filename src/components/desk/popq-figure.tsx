const POPQ = /POP-?\s*Q|pelvic organ prolapse quantification/i;

export function isPopqText(text: string) {
  return POPQ.test(text);
}

export function PopqFigure() {
  return (
    <img
      src="/guidelines/popq.png"
      alt="POP-Q points Aa, Ba, C, D, Ap, Bp, gh, pb, and tvl, with staging from the hymen: stage 0 through stage IV."
      className="mt-3 max-h-[40rem] w-full bg-white object-contain"
    />
  );
}
