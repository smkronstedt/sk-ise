const KEY = "callroom-ops-v1";

export type TheaterId = "afghanistan" | "iraq";
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

export type Town = { id: string; name: string; note: string; topics: string[] };

export const theaters: { id: TheaterId; name: string; towns: Town[] }[] = [
  {
    id: "afghanistan",
    name: "Afghanistan",
    towns: [
      { id: "bagram", name: "Bagram", note: "The strip. Basics before you roll.", topics: ["Anatomy/Embryology", "Ethics/Professionalism/Statistics", "Pharmacology", "Imaging/Radiation Safety"] },
      { id: "kabul", name: "Kabul", note: "Bladder and urothelial oncology.", topics: ["Oncology-Bladder/Urothelial"] },
      { id: "jalalabad", name: "Jalalabad", note: "Prostate oncology.", topics: ["Oncology-Prostate"] },
      { id: "kandahar", name: "Kandahar", note: "Kidney and adrenal.", topics: ["Oncology-Kidney", "Oncology-Adrenal"] },
      { id: "helmand", name: "Lashkar Gah", note: "Stones.", topics: ["Stones"] },
      { id: "herat", name: "Herat", note: "Trauma and diversion. Last town on this route.", topics: ["Trauma/Reconstruction", "Urinary Diversion"] },
    ],
  },
  {
    id: "iraq",
    name: "Iraq",
    towns: [
      { id: "kuwait", name: "Kuwait staging", note: "Infection and inflammation.", topics: ["Infection/Inflammation"] },
      { id: "basra", name: "Basra", note: "BPH, LUTS, and incontinence.", topics: ["BPH/LUTS", "Voiding Dysfunction/Incontinence"] },
      { id: "nasiriyah", name: "Nasiriyah", note: "Neurogenic bladder and pelvic floor.", topics: ["Neurogenic Bladder", "Female Urology/Pelvic Floor"] },
      { id: "baghdad", name: "Baghdad", note: "Andrology and sexual dysfunction.", topics: ["Infertility/Andrology", "Sexual Dysfunction"] },
      { id: "ramadi", name: "Ramadi", note: "Testis, penis, and urethra.", topics: ["Oncology-Testis", "Oncology-Penis/Urethra"] },
      { id: "fallujah", name: "Fallujah", note: "Pediatrics.", topics: ["Pediatrics"] },
      { id: "mosul", name: "Mosul", note: "Laparoscopy, transplant, and the rest. Last town.", topics: ["Laparoscopy/Robotics/Perioperative", "Transplant/Renal Physiology", "Other"] },
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
};

function emptySave(): OpsSave {
  return {
    owned: [],
    equipped: {},
    here: { afghanistan: "bagram", iraq: "kuwait" },
    fees: 0,
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
