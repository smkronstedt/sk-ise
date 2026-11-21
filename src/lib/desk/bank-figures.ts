/** Figures pulled from the SASP question PDFs already in this project. */
export const bankFigures: Record<string, string> = {
  "SASP2023-006": "/bank/figures/SASP2023-006.jpg",
  "SASP2023-023": "/bank/figures/SASP2023-023.jpg",
  "SASP2023-062": "/bank/figures/SASP2023-062.jpg",
  "SASP2023-068": "/bank/figures/SASP2023-068.jpg",
  "SASP2023-086": "/bank/figures/SASP2023-086.jpg",
  "SASP2023-116": "/bank/figures/SASP2023-116.jpg",
  "SASP2023-128": "/bank/figures/SASP2023-128.jpg",
  "SASP2023-139": "/bank/figures/SASP2023-139.jpg",
  "SASP2025-108": "/bank/figures/SASP2025-108.jpg",
  "SASP2016-068": "/bank/figures/uds-boo-guarding.jpg",
  "SASP2016-085": "/bank/figures/uds-artifact.jpg",
  "SASP2016-091": "/bank/figures/uds-boo-guarding.jpg",
  "SASP2017-012": "/bank/figures/uds-boo-guarding.jpg",
  "SASP2021-039": "/bank/figures/uds-closed-neck.jpg",
  "SASP2022-017": "/bank/figures/uds-open-neck.jpg",
  "SASP2022-119": "/bank/figures/uds-desd.jpg",
  "SASP2023-034": "/bank/figures/uds-boo-guarding.jpg",
  "SASP2023-074": "/bank/figures/uds-boo-guarding.jpg",
  "UQB-1005": "/anatomy/testis-arteries.svg",
};

/** Teaching plates shown with the explanation, not with the stem. SASP 2026 and later stay text only. */
export const answerFigures: Record<string, { src: string; caption: string }> = {};

/** SASP 2026 and later are text only: stem, choices, and the written answer. No plates. */
export function textOnlyBank(id: string) {
  const year = Number(/^SASP(\d{4})-/.exec(id)?.[1]);
  return Number.isFinite(year) && year >= 2026;
}
