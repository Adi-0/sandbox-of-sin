/*
 * audio.js — the part where you stop reading about signals and hear one.
 *
 * Nothing here is a recording. Every sound is rendered on the spot by the
 * same engine that draws the figure above it: the same poles, the same
 * lsim(), the same numbers, run at 44.1 kHz instead of at plotting
 * resolution. If the curve on screen is wrong the sound is wrong in
 * exactly the same way, which is the point.
 *
 * One honest simplification, flagged everywhere it applies: the guide's
 * recurring signal is a 100 Hz square wave, and small speakers cannot
 * reproduce 100 Hz. Every ear demo therefore runs the whole scene — the
 * signal AND the system — a factor of EAR faster. Scaling time scales
 * every frequency together and leaves every ratio, every shape and every
 * decibel identical, so what you hear is the figure, transposed.
 */

import { h } from './dom.js';

export const EAR = 4;               // two octaves up
const MASTER = 0.22;                // peak output, well below clipping
const FADE = 0.012;                 // seconds of raised-cosine at each end

let ctx = null;
let current = null;

function context() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export function available() {
  return !!(window.AudioContext || window.webkitAudioContext);
}

/** Stop whatever is playing. The router calls this on navigation. */
export function stopAll() {
  if (current) {
    try { current.stop(); } catch { /* already finished */ }
    current = null;
  }
}

/**
 * Play a mono Float32Array. The buffer is peak-normalised and then
 * attenuated to a fixed master level, so no demo in the guide is
 * dramatically louder than any other.
 */
export function play(samples, { onended } = {}) {
  const ac = context();
  if (!ac) return false;
  if (ac.state === 'suspended') ac.resume();
  stopAll();

  let peak = 0;
  for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
  const g = peak > 1e-6 ? MASTER / peak : 0;

  const nFade = Math.round(FADE * ac.sampleRate);
  const buf = ac.createBuffer(1, samples.length, ac.sampleRate);
  const out = buf.getChannelData(0);
  for (let i = 0; i < samples.length; i++) {
    let env = 1;
    if (i < nFade) env = 0.5 - 0.5 * Math.cos((Math.PI * i) / nFade);
    else if (i > samples.length - nFade) env = 0.5 - 0.5 * Math.cos((Math.PI * (samples.length - i)) / nFade);
    out[i] = samples[i] * g * env;
  }

  const src = ac.createBufferSource();
  src.buffer = buf;
  src.connect(ac.destination);
  src.onended = () => { if (current === src) current = null; if (onended) onended(); };
  src.start();
  current = src;
  return true;
}

export const sampleRate = () => (context() ? context().sampleRate : 44100);

/**
 * A listen button.
 *   build(sr)  returns a Float32Array of mono samples at rate sr
 *   label      what the button says
 *
 * Rendering happens on click, never before: no audio context is created
 * until the reader asks for one, which is both polite and what browsers
 * require. If Web Audio is unavailable the button says so and disables
 * itself rather than failing silently.
 */
export function listen({ label = 'Listen', build, seconds = 1.3 }) {
  const ok = available();
  const btn = h('button', {
    type: 'button', class: 'btn', 'data-role': 'listen',
    text: ok ? `▸ ${label}` : 'audio unavailable',
    'aria-label': ok ? `Play: ${label}` : 'Audio is not available in this browser',
  });
  if (!ok) { btn.disabled = true; return btn; }

  btn.addEventListener('click', () => {
    const sr = sampleRate();
    let samples;
    try {
      samples = build(sr, Math.round(seconds * sr));
    } catch (err) {
      console.error('audio build failed', err);
      btn.textContent = 'render failed';
      return;
    }
    const started = play(samples, {
      onended: () => { btn.textContent = `▸ ${label}`; btn.setAttribute('aria-pressed', 'false'); },
    });
    if (started) {
      btn.textContent = `■ ${label}`;
      btn.setAttribute('aria-pressed', 'true');
    }
  });
  return btn;
}

/** Turn a function of time into samples. Used by every audio builder. */
export function render(fn, sr, n) {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / sr);
  return out;
}

/** Copy a Float64Array simulation result into an audio buffer. */
export function fromSim(y) {
  const out = new Float32Array(y.length);
  for (let i = 0; i < y.length; i++) out[i] = y[i];
  return out;
}
