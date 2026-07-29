/* ==========================================================================
   figures/numbers.js — Plates 63 and 64.

   Plate 63 shows one quantity in four notations at once, with the bit weights
   under it, so "convert to hex" stops being a procedure and becomes reading.

   Plate 64 is the wheel: eight bits are 256 patterns arranged in a circle,
   and signed and unsigned are two ways of cutting it. Overflow is then not a
   rule to remember but a place on the drawing.

   The cast: 53, which is 0x35 — hex digits 3 and 5 — with exactly 4 bits set.
   The compilation's angle, arriving as a number.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;
const NS = "http://www.w3.org/2000/svg";

const bin8 = (v) => v.toString(2).padStart(8, "0");
const hex2 = (v) => v.toString(16).toUpperCase().padStart(2, "0");
// not zero-padded — "0o065" reads as a four-digit number, which it is not
const oct3 = (v) => v.toString(8);
const popcount = (v) => bin8(v).split("").filter((c) => c === "1").length;

/* ==========================================================================
   Plate 63 — one number, four notations
   One knob: the value. Lesson: the bases are not conversions of each other,
   they are groupings of the same bits — 3 bits to an octal digit, 4 to a hex.
   ========================================================================== */

function baseView() {
  // pixels as data units, +y up
  const p = new Plot({
    w: 620, h: 300, xr: [0, 588], yr: [-104, 96],
    pad: { l: 16, r: 16, t: 14, b: 14 },
    label:
      "One eight-bit value shown as binary, with each bit's place value beneath " +
      "it, and the same quantity written in decimal, octal and hexadecimal.",
  });

  const rdDec = readout({ key: "decimal", value: "", tone: "x" });
  const rdBin = readout({ key: "binary", value: "", tone: "y" });
  const rdHex = readout({ key: "hex", value: "", tone: "r" });
  const rdOct = readout({ key: "octal", value: "" });
  const rdBits = readout({ key: "bits set", value: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  const W = 58;                                // one bit cell
  const x0 = (588 - 8 * W) / 2;

  function draw(v) {
    p.clear("curve", "label", "mark", "shade");
    const b = bin8(v);

    // the eight bits, grouped into nibbles by a wider gap in the rule beneath
    for (let i = 0; i < 8; i++) {
      const x = x0 + i * W + W / 2;
      const on = b[i] === "1";
      cell(p, x, 34, W - 8, 42, on);
      p.text(x, 34, b[i], { color: on ? "q-y" : "muted", size: 19, weight: 600, dy: 7 });
      p.text(x, 2, `${2 ** (7 - i)}`, { color: "muted", size: 10.5 });
      if (on) p.text(x, -16, `${2 ** (7 - i)}`, { color: "q-x", size: 11, weight: 600 });
    }
    p.text(x0 - 10, 2, "place", { color: "muted", size: 10, anchor: "end" });
    p.text(x0 - 10, -16, "counts", { color: "q-x", size: 10, anchor: "end" });

    // nibble brackets — the whole reason hex exists
    [0, 1].forEach((n) => {
      const a = x0 + n * 4 * W + 4, z = x0 + (n + 1) * 4 * W - 4;
      p.line(a, 66, z, 66, { color: "q-r", width: 1.6 });
      p.line(a, 66, a, 60, { color: "q-r", width: 1.6 });
      p.line(z, 66, z, 60, { color: "q-r", width: 1.6 });
      const nib = n === 0 ? v >> 4 : v & 15;
      p.text((a + z) / 2, 76, `${nib.toString(16).toUpperCase()}`,
        { color: "q-r", size: 15, weight: 600 });
    });
    p.text(x0 - 10, 76, "hex", { color: "q-r", size: 10, anchor: "end" });

    const sum = b.split("").map((c, i) => (c === "1" ? 2 ** (7 - i) : 0)).filter(Boolean);
    p.text(294, -44, sum.length ? `${sum.join(" + ")} = ${v}` : "0",
      { color: "q-x", size: 13, weight: 600 });
    p.text(294, -72, `${v}₁₀   =   0x${hex2(v)}   =   0o${oct3(v)}`,
      { color: "ink", size: 13.5, weight: 600 });

    rdDec.set(`${v}`);
    rdBin.set(bin8(v));
    rdHex.set(`0x${hex2(v)}`);
    rdOct.set(`0o${oct3(v)}`);
    rdBits.set(`${popcount(v)}`);
    rdNote.set(
      v === 53
        ? "<b>53 is 0x35.</b> Its two hex digits are <b>3</b> and <b>5</b>, and it has exactly <b>4</b> bits set — the compilation's triangle, arriving as a number. It is a coincidence, and it is also why this module uses 53 for everything."
        : `Each hex digit is exactly one <b>nibble</b> of four bits, which is the entire reason hexadecimal exists: it is binary you can read aloud. Octal groups by three instead, which is why it needs ${oct3(v).length} digits where hex needs 2.`
    );
  }

  const k = knob({
    label: "value", min: 0, max: 255, step: 1, value: 53,
    format: (v) => `${v}`,
    onInput: draw,
  });
  draw(53);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdDec, rdBin, rdHex, rdOct, rdBits, rdNote),
  };
}

