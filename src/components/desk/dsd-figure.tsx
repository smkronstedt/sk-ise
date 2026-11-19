const DIAGNOSIS =
  /disorders? of sexual development|ambiguous genitalia|congenital adrenal hyperplasia|\bCAH\b|androgen insensitivity|gonadal dysgenesis|ovotesticular|mixed gonadal|5-alpha-reductase (?!inhibitor)|persistent m[uü]llerian|swyer|clitoroplasty|clitoromegaly|testicular adrenal rest/i;

export function isDsdText(text: string) {
  if (DIAGNOSIS.test(text)) return true;
  return /\bDSD\b/.test(text) && !/detrusor|sphincter|dyssynerg/i.test(text);
}

export function DsdFigure() {
  return (
    <img
      src="/guidelines/dsd-development.jpg"
      alt="Sex determination and differentiation. Indifferent ducts at 6 weeks, SRY and SOX9 toward testis or RSPO1 and WNT4 toward ovary, then male and female genitalia by 16 weeks."
      className="mt-3 max-h-[40rem] w-full bg-white object-contain"
    />
  );
}

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
