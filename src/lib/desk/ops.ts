const KEY = "callroom-ops-v1";

export type TheaterId =
  | "afghanistan"
  | "iraq"
  | "horn"
  | "syria"
  | "philippines"
  | "iran"
  | "route7"
  | "route8"
  | "route9"
  | "route10";
export type Slot =
  | "eyes"
  | "head"
  | "plate"
  | "uniform"
  | "boots"
  | "primary"
  | "sidearm"
  | "extra"
  | "workout"
  | "ride"
  | "partner";

export type Gear = {
  id: string;
  name: string;
  slot: Slot | "supply";
  price: number;
  strength: number;
  endurance: number;
  smarts: number;
  cool: number;
  note: string;
};

export type Town = { id: string; name: string; note: string; topics: string[]; x: number; y: number };

export const theaters: { id: TheaterId; name: string; classified?: boolean; towns: Town[] }[] = [
  {
    id: "afghanistan",
    name: "Afghanistan",
    towns: [
      { id: "bagram", name: "Bagram", note: "The strip. Basics before you roll.", x: 46, y: 22, topics: ["Anatomy/Embryology", "Ethics/Professionalism/Statistics", "Pharmacology", "Imaging/Radiation Safety"] },
      { id: "kabul", name: "Kabul", note: "Bladder and urothelial oncology.", x: 50, y: 40, topics: ["Oncology-Bladder/Urothelial"] },
      { id: "jalalabad", name: "Jalalabad", note: "Prostate oncology.", x: 76, y: 48, topics: ["Oncology-Prostate"] },
      { id: "kandahar", name: "Kandahar", note: "Kidney and adrenal.", x: 58, y: 68, topics: ["Oncology-Kidney", "Oncology-Adrenal"] },
      { id: "helmand", name: "Lashkar Gah", note: "Stones.", x: 34, y: 76, topics: ["Stones"] },
      { id: "herat", name: "Herat", note: "Trauma and diversion. Last town on this route.", x: 16, y: 52, topics: ["Trauma/Reconstruction", "Urinary Diversion"] },
    ],
  },
  {
    id: "iraq",
    name: "Iraq",
    towns: [
      { id: "kuwait", name: "Kuwait staging", note: "Infection and inflammation.", x: 54, y: 84, topics: ["Infection/Inflammation"] },
      { id: "basra", name: "Basra", note: "BPH, LUTS, and incontinence.", x: 48, y: 70, topics: ["BPH/LUTS", "Voiding Dysfunction/Incontinence"] },
      { id: "nasiriyah", name: "Nasiriyah", note: "Neurogenic bladder and pelvic floor.", x: 40, y: 56, topics: ["Neurogenic Bladder", "Female Urology/Pelvic Floor"] },
      { id: "baghdad", name: "Baghdad", note: "Andrology and sexual dysfunction.", x: 56, y: 42, topics: ["Infertility/Andrology", "Sexual Dysfunction"] },
      { id: "ramadi", name: "Ramadi", note: "Testis, penis, and urethra.", x: 28, y: 44, topics: ["Oncology-Testis", "Oncology-Penis/Urethra"] },
      { id: "fallujah", name: "Fallujah", note: "Pediatrics.", x: 42, y: 36, topics: ["Pediatrics"] },
      { id: "mosul", name: "Mosul", note: "Laparoscopy, transplant, and the rest. Last town.", x: 50, y: 16, topics: ["Laparoscopy/Robotics/Perioperative", "Transplant/Renal Physiology", "Other"] },
    ],
  },
  {
    id: "horn",
    name: "Horn of Africa",
    towns: [
      { id: "lemonnier", name: "Camp Lemonnier", note: "Djibouti. The stones you still miss.", x: 30, y: 28, topics: ["Stones"] },
      { id: "berbera", name: "Berbera", note: "Prostate, again, under a harder mix.", x: 52, y: 34, topics: ["Oncology-Prostate"] },
      { id: "bosaso", name: "Bosaso", note: "Voiding and incontinence.", x: 74, y: 30, topics: ["BPH/LUTS", "Voiding Dysfunction/Incontinence"] },
      { id: "mogadishu", name: "Mogadishu", note: "Trauma and reconstruction.", x: 68, y: 58, topics: ["Trauma/Reconstruction", "Urinary Diversion"] },
      { id: "kismayo", name: "Kismayo", note: "Infection and sexual health.", x: 60, y: 76, topics: ["Infection/Inflammation", "Sexual Dysfunction"] },
      { id: "manda", name: "Manda Bay", note: "Pediatrics and neurogenic bladder. Last town on this coast.", x: 28, y: 70, topics: ["Pediatrics", "Neurogenic Bladder"] },
    ],
  },
  {
    id: "syria",
    name: "Syria",
    towns: [
      { id: "damascus", name: "Damascus", note: "Core again. Anatomy, imaging, and ethics.", x: 42, y: 62, topics: ["Anatomy/Embryology", "Imaging/Radiation Safety", "Ethics/Professionalism/Statistics"] },
      { id: "aleppo", name: "Aleppo", note: "Bladder and urothelial oncology.", x: 48, y: 28, topics: ["Oncology-Bladder/Urothelial"] },
      { id: "homs", name: "Homs", note: "Kidney and adrenal.", x: 46, y: 46, topics: ["Oncology-Kidney", "Oncology-Adrenal"] },
      { id: "latakia", name: "Latakia", note: "Stones on the coast.", x: 22, y: 36, topics: ["Stones"] },
      { id: "palmyra", name: "Palmyra", note: "Testis, penis, and urethra.", x: 62, y: 50, topics: ["Oncology-Testis", "Oncology-Penis/Urethra"] },
      { id: "deir", name: "Deir ez-Zor", note: "Trauma. Last town on this route.", x: 78, y: 58, topics: ["Trauma/Reconstruction"] },
    ],
  },
  {
    id: "philippines",
    name: "Philippines",
    towns: [
      { id: "manila", name: "Manila", note: "Prostate oncology.", x: 28, y: 32, topics: ["Oncology-Prostate"] },
      { id: "subic", name: "Subic", note: "BPH, LUTS, and incontinence.", x: 24, y: 28, topics: ["BPH/LUTS", "Voiding Dysfunction/Incontinence"] },
      { id: "clark", name: "Clark", note: "Infection and pharmacology.", x: 30, y: 30, topics: ["Infection/Inflammation", "Pharmacology"] },
      { id: "cebu", name: "Cebu", note: "Female pelvic floor.", x: 48, y: 52, topics: ["Female Urology/Pelvic Floor"] },
      { id: "palawan", name: "Palawan", note: "Andrology.", x: 18, y: 48, topics: ["Infertility/Andrology", "Sexual Dysfunction"] },
      { id: "zamboanga", name: "Zamboanga", note: "Pediatrics. Last island.", x: 62, y: 68, topics: ["Pediatrics"] },
    ],
  },
  {
    id: "iran",
    name: "Iran",
    towns: [
      { id: "tehran", name: "Tehran", note: "Neurogenic bladder.", x: 48, y: 32, topics: ["Neurogenic Bladder"] },
      { id: "tabriz", name: "Tabriz", note: "Transplant and renal physiology.", x: 28, y: 24, topics: ["Transplant/Renal Physiology"] },
      { id: "isfahan", name: "Isfahan", note: "Laparoscopy and perioperative care.", x: 46, y: 48, topics: ["Laparoscopy/Robotics/Perioperative"] },
      { id: "shiraz", name: "Shiraz", note: "Diversion.", x: 48, y: 64, topics: ["Urinary Diversion"] },
      { id: "bushehr", name: "Bushehr", note: "Stones again, on the gulf.", x: 40, y: 74, topics: ["Stones"] },
      { id: "bandar", name: "Bandar Abbas", note: "The rest of the bank. Last town.", x: 70, y: 78, topics: ["Other", "Oncology-Adrenal"] },
    ],
  },
  {
    id: "route7",
    name: "Undisclosed",
    classified: true,
    towns: [
      { id: "r7-1", name: "Rafah", note: "Stones and imaging.", x: 30, y: 78, topics: ["Stones", "Imaging/Radiation Safety"] },
      { id: "r7-2", name: "Khan Yunis", note: "Bladder oncology.", x: 36, y: 62, topics: ["Oncology-Bladder/Urothelial"] },
      { id: "r7-3", name: "Deir al-Balah", note: "Voiding and incontinence.", x: 34, y: 48, topics: ["Voiding Dysfunction/Incontinence", "BPH/LUTS"] },
      { id: "r7-4", name: "Gaza City", note: "Trauma and reconstruction.", x: 32, y: 36, topics: ["Trauma/Reconstruction"] },
      { id: "r7-5", name: "Jabalia", note: "Infection. Last city on this route.", x: 34, y: 22, topics: ["Infection/Inflammation"] },
    ],
  },
  {
    id: "route8",
    name: "Undisclosed",
    classified: true,
    towns: [
      { id: "r8-1", name: "Murmansk", note: "Core and pharmacology.", x: 28, y: 18, topics: ["Anatomy/Embryology", "Pharmacology"] },
      { id: "r8-2", name: "St. Petersburg", note: "Prostate oncology.", x: 24, y: 28, topics: ["Oncology-Prostate"] },
      { id: "r8-3", name: "Kaliningrad", note: "Neurogenic bladder.", x: 16, y: 32, topics: ["Neurogenic Bladder"] },
      { id: "r8-4", name: "Moscow", note: "Kidney and testis oncology.", x: 36, y: 36, topics: ["Oncology-Kidney", "Oncology-Testis"] },
      { id: "r8-5", name: "Sevastopol", note: "Andrology.", x: 30, y: 48, topics: ["Infertility/Andrology", "Sexual Dysfunction"] },
      { id: "r8-6", name: "Vladivostok", note: "Pediatrics. Last city.", x: 88, y: 42, topics: ["Pediatrics"] },
    ],
  },
  {
    id: "route9",
    name: "Undisclosed",
    classified: true,
    towns: [
      { id: "r9-1", name: "Sinuiju", note: "Core and stones.", x: 22, y: 30, topics: ["Stones", "Anatomy/Embryology"] },
      { id: "r9-2", name: "Pyongyang", note: "Prostate oncology.", x: 40, y: 46, topics: ["Oncology-Prostate"] },
      { id: "r9-3", name: "Kaesong", note: "Trauma.", x: 36, y: 62, topics: ["Trauma/Reconstruction"] },
      { id: "r9-4", name: "Wonsan", note: "Infection and pharmacology.", x: 62, y: 48, topics: ["Infection/Inflammation", "Pharmacology"] },
      { id: "r9-5", name: "Chongjin", note: "Pediatrics. Last city.", x: 78, y: 22, topics: ["Pediatrics"] },
    ],
  },
  {
    id: "route10",
    name: "Undisclosed",
    classified: true,
    towns: [
      { id: "r10-1", name: "Beijing", note: "Ethics and the core.", x: 62, y: 32, topics: ["Ethics/Professionalism/Statistics", "Anatomy/Embryology"] },
      { id: "r10-2", name: "Qingdao", note: "Stones.", x: 74, y: 38, topics: ["Stones"] },
      { id: "r10-3", name: "Shanghai", note: "Urothelial oncology and laparoscopy.", x: 76, y: 52, topics: ["Oncology-Bladder/Urothelial", "Laparoscopy/Robotics/Perioperative"] },
      { id: "r10-4", name: "Guangzhou", note: "Female pelvic floor.", x: 64, y: 72, topics: ["Female Urology/Pelvic Floor"] },
      { id: "r10-5", name: "Hong Kong", note: "Transplant.", x: 68, y: 78, topics: ["Transplant/Renal Physiology"] },
      { id: "r10-6", name: "Chengdu", note: "Trauma, diversion, and whatever is left.", x: 42, y: 52, topics: ["Trauma/Reconstruction", "Urinary Diversion", "Other"] },
    ],
  },
];

