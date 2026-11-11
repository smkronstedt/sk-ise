/** Original town loop. Not a game soundtrack. Starts only after a click. */

let ctx: AudioContext | null = null;
let timer = 0;
let step = 0;
let playing = false;

const notes = [262, 330, 392, 349, 330, 294, 330, 392, 523, 392, 349, 330];

function beep(frequency: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

function tick() {
  if (!playing || !ctx) return;
  beep(notes[step % notes.length]);
  step += 1;
  timer = window.setTimeout(tick, step % 4 === 0 ? 420 : 280);
}

export function musicOn() {
  return playing;
}

export function setTownMusic(next: boolean) {
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
  window.clearTimeout(timer);
  tick();
  return true;
}

export function rememberedMusic() {
  return localStorage.getItem("ise-quest-music") === "1";
}
