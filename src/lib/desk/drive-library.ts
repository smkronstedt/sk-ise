/** Index of the user's private "Grok Uploads" Drive folder.
 * Links open their own files. Exam booklets are listed only, never copied in.
 */

export type DriveItem = {
  name: string;
  href: string;
  kind: "notes" | "exam" | "book" | "video" | "schedule" | "folder";
};

export type DriveShelf = {
  id: string;
  title: string;
  href: string;
  note: string;
  items: DriveItem[];
};

const ROOT = "https://drive.google.com/drive/folders/1yS7USmpI4DjjfLIYVezglp6O6LzmlNKB";

export const driveRoot = {
  title: "Grok Uploads",
  href: ROOT,
};

export const shelves: DriveShelf[] = [
  {
    id: "sasp",
    title: "SASP self-study books",
    href: "https://drive.google.com/drive/folders/1PeusG_soZWbcQucGdMW6OnEIbO1GmIJn",
    note: "Copyrighted AUA exams, 2016–2023. Kept as private Drive links only. Stems and answers are not copied into this app.",
    items: [
      { name: "2016 SASP study book", href: "https://drive.google.com/file/d/1P62mlTjyqU5nOOqeE871p_pFxHit1t7x/view", kind: "exam" },
      { name: "2017 closed book + answers", href: "https://drive.google.com/file/d/17ks3EysJ9q3ltE43p3GXESMs39XhsUYJ/view", kind: "exam" },
      { name: "2018 closed book + answers", href: "https://drive.google.com/file/d/1g6M5NnA10Lq6n0dcDuuRZmSDgnNb5m2b/view", kind: "exam" },
      { name: "2019 SASP", href: "https://drive.google.com/file/d/1O1JJCBVY7Cr8wDz5pTHIhIibwDnIwwAK/view", kind: "exam" },
      { name: "2020 questions + answers", href: "https://drive.google.com/file/d/16AdJi4ILCtViRttSZtnLJpAVNp1IFk7-/view", kind: "exam" },
      { name: "2021 SASP", href: "https://drive.google.com/file/d/1KNCr0h7c743HNWn9YvKoxIogiGE8ERer/view", kind: "exam" },
      { name: "2022 Part 1 questions", href: "https://drive.google.com/file/d/1O_pUKtS-_0y4DZxM5iviXh6nHUKkahzk/view", kind: "exam" },
      { name: "2022 Part 2 study booklet", href: "https://drive.google.com/file/d/1a4G5WXRpVeF5cG_Sy3fTNWBz7jUu3Hl6/view", kind: "exam" },
      { name: "2023 Part 1 questions", href: "https://drive.google.com/file/d/1_qUTxWAP1cCpnN05ECx70JHLCKH2iJxp/view", kind: "exam" },
      { name: "2023 Part 2 study booklet", href: "https://drive.google.com/file/d/1EqJqdf7sMbghkHZTj2IL1uBdXEXeNhYk/view", kind: "exam" },
    ],
  },
  {
    id: "oncology",
    title: "Oncology notes",
    href: "https://drive.google.com/drive/folders/1QzfZ02IHqstSMvJVg3dFpmVbjX2jHd8C",
    note: "Personal guideline notes. Safe to turn into original tutor items.",
    items: [
      { name: "NMIBC, BCG, Cysview", href: "https://docs.google.com/document/d/1TlZw4_BD4qVAdHkyBcKNI6Aewp-I_MGb/edit", kind: "notes" },
      { name: "MIBC", href: "https://docs.google.com/document/d/1D7WEXC3Sgwvbabf5giSpattQrLVvKzM2/edit", kind: "notes" },
      { name: "Microhematuria", href: "https://docs.google.com/document/d/1R7YbUEig6_09C5tLHwnNI5ChSbq6E8Mw/edit", kind: "notes" },
      { name: "Upper tract urothelial carcinoma", href: "https://docs.google.com/document/d/1wkq-ektE8Ws7rBpR1hd3i0i8oIGTr4HB/edit", kind: "notes" },
      { name: "Penile cancer", href: "https://docs.google.com/document/d/1uJgHtLihWT9T815lBw6FsswHt6ZE_m7C/edit", kind: "notes" },
      { name: "Penile neoplasms", href: "https://docs.google.com/document/d/1CNq52CZVH1HSJsJxSvqRyMX_-eAVUeRw/edit", kind: "notes" },
      { name: "Testicular cancer", href: "https://docs.google.com/document/d/1fAZSD1Qmvapi0r3VX40GIX2VuE2InYXN/edit", kind: "notes" },
      { name: "Testicular adnexa", href: "https://docs.google.com/document/d/1oarQGGlA7cjP-O6lgoDVUuetkZMLGFlA/edit", kind: "notes" },
      { name: "Prostate early detection and localized", href: "https://docs.google.com/document/d/1iagJb6W4CUrcGkEa-EYyRBUxYpJHHQ7r/edit", kind: "notes" },
      { name: "Advanced prostate cancer", href: "https://docs.google.com/document/d/1i-9vrwCokJ1f8fk7x6jBMtnHplU-UZ3r/edit", kind: "notes" },
      { name: "Adjuvant and salvage radiotherapy", href: "https://docs.google.com/document/d/1ur6QST3jJPKBky2McU-TgcXeMA2LPFFs/edit", kind: "notes" },
      { name: "Salvage therapy after prostate cancer", href: "https://docs.google.com/document/d/1E8jLZhUSLzBWAt7W0Licow3veSWil9BM/edit", kind: "notes" },
      { name: "Renal masses", href: "https://docs.google.com/document/d/1IPiA3P1bewwdGANhd6Dqt2c04QJq_83i/edit", kind: "notes" },
      { name: "Hereditary renal tumor syndromes", href: "https://docs.google.com/document/d/12GHaS-YWPogYSsrZjIK7rYHpgoxW34xK/edit", kind: "notes" },
      { name: "Adrenal gland", href: "https://docs.google.com/document/d/1pF5JS54HpaFeV4m9ASGTan-vagVtxB8i/edit", kind: "notes" },
      { name: "Urinary diversions", href: "https://docs.google.com/document/d/1hFJ8Zl5ng-NH4GxVAk-_FJ36b4Vi_X6v/edit", kind: "notes" },
    ],
  },
  {
    id: "stones",
    title: "Stone disease",
    href: "https://drive.google.com/drive/folders/1-oBxVOd4Q13KnpimXowNYffJ3SYl07KG",
    note: "Medical management, surgical parts 1 and 2, and SWL notes.",
    items: [
      { name: "Medical management of nephrolithiasis", href: "https://docs.google.com/document/d/1JbI0R9MhE2B3Um_kdR0tCjgZ7NC2S7eM/edit", kind: "notes" },
      { name: "Surgical management, part 1", href: "https://docs.google.com/document/d/1SIxRDzioBEXAWzbQJTnGTTQvAPuAYk6z/edit", kind: "notes" },
      { name: "Surgical management, part 2", href: "https://docs.google.com/document/d/1zApCsT2iuJyeBl840MGnHlTyhYJeFK4p/edit", kind: "notes" },
      { name: "Shockwave lithotripsy", href: "https://docs.google.com/document/d/1TAc2MvCNPV4ys1QbnIWznUQuPq9R8iWK/edit", kind: "notes" },
    ],
  },
  {
    id: "sexual",
    title: "Sexual medicine and infertility",
    href: "https://drive.google.com/drive/folders/1laOTdzddEu4z-m2-PDgDD9hu52ZYhbgi",
    note: "Testosterone, ED, Peyronie, priapism, PE, vasectomy, infertility, female sexual dysfunction.",
    items: [
      { name: "Testosterone guidelines", href: "https://docs.google.com/document/d/13CbDOLO8rdHZm27N3FIxZHPBtD4dx0TW/edit", kind: "notes" },
      { name: "Erectile dysfunction, medical", href: "https://docs.google.com/document/d/1dqtgj5jrQin088LQf9PnufO4rvDqiM6Y/edit", kind: "notes" },
      { name: "Peyronie", href: "https://docs.google.com/document/d/1Loa22V4iJtzjYkjsK9Ui3GDGMS_0H8kP/edit", kind: "notes" },
      { name: "Xiaflex", href: "https://docs.google.com/document/d/1ZKcYQ_X76P348GXK50zeLc2S3cfrPZc6/edit", kind: "notes" },
      { name: "Priapism", href: "https://docs.google.com/document/d/1Qn5G8Gc-h6w_OUploGBA1MLAFQRZK9dR/edit", kind: "notes" },
      { name: "Premature ejaculation", href: "https://docs.google.com/document/d/1F86-bbET_cAz-B8R-wKBXDqUQAU0YCQ_/edit", kind: "notes" },
      { name: "Male infertility", href: "https://docs.google.com/document/d/1OOurLxVL67clgYnGkKySJ4VnPlXXdH1A/edit", kind: "notes" },
      { name: "Vasectomy", href: "https://docs.google.com/document/d/1sPngrxL6O2LQDC4GEvXJgyI2JWYrvoFy/edit", kind: "notes" },
      { name: "Female sexual dysfunction", href: "https://docs.google.com/document/d/1bCM7HYi79QV6ybKkpJFCH6kL554CfX8B/edit", kind: "notes" },
    ],
  },
  {
    id: "function",
    title: "Benign, female, neuro, infection",
    href: "https://drive.google.com/drive/folders/17o1G6WGVLoU8xlAPoXHF6tNYMpa7PiXk",
    note: "BPH, OAB, post-prostate incontinence, IC, NLUTD, UDS, prostatitis, recurrent UTI.",
    items: [
      { name: "BPH", href: "https://docs.google.com/document/d/1v_h2NvKIgcQU6YBrUJaMmv_7OmgPQ7Z4/edit", kind: "notes" },
      { name: "Overactive bladder", href: "https://docs.google.com/document/d/1DPgxdIBD85a77jiZgfXSQpkd5TD6eC03/edit", kind: "notes" },
      { name: "Incontinence after prostate treatment", href: "https://docs.google.com/document/d/1OOYNStiW1v6a7aZamHzS9BL1HbinlaFS/edit", kind: "notes" },
      { name: "Renovascular disease", href: "https://docs.google.com/document/d/1h2o57yoa60RoixS18KXwoDDJ7HxAVXz_/edit", kind: "notes" },
      { name: "Interstitial cystitis", href: "https://docs.google.com/document/d/1JxE2FpHJ6IgNdJj3AXKqbdYrYJVw45ic/edit", kind: "notes" },
      { name: "Female urology notes", href: "https://docs.google.com/document/d/1upFu5dLlx5NsrH6HR4eX4hjj-9bctKK2/edit", kind: "notes" },
      { name: "NLUTD guidelines", href: "https://docs.google.com/document/d/1wWhC0eA6-ykF1mR6NHP13UbNYuaMFayR/edit", kind: "notes" },
      { name: "UDS notes", href: "https://docs.google.com/document/d/1Cor4xvrXbDD0Zsp1JSfspR9ywMECRUzb/edit", kind: "notes" },
      { name: "Prostatitis", href: "https://docs.google.com/document/d/1FJ53Wz2yi5fIyJJnXYudKERpEqftMJ3Q/edit", kind: "notes" },
      { name: "Recurrent UTI", href: "https://docs.google.com/document/d/1SI8Pi6DYfbPQR0c5eC-5VDephev-sRKu/edit", kind: "notes" },
      { name: "STDs", href: "https://docs.google.com/document/d/1TZ4UO1wuoJA-3fk0YP4g4m28hGhUr-2c/edit", kind: "notes" },
      { name: "Emphysematous pyelitis", href: "https://docs.google.com/document/d/1zFy66di6o2W3IJd40P9RLsJO2cvz98HC/edit", kind: "notes" },
    ],
  },
  {
    id: "peds",
    title: "Pediatrics and embryology",
    href: "https://drive.google.com/drive/folders/1YzK_yNymtcvKSlDZNKqR5p83PlyiD-u4",
    note: "Cryptorchidism, VUR, spina bifida, pediatric renal masses, renal embryology.",
    items: [
      { name: "Cryptorchidism", href: "https://docs.google.com/document/d/1hPqZyBNfiGXBMiuqv5UAo5jdPMspX1yV/edit", kind: "notes" },
      { name: "Vesicoureteral reflux", href: "https://docs.google.com/document/d/1yn3VYhnNh7BqlPjMq74O0j7KlQe1PhTO/edit", kind: "notes" },
      { name: "Pediatric spina bifida", href: "https://docs.google.com/document/d/1197VaR7-7SARPYTPAFuz58z_9T3-cRZK/edit", kind: "notes" },
      { name: "Pediatric renal masses", href: "https://docs.google.com/document/d/1piKcE9g_jnPabPmcJZDANUCE9RGBmH6n/edit", kind: "notes" },
      { name: "Renal embryology", href: "https://docs.google.com/document/d/1uBrlAPOWsNFx9aSoEwO4tkmf51KXXbL9/edit", kind: "notes" },
      { name: "Pediatric core curriculum", href: "https://docs.google.com/document/d/1uRv8mt4AXvOsJ2MVbgNjZghfPUnvv89t/edit", kind: "notes" },
    ],
  },
  {
    id: "trauma",
    title: "Trauma and reconstruction",
    href: "https://drive.google.com/drive/folders/1HSmavRLrluAS8O9U_drd6sTcRntbB_xx",
    note: "Trauma notes and urethral stricture guidelines.",
    items: [
      { name: "Urogenital trauma", href: "https://docs.google.com/document/d/11J5AXrSxA5XRhpfob2xq3cCPPAYCPwsz/edit", kind: "notes" },
      { name: "Urethral stricture and reconstruction", href: "https://docs.google.com/document/d/15e8t-Wc1yVWoR4H2d6OfyOYkF4ncZtkO/edit", kind: "notes" },
    ],
  },
  {
    id: "core",
    title: "Core, imaging, and lectures",
    href: "https://drive.google.com/drive/folders/1fsG1sN-S0eqNm5YT9XrZ-Q1MNgYeD8aX",
    note: "Anatomy, physiology, imaging, consult notes, MOKA folders, two lecture videos, and the 2023 study schedule.",
    items: [
      { name: "Study schedule, Reddy 2023", href: "https://docs.google.com/spreadsheets/d/1MbcoVzAAeauTiFbRWqv-wDjxSVWEykgO/edit", kind: "schedule" },
      { name: "In-service prep slides", href: "https://docs.google.com/presentation/d/1FeU5e5SSv9Eh6rdCmtNIkV6pasz7rkiO/edit", kind: "notes" },
      { name: "Urologic anatomy", href: "https://docs.google.com/document/d/1u8xLvyBNKYxoPEScyvtoiwjJqGM8Xdfv/edit", kind: "notes" },
      { name: "Physiology and pathology", href: "https://docs.google.com/document/d/1oLNAQqTwVF8OF6x-WrYP20boJTaaNz3E/edit", kind: "notes" },
      { name: "Laparoscopy physiology", href: "https://docs.google.com/document/d/1aw6dDawRSkxYwCWVnBx0aWST_P00bKa5/edit", kind: "notes" },
      { name: "Renal medicine", href: "https://docs.google.com/document/d/1ztymBLm-kUaPz6tpDrb2QU_yX4Ox3Wlt/edit", kind: "notes" },
      { name: "Consult notes", href: "https://docs.google.com/document/d/1xlBhEsCpg_7R48Z34vVSxiyh_Gm9cHJs/edit", kind: "notes" },
      { name: "CT and ultrasound", href: "https://docs.google.com/document/d/1uWfsgeuQjuZb7sw7XRO_Tlznax4dIr1f/edit", kind: "notes" },
      { name: "MRI notes", href: "https://docs.google.com/document/d/10e_u4iphqRDmABx-Bxe-1WFioFGUN8Gw/edit", kind: "notes" },
      { name: "Nuclear medicine", href: "https://docs.google.com/document/d/10UgTrZYgA3-pFIFetpanO3OjtPLqrY2h/edit", kind: "notes" },
      { name: "Imaging of renal masses", href: "https://docs.google.com/document/d/1yZxGGDL1DaIWtskvYc9JFEjAviP3GSLU/edit", kind: "notes" },
      { name: "MOKA 2025–2026", href: "https://drive.google.com/drive/folders/1iHgXYMJ-GOWnugpwt5aGexql7xMCd7qd", kind: "folder" },
      { name: "MOKA 2026–2027", href: "https://drive.google.com/drive/folders/1P2n_tvW3kMyzMEsy4sbc4zw1KXM2HHyI", kind: "folder" },
      { name: "Brandes, rectourinary fistulae (video)", href: "https://drive.google.com/file/d/1g9VG4Pq8HT5NtWVLK3KLoNl_thHGrbvS/view", kind: "video" },
      { name: "Smith, neurourology (video)", href: "https://drive.google.com/file/d/1XkjNzzrBZgE49ttAG_3cC2YG5TPAZR6A/view", kind: "video" },
      { name: "Campbell's cystoscopy chapter", href: "https://docs.google.com/document/d/15K2lxMzOzpstshaXl1JhCaVXjzvJFNkx/edit", kind: "book" },
    ],
  },
];
