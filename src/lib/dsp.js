/* ==========================================================================
   dsp.js — sampling, spectra, and filters that run on numbers.

   Signal Processing reuses more than it adds. A z-polynomial is a polynomial,
   so poly.js already gives roots and complex evaluation; a filter's magnitude
   response is the same |N(jω)|/|D(jω)| that Linear Systems plots. What is
   genuinely new is here, and only that:

     - where a sampled sinusoid's frequency *appears* to be (aliasing),
     - the amplitude of a periodic wave's harmonics (a spectrum to draw),
     - running a difference equation forward,
     - evaluating a digital filter around the unit circle.

   Frequencies are in hertz where a signal is being described and in radians
   per sample where a digital filter is. The two are one multiplication apart
   and mixing them up is the single most common error in this subject, so the
   conversion is a named function rather than an inline 2π.
   ========================================================================== */

import { cabs, carg, evalComplex } from "./poly.js";

/* --- sampling ------------------------------------------------------------- */

/**
 * Where a tone at `f` appears once sampled at `fs`.
 *
 * The rule is usually taught as "subtract multiples of fs until you land in
 * the band", but the honest statement is a fold: the frequency axis is
 * creased at every multiple of fs/2, and the tone lands wherever the paper
 * takes it. Both give the same number; folding also explains why the answer
 * is never negative and never above fs/2.
 */
export function aliasOf(f, fs) {
  if (fs <= 0) return Math.abs(f);
  const r = Math.abs(f) % fs;              // slide into [0, fs)
  return r > fs / 2 ? fs - r : r;          // then fold about fs/2
}

/** True when the tone survives sampling unchanged. Strict, as Nyquist is. */
export const resolved = (f, fs) => Math.abs(f) < fs / 2;

/**
 * A sampled sinusoid is also fitted exactly by its alias, and that impostor
 * is what a reconstructor draws. Returns the impostor's frequency and the
 * phase it needs to pass through the same samples.
 *
 * When the tone sits in an odd band — between fs/2 and fs, between 3fs/2 and
 * 2fs, and so on — the fold reverses the direction of rotation and the
 * impostor is the *conjugate*. Written as a sine that is not a negated phase:
 * the samples give sin(φ − θ), and sin(φ − θ) = sin(θ + π − φ), so the phase
 * becomes π − φ. Getting this wrong is why a hand-drawn alias sometimes
 * refuses to touch the samples it is supposed to pass through.
 */
export function aliasPhasor(f, fs, phase = 0) {
  const fa = aliasOf(f, fs);
  const band = Math.floor(Math.abs(f) / (fs / 2));   // which crease we are past
  const flipped = band % 2 === 1;
  return { f: fa, phase: flipped ? Math.PI - phase : phase, flipped };
}

/** Sample instants and values, for drawing the dots on a waveform. */
export function sampleAt(fn, fs, tMax) {
  const out = [];
  for (let n = 0; n * (1 / fs) <= tMax + 1e-12; n++) {
    const t = n / fs;
    out.push([t, fn(t)]);
  }
  return out;
}

/* --- spectra of the standard waves ---------------------------------------- */

/**
 * Harmonic amplitudes of a unit-amplitude periodic wave, index 1..n.
 *
 * These are the four waves the exam ever asks about, and the pattern that
 * matters is not the constant out front — it is how fast the terms die:
 * 1/k for a discontinuous wave, 1/k² for a continuous one with a corner.
 * A sharp edge is expensive in bandwidth, and that is the whole lesson of
 * Part 1.
 */
export function harmonics(kind, n = 12) {
  const out = [];
  for (let k = 1; k <= n; k++) {
    let a = 0;
    if (kind === "square") a = k % 2 ? 4 / (Math.PI * k) : 0;
    else if (kind === "sawtooth") a = 2 / (Math.PI * k);
    else if (kind === "triangle") a = k % 2 ? 8 / (Math.PI * Math.PI * k * k) : 0;
    else if (kind === "sine") a = k === 1 ? 1 : 0;
    out.push(a);
  }
  return out;
}

/** The partial sum those harmonics build, as a function of time. */
export function partialSum(kind, n, f0) {
  const a = harmonics(kind, n);
  const odd = kind === "triangle";       // triangle's odd harmonics alternate
  return (t) => {
    let y = 0;
    for (let k = 1; k <= n; k++) {
      if (!a[k - 1]) continue;
      const ph = 2 * Math.PI * k * f0 * t;
      if (odd) y += a[k - 1] * ((k % 4 === 1 ? 1 : -1) * Math.sin(ph));
      else y += a[k - 1] * Math.sin(ph);
    }
    return y;
  };
}

/* --- analog filter shapes -------------------------------------------------- */

/**
 * Magnitude of a first-order RC section at frequency ratio u = f/fc.
 * Low-pass and high-pass are the same denominator; only the numerator moves.
 */
