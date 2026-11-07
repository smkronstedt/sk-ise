export type DeskMode = "classic" | "base" | "trail" | "encounter" | "rpg" | "notes" | "ops";

export const deskModes: { id: DeskMode; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "base", label: "Home Base" },
  { id: "trail", label: "Uro Trail" },
  { id: "encounter", label: "Encounter" },
  { id: "notes", label: "Monster Quest" },
  { id: "rpg", label: "RPG" },
  { id: "ops", label: "Black Ops" },
];

export const MODE_KEY = "callroom-desk-mode";
export const MODE_EVENT = "ise-mode";

export function loadMode(): DeskMode {
  if (typeof window === "undefined") return "classic";
  const saved = localStorage.getItem(MODE_KEY);
  return deskModes.some((item) => item.id === saved) ? (saved as DeskMode) : "classic";
}

export function saveMode(mode: DeskMode) {
  localStorage.setItem(MODE_KEY, mode);
  window.dispatchEvent(new Event(MODE_EVENT));
}
