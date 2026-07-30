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

export const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const cabs = (a) => Math.hypot(a[0], a[1]);
export const carg = (a) => Math.atan2(a[1], a[0]);
export function cdiv(a, b) {
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

/** d/ds, still highest power first. */
export function deriv(a) {
  const n = a.length - 1;
  return n < 1 ? [0] : a.slice(0, n).map((c, i) => c * (n - i));
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

/* --- time response -------------------------------------------------------- */

/**
 * The response of num(s)/den(s) to an arbitrary input u(t), by integrating the
 * controllable canonical realisation with RK4. Returns [[t, y], …].
 *
 * Partial fractions would be exact and faster, but it cannot cope with a ramp
 * driving a system that already has a pole at the origin — which is precisely
 * the case steady-state error is about. Integration does not care.
 */
export function simulate(num, den, u, tMax, steps = 800) {
  const d0 = den[0];
  const d = den.map((c) => c / d0);
  const n = d.length - 1;
  if (n < 1) return [];
  const nn = new Array(n + 1).fill(0);
  for (let i = 0; i < num.length; i++) nn[n + 1 - num.length + i] = num[i] / d0;

  /* x_i' = x_{i+1}; the last row carries the denominator. Coefficient on x_i
     is arr[n - i] in both the state equation and the output equation. */
  const f = (x, t) => {
    const dx = new Array(n);
    for (let i = 0; i < n - 1; i++) dx[i] = x[i + 1];
    let acc = u(t);
    for (let i = 0; i < n; i++) acc -= d[n - i] * x[i];
    dx[n - 1] = acc;
    return dx;
  };
  const yOf = (x, t) => {
    let y = nn[0] * u(t);
    for (let i = 0; i < n; i++) y += (nn[n - i] - nn[0] * d[n - i]) * x[i];
    return y;
  };

  let x = new Array(n).fill(0);
  const h = tMax / steps;
  const out = [[0, yOf(x, 0)]];
  const axpy = (a, k, b) => a.map((v, i) => v + k * b[i]);
  for (let s = 0; s < steps; s++) {
    const t = s * h;
    const k1 = f(x, t);
    const k2 = f(axpy(x, h / 2, k1), t + h / 2);
    const k3 = f(axpy(x, h / 2, k2), t + h / 2);
    const k4 = f(axpy(x, h, k3), t + h);
    x = x.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    out.push([t + h, yOf(x, t + h)]);
  }
  return out;
}

/* --- Routh–Hurwitz -------------------------------------------------------- */

const ROUTH_EPS = 1e-4;

/**
 * The Routh array of a characteristic polynomial.
 *
 * Rows run s^n down to s^0. Both textbook special cases are handled and
 * flagged, because both mean something physical: a zero in the first column
 * is a bookkeeping accident, but an entire row of zeros means roots placed
 * symmetrically about the origin — which for a stable-until-now system is
 * exactly a pair sitting on the imaginary axis.
 */
export function routh(coef) {
  const n = coef.length - 1;
  const width = Math.floor(n / 2) + 1;
  const pad = (a) => {
    const r = a.slice(0, width);
    while (r.length < width) r.push(0);
    return r;
  };
  const rows = [
    pad(coef.filter((_, i) => i % 2 === 0)),
    pad(coef.filter((_, i) => i % 2 === 1)),
  ];
  const flags = [];
  let aux = null;

  for (let k = 2; k <= n; k++) {
    const A = rows[k - 2];
    let B = rows[k - 1];
    if (B.every((v) => Math.abs(v) < 1e-10)) {
      const p = n - (k - 2);                       // power of the row above
      aux = { row: k - 2, power: p, coef: A.slice() };
      B = pad(A.map((v, i) => v * (p - 2 * i)));   // derivative of the auxiliary
      rows[k - 1] = B;
      flags[k - 1] = "auxiliary";
    } else if (Math.abs(B[0]) < 1e-10) {
      B = B.slice();
      B[0] = ROUTH_EPS;
      rows[k - 1] = B;
      flags[k - 1] = "epsilon";
    }
    const C = [];
    for (let j = 0; j < width; j++) {
      C.push((B[0] * (A[j + 1] ?? 0) - A[0] * (B[j + 1] ?? 0)) / B[0]);
    }
    rows.push(pad(C));
  }

  const first = rows.map((r) => r[0]);
  let changes = 0;
  for (let i = 1; i < first.length; i++) {
    if (first[i] !== 0 && first[i - 1] !== 0 && Math.sign(first[i]) !== Math.sign(first[i - 1])) changes++;
  }
  return { rows, flags, width, first, changes, aux, labels: rows.map((_, i) => n - i) };
}

/**
 * The auxiliary polynomial's roots, as ± jω. This is how a Routh table hands
 * you the frequency a marginally stable loop will oscillate at.
 */
export function auxFrequency(aux) {
  if (!aux) return null;
  const c = [];
  for (let i = 0; i < aux.coef.length; i++) {
    const p = aux.power - 2 * i;
    if (p < 0) break;
    c.push(aux.coef[i]);
    if (p - 1 >= 0) c.push(0);
  }
  const r = roots(c).filter((z) => Math.abs(z[0]) < 1e-6 && z[1] > 1e-9);
  return r.length ? r[0][1] : null;
}