export function firstOrder(kind, u) {
  const d = Math.hypot(1, u);
  return kind === "high" ? Math.abs(u) / d : 1 / d;
}

/**
 * Butterworth magnitude, order n, at ratio u = f/fc.
 *
 * The defining property is visible in the formula rather than asserted: at
 * u = 1 it is 1/√2 for *every* order, which is what makes fc a single
 * well-defined number instead of an order-dependent one.
 */
export const butterworth = (n, u) => 1 / Math.sqrt(1 + Math.pow(Math.abs(u), 2 * n));

/**
 * Magnitude of a second-order low-pass with damping ζ at ratio u = f/fn.
 * Peaks only when ζ < 1/√2, and `peakOf` below says by how much.
 */
export function secondOrder(zeta, u) {
  return 1 / Math.hypot(1 - u * u, 2 * zeta * u);
}

/**
 * Where and how high a second-order low-pass peaks. Returns null when it
 * does not peak at all — which is the entire content of the Butterworth
 * choice, so it is a null rather than a zero.
 */
export function peakOf(zeta) {
  if (zeta >= Math.SQRT1_2) return null;
  const u = Math.sqrt(1 - 2 * zeta * zeta);
  const m = 1 / (2 * zeta * Math.sqrt(1 - zeta * zeta));
  return { u, mag: m, dB: 20 * Math.log10(m) };
}

/** Order needed to reach `atten` dB of loss at `u` times the cutoff. */
export function orderFor(atten, u) {
  if (u <= 1) return Infinity;
  return Math.log10(Math.pow(10, atten / 10) - 1) / (2 * Math.log10(u));
}

export const dB = (m) => 20 * Math.log10(Math.max(m, 1e-12));
export const undB = (d) => Math.pow(10, d / 20);

/* --- digital filters ------------------------------------------------------- */

/**
 * Run y[n] = Σ b_k x[n−k] − Σ a_k y[n−k] forward over an input array.
 *
 * `b` and `a` are in ascending powers of z⁻¹ with a[0] the leading
 * denominator term — the direct-form convention, and the one a difference
 * equation is read off in. Everything before n = 0 is zero, which is what
 * "initially at rest" means and why the impulse response is just the output
 * for x = [1, 0, 0, …].
 */
export function runFilter(b, a, x) {
  const a0 = a[0] ?? 1;
  const y = new Array(x.length).fill(0);
  for (let n = 0; n < x.length; n++) {
    let acc = 0;
    for (let k = 0; k < b.length; k++) if (n - k >= 0) acc += b[k] * x[n - k];
    for (let k = 1; k < a.length; k++) if (n - k >= 0) acc -= a[k] * y[n - k];
    y[n] = acc / a0;
  }
  return y;
}

/** The impulse response, which for an FIR is literally the coefficients. */
export const impulseResponse = (b, a, n = 32) =>
  runFilter(b, a, Array.from({ length: n }, (_, i) => (i === 0 ? 1 : 0)));

/** The step response, for reading DC gain off the far end. */
export const stepResponse = (b, a, n = 32) =>
  runFilter(b, a, new Array(n).fill(1));

/**
 * H(e^{jΩ}) — the frequency response, Ω in radians per sample.
 *
 * A coefficient list in z⁻¹ is the same list read as a polynomial in z of the
 * same degree, so poly.js evaluates it directly once z is raised to that
 * degree. Only the shared z^{-(N)} factor differs between numerator and
 * denominator, and it cancels in the ratio when both are padded to equal
 * length — which is what the padding below is for.
 */
export function freqz(b, a, omega) {
  const n = Math.max(b.length, a.length);
  const bp = [...b, ...new Array(n - b.length).fill(0)];
  const ap = [...a, ...new Array(n - a.length).fill(0)];
  const z = [Math.cos(omega), Math.sin(omega)];
  const num = evalComplex(bp, z);          // bp read highest-power-first
  const den = evalComplex(ap, z);
  const dm = cabs(den);
  return {
    mag: dm < 1e-12 ? Infinity : cabs(num) / dm,
    phase: carg(num) - carg(den),
  };
}

/** Radians per sample ↔ hertz, the conversion that is always getting lost. */
export const omegaOf = (f, fs) => (2 * Math.PI * f) / fs;
export const freqOf = (omega, fs) => (omega * fs) / (2 * Math.PI);

/**
 * Denominator of a two-pole resonator with poles at r·e^{±jΩ}.
 * Expanding (1 − re^{jΩ}z⁻¹)(1 − re^{−jΩ}z⁻¹) leaves only real coefficients,
 * which is why a conjugate pair is the smallest thing a real filter can hold.
 */
export const resonator = (r, omega) => [1, -2 * r * Math.cos(omega), r * r];

/** Stable when every pole is strictly inside the unit circle. */
export const stableZ = (poles) => poles.every((p) => cabs(p) < 1 - 1e-9);
