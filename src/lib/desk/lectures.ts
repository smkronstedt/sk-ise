export type Lecture = { id: string; title: string; section: string; topic: string };

export const lectureSections = [
  "In-service review",
  "Oncology",
  "Stones and endourology",
  "Voiding and reconstruction",
  "Men's health",
  "Pediatrics and core",
  "Behind the Scope",
  "Hidden curriculum",
] as const;

export const lectures: Lecture[] = [
  { id: "dYknqdUprts", title: "Adrenal diseases", section: "In-service review", topic: "Oncology-Adrenal" },
  { id: "8mZABQZYbFU", title: "RCC staging and hereditary syndromes", section: "In-service review", topic: "Oncology-Kidney" },
  { id: "86oyy9qz-h8", title: "NMIBC guidelines and cystectomy", section: "In-service review", topic: "Oncology-Bladder/Urothelial" },
  { id: "uIdNA2nr91M", title: "Prostate screening and CRPC", section: "In-service review", topic: "Oncology-Prostate" },
  { id: "IUje_fAJwLk", title: "Urologic gross anatomy", section: "In-service review", topic: "Anatomy/Embryology" },
  { id: "AogA0J4ninI", title: "Testicular cancer", section: "In-service review", topic: "Oncology-Testis" },
  { id: "QLo7qGRY30U", title: "Penile cancer", section: "In-service review", topic: "Oncology-Penis/Urethra" },
  { id: "EvwfLHo-Z1o", title: "Embryology, DSD, cryptorchidism", section: "In-service review", topic: "Pediatrics" },
  { id: "suxJSDgqfPo", title: "UDS and neurourology", section: "In-service review", topic: "Neurogenic Bladder" },
  { id: "udIoQKwmcfQ", title: "Complications of urinary diversion", section: "In-service review", topic: "Urinary Diversion" },
  { id: "NfLbtf9sN38", title: "Male stress incontinence", section: "In-service review", topic: "Voiding Dysfunction/Incontinence" },
  { id: "byMFrmadLQ8", title: "Interstitial cystitis", section: "In-service review", topic: "Voiding Dysfunction/Incontinence" },
  { id: "10qBZIHrClA", title: "Prostate cancer early detection", section: "In-service review", topic: "Oncology-Prostate" },
  { id: "MM58n_Lrtf8", title: "Metabolic workup of stones", section: "In-service review", topic: "Stones" },
  { id: "2alhXUUCzxA", title: "Female stress incontinence", section: "In-service review", topic: "Female Urology/Pelvic Floor" },
  { id: "q_QJIS_2KDo", title: "Upper tract urothelial carcinoma", section: "In-service review", topic: "Oncology-Bladder/Urothelial" },
  { id: "0knoFlDcmPo", title: "Muscle invasive bladder cancer", section: "Oncology", topic: "Oncology-Bladder/Urothelial" },
  { id: "X_kh_QpYaks", title: "Risk stratified NMIBC", section: "Oncology", topic: "Oncology-Bladder/Urothelial" },
  { id: "0D9RgJya8xM", title: "Advanced urothelial carcinoma", section: "Oncology", topic: "Oncology-Bladder/Urothelial" },
  { id: "y6D3oNc_mpE", title: "Upper tract urothelial carcinoma", section: "Oncology", topic: "Oncology-Bladder/Urothelial" },
  { id: "ObpoAaA5gtk", title: "Adrenal diseases for the urologist", section: "Oncology", topic: "Oncology-Adrenal" },
  { id: "BoTl1pYKVck", title: "Prostate cancer risk reduction", section: "Oncology", topic: "Oncology-Prostate" },
  { id: "0BG9PTyL0-4", title: "MRI fusion biopsy", section: "Oncology", topic: "Oncology-Prostate" },
  { id: "nzVCHEBbvuk", title: "Ureteroscopy complications", section: "Stones and endourology", topic: "Stones" },
  { id: "rtkk3kittFA", title: "Lower pole kidney stone", section: "Behind the Scope", topic: "Stones" },
  { id: "fZ9bViE_dQo", title: "Urinary-rectal fistulas", section: "Voiding and reconstruction", topic: "Trauma/Reconstruction" },
  { id: "FCZeEgw_rPE", title: "Surgery for stress incontinence", section: "Voiding and reconstruction", topic: "Voiding Dysfunction/Incontinence" },
  { id: "KRwdNoDZnhM", title: "Neural pathways in micturition", section: "Voiding and reconstruction", topic: "Neurogenic Bladder" },
  { id: "vANdsR0zXqo", title: "Mixed urinary incontinence", section: "Behind the Scope", topic: "Voiding Dysfunction/Incontinence" },
  { id: "SZEz_JZWtZs", title: "Low grade NMIBC", section: "Behind the Scope", topic: "Oncology-Bladder/Urothelial" },
  { id: "Ax-7OBUoxK8", title: "Testosterone replacement", section: "Men's health", topic: "Sexual Dysfunction" },
  { id: "y-_EbfxUtyE", title: "Cases in male infertility", section: "Men's health", topic: "Infertility/Andrology" },
  { id: "u2-Fia516T0", title: "Non-surgical Peyronie's disease", section: "Men's health", topic: "Sexual Dysfunction" },
  { id: "1qqu23X6UuQ", title: "Burnout in urology", section: "Hidden curriculum", topic: "Ethics/Professionalism/Statistics" },
  { id: "wXs2U1uexIg", title: "Private practice models", section: "Hidden curriculum", topic: "Ethics/Professionalism/Statistics" },
  { id: "_RBLLOlfLgk", title: "Malpractice for urologists", section: "Hidden curriculum", topic: "Ethics/Professionalism/Statistics" },
  { id: "U-ZSqCMRgDk", title: "Contract negotiations", section: "Hidden curriculum", topic: "Ethics/Professionalism/Statistics" },
  { id: "AjelroW3Uw4", title: "Leadership and academic promotion", section: "Hidden curriculum", topic: "Ethics/Professionalism/Statistics" },
  { id: "3Iq2-itALPc", title: "Social media for urologists", section: "Hidden curriculum", topic: "Ethics/Professionalism/Statistics" },
  { id: "WOnNmrIrIF0", title: "Endgame in urology", section: "Pediatrics and core", topic: "Laparoscopy/Robotics/Perioperative" },
];

export const playlists = [
  { title: "Lecture series", href: "https://www.youtube.com/playlist?list=PLe7F6RMpK5ctHhycv-bDk1VDnz1w3y6XK", note: "The full EMPIRE didactic list." },
  { title: "In-service 2023", href: "https://www.youtube.com/playlist?list=PLe7F6RMpK5ctrq3G2Bu5vjgGfmj0gjq-t", note: "Seven review talks." },
  { title: "In-service 2020", href: "https://www.youtube.com/playlist?list=PLe7F6RMpK5ct9MXJioYgXhY8Yxd69Ko3X", note: "The longer review set." },
  { title: "Behind the Scope", href: "https://www.youtube.com/playlist?list=PLe7F6RMpK5csBDpWVTuzxHSbKLJodsksr", note: "Case conversations." },
];

export function lectureFor(topic: string) {
  return lectures.find((lecture) => lecture.topic === topic) ?? lectures[0];
}

export function thumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
