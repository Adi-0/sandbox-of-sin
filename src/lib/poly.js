/* ==========================================================================
   poly.js — real polynomials, and where their roots are.

   Coefficients are stored highest power first, the way a characteristic
   equation is written: [1, 6, 25] is s² + 6s + 25.

   Control Systems needs this three times over — the root locus is the roots
   of D + KN as K sweeps, Routh–Hurwitz is a statement about those roots, and
   a Bode plot is the same polynomial evaluated along the imaginary axis — so
   it lives here rather than in any one figure.
   ========================================================================== */

/* --- complex scratch ------------------------------------------------------ */

const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cabs = (a) => Math.hypot(a[0], a[1]);
function cdiv(a, b) {
  const d = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
}

/* --- arithmetic ----------------------------------------------------------- */

/** Pad to a common length and add. */
export function add(a, b) {
  const n = Math.max(a.length, b.length);
  const out = new Array(n).fill(0);
  for (let i = 0; i < a.length; i++) out[n - a.length + i] += a[i];
  for (let i = 0; i < b.length; i++) out[n - b.length + i] += b[i];
  return out;
}

export function scale(a, k) { return a.map((c) => c * k); }

export function mul(a, b) {
  const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
  }
  return out;
}

/** Build the monic polynomial with the given real roots. */
export function fromRoots(rs) {
  return rs.reduce((p, r) => mul(p, [1, -r]), [1]);
}

/** Horner, on the real line. */
export function evalReal(a, x) { return a.reduce((acc, c) => acc * x + c, 0); }

/** Horner, in the complex plane. `z` is [re, im]. */
export function evalComplex(a, z) {
  let r = [0, 0];
  for (const c of a) r = [r[0] * z[0] - r[1] * z[1] + c, r[0] * z[1] + r[1] * z[0]];
  return r;
}

/** s → jω, which is all a frequency response ever is. */
export function evalJw(a, w) { return evalComplex(a, [0, w]); }

/* --- roots ---------------------------------------------------------------- */

const REAL_EPS = 1e-9;

/**
 * Every root, as [re, im], sorted by real part.
 *
 * Degrees 1 and 2 are solved in closed form because they are most of the
 * calls and exactness there is free. Anything higher goes through
 * Durand–Kerner, which converges on well-separated roots in a few dozen
 * passes and is not troubled by complex ones.
 */
export function roots(coef) {
  let a = coef.slice();
  while (a.length && Math.abs(a[0]) < 1e-14) a.shift();
  if (a.length < 2) return [];
  a = a.map((c) => c / a[0]);

  /* Roots at the origin break the iteration's division. Peel them off. */
  const out = [];
  while (a.length > 1 && Math.abs(a[a.length - 1]) < 1e-12) { out.push([0, 0]); a.pop(); }

  const n = a.length - 1;
  if (n === 1) {
    out.push([-a[1], 0]);
  } else if (n === 2) {
    const b = a[1], c = a[2];
    const disc = b * b - 4 * c;
    if (disc >= 0) {
      const r = Math.sqrt(disc);
      out.push([(-b - r) / 2, 0], [(-b + r) / 2, 0]);
    } else {
      const r = Math.sqrt(-disc) / 2;
      out.push([-b / 2, -r], [-b / 2, r]);
    }
  } else if (n > 2) {
    const bound = 1 + Math.max(...a.slice(1).map(Math.abs));
    const z = [];
    let p = [1, 0];
    for (let i = 0; i < n; i++) {
      z.push([p[0] * bound, p[1] * bound]);
      p = cmul(p, [0.4, 0.9]);
    }
    for (let it = 0; it < 200; it++) {
      let move = 0;
      for (let i = 0; i < n; i++) {
        let den = [1, 0];
        for (let j = 0; j < n; j++) if (j !== i) den = cmul(den, csub(z[i], z[j]));
        if (cabs(den) < 1e-30) continue;
        const d = cdiv(evalComplex(a, z[i]), den);
        z[i] = csub(z[i], d);
        move = Math.max(move, cabs(d));
      }
      if (move < 1e-13) break;
    }
    out.push(...z);
  }

  /* Snap the numerical fuzz on roots that are really real, so downstream
     "is this pair complex?" tests are not deciding on 1e-16. */
  for (const r of out) if (Math.abs(r[1]) < REAL_EPS * (1 + Math.abs(r[0]))) r[1] = 0;
  return out.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
}

/** True when every root is strictly in the left half-plane. */
export function stable(coef) {
  return roots(coef).every((r) => r[0] < -1e-9);
}

/**
 * Dominant behaviour of a set of closed-loop poles: the complex pair nearest
 * the imaginary axis if there is one, otherwise the slowest real pole. This
 * is the approximation every performance formula silently assumes.
 */
export function dominant(rs) {
  const pair = rs.filter((r) => r[1] > REAL_EPS).sort((p, q) => q[0] - p[0])[0];
  if (pair) {
    const wn = Math.hypot(pair[0], pair[1]);
    return { complex: true, re: pair[0], im: pair[1], wn, zeta: -pair[0] / wn };
  }
  const slow = rs.slice().sort((p, q) => q[0] - p[0])[0];
  if (!slow) return null;
  return { complex: false, re: slow[0], im: 0, wn: Math.abs(slow[0]), zeta: 1 };
}

/** Percent overshoot of a second-order step response, from ζ alone. */
export function overshoot(zeta) {
  if (zeta >= 1 || zeta <= 0) return 0;
  return 100 * Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta));
}

/** The ζ that just meets an overshoot limit, in percent. */
export function zetaFor(osPercent) {
  const l = Math.log(osPercent / 100);
  return -l / Math.sqrt(Math.PI * Math.PI + l * l);
}
