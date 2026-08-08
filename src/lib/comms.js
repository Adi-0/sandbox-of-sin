/* ==========================================================================
   comms.js — modulation, and the two bounds on a digital link.

   Most of Communications reuses what is already here: dsp.js has spectra and
   sampling, poly.js has complex arithmetic, and Signal Processing Part 1
   already built the Fourier *series*. What this module genuinely adds is:

     - the Fourier *transform* of the handful of shapes the exam uses,
     - AM and FM waveforms and the power split between carrier and sidebands,
     - Bessel functions, because an FM spectrum is not approximable — its
       sideband amplitudes are J_n(β) and nothing simpler will do,
     - Nyquist's signalling limit and Shannon's capacity.

   Frequencies are in hertz throughout. Where a formula is conventionally
   written in radians the conversion is explicit rather than folded in.
   ========================================================================== */

/* --- Bessel functions of the first kind ----------------------------------
   J_n(x) = Σ_k (−1)^k / (k! (n+k)!) · (x/2)^(2k+n)

   The direct series is used rather than a recurrence. Upward recurrence is
   numerically unstable for n > x, which is exactly the region an FM spectrum
   lives in — the sidebands that matter are the ones near and beyond β — and
   a wrong-but-plausible sideband amplitude is the kind of error that would
   never be noticed. The series converges quickly for the range the exam
   uses (β up to ~12, n up to ~20) and every term is exact to double
   precision.                                                              */

const FACT = (() => {
  const f = [1];
  for (let i = 1; i <= 170; i++) f[i] = f[i - 1] * i;
  return f;
})();

export function besselJ(n, x) {
  const m = Math.abs(n);
  if (x === 0) return m === 0 ? 1 : 0;
  let sum = 0;
  const half = x / 2;
  for (let k = 0; k < 60; k++) {
    if (m + k > 170) break;
    const term = ((k % 2 ? -1 : 1) / (FACT[k] * FACT[m + k])) * Math.pow(half, 2 * k + m);
    sum += term;
    if (Math.abs(term) < 1e-18 * Math.max(Math.abs(sum), 1e-12) && k > m) break;
  }
  /* J_{−n} = (−1)^n J_n. The negative sidebands of an FM signal are the
     positive ones with alternating sign, which is why odd-order pairs
     subtract at the carrier and even-order pairs add. */
  return n < 0 && m % 2 ? -sum : sum;
}

/* --- amplitude modulation ------------------------------------------------- */

/**
 * Modulation index from the envelope extremes — the way it is actually
 * measured on an oscilloscope, and the way the exam usually gives it.
 */
export const indexFromEnvelope = (aMax, aMin) => (aMax - aMin) / (aMax + aMin);

/**
 * Where the power goes in a full-carrier AM signal, normalised to carrier
 * power = 1.
 *
 * The carrier carries no information and cannot be removed without changing
 * the demodulator, which is the entire argument for DSB-SC and SSB. Even at
 * 100% modulation only a third of the transmitted power is doing any work.
 */
export function amPower(m) {
  const total = 1 + (m * m) / 2;
  const sidebands = (m * m) / 2;              // both together
  return {
    total, carrier: 1, sidebands,
    perSideband: sidebands / 2,
    efficiency: sidebands / total,
  };
}

/** The AM envelope, for drawing. Carrier amplitude 1. */
export const amEnvelope = (m, fm) => (t) => 1 + m * Math.cos(2 * Math.PI * fm * t);

/* --- angle modulation ----------------------------------------------------- */

/** β = Δf / fm. Dimensionless, and the only number an FM spectrum depends on. */
export const fmIndex = (deviation, fm) => deviation / fm;

/**
 * Carson's rule: essentially all the power lies within this bandwidth.
 *
 * BW = 2(Δf + fm) = 2fm(β + 1). The two forms are the same thing and the
 * exam uses both, so both are worth recognising.
 */
export const carson = (deviation, fm) => 2 * (deviation + fm);

/**
 * Sideband amplitudes of a tone-modulated FM signal, index 0..n.
 * Element 0 is the carrier; element k is the pair at ±k·fm.
 */
export const fmSidebands = (beta, n = 12) =>
  Array.from({ length: n + 1 }, (_, k) => besselJ(k, beta));

/**
 * How much of the total power lies inside ±k·fm of the carrier.
 * Total power is 1 for any β — FM does not change the transmitted power,
 * only how it is distributed, which is the point people find surprising.
 */
export function fmPowerWithin(beta, k) {
  let p = besselJ(0, beta) ** 2;
  for (let i = 1; i <= k; i++) p += 2 * besselJ(i, beta) ** 2;
  return p;
}

/* --- the two bounds on a digital link ------------------------------------- */

/** Bits per symbol for an M-ary alphabet. */
export const bitsPerSymbol = (M) => Math.log2(M);

/**
 * Nyquist's signalling limit: the maximum symbol rate a bandwidth B can
 * carry without intersymbol interference, and the bit rate that follows.
 *
 * This is a limit imposed by BANDWIDTH ALONE and says nothing about noise —
 * which is why it permits an unbounded bit rate by raising M. Shannon is the
 * bound that stops that.
 */