export const gear: Gear[] = [
  { id: "nvg-green", name: "Green night vision", slot: "eyes", price: 80, strength: 0, endurance: 1, smarts: 0, cool: 1, note: "Single tube, green." },
  { id: "nvg-white", name: "White night vision", slot: "eyes", price: 140, strength: 0, endurance: 1, smarts: 1, cool: 2, note: "White phosphor." },
  { id: "quad", name: "White quad tubes", slot: "eyes", price: 320, strength: 0, endurance: 2, smarts: 1, cool: 3, note: "Four tubes. The expensive set." },
  { id: "gatorz", name: "Gatorz", slot: "eyes", price: 36, strength: 0, endurance: 0, smarts: 0, cool: 1, note: "Day eye pro." },
  { id: "oakley", name: "Oakleys", slot: "eyes", price: 40, strength: 0, endurance: 0, smarts: 0, cool: 1, note: "The other pair." },
  { id: "kevlar", name: "Kevlar helmet", slot: "head", price: 70, strength: 1, endurance: 0, smarts: 0, cool: 0, note: "Full cut." },
  { id: "halfshell", name: "Half-shell helmet", slot: "head", price: 55, strength: 0, endurance: 1, smarts: 0, cool: 1, note: "Lighter." },
  { id: "cap", name: "Team X ball cap", slot: "head", price: 18, strength: 0, endurance: 0, smarts: 0, cool: 1, note: "Camp hat. Not a unit patch." },
  { id: "armor", name: "Body armor", slot: "plate", price: 90, strength: 2, endurance: 0, smarts: 0, cool: 0, note: "Soft armor plus plates." },
  { id: "carrier", name: "Dive-cut plate carrier", slot: "plate", price: 150, strength: 2, endurance: 1, smarts: 0, cool: 1, note: "In the style of a London Bridge carrier." },
  { id: "crye", name: "Crye shirt and pants", slot: "uniform", price: 110, strength: 0, endurance: 2, smarts: 0, cool: 1, note: "Elbow and knee pads on." },
  { id: "tank", name: "Team X tank", slot: "uniform", price: 22, strength: 0, endurance: 0, smarts: 0, cool: 1, note: "Camp shirt." },
  { id: "ranger", name: "Ranger panties", slot: "workout", price: 16, strength: 0, endurance: 1, smarts: 0, cool: 1, note: "Shorts for the workout." },
  { id: "arcteryx", name: "Arc'teryx boots", slot: "boots", price: 75, strength: 0, endurance: 2, smarts: 0, cool: 1, note: "All-day pair." },
  { id: "salomon", name: "Salomon boots", slot: "boots", price: 68, strength: 0, endurance: 2, smarts: 0, cool: 0, note: "The lighter pair." },
  { id: "alphafly", name: "Nike Alphafly 4", slot: "boots", price: 80, strength: 0, endurance: 2, smarts: 0, cool: 1, note: "Race day." },
  { id: "altra", name: "Altra Carbon Vanish 3", slot: "boots", price: 72, strength: 0, endurance: 2, smarts: 0, cool: 1, note: "Wide race shoe." },
  { id: "adios", name: "Adidas Adizero Adios Pro 5", slot: "boots", price: 78, strength: 0, endurance: 2, smarts: 0, cool: 1, note: "Race flat." },
  { id: "evo", name: "Adidas Adizero Evo Pro 3", slot: "boots", price: 84, strength: 0, endurance: 2, smarts: 0, cool: 1, note: "The light one." },
  { id: "puma", name: "Puma Fast-R Nitro Elite 3", slot: "boots", price: 76, strength: 0, endurance: 2, smarts: 0, cool: 1, note: "Nitro elite." },
  { id: "m4", name: "M4", slot: "primary", price: 160, strength: 2, endurance: 0, smarts: 0, cool: 1, note: "Carbine. A camp prop, not a lesson." },
  { id: "launcher", name: "Launcher", slot: "primary", price: 240, strength: 3, endurance: 0, smarts: 0, cool: 1, note: "Heavy. One primary at a time." },
  { id: "staccato-c", name: "Staccato compact", slot: "sidearm", price: 120, strength: 1, endurance: 0, smarts: 0, cool: 1, note: "Short grip." },
  { id: "staccato-p", name: "Staccato P", slot: "sidearm", price: 150, strength: 1, endurance: 0, smarts: 0, cool: 2, note: "Duty size." },
  { id: "staccato-xc", name: "Staccato XC", slot: "sidearm", price: 190, strength: 2, endurance: 0, smarts: 0, cool: 2, note: "The comped one." },
  { id: "grenades", name: "Training grenades", slot: "extra", price: 40, strength: 1, endurance: 0, smarts: 0, cool: 0, note: "Inert camp props." },
  { id: "radio", name: "Radio", slot: "extra", price: 45, strength: 0, endurance: 0, smarts: 1, cool: 0, note: "You hear the plan." },
  { id: "ifak", name: "IFAK", slot: "extra", price: 30, strength: 0, endurance: 1, smarts: 1, cool: 0, note: "Blowout kit on the belt." },
  { id: "bob", name: "Harley Street Bob", slot: "ride", price: 340, strength: 0, endurance: 1, smarts: 0, cool: 3, note: "Back home." },
  { id: "moped", name: "Overseas moped", slot: "ride", price: 90, strength: 0, endurance: 1, smarts: 0, cool: 1, note: "The town bike." },
  { id: "dog", name: "Working dog", slot: "partner", price: 180, strength: 1, endurance: 1, smarts: 0, cool: 2, note: "He stays at camp until you buy the kit." },
  { id: "dogkit", name: "Dog vest and kit", slot: "supply", price: 60, strength: 0, endurance: 1, smarts: 0, cool: 1, note: "Only useful once the dog is yours." },
  { id: "books", name: "College books", slot: "supply", price: 35, strength: 0, endurance: 0, smarts: 2, cool: 0, note: "A stack for the slow nights." },
  { id: "macbook", name: "MacBook Pro", slot: "supply", price: 260, strength: 0, endurance: 0, smarts: 3, cool: 1, note: "Notes, guidelines, the bank." },
  { id: "mags", name: "Magazines", slot: "supply", price: 20, strength: 1, endurance: 0, smarts: 0, cool: 0, note: "A few loaded mags on the shelf." },
  { id: "ammo", name: "Ammunition cans", slot: "supply", price: 25, strength: 1, endurance: 0, smarts: 0, cool: 0, note: "Cans, not a range day." },
  { id: "watch", name: "Field watch", slot: "supply", price: 48, strength: 0, endurance: 1, smarts: 0, cool: 1, note: "You stop guessing the time." },
];

