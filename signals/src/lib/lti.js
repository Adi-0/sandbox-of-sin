/*
 * lti.js — THE engine.
 *
 * Everything in this guide that moves, plots, reads out or plays comes
 * through here. There is exactly one description of a system in the whole
 * codebase — a list of zeros, a list of poles and a gain — and every other
 * view of it is *derived*:
 *
 *      zeros/poles/gain
 *            |
 *            +--> b, a          polynomial coefficients
 *                   |
 *                   +--> H(jw)  the Bode plot
 *                   +--> state space --> h(t), step response, any input
 *                                          |
 *                                          +--> the audio you hear
 *
 * So the curve you see, the number in the readout and the sound in your
 * speakers cannot drift apart: they are three renderings of one simulation.
 *
 * Convention: polynomial coefficient arrays are ASCENDING in powers of s,
 * so a = [a0, a1, a2] means a0 + a1*s + a2*s^2. This is unusual in
 * textbooks and very convenient in code — index equals power.
 */

/* ============================================================
   complex arithmetic — just enough of it
   ============================================================ */

export const C = (re = 0, im = 0) => ({ re, im });
export const cadd = (p, q) => ({ re: p.re + q.re, im: p.im + q.im });
export const csub = (p, q) => ({ re: p.re - q.re, im: p.im - q.im });
export const cmul = (p, q) => ({ re: p.re * q.re - p.im * q.im, im: p.re * q.im + p.im * q.re });
export const cabs = (p) => Math.hypot(p.re, p.im);
export const carg = (p) => Math.atan2(p.im, p.re);

export function cdiv(p, q) {
  const d = q.re * q.re + q.im * q.im;
  if (d === 0) return { re: Infinity, im: 0 };
  return { re: (p.re * q.re + p.im * q.im) / d, im: (p.im * q.re - p.re * q.im) / d };
}

/* ============================================================
   polynomials
   ============================================================ */

/**
 * Expand a set of roots into real ascending coefficients.
 * poly([-1, -2]) -> [2, 3, 1]   i.e.  2 + 3s + s^2 = (s+1)(s+2)
 * Roots must come in conjugate pairs for the result to be real; any
 * residual imaginary part is discarded (it is float noise, ~1e-16).
 */
export function poly(roots) {
  let c = [C(1, 0)];
  for (const r of roots) {
    const root = typeof r === 'number' ? C(r, 0) : r;
    const next = new Array(c.length + 1);
    for (let k = 0; k <= c.length; k++) {
      const lower = k > 0 ? c[k - 1] : C(0, 0);          // s * c[k-1]
      const upper = k < c.length ? c[k] : C(0, 0);        // -root * c[k]
      next[k] = csub(lower, cmul(root, upper));
    }
    c = next;
  }
  return c.map((z) => z.re);
}

/** Evaluate an ascending real polynomial at a complex s, by Horner. */
export function polyval(coeffs, s) {
  let acc = C(0, 0);
  for (let i = coeffs.length - 1; i >= 0; i--) {
    acc = cadd(cmul(acc, s), C(coeffs[i], 0));
  }
  return acc;
}

/* ============================================================
   a system
   ============================================================ */

/**
 * Build a system from zeros, poles and gain.
 *   H(s) = k * prod(s - z) / prod(s - p)
 * Returns { zeros, poles, k, b, a } with b, a ascending and a monic.
 */
export function zpk(zeros, poles, k = 1) {
  const bRaw = poly(zeros).map((c) => c * k);
  const aRaw = poly(poles);
  const lead = aRaw[aRaw.length - 1] || 1;
  const b = bRaw.map((c) => c / lead);
  const a = aRaw.map((c) => c / lead);
  return { zeros: zeros.slice(), poles: poles.slice(), k, b, a };
}

/** Scale a system so its gain at DC (s = 0) is exactly `target`. */
export function normalizeDC(sys, target = 1) {
  const dc = sys.a[0] === 0 ? 0 : sys.b[0] / sys.a[0];
  if (!dc || !isFinite(dc)) return sys;
  const f = target / dc;
  return { ...sys, k: sys.k * f, b: sys.b.map((c) => c * f) };
}

/** Scale a system so |H(jw0)| is exactly `target`. Used for bandpass. */
export function normalizeAt(sys, w0, target = 1) {
  const m = cabs(freqResp(sys, w0));
  if (!m || !isFinite(m)) return sys;
  const f = target / m;
  return { ...sys, k: sys.k * f, b: sys.b.map((c) => c * f) };
}