export const nyquistRate = (B, M = 2) => 2 * B * Math.log2(M);

/** Shannon capacity, the bound noise imposes. snr is a ratio, not decibels. */
export const shannon = (B, snr) => B * Math.log2(1 + snr);

export const dbToRatio = (db) => Math.pow(10, db / 10);
export const ratioToDb = (r) => 10 * Math.log10(r);

/* --- pulse code modulation ------------------------------------------------ */

/**
 * Bit rate of a PCM channel: sample rate times bits per sample.
 * The telephone channel this compilation has been carrying since Signal
 * Processing Part 2 is 8000 × 8 = 64 kbit/s, which is one DS0.
 */
export const pcmRate = (fs, bits) => fs * bits;

/**
 * A T-carrier frame: `ch` channels of `bits` each, plus framing overhead.
 * T1 is 24 channels of 8 bits plus 1 framing bit = 193 bits, at 8000 frames
 * per second, which is 1.544 Mbit/s exactly.
 */
export function frame(ch, bits, overhead, framesPerSecond) {
  const perFrame = ch * bits + overhead;
  return { perFrame, rate: perFrame * framesPerSecond, payload: ch * bits * framesPerSecond };
}

/* --- Fourier transform pairs the exam actually uses ----------------------- */

export const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));

/**
 * |X(f)| for the standard shapes, each normalised to unit area so the
 * duality is visible: making the pulse narrower raises and widens its
 * transform by exactly the reciprocal factor.
 */
export const transformOf = {
  /** Rectangle of width τ → τ·sinc(fτ). */
  rect: (tau) => (f) => Math.abs(tau * sinc(f * tau)),
  /** Triangle of base 2τ → τ·sinc²(fτ). */
  tri: (tau) => (f) => Math.abs(tau * sinc(f * tau) ** 2),
  /** Two-sided exponential e^(−|t|/τ) → 2τ/(1 + (2πfτ)²). */
  exp: (tau) => (f) => (2 * tau) / (1 + (2 * Math.PI * f * tau) ** 2),
  /** Gaussian → Gaussian: the shape that is its own transform. */
  gauss: (tau) => (f) => tau * Math.sqrt(2 * Math.PI) * Math.exp(-2 * (Math.PI * f * tau) ** 2),
};

export const shapeOf = {
  rect: (tau) => (t) => (Math.abs(t) <= tau / 2 ? 1 : 0),
  tri: (tau) => (t) => Math.max(0, 1 - Math.abs(t) / tau),
  exp: (tau) => (t) => Math.exp(-Math.abs(t) / tau),
  gauss: (tau) => (t) => Math.exp(-(t * t) / (2 * tau * tau)),
};

/**
 * Quantisation SNR for a sinusoid, in dB, at a level `levelDb` below full
 * scale. Electronics Part 6 gives the full-scale figure; what PCM needs is
 * what happens as the signal gets quieter, because that is the entire
 * argument for companding.
 */
export const pcmSnrUniform = (bits, levelDb = 0) => 6.02 * bits + 1.76 + levelDb;

/**
 * Quantisation SNR with mu-law companding, which is very nearly independent
 * of level — that is the point of it.
 *
 *   SNR ≈ 6.02n + 4.77 − 20 log10[ln(1 + mu)]
 *
 * At mu = 255 and 8 bits this is about 38 dB, held across the whole range,
 * against uniform's 50 dB at full scale falling a decibel per decibel.
 */
export const pcmSnrCompanded = (bits, mu = 255) =>
  6.02 * bits + 4.77 - 20 * Math.log10(Math.log(1 + mu));

/** Level below full scale at which companding starts to win. */
export function compandingCrossover(bits, mu = 255) {
  return pcmSnrCompanded(bits, mu) - pcmSnrUniform(bits, 0);
}

/**
 * The same for A-law, Europe's companding standard, which is a different
 * curve reached by a different argument and lands within 0.11 dB of mu-law
 * at 8 bits. Worth knowing they agree; not worth memorising both.
 */
export const pcmSnrALaw = (bits, A = 87.6) =>
  6.02 * bits + 4.77 - 20 * Math.log10(1 + Math.log(A));

/** The mu-law compression curve itself, for drawing. x in [-1, 1]. */
export const muLaw = (x, mu = 255) =>
  Math.sign(x) * (Math.log(1 + mu * Math.abs(x)) / Math.log(1 + mu));

/** A-law's curve: linear below 1/A, logarithmic above, continuous at the join. */
export function aLaw(x, A = 87.6) {
  const a = Math.abs(x), d = 1 + Math.log(A);
  return Math.sign(x) * (a < 1 / A ? (A * a) / d : (1 + Math.log(A * a)) / d);
}

/**
 * How much finer the quantiser steps are at the bottom of the range than at
 * the top.
 *
 * For mu-law the slope is mu/[(1 + mu|x|) ln(1 + mu)], so the ratio between
 * x = 0 and x = 1 is exactly 1 + mu — 256 at mu = 255. The compressor buys
 * small signals 256 times the resolution it gives large ones, which is the
 * whole mechanism in one number.
 */
export const companderSlopeRatio = (mu = 255) => 1 + mu;
