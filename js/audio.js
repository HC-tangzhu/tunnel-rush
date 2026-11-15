let ctxRef = null;
let muted = false;
let engineOsc = null;
let engineGain = null;
let engineFilter = null;

export function initAudio() {
  if (ctxRef || typeof window === 'undefined') return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctxRef = new AC();
  engineFilter = ctxRef.createBiquadFilter();
  engineFilter.type = 'lowpass';
  engineFilter.frequency.value = 420;
  engineGain = ctxRef.createGain();
  engineGain.gain.value = 0;
  engineOsc = ctxRef.createOscillator();
  engineOsc.type = 'sawtooth';
  engineOsc.frequency.value = 60;
  engineOsc.connect(engineFilter);
  engineFilter.connect(engineGain);
  engineGain.connect(ctxRef.destination);
  engineOsc.start();
}

export function resumeAudio() {
  if (ctxRef && ctxRef.state === 'suspended') ctxRef.resume();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (muted && engineGain) engineGain.gain.value = 0;
  return muted;
}

function tone(freq, dur, type = 'square', vol = 0.08, slideTo = null) {
  if (!ctxRef || muted) return;
  const now = ctxRef.currentTime;
  const osc = ctxRef.createOscillator();
  const gain = ctxRef.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain);
  gain.connect(ctxRef.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

function noise(dur = 0.25, vol = 0.18) {
  if (!ctxRef || muted) return;
  const now = ctxRef.currentTime;
  const frames = Math.floor(ctxRef.sampleRate * dur);
  const buffer = ctxRef.createBuffer(1, frames, ctxRef.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = ctxRef.createBufferSource();
  src.buffer = buffer;
  const filter = ctxRef.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, now);
  filter.frequency.exponentialRampToValueAtTime(240, now + dur);
  const gain = ctxRef.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctxRef.destination);
  src.start(now);
}

export function sfx(name) {
  switch (name) {
    case 'pickup':
      tone(660, 0.12, 'triangle', 0.09, 990);
      break;
    case 'crash':
      noise(0.32, 0.2);
      tone(140, 0.28, 'sawtooth', 0.1, 60);
      break;
    case 'violation':
      tone(880, 0.1, 'square', 0.07);
      setTimeout(() => tone(660, 0.14, 'square', 0.07), 110);
      break;
    case 'pass':
      tone(520, 0.07, 'sine', 0.05);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.09), i * 130));
      break;
    case 'lose':
      tone(300, 0.5, 'sawtooth', 0.09, 90);
      break;
    case 'start':
      tone(440, 0.1, 'triangle', 0.08, 880);
      break;
    default:
      break;
  }
}

export function engine(speed, playing) {
  if (!engineOsc || !engineGain || !ctxRef) return;
  const now = ctxRef.currentTime;
  engineOsc.frequency.setTargetAtTime(55 + speed * 4.2, now, 0.08);
  const level = playing && !muted ? 0.012 + speed * 0.00055 : 0;
  engineGain.gain.setTargetAtTime(level, now, 0.12);
}