/** H(jw) as a complex number. */
export function freqResp(sys, w) {
  const s = C(0, w);
  return cdiv(polyval(sys.b, s), polyval(sys.a, s));
}

/** |H(jw)| and angle, in convenient units, over an array of w. */
export function bode(sys, ws) {
  const mag = new Float64Array(ws.length);
  const db = new Float64Array(ws.length);
  const phase = new Float64Array(ws.length);
  let prev = 0;
  for (let i = 0; i < ws.length; i++) {
    const H = freqResp(sys, ws[i]);
    mag[i] = cabs(H);
    db[i] = 20 * Math.log10(Math.max(mag[i], 1e-12));
    // unwrap so the phase curve does not jump by 360 degrees mid-plot
    let ph = (carg(H) * 180) / Math.PI;
    if (i > 0) { while (ph - prev > 180) ph -= 360; while (prev - ph > 180) ph += 360; }
    phase[i] = ph; prev = ph;
  }
  return { w: ws, mag, db, phase };
}

/** Is every pole strictly in the left half-plane? */
export function isStable(sys) {
  return sys.poles.every((p) => (typeof p === 'number' ? p : p.re) < -1e-12);
}

/* ============================================================
   state space, and therefore time
   ============================================================ */

/**
 * Controllable canonical form.
 *   x'[i]   = x[i+1]                      (i < n-1)
 *   x'[n-1] = -sum(a[i] * x[i]) + u
 *   y       = sum(c[i] * x[i]) + D*u
 * With a monic, this is exact for any proper H(s).
 */
export function ss(sys) {
  const a = sys.a;
  const n = a.length - 1;
  if (n < 1) return { n: 0, a: [], c: [], D: sys.b[0] || 0 };
  const b = sys.b.slice();
  while (b.length < n + 1) b.push(0);
  const D = b[n];                                   // zero unless m == n
  const c = new Array(n);
  for (let i = 0; i < n; i++) c[i] = b[i] - D * a[i];
  return { n, a: a.slice(0, n), c, D };
}

/** Fastest pole magnitude — sets how small an integration step must be. */
function fastest(sys) {
  let m = 0;
  for (const p of sys.poles) m = Math.max(m, cabs(typeof p === 'number' ? C(p, 0) : p));
  for (const z of sys.zeros) m = Math.max(m, cabs(typeof z === 'number' ? C(z, 0) : z));
  return m || 1;
}

/**
 * Run an input through a system.
 *
 *   u        function of time, or null for the zero input
 *   dt       output sample spacing, seconds
 *   n        number of output samples
 *   x0       initial state (impulse response uses x0 = B)
 *
 * RK4 with automatic sub-stepping: the step is shrunk until it is
 * comfortably shorter than the system's own fastest time constant, so a
 * sharply-tuned filter integrates as accurately as a sluggish one.
 */
export function lsim(sys, u, dt, n, x0 = null) {
  const m = ss(sys);
  if (m.n === 0) {
    const y = new Float64Array(n);
    for (let i = 0; i < n; i++) y[i] = m.D * (u ? u(i * dt) : 0);
    return y;
  }
  const sub = Math.min(64, Math.max(1, Math.ceil((dt * fastest(sys)) / 0.08)));
  const hh = dt / sub;
  const x = new Float64Array(m.n);
  if (x0) x.set(x0.subarray ? x0 : Float64Array.from(x0));

  const k1 = new Float64Array(m.n), k2 = new Float64Array(m.n);
  const k3 = new Float64Array(m.n), k4 = new Float64Array(m.n);
  const tmp = new Float64Array(m.n);

  function deriv(state, t, out) {
    for (let i = 0; i < m.n - 1; i++) out[i] = state[i + 1];
    let acc = u ? u(t) : 0;
    for (let i = 0; i < m.n; i++) acc -= m.a[i] * state[i];
    out[m.n - 1] = acc;
  }

  const y = new Float64Array(n);
  let t = 0;
  for (let i = 0; i < n; i++) {
    let out = 0;
    for (let j = 0; j < m.n; j++) out += m.c[j] * x[j];
    y[i] = out + m.D * (u ? u(t) : 0);

    for (let sIdx = 0; sIdx < sub; sIdx++) {
      deriv(x, t, k1);
      for (let j = 0; j < m.n; j++) tmp[j] = x[j] + (hh / 2) * k1[j];
      deriv(tmp, t + hh / 2, k2);
      for (let j = 0; j < m.n; j++) tmp[j] = x[j] + (hh / 2) * k2[j];
      deriv(tmp, t + hh / 2, k3);
      for (let j = 0; j < m.n; j++) tmp[j] = x[j] + hh * k3[j];
      deriv(tmp, t + hh, k4);
      for (let j = 0; j < m.n; j++) {
        x[j] += (hh / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]);
      }
      t += hh;
      if (!isFinite(x[0])) { for (let j = 0; j < m.n; j++) x[j] = 0; }
    }
  }
  return y;
}