/* ==========================================================================
   Plate 64 — the wheel
   One knob: the bit pattern. One control: how to read it. Lesson: the bits
   never change; only the interpretation does, and overflow is the seam.
   ========================================================================== */

function twosComplement() {
  const R = 118;

  const p = new Plot({
    /* Equal scales, and wide enough that the labels outside the ring are not
       clipped — the first pass lost the "0" marker off the top. */
    w: 560, h: 400, xr: [-244, 244], yr: [-172, 172],
    pad: { l: 10, r: 10, t: 10, b: 10 },
    label:
      "Two hundred and fifty-six bit patterns arranged in a circle, with a " +
      "marker on the selected one. Unsigned values run from zero all the way " +
      "round; signed values put the negative half on the left of the seam.",
  });

  const rdBits = readout({ key: "the bits", value: "", tone: "y" });
  const rdU = readout({ key: "as unsigned", value: "", tone: "x" });
  const rdS = readout({ key: "as signed", value: "", tone: "r" });
  const rdNeg = readout({ key: "its negation", value: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  const signed = (v) => (v > 127 ? v - 256 : v);
  const ang = (v) => Math.PI / 2 - (v / 256) * 2 * Math.PI;   // 0 at the top

  function draw(v) {
    p.clear("curve", "label", "mark", "shade");

    // the ring first, then the negative half painted on top of it
    ring(p, 0, 0, R);
    const arc = [];
    for (let i = 128; i <= 256; i++) {
      const a = ang(i);
      arc.push(`${p.x(Math.cos(a) * R).toFixed(1)} ${p.y(Math.sin(a) * R).toFixed(1)}`);
    }
    p.add("curve", pathOf(arc, "q-bad", 5, 0.55));
    // set on the lower-left diagonal, clear of the 192 quarter mark due west
    p.text(-152, -50, "negative", { color: "q-bad", size: 11, weight: 600, anchor: "end" });
    p.text(-152, -66, "as signed", { color: "muted", size: 10, anchor: "end" });

    // zero at the top, the seam at the bottom
    p.line(0, R - 14, 0, R + 14, { color: "q-r", width: 2 });
    p.text(0, R + 28, "0", { color: "q-r", size: 12, weight: 600 });
    p.line(0, -R + 14, 0, -R - 14, { color: "q-bad", width: 2 });
    p.text(0, -R - 28, "the seam · 127 → −128", { color: "q-bad", size: 11.5, weight: 600 });

    /* Quarter marks. 128 is omitted because the seam label already occupies
       the bottom of the wheel, and the signed value is only printed when it
       differs from the unsigned one. */
    [64, 192].forEach((m) => {
      const a = ang(m);
      p.line(Math.cos(a) * (R - 10), Math.sin(a) * (R - 10),
        Math.cos(a) * (R + 10), Math.sin(a) * (R + 10),
        { color: "muted", width: 1.2 });
      const lx = Math.cos(a) * (R + 34), ly = Math.sin(a) * (R + 34);
      const same = signed(m) === m;
      p.text(lx, ly + (same ? 0 : 7), `${m}`, { color: "muted", size: 10.5, dy: 4 });
      if (!same) p.text(lx, ly - 9, `${signed(m)}`, { color: "q-bad", size: 10, dy: 4 });
    });

    const a = ang(v);
    const px = Math.cos(a) * R, py = Math.sin(a) * R;
    p.line(0, 0, px, py, { color: "q-y", width: 1.6, dash: "4 3" });
    p.dot(px, py, { color: "q-y", r: 7 });

    p.text(0, 24, bin8(v), { color: "q-y", size: 17, weight: 600 });
    p.text(0, 2, `0x${hex2(v)}`, { color: "muted", size: 12 });
    p.text(0, -30, `unsigned ${v}`, { color: "q-x", size: 13, weight: 600 });
    p.text(0, -52, `signed ${signed(v)}`, { color: "q-r", size: 13, weight: 600 });

    const neg = (256 - v) & 255;
    rdBits.set(bin8(v));
    rdU.set(`${v}`);
    rdS.set(`${signed(v)}`);
    rdNeg.set(`${bin8(neg)}`, ` = ${signed(neg)}`);
    rdNote.set(
      v === 0
        ? "<b>Zero is its own negation</b>, and in two's complement there is only one of it — which is the whole advantage over sign-magnitude, where +0 and −0 are different patterns."
        : v === 128
          ? "<b>−128 has no positive counterpart.</b> Negating it gives back 10000000, because +128 will not fit in eight bits. The range is asymmetric by exactly one, and this is the pattern that breaks naive negation code."
          : `Negate by <b>inverting every bit and adding one</b>: ${bin8(v)} → ${bin8(~v & 255)} → ${bin8(neg)}. The point of the scheme is that <b>addition needs no special case</b> — ${v} + ${neg} wraps around the seam back to zero, so subtraction is just addition of the negation, and one adder does both.`
    );
  }

  const k = knob({
    label: "bit pattern", min: 0, max: 255, step: 1, value: 53,
    format: (v) => `${bin8(v)}`,
    onInput: draw,
  });
  draw(53);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdBits, rdU, rdS, rdNeg, rdNote),
  };
}

