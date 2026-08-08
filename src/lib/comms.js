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

/* --- the decision, and when it fails --------------------------------------

   Everything about a digital link's error rate comes through the Q function:
   the probability a zero-mean unit-variance Gaussian exceeds x. The exam
   quotes error rates rather than deriving them, but a figure that draws a
   noise cloud has to compute the real number or the picture lies.

   erfc is the Chebyshev form from Numerical Recipes — full double precision
   across the whole range, which matters because BER curves are read over ten
   decades and a 1e-7 approximation goes flat at the bottom of the plot.     */

const ERFC_COF = [
  -1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2,
  -9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4,
  4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6,
  1.30365583558e-6, 1.5626441722e-8, -8.5238095915e-8,
  6.529054439e-9, 5.059343495e-9, -9.91364156e-10,
  -2.27365122e-10, 9.6467911e-11, 2.394038e-12,
  -6.886027e-12, 8.94487e-13, 3.13092e-13,
  -1.12708e-13, 3.81e-16, 7.106e-15,
];

export function erfc(x) {
  const z = Math.abs(x);
  const t = 2 / (2 + z);
  const ty = 4 * t - 2;
  let d = 0, dd = 0;
  for (let j = ERFC_COF.length - 1; j > 0; j--) {
    const tmp = d;
    d = ty * d - dd + ERFC_COF[j];
    dd = tmp;
  }
  const ans = t * Math.exp(-z * z + 0.5 * (ERFC_COF[0] + ty * d) - dd);
  return x >= 0 ? ans : 2 - ans;
}

/** P(N(0,1) > x). The whole of digital communications is this one integral. */
export const qfunc = (x) => 0.5 * erfc(x / Math.SQRT2);

/**
 * BPSK — and, with Gray coding, QPSK too, which is the surprising part:
 * QPSK carries twice the bits in the same bandwidth for the same energy per
 * bit and the same error rate. Its two carriers are orthogonal, so it is
 * really two independent BPSK links sharing one channel.
 */
export const berBpsk = (ebn0) => qfunc(Math.sqrt(2 * ebn0));

/** Symbol error rate for M-PSK, the standard nearest-neighbour bound. */
export const serPsk = (M, esn0) =>
  M === 2 ? qfunc(Math.sqrt(2 * esn0)) : 2 * qfunc(Math.sqrt(2 * esn0) * Math.sin(Math.PI / M));

/** Symbol error rate for square M-QAM. */
export function serQam(M, esn0) {
  const r = Math.sqrt(M);
  const p = 2 * (1 - 1 / r) * qfunc(Math.sqrt((3 * esn0) / (M - 1)));
  return 1 - (1 - p) ** 2;              // two independent PAM axes
}

/* --- the two bounds, side by side -----------------------------------------

   Shannon and Nyquist are quoted here in the same units — bits per second
   per hertz — because the only useful thing to do with them is compare them.
   Nyquist's is the BASEBAND figure, R_b/B = 2 log2 M, matching the channel
   bandwidth used for PCM in Part 4.                                        */

/** Shannon's bound on spectral efficiency. snrDb is a power ratio in dB. */
export const shannonEff = (snrDb) => Math.log2(1 + Math.pow(10, snrDb / 10));

/** Nyquist's ideal baseband efficiency for an M-level alphabet. */
export const nyquistEff = (M) => 2 * Math.log2(M);

/**
 * The SNR at which Shannon first permits an M-ary scheme's ideal rate.
 *
 * Setting 2 log2 M = log2(1 + SNR) gives 1 + SNR = M² exactly — so binary
 * needs 3 (4.8 dB), QPSK 15 (11.8 dB) and 16-ary 255 (24.1 dB). Below that
 * the scheme is not merely difficult, it is impossible at any coding.
 */
export const snrForNyquist = (M) => M * M - 1;

