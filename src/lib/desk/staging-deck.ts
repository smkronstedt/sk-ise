export type StagingCard = {
  id: string;
  organ: "Bladder" | "Prostate" | "Testis" | "Kidney" | "Penis";
  front: string;
  back: string;
};

export const stagingOrgans = ["Bladder", "Prostate", "Testis", "Kidney", "Penis"] as const;

/** Cutoffs that change the next step. Not a full TNM manual. */
export const stagingCards: StagingCard[] = [
  { id: "bl-ta", organ: "Bladder", front: "Papillary tumor. No invasion through the basement membrane.", back: "Ta. Noninvasive papillary. Low-grade solitary Ta is low risk. High-grade Ta is high risk." },
  { id: "bl-tis", organ: "Bladder", front: "Flat carcinoma in situ. No papillary tumor, no lamina propria invasion.", back: "Tis. High risk. Induction BCG and maintenance if he can take it." },
  { id: "bl-t1", organ: "Bladder", front: "Tumor into the lamina propria. Muscularis propria present and negative.", back: "T1. High-grade T1 is restaged within about 6 weeks before BCG. A clean restage does not drop the risk." },
  { id: "bl-t2", organ: "Bladder", front: "Tumor into the detrusor. Inner half versus outer half.", back: "T2. T2a is the inner half of the muscle. T2b is the outer half. This is muscle-invasive disease." },
  { id: "bl-t3", organ: "Bladder", front: "Tumor beyond the muscle, into perivesical fat. Microscopic versus a mass you can see.", back: "T3a is microscopic fat invasion. T3b is an extravesical mass." },
  { id: "bl-t4", organ: "Bladder", front: "Tumor into prostate stroma, uterus, or vagina. Versus the pelvic sidewall.", back: "T4a is prostate stroma, seminal vesicle, uterus, or vagina. T4b is the pelvic sidewall or abdominal wall." },
  { id: "bl-n", organ: "Bladder", front: "One node in the true pelvis. Several nodes in the true pelvis. A common iliac node.", back: "N1 is a single true-pelvis node. N2 is multiple true-pelvis nodes. N3 is common iliac." },
  { id: "bl-risk", organ: "Bladder", front: "Which non-muscle-invasive tumors are high risk?", back: "Any high-grade tumor: high-grade Ta, high-grade T1, or CIS. A small solitary high-grade Ta is still high risk." },
  { id: "bl-variant", organ: "Bladder", front: "High-grade T1 with micropapillary, plasmacytoid, or sarcomatoid histology. Restage still shows no muscle invasion.", back: "Very high risk. Counsel early cystectomy. Do not wait for a muscle-invasive biopsy." },
  { id: "bl-mibc", organ: "Bladder", front: "Muscle-invasive, no metastasis, fit for cisplatin. What is the sequence, and what stages him?", back: "Neoadjuvant cisplatin-based chemotherapy, then cystectomy. Stage with CT of the chest, abdomen, and pelvis. A bone scan is for symptoms or lab clues, not routine." },
  { id: "pr-gg", organ: "Prostate", front: "Grade groups from the Gleason patterns.", back: "GG1 is 3+3. GG2 is 3+4. GG3 is 4+3. GG4 is 4+4, 3+5, or 5+3. GG5 is 4+5, 5+4, or 5+5." },
  { id: "pr-t", organ: "Prostate", front: "Not palpable. One side. Both sides. Outside the gland. Seminal vesicle.", back: "T1c is PSA-detected, not palpable. T2a is half of one lobe or less. T2b is more than half of one lobe. T2c is both lobes. T3a is extraprostatic extension. T3b is seminal vesicle. T4 is other adjacent organs." },
  { id: "pr-low", organ: "Prostate", front: "PSA 6, grade group 1, clinical T1c. What risk, and does he need a bone scan?", back: "Low risk. No bone scan. A bone scan is not staging for low-risk disease." },
  { id: "pr-fav", organ: "Prostate", front: "Grade group 2, PSA 8, T1c, one intermediate feature, less than half the cores.", back: "Favorable intermediate. Can be treated or, in a reliable patient, watched. Not an automatic operation." },
  { id: "pr-unfav", organ: "Prostate", front: "Grade group 3, or two intermediate features (PSA 10–20, T2b–c, GG2–3).", back: "Unfavorable intermediate. Treat. This is not a surveillance case." },
  { id: "pr-high", organ: "Prostate", front: "Grade group 4 or 5, or PSA over 20, or T3.", back: "High risk. Treat. Stage with cross-sectional imaging and a bone scan before local therapy." },
  { id: "pr-idc", organ: "Prostate", front: "Grade group 1 acinar cancer plus intraductal carcinoma.", back: "Not low-risk surveillance. Intraductal carcinoma is treated as aggressive disease." },
  { id: "ts-i", organ: "Testis", front: "Orchiectomy done. Markers fall to normal. CT of the chest, abdomen, and pelvis is clear.", back: "Clinical stage I. Disease was confined to the testis." },
  { id: "ts-is", organ: "Testis", front: "CT is clear after orchiectomy, but AFP or hCG stays elevated.", back: "Clinical stage IS. Persistent markers without a mass. This is not stage I surveillance." },
  { id: "ts-nodes", organ: "Testis", front: "Retroperitoneal node size that separates IIA, IIB, and IIC.", back: "IIA is 2 cm or smaller. IIB is larger than 2 cm up to 5 cm. IIC is larger than 5 cm. Stage III is distant metastasis." },
  { id: "ts-s", organ: "Testis", front: "Marker cutoffs for S1, S2, and S3.", back: "S1: LDH under 1.5× normal, hCG under 5,000, AFP under 1,000. S2: LDH 1.5–10×, hCG 5,000–50,000, AFP 1,000–10,000. S3: above those." },
  { id: "ts-sem", organ: "Testis", front: "Clinical stage I pure seminoma. Markers normal, imaging negative. Next step.", back: "Surveillance. Relapse is about 15%, almost always in the retroperitoneum, and salvage is expected. Radiation or carboplatin are alternatives, not the requirement." },
  { id: "ts-lvi", organ: "Testis", front: "Clinical stage I nonseminoma with lymphovascular invasion.", back: "High-risk stage I. Relapse is about 50% on surveillance. Nerve-sparing RPLND, one cycle of BEP, or surveillance are the options. Radiation is not a nonseminoma treatment." },
  { id: "ts-igcccg", organ: "Testis", front: "Metastatic nonseminoma. What makes good, intermediate, and poor risk?", back: "Good: testis or retroperitoneal primary, no nonpulmonary visceral mets, S1. Intermediate: same primary, no visceral mets, S2. Poor: mediastinal primary, or nonpulmonary visceral mets, or S3. Seminoma has no poor-risk group. Visceral mets make seminoma intermediate." },
  { id: "kd-t1", organ: "Kidney", front: "Renal mass limited to the kidney. 3 cm. 5 cm. 8 cm. 12 cm.", back: "T1a is 4 cm or less. T1b is more than 4 up to 7. T2a is more than 7 up to 10. T2b is more than 10, still limited to the kidney." },
  { id: "kd-t3", organ: "Kidney", front: "Tumor in sinus fat, perinephric fat, or the renal vein. IVC below the diaphragm. IVC above the diaphragm.", back: "T3a is fat, sinus, or the renal vein (including segmental branches), not beyond Gerota. T3b is the IVC below the diaphragm. T3c is the IVC above the diaphragm, or the wall of the IVC." },
  { id: "kd-t4", organ: "Kidney", front: "Tumor through Gerota fascia. A normal adrenal was seen on imaging.", back: "T4 is beyond Gerota, including contiguous adrenal invasion. A normal adrenal is left. Chest imaging is part of staging." },
  { id: "kd-bosniak", organ: "Kidney", front: "Bosniak I, II, IIF, III, and IV. Which are followed, and which are treated?", back: "I and II are benign. No cancer follow-up. IIF is followed. III and IV are managed as cancer. Biopsy when the result would change the plan." },
  { id: "pn-t1", organ: "Penis", front: "Glans squamous cancer into the subepithelium. No lymphovascular invasion, not high grade. Versus the same tumor with lymphovascular invasion.", back: "T1a has no lymphovascular invasion, no perineural invasion, and is not grade 3. T1b has one of those. Ta is noninvasive." },
  { id: "pn-t2", organ: "Penis", front: "Tumor into the corpus spongiosum, including the glans. Versus into the corpus cavernosum.", back: "T2 is the spongiosum, with or without the urethra. T3 is the cavernosum. T4 is scrotum, prostate, or bone." },
  { id: "pn-groin", organ: "Penis", front: "Clinically negative groins. When do you watch, and when do you stage the nodes?", back: "Ta or T1a, low grade, no lymphovascular invasion: the groin can be watched. T1b or higher, grade 3, or lymphovascular invasion: stage the groin (dynamic sentinel node or inguinal dissection). A positive groin can mean a pelvic dissection." },
];
