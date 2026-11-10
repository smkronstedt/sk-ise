export function touchProgress() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("ise-progress"));
}
