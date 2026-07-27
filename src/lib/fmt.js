/* ==========================================================================
   fmt.js — number presentation.

   One rule, enforced here so no figure has to think about it: a reader must
   never see a floating-point tail. 0.30000000000000004 is a bug in the
   document, not a rounding preference.
   ========================================================================== */

/** Round to `d` decimals and drop trailing zeros. `num(0.1+0.2)` -> "0.3" */
export function num(v, d = 3) {
  if (!Number.isFinite(v)) return v > 0 ? "∞" : v < 0 ? "−∞" : "—";
  let s = v.toFixed(d);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  if (s === "-0") s = "0";
  return s.replace("-", "−");           // real minus sign, not a hyphen
}

/** Fixed decimals, zeros kept — for readouts that must not jitter in width. */
export function fixed(v, d = 2) {
  if (!Number.isFinite(v)) return "—";
  const s = v.toFixed(d);
  return (s === (0).toFixed(d) ? s : s).replace("-", "−");
}

/** Always shows a sign. Used wherever sign carries meaning. */
export function signed(v, d = 2) {
  if (!Number.isFinite(v)) return "—";
  const r = Number(v.toFixed(d));
  return (r >= 0 ? "+" : "−") + Math.abs(r).toFixed(d);
}

/** Significant figures — how "most nearly" answers are actually quoted. */
export function sig(v, n = 3) {
  if (!Number.isFinite(v) || v === 0) return v === 0 ? "0" : "—";
  const mag = Math.floor(Math.log10(Math.abs(v)));
  const d = Math.max(0, n - 1 - mag);
  if (Math.abs(mag) >= 5) return sci(v, n);
  return num(v, d);
}

/** Scientific notation with a real multiplication sign and a superscript. */
export function sci(v, n = 3) {
  if (v === 0) return "0";
  if (!Number.isFinite(v)) return "—";
  const e = Math.floor(Math.log10(Math.abs(v)));
  const m = v / Math.pow(10, e);
  return `${num(m, n - 1)} × 10${sup(e)}`;
}

const SUPS = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
export function sup(n) {
  return String(n).split("").map((c) => SUPS[c] ?? c).join("");
}

/** Degrees, with the degree sign attached. */
export function deg(rad, d = 2) { return `${num(rad * 180 / Math.PI, d)}°`; }
export function degv(v, d = 2) { return `${num(v, d)}°`; }

/** Radians as a multiple of π where that is the honest way to say it. */
export function rad(v, d = 3) {
  const k = v / Math.PI;
  const r = Math.round(k * 12) / 12;
  if (Math.abs(k - r) < 1e-9 && r !== 0) {
    const f = frac(r);
    if (f) return f === "1" ? "π" : f === "−1" ? "−π" : `${f}π`;
  }
  return num(v, d);
}

/** Small rationals as a/b, for angles and slopes. Returns null if unclean. */
export function frac(v, maxDen = 24) {
  if (!Number.isFinite(v)) return null;
  const s = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (Number.isInteger(a)) return s + a;
  for (let den = 2; den <= maxDen; den++) {
    const n = a * den;
    if (Math.abs(n - Math.round(n)) < 1e-9) return `${s}${Math.round(n)}/${den}`;
  }
  return null;
}

/** A value with its unit, non-breaking space between. Units are never optional. */
export function unit(v, u, d = 2) { return `${num(v, d)} ${u}`; }

/** m:ss for the exam clock. */
export function clock(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Complex number as a + bj, in the electrical convention (j, not i). */
export function cplx(re, im, d = 3) {
  const r = Number(re.toFixed(d)) || 0;
  const i = Number(im.toFixed(d)) || 0;
  if (i === 0) return num(r, d);
  if (r === 0) return `${i === 1 ? "" : i === -1 ? "−" : num(i, d)}j`;
  const mag = Math.abs(i) === 1 ? "" : num(Math.abs(i), d);
  return `${num(r, d)} ${i > 0 ? "+" : "−"} ${mag}j`;
}

/** Polar form, the way an electrical engineer writes it. */
export function polar(mag, angRad, d = 2) {
  return `${num(mag, d)}∠${num(angRad * 180 / Math.PI, d)}°`;
}

/** Ordinal — "3rd" — for step and part references. */
export function ord(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Plain hyphen-minus back to a typographic minus, for text built elsewhere. */
export function minus(s) { return String(s).replace(/-/g, "−"); }