export type OpsSave = {
  owned: string[];
  equipped: Partial<Record<Slot, string>>;
  here: Record<TheaterId, string>;
  fees: number;
  treated: string[];
};

function emptySave(): OpsSave {
  return {
    owned: [],
    equipped: {},
    here: {
      afghanistan: "bagram",
      iraq: "kuwait",
      horn: "lemonnier",
      syria: "damascus",
      philippines: "manila",
      iran: "tehran",
      route7: "r7-1",
      route8: "r8-1",
      route9: "r9-1",
      route10: "r10-1",
    },
    fees: 0,
    treated: [],
  };
}

export function loadOps(): OpsSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as OpsSave;
    return {
      owned: parsed.owned ?? [],
      equipped: parsed.equipped ?? {},
      here: { ...emptySave().here, ...parsed.here },
      fees: parsed.fees ?? 0,
      treated: parsed.treated ?? [],
    };
  } catch {
    return emptySave();
  }
}

export function saveOps(state: OpsSave) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function townGate(index: number, count: number, total: number) {
  if (index <= 0) return 0;
  const steps = Math.max(1, count - 1);
  if (index >= count - 1) return total;
  return Math.ceil((index / steps) * total);
}

export function levelFor(correct: number, total: number) {
  if (correct <= 0) return 1;
  return Math.min(20, 1 + Math.floor((correct / Math.max(1, total)) * 19));
}

export function statsFor(owned: string[], equipped: Partial<Record<Slot, string>>, level: number) {
  const active = new Set<string>(Object.values(equipped).filter(Boolean) as string[]);
  for (const id of owned) {
    const item = gear.find((row) => row.id === id);
    if (item?.slot === "supply") active.add(id);
  }
  const totals = { strength: level, endurance: level, smarts: Math.ceil(level / 2), cool: 0 };
  for (const id of active) {
    const item = gear.find((row) => row.id === id);
    if (!item) continue;
    if (item.id === "dogkit" && !owned.includes("dog")) continue;
    totals.strength += item.strength;
    totals.endurance += item.endurance;
    totals.smarts += item.smarts;
    totals.cool += item.cool;
  }
  return totals;
}
