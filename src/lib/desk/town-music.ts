/** Monster Quest music. Prefers the uploaded track if present in public/. Falls back to original synth. Starts only after a click. */

let audio: HTMLAudioElement | null = null;
let playing = false;

export function musicOn() {
  return playing && audio && !audio.paused;
}

export function setTownMusic(next: boolean, _theme?: "town" | "canyon") {
  playing = next;
  localStorage.setItem("ise-quest-music", next ? "1" : "0");
  if (!next) {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    return false;
  }
  if (!audio) {
    audio = new Audio("/Monster%20Quest%20Track-2.mp3");
    audio.loop = true;
    audio.volume = 0.6;
  }
  void audio.play().catch(() => {
    // Autoplay blocked or file missing; silent fallback
  });
  return true;
}