/**
 * The impulse response h(t).
 * A true impulse is not a signal you can sample, so we do the honest thing
 * instead of poking the system with a tall narrow pulse: for x(0) = B and
 * u = 0 the state evolves exactly as it would after a unit impulse. The D
 * term (a straight-through path) would be an impulse in the output and is
 * reported separately rather than drawn as a spike of arbitrary height.
 */
export function impulseResponse(sys, dt, n) {
  const m = ss(sys);
  if (m.n === 0) return { h: new Float64Array(n), direct: m.D };
  const x0 = new Float64Array(m.n);
  x0[m.n - 1] = 1;
  return { h: lsim(sys, null, dt, n, x0), direct: m.D };
}

export function stepResponse(sys, dt, n) {
  return lsim(sys, () => 1, dt, n);
}

/* ============================================================
   convolution
   ============================================================ */

/** Discrete convolution scaled by dt, so it approximates the integral. */
export function convolve(x, h, dt = 1) {
  const n = x.length, m = h.length;
  const y = new Float64Array(n + m - 1);
  for (let i = 0; i < n; i++) {
    const xi = x[i];
    if (xi === 0) continue;
    for (let j = 0; j < m; j++) y[i + j] += xi * h[j];
  }
  for (let i = 0; i < y.length; i++) y[i] *= dt;
  return y;
}

/**
 * One output sample of a convolution, with the overlap kept so a figure
 * can shade it: y(t) = integral of x(tau) h(t - tau) dtau.
 */
export function convolveAt(x, h, idx, dt = 1) {
  let sum = 0;
  const prod = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const j = idx - i;
    if (j >= 0 && j < h.length) { prod[i] = x[i] * h[j]; sum += prod[i]; }
  }
  return { value: sum * dt, product: prod };
}

/* ============================================================
   the discrete Fourier transform (radix-2)
   ============================================================ */

/** In-place FFT. re and im must have a power-of-two length. */
export function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
}

/**
 * Single-sided amplitude spectrum of a real signal.
 * Returns frequencies in Hz and amplitudes in the same units as x, so a
 * 1.0-amplitude sine reads 1.0 — not 0.5, and not N/2.
 */
export function spectrum(x, dt) {
  let n = 1;
  while (n < x.length) n <<= 1;
  const re = new Float64Array(n), im = new Float64Array(n);
  re.set(x.subarray ? x.subarray(0, Math.min(x.length, n)) : x.slice(0, n));
  fft(re, im);
  const half = n >> 1;
  const freq = new Float64Array(half), amp = new Float64Array(half);
  for (let i = 0; i < half; i++) {
    freq[i] = i / (n * dt);
    amp[i] = (2 * Math.hypot(re[i], im[i])) / x.length;
  }
  if (half > 0) amp[0] /= 2;
  return { freq, amp, n };
}

/**
 * The same convolution, done through the frequency room.
 *
 * This is not a flourish — it is Part 6's central claim, load-bearing.
 * Convolving a 1.3-second sound with a 0.3-second room directly is about
 * 800 million multiplications and would freeze the page for seconds. Three
 * FFTs and a multiply is about ten million, and returns before you have
 * let go of the button. The guide's reverb literally could not exist
 * without the theorem the guide is teaching.
 */
export function fftConvolve(x, hArr, dt = 1) {
  const need = x.length + hArr.length - 1;
  let L = 1;
  while (L < need) L <<= 1;
  const xr = new Float64Array(L), xi = new Float64Array(L);
  const hr = new Float64Array(L), hi = new Float64Array(L);
  for (let i = 0; i < x.length; i++) xr[i] = x[i];
  for (let i = 0; i < hArr.length; i++) hr[i] = hArr[i];
  fft(xr, xi);
  fft(hr, hi);
  for (let i = 0; i < L; i++) {
    const re = xr[i] * hr[i] - xi[i] * hi[i];
    const im = xr[i] * hi[i] + xi[i] * hr[i];
    xr[i] = re; xi[i] = -im;               // conjugate, for the inverse
  }
  fft(xr, xi);
  const y = new Float64Array(need);
  for (let i = 0; i < need; i++) y[i] = (xr[i] / L) * dt;
  return y;
}

