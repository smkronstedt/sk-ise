/** Original desert loop. Not a Nintendo piece, and not the uploaded cover. Starts only after a click. */

let ctx: AudioContext | null = null;
let timer = 0;
let step = 0;
let playing = false;
let theme: "town" | "canyon" = "town";
let noise: AudioBuffer | null = null;

const townNotes = [262, 330, 392, 349, 330, 294, 330, 392, 523, 392, 349, 330];

function tone(frequency: number, when: number, duration: number, type: OscillatorType, volume: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.03);
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

function hat(when: number, volume: number) {
  if (!ctx) return;
  if (!noise) {
    const length = Math.floor(ctx.sampleRate * 0.2);
    noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 5000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(when);
  source.stop(when + 0.05);
}

/** Eight bars. E phrygian walk and a low pulse. Original, not the Gerudo theme. */
function playCanyon(start: number) {
  const beat = 0.48;
  const bass = [82.41, 82.41, 98, 87.31, 82.41, 110, 98, 87.31, 82.41, 73.42, 98, 82.41, 87.31, 98, 110, 82.41];
  const lead = [329.63, 349.23, 392, 440, 523.25, 440, 392, 349.23, 329.63, 392, 440, 523.25, 493.88, 440, 392, 329.63];
  bass.forEach((frequency, index) => tone(frequency, start + index * beat, beat * 0.92, "triangle", 0.055));
  lead.forEach((frequency, index) => tone(frequency, start + index * beat, beat * 0.7, "sine", 0.04));
  for (let index = 0; index < bass.length * 2; index++) hat(start + index * (beat / 2), index % 2 ? 0.015 : 0.04);
  return bass.length * beat;
}

function tick() {
  if (!playing || !ctx) return;
  if (theme === "canyon") {
    const start = ctx.currentTime + 0.05;
    const length = playCanyon(start);
    timer = window.setTimeout(tick, Math.max(200, length * 1000 - 80));
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
