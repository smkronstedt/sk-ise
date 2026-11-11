/** Original loops. The canyon theme is not a Nintendo piece. Starts only after a click. */

let ctx: AudioContext | null = null;
let timer = 0;
let step = 0;
let playing = false;
let theme: "town" | "canyon" = "town";

const townNotes = [262, 330, 392, 349, 330, 294, 330, 392, 523, 392, 349, 330];

function tone(frequency: number, when: number, duration: number, type: OscillatorType, volume: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}

function beep(frequency: number) {
  if (!ctx) return;
  tone(frequency, ctx.currentTime, 0.26, "square", 0.04);
}

function playCanyon(start: number) {
  const beat = 0.18;
  const bass = [147, 147, 175, 165, 147, 196, 175, 165];
  const lead = [440, 523, 466, 392, 349, 392, 440, 349, 294, 349, 392, 440, 466, 392, 349, 330];
  bass.forEach((frequency, index) => tone(frequency, start + index * beat, beat * 0.85, "triangle", 0.05));
  lead.forEach((frequency, index) => tone(frequency, start + index * (beat / 2), beat * 0.42, "square", 0.03));
}

function tick() {
  if (!playing || !ctx) return;
  if (theme === "canyon") {
    const start = ctx.currentTime + 0.05;
    playCanyon(start);
    timer = window.setTimeout(tick, 1400);
    return;
  }
  beep(townNotes[step % townNotes.length]);
  step += 1;
  timer = window.setTimeout(tick, step % 4 === 0 ? 420 : 280);
}

export function musicOn() {
  return playing;
}

export function setTownMusic(next: boolean, nextTheme: "town" | "canyon" = theme) {
  const changed = nextTheme !== theme;
  theme = nextTheme;
  playing = next;
  localStorage.setItem("ise-quest-music", next ? "1" : "0");
  if (!next) {
    window.clearTimeout(timer);
    return false;
  }
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return false;
  ctx ??= new AudioCtx();
  void ctx.resume();
  if (changed) window.clearTimeout(timer);
  if (changed || timer === 0) {
    window.clearTimeout(timer);
    tick();
  }
  return true;
}