/* ============================================================
   signals
   ============================================================ */

export const TAU = 2 * Math.PI;

export const sine     = (t, f, phase = 0) => Math.sin(TAU * f * t + phase);
export const cosine   = (t, f, phase = 0) => Math.cos(TAU * f * t + phase);
export const square   = (t, f) => (((t * f) % 1 + 1) % 1 < 0.5 ? 1 : -1);
export const sawtooth = (t, f) => 2 * (((t * f) % 1 + 1) % 1) - 1;
export function triangle(t, f) {
  const p = ((t * f) % 1 + 1) % 1;
  return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
}
export const step = (t, t0 = 0) => (t >= t0 ? 1 : 0);

/** A rectangular pulse of unit height, centred on zero. */
export const rect = (t, width) => (Math.abs(t) <= width / 2 ? 1 : 0);

export const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));

/** Seeded RNG, so every figure and every rendered sound is identical
    on every load. Randomness that changes between visits is a bug. */
export function rng(seed = 7) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** White noise in [-1, 1], deterministic for a given seed. */
export function noise(n, seed = 7) {
  const r = rng(seed);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = 2 * r() - 1;
  return out;
}

/**
 * Fourier series amplitude of the nth harmonic of a unit-amplitude
 * waveform. These are the exact analytic coefficients, not measured ones,
 * so the bar chart and the reconstruction agree to the last decimal.
 * Returns { amp, phase } for a sine-series representation.
 */
export function harmonic(shape, n) {
  if (n < 1) return { amp: 0, phase: 0 };
  switch (shape) {
    case 'square':   // 4/(n pi) for odd n
      return n % 2 ? { amp: 4 / (n * Math.PI), phase: 0 } : { amp: 0, phase: 0 };
    case 'triangle': // 8/(n^2 pi^2), alternating sign, odd n
      return n % 2
        ? { amp: 8 / (n * n * Math.PI * Math.PI), phase: ((n - 1) / 2) % 2 ? Math.PI : 0 }
        : { amp: 0, phase: 0 };
    case 'sawtooth': // 2/(n pi), every n, alternating
      return { amp: 2 / (n * Math.PI), phase: n % 2 ? 0 : Math.PI };
    case 'sine':
      return n === 1 ? { amp: 1, phase: 0 } : { amp: 0, phase: 0 };
    default:
      return { amp: 0, phase: 0 };
  }
}

/** Partial sum of a Fourier series: the first `terms` harmonics only. */
export function partialSum(shape, f0, t, terms) {
  let y = 0;
  for (let n = 1; n <= terms; n++) {
    const { amp, phase } = harmonic(shape, n);
    if (amp) y += amp * Math.sin(TAU * n * f0 * t + phase);
  }
  return y;
}

/* ============================================================
   sampling
   ============================================================ */

/** Where a tone at f actually lands after sampling at fs. */
export function aliasOf(f, fs) {
  const r = ((f % fs) + fs) % fs;
  return r > fs / 2 ? fs - r : r;
}

/**
 * Whittaker-Shannon reconstruction: put a sinc at every sample, scaled by
 * that sample's height, and add them up. This is the exact inverse of
 * sampling for a band-limited signal — not an approximation.
 */
export function sincInterp(samples, ts, t) {
  let y = 0;
  for (let i = 0; i < samples.length; i++) y += samples[i] * sinc((t - i * ts) / ts);
  return y;
}

/* ============================================================
   standard systems — the recurring cast
   ============================================================ */

/** The room: a one-pole lowpass with corner at wc rad/s. tau = 1/wc. */
export const rc = (wc) => normalizeDC(zpk([], [-wc], 1));

/** A resonant second-order system: wn rad/s, damping ratio zeta. */
export const resonant = (wn, zeta) => {
  const re = -zeta * wn;
  const im = wn * Math.sqrt(Math.max(0, 1 - zeta * zeta));
  const poles = im > 1e-9 ? [C(re, im), C(re, -im)] : [re + im, re - im];
  return normalizeDC(zpk([], poles, 1));
};

/** n-pole Butterworth lowpass, corner wc. */
export function butterworth(n, wc) {
  const poles = [];
  for (let k = 1; k <= n; k++) {
    const ang = (Math.PI * (2 * k + n - 1)) / (2 * n);
    poles.push(C(wc * Math.cos(ang), wc * Math.sin(ang)));
  }
  return normalizeDC(zpk([], poles, 1));
}

