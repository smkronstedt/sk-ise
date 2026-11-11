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
