/** Loops Monster Quest Track 2. Starts only after a click. */

const SRC = "/monster-quest-track-2.mp3";

let audio: HTMLAudioElement | null = null;
let playing = false;

export function musicOn() {
  return playing;
}

export function setTownMusic(next: boolean, _theme?: "town" | "canyon") {
  playing = next;
  try {
    localStorage.setItem("ise-quest-music", next ? "1" : "0");
  } catch {
    /* private mode */
  }
  if (!audio) {
    audio = new Audio(SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.55;
  }
  if (!next) {
    audio.pause();
    return false;
  }
  const start = () => {
    if (!playing || !audio) return;
    void audio.play().catch(() => {
      window.setTimeout(() => {
        if (playing && audio) void audio.play().catch(() => {});
      }, 60);
    });
  };
  start();
  return true;
}
