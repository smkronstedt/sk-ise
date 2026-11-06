export const EXAM_SIZE = 150;
export const YEAR_PURSE = 1000;
export const CABINET_PURSE = 5000;

export const saspExams = [
  { year: 2016, start: 1 },
  { year: 2017, start: 151 },
  { year: 2018, start: 301 },
  { year: 2019, start: 451 },
  { year: 2020, start: 601 },
  { year: 2021, start: 751 },
  { year: 2022, start: 901 },
  { year: 2023, start: 1051 },
] as const;

export function examIds(start: number) {
  return Array.from({ length: EXAM_SIZE }, (_, index) => `UQB-${String(start + index).padStart(4, "0")}`);
}

export function examProgress(answered: Set<string>) {
  return saspExams.map((exam) => {
    const ids = examIds(exam.start);
    const done = ids.filter((id) => answered.has(id)).length;
    return { ...exam, done, total: EXAM_SIZE, complete: done === EXAM_SIZE };
  });
}

export function purseFor(doneYears: number) {
  return doneYears * YEAR_PURSE + (doneYears === saspExams.length ? CABINET_PURSE : 0);
}