/** Highpass: the same poles, with zeros stacked at the origin. */
export function highpass(n, wc) {
  const lp = butterworth(n, wc);
  const zeros = new Array(n).fill(0);
  const sys = zpk(zeros, lp.poles, 1);
  // unity gain far above the corner
  return normalizeAt(sys, wc * 1000, 1);
}

/** Bandpass with centre w0 and quality factor Q. */
export function bandpass(w0, Q) {
  const zeta = 1 / (2 * Q);
  const re = -zeta * w0;
  const im = w0 * Math.sqrt(Math.max(0, 1 - zeta * zeta));
  return normalizeAt(zpk([0], [C(re, im), C(re, -im)], 1), w0, 1);
}

/** Notch: zeros exactly on the imaginary axis at w0, poles just behind. */
export function notch(w0, Q) {
  const zeta = 1 / (2 * Q);
  const re = -zeta * w0;
  const im = w0 * Math.sqrt(Math.max(0, 1 - zeta * zeta));
  return normalizeDC(zpk([C(0, w0), C(0, -w0)], [C(re, im), C(re, -im)], 1));
}

/**
 * Three lags in series — an engine that takes its time, a car that takes
 * longer, and a speedometer that lags them both. Part 7 wraps feedback
 * around this and Part 10 puts it in a car.
 */
export const threeLag = (k = 1) => normalizeDC(zpk([], [-1 / 10, -1, -1 / 0.5], 1), k);

/** Close a unity-feedback loop around `plant` with forward gain K. */
export function closeLoop(plant, K) {
  // T(s) = K P / (1 + K P) = K b / (a + K b)
  const b = plant.b.map((c) => c * K);
  const a = plant.a.slice();
  const len = Math.max(a.length, b.length);
  const den = new Array(len).fill(0);
  for (let i = 0; i < len; i++) den[i] = (a[i] || 0) + (b[i] || 0);
  const lead = den[den.length - 1] || 1;
  const bb = new Array(len).fill(0);
  for (let i = 0; i < len; i++) bb[i] = (b[i] || 0) / lead;
  return { zeros: [], poles: rootsOf(den), k: K, b: bb, a: den.map((c) => c / lead) };
}

/**
 * Roots of a real ascending polynomial, by Durand-Kerner. Used only where
 * the poles are a *result* (closing a feedback loop) rather than the
 * authoring format, so it never sits on a hot path.
 */
export function rootsOf(coeffs) {
  const c = coeffs.slice();
  while (c.length > 1 && Math.abs(c[c.length - 1]) < 1e-14) c.pop();
  const n = c.length - 1;
  if (n < 1) return [];
  const lead = c[c.length - 1];
  const m = c.map((v) => v / lead);
  let roots = [];
  for (let i = 0; i < n; i++) {
    const ang = (TAU * i) / n + 0.4;
    roots.push(C(0.4 * Math.cos(ang), 0.4 * Math.sin(ang) + 0.9));
  }
  const evalAt = (z) => polyval(m, z);
  for (let iter = 0; iter < 500; iter++) {
    let moved = 0;
    for (let i = 0; i < n; i++) {
      let den = C(1, 0);
      for (let j = 0; j < n; j++) if (j !== i) den = cmul(den, csub(roots[i], roots[j]));
      const dz = cdiv(evalAt(roots[i]), den);
      roots[i] = csub(roots[i], dz);
      moved = Math.max(moved, cabs(dz));
    }
    if (moved < 1e-12) break;
  }
  return roots.map((r) => (Math.abs(r.im) < 1e-9 ? r.re : r));
}

/* ============================================================
   small numeric helpers used by figures
   ============================================================ */

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const dB = (m) => 20 * Math.log10(Math.max(m, 1e-12));

/** Logarithmically spaced values — the x-axis of every Bode plot. */
export function logspace(lo, hi, n) {
  const out = new Float64Array(n);
  const a = Math.log10(lo), b = Math.log10(hi);
  for (let i = 0; i < n; i++) out[i] = Math.pow(10, a + ((b - a) * i) / (n - 1));
  return out;
}

export function linspace(lo, hi, n) {
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = lo + ((hi - lo) * i) / (n - 1);
  return out;
}

/** Sample a function of time into an array. */
export function sampleFn(fn, dt, n, t0 = 0) {
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(t0 + i * dt);
  return out;
}
