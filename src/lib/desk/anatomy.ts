export type AnatomyPlate = { src: string; caption: string };

const plates: { src: string; keys: string[]; caption: string }[] = [
  {
    src: "/anatomy/weigert.svg",
    keys: ["weigert", "duplex", "ureterocele", "ectopic ureter", "upper pole moiety"],
    caption: "Duplex kidney. The upper-pole ureter inserts medial and inferior and obstructs, often with a ureterocele. The lower-pole ureter inserts lateral and superior and refluxes.",
  },
  {
    src: "/anatomy/horseshoe.jpg",
    keys: ["horseshoe"],
    caption: "Horseshoe kidney. The isthmus crosses in front of the aorta and vena cava. The ureters pass in front of the isthmus.",
  },
  {
    src: "/anatomy/nephron.jpg",
    keys: ["nephron", "glomerul", "loop of henle", "proximal tubule", "distal tubule", "collecting duct", "macula densa", "juxtaglomer", "renin"],
    caption: "Nephron. Glomerulus, coiled proximal tubule, loop of Henle, distal tubule, then the collecting duct. Renin comes from the juxtaglomerular cells.",
  },
  {
    src: "/anatomy/gerota.jpg",
    keys: ["gerota", "perinephric", "pararenal", "renal fascia"],
    caption: "From the kidney out: capsule, perinephric fat, Gerota fascia, then pararenal fat. The body wall is outside that.",
  },
  {
    src: "/anatomy/vessels.jpg",
    keys: ["varicocele", "pampiniform", "gonadal vein", "left renal vein", "renal vein", "renal artery", "nutcracker"],
    caption: "The left gonadal vein drains into the left renal vein, which crosses the aorta. That is why a varicocele is usually on the left. The right gonadal vein drains straight to the vena cava.",
  },
  {
    src: "/anatomy/adrenal-zones.jpg",
    keys: ["zona glomerulosa", "zona fasciculata", "zona reticularis", "aldosterone", "adrenal cortex", "pheochrom", "adrenal"],
    caption: "Adrenal cortex, outside in: glomerulosa (aldosterone), fasciculata (cortisol), reticularis (androgens). The medulla in the center makes catecholamines.",
  },
  {
    src: "/anatomy/prostate-zones.svg",
    keys: ["transition zone", "peripheral zone", "central zone", "mcneal", "neurovascular bundle"],
    caption: "Peripheral zone is most of the gland and most cancers. Transition zone around the urethra is where BPH starts. Central zone surrounds the ejaculatory ducts.",
  },
  {
    src: "/anatomy/penis-cross.svg",
    keys: ["corpus cavern", "buck fascia", "buck's fascia", "tunica albuginea", "deep dorsal", "priapism"],
    caption: "Two corpora cavernosa on top, corpus spongiosum and urethra below. Tunica albuginea around each body. Buck fascia wraps all three, with the deep dorsal vein inside it.",
  },
  {
    src: "/anatomy/inguinal.jpg",
    keys: ["inguinal", "spermatic cord", "processus vaginalis", "gubernaculum", "direct hernia", "indirect hernia"],
    caption: "Inguinal canal. The spermatic cord carries the vas, testicular artery, pampiniform plexus, and genital branch of the genitofemoral nerve. The ilioinguinal nerve runs with it.",
  },
  {
    src: "/anatomy/scrotum.jpg",
    keys: ["dartos", "tunica vaginalis", "cremaster", "scrotum", "epididym", "appendix testis"],
    caption: "Scrotal layers, outside in: skin, dartos, external spermatic fascia, cremaster, internal spermatic fascia, parietal then visceral tunica vaginalis, tunica albuginea, testis. The epididymis is posterolateral.",
  },
  {
    src: "/anatomy/nerves.jpg",
    keys: ["pontine", "micturition", "pudendal", "hypogastric", "pelvic nerve", "onuf", "parasympathetic"],
    caption: "Pelvic parasympathetic nerves (S2–S4) contract the detrusor. Hypogastric sympathetics (T11–L2) close the bladder neck. The pudendal nerve (Onuf nucleus, S2–S4) holds the external sphincter. The pontine center coordinates voiding.",
  },
  {
    src: "/anatomy/pelvic-lymph.jpg",
    keys: ["obturator node", "obturator fossa", "lymph node", "lymphaden", "iliac node", "sentinel node"],
    caption: "Pelvic nodes around the bladder and prostate: obturator, external iliac, internal iliac, then common iliac.",
  },
  {
    src: "/anatomy/female-pelvis.jpg",
    keys: ["pelvic floor", "levator", "prolapse", "sling", "vagina", "uterus", "cystocele"],
    caption: "Female pelvis, sagittal. Short urethra under the pubic bone, bladder, uterus and vagina, rectum against the sacrum, levator ani as the floor.",
  },
  {
    src: "/anatomy/male-pelvis.jpg",
    keys: ["seminal vesicle", "ejaculatory", "space of retzius", "denonvillier"],
    caption: "Male pelvis, sagittal. Bladder, prostate under it, seminal vesicle behind the bladder, rectum behind Denonvilliers fascia.",
  },
  {
    src: "/anatomy/bladder.jpg",
    keys: ["trigone", "detrusor", "bladder neck", "ureteral orifice", "urachus", "bladder"],
    caption: "Bladder interior. The trigone is the triangle between the two ureteral orifices and the bladder neck. The urachus runs from the dome to the umbilicus.",
  },
  {
    src: "/anatomy/urethra-segments.jpg",
    keys: ["prostatic urethra", "membranous", "bulbar", "pendulous", "fossa navicular", "posterior urethral valve", "urethral stricture", "urethroplasty", "urethra"],
    caption: "Male urethra, proximal to distal: prostatic, membranous (through the pelvic floor, the external sphincter), bulbar, then pendulous in the shaft.",
  },
  {
    src: "/anatomy/prostate.jpg",
    keys: ["prostate", "bph", "verumontanum"],
    caption: "Prostate under the bladder, around the urethra.",
  },
  {
    src: "/anatomy/penis.jpg",
    keys: ["penis", "penile", "peyronie", "glans", "hypospad", "prepuce"],
    caption: "Penis. The glans is the expanded end of the corpus spongiosum. A hypospadias meatus opens on the ventral surface.",
  },
  {
    src: "/anatomy/testis.jpg",
    keys: ["testis", "testicular", "seminiferous", "sertoli", "leydig", "spermatic"],
    caption: "Testis and cord. Seminiferous tubules make sperm. Leydig cells between them make testosterone. The vas leaves the tail of the epididymis.",
  },
  {
    src: "/anatomy/ureter.jpg",
    keys: ["ureter", "upj", "uvj"],
    caption: "Ureter. The three common narrowings are the UPJ, the crossing of the iliac vessels, and the UVJ.",
  },
  {
    src: "/anatomy/kidney.jpg",
    keys: ["kidney", "renal", "calyx", "calyces", "cortex", "hilum", "papilla"],
    caption: "Kidney. Cortex outside, pyramids and papillae inside, calyces into the renal pelvis, vessels and pelvis at the hilum.",
  },
];

/** A plate for the structure the question is about, if it has one. */
export function anatomyPlate(topic: string, text: string): AnatomyPlate | undefined {
  const blob = `${topic} ${text}`.toLowerCase();
  for (const plate of plates) {
    if (plate.keys.some((key) => blob.includes(key))) return { src: plate.src, caption: plate.caption };
  }
  if (blob.includes("anatomy") || blob.includes("embryolog")) {
    return { src: "/anatomy/kidney.jpg", caption: "Kidney. Cortex, medulla, calyces, and the pelvis at the hilum." };
  }
  return undefined;
}

export function anatomyImage(topic: string, text: string) {
  return anatomyPlate(topic, text)?.src;
}