/* -------------------------------------------------------------------------
   helpers
   ------------------------------------------------------------------------- */

function pathOf(pts, color, width, opacity = 1) {
  const n = document.createElementNS(NS, "path");
  n.setAttribute("d", pts.length ? "M " + pts.join(" L ") : "");
  n.setAttribute("fill", "none");
  n.setAttribute("stroke", V(color));
  n.setAttribute("stroke-width", width);
  n.setAttribute("opacity", opacity);
  n.setAttribute("stroke-linecap", "round");
  return n;
}

function cell(p, ux, uy, w, h, on) {
  const r = document.createElementNS(NS, "rect");
  r.setAttribute("x", p.x(ux) - w / 2); r.setAttribute("y", p.y(uy) - h / 2);
  r.setAttribute("width", w); r.setAttribute("height", h); r.setAttribute("rx", 2);
  r.setAttribute("fill", on ? V("q-y-soft") : V("plate"));
  r.setAttribute("stroke", V(on ? "q-y" : "grid"));
  r.setAttribute("stroke-width", on ? 1.8 : 1.2);
  p.add("curve", r);
}

function ring(p, ux, uy, r) {
  const c = document.createElementNS(NS, "circle");
  c.setAttribute("cx", p.x(ux)); c.setAttribute("cy", p.y(uy));
  c.setAttribute("r", r * (p.x(1) - p.x(0)));
  c.setAttribute("fill", "none");
  c.setAttribute("stroke", V("grid")); c.setAttribute("stroke-width", 5);
  p.add("curve", c);
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("baseView", { no: 63, build: () => {
  const f = baseView();
  return plate({
    no: 63, title: "One number, four notations", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Nothing is being <em>converted</em> here. The bits are the number, and " +
      "the other notations are just ways of grouping them — <b>four bits to a " +
      "hex digit, three to an octal one</b>, which is why the brackets fall " +
      "where they do. Decimal is the odd one out: ten is not a power of two, so " +
      "it is the only column that needs actual arithmetic. <b>Leave the default " +
      "at 53</b> and read the hex: 0x35, digits 3 and 5, four bits set.",
  });
} });

register("twosComplement", { no: 64, build: () => {
  const f = twosComplement();
  return plate({
    no: 64, title: "The wheel", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Eight bits are 256 patterns and nothing else. <b>Signed and unsigned are " +
      "not two formats — they are two ways of reading the same wheel</b>, " +
      "differing only in where you decide the numbers go negative. Two's " +
      "complement puts that seam between 127 and −128, and the payoff is at the " +
      "top of the circle: adding wraps through zero, so <b>subtraction is " +
      "addition of the negation and one adder does both</b>. Slide to 10000000 " +
      "to find the one pattern that has no positive counterpart.",
  });
} });