/**
 * Energy per bit over noise density required to reach a spectral efficiency,
 * on the Shannon bound: (2^eff − 1)/eff.
 *
 * As eff -> 0 this tends to ln 2 = -1.59 dB, the absolute floor below which
 * no communication is possible however much bandwidth is spent.
 */
export const ebn0Limit = (eff) => (eff <= 0 ? Math.LN2 : (2 ** eff - 1) / eff);

/* --- constellations --------------------------------------------------------
   Unit average symbol energy, so schemes are compared at equal power and the
   minimum distance is the thing that actually differs. */

export function constellation(kind, M) {
  let pts = [];
  if (kind === "qam") {
    const r = Math.sqrt(M);
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < r; j++) pts.push({ x: 2 * i - (r - 1), y: 2 * j - (r - 1) });
    }
  } else {
    for (let i = 0; i < M; i++) {
      const a = (2 * Math.PI * i) / M;
      pts.push({ x: Math.cos(a), y: Math.sin(a) });
    }
  }
  const e = pts.reduce((s, p) => s + p.x * p.x + p.y * p.y, 0) / pts.length;
  const g = 1 / Math.sqrt(e);
  return pts.map((p) => ({ x: p.x * g, y: p.y * g }));
}

/** Smallest distance between any two symbols — what noise has to cross. */
export function minDistance(pts) {
  let d = Infinity;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      d = Math.min(d, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
    }
  }
  return d;
}

/* --- multiplexing ----------------------------------------------------------

   All three ways of sharing a channel are the same trick — put the users on
   mutually orthogonal signals — applied to a different variable. TDM uses
   disjoint time slots, FDM disjoint frequency bands, CDMA overlapping codes
   whose inner products vanish. Only the third needs any arithmetic here.   */

/**
 * Walsh–Hadamard codes of length n, n a power of two.
 *
 * H(1) = [1], H(2n) = [[H, H], [H, −H]]. Every pair of distinct rows has
 * inner product exactly zero and every row with itself exactly n, in integer
 * arithmetic — which is what lets a CDMA receiver recover one user's bit from
 * a sum of all of them with the others cancelling exactly rather than nearly.
 */
export function walsh(n) {
  let H = [[1]];
  while (H.length < n) {
    const m = H.length;
    const N = [];
    for (let i = 0; i < m; i++) N.push([...H[i], ...H[i]]);
    for (let i = 0; i < m; i++) N.push([...H[i], ...H[i].map((v) => -v)]);
    H = N;
  }
  return H;
}

/** Inner product. Integer in, integer out, for codes of ±1. */
export const correlate = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

/**
 * The chip sequence on the wire when several users transmit at once: the
 * plain sum of their modulated waveforms. No user is attenuated and nothing
 * is coordinated beyond the codes themselves.
 *
 * Takes waveforms rather than (codes, bits) so that a misaligned user — one
 * whose window straddles two symbols, see lateWindow — sums the same way an
 * aligned one does. The channel does not know which is which.
 */
export const cdmaChannel = (waveforms) =>
  waveforms.reduce(
    (acc, w) => acc.map((v, i) => v + w[i]),
    new Array(waveforms[0].length).fill(0)
  );

/**
 * What a receiver's correlation window sees from a user whose chips arrive
 * `late` chips behind it: the tail of that user's PREVIOUS symbol followed
 * by the head of the current one.
 *
 * This, and not a cyclic rotation, is what losing chip synchronisation
 * actually does. A cyclic shift of a Walsh row is often still orthogonal to
 * the other rows, so it understates the damage; the window straddling two
 * symbols with independent bits is what destroys orthogonality. At n = 8 a
 * single interferer one chip out of step can correlate 8 against a wanted
 * signal of 8 — interference exactly as strong as the signal.
 */
export function lateWindow(code, late, prevBit, curBit) {
  const n = code.length;
  const s = ((late % n) + n) % n;
  return [
    ...code.slice(n - s).map((v) => v * prevBit),
    ...code.slice(0, n - s).map((v) => v * curBit),
  ];
}
