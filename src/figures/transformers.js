/* ==========================================================================
   figures/transformers.js — Plates 44 and 45.

   Plate 44 is the ideal transformer with one knob on the turns ratio, so the
   reader can watch voltage and current trade against each other while their
   product does not move — and watch the load's impedance be multiplied by the
   square of the ratio as seen from the primary.

   Plate 45 is the four three-phase connections in one-line notation, where
   the extra root three of a delta-wye is the whole lesson.

   The cast: 4160:208, a turns ratio of 20, so a squared is 400 and the
   plant's 5 ohms per phase looks like 2000 ohms from the high side.
   ========================================================================== */

import { el, svg, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;
const RT3 = Math.sqrt(3);

const XF = { V1: 4160, Zload: 5 };

/* ==========================================================================
   Plate 44 — the ideal transformer
   One knob: the turns ratio. Lesson: volts times amps is the same on both
   sides, and the impedance the source sees is scaled by the ratio squared.
   ========================================================================== */

function idealTransformer() {
  const { V1, Zload } = XF;

  // pixels as data units, +y up — this is a schematic
  const p = new Plot({
    w: 600, h: 206, xr: [0, 568], yr: [-70.0541, 83.8919],
    pad: { l: 16, r: 16, t: 14, b: 14 },
    label:
      "An ideal transformer with a source on the primary side and a resistive " +
      "load on the secondary, showing the voltage and current on each side and " +
      "the impedance the source sees looking in.",
  });

  const rdA = readout({ key: "turns ratio", value: "" });
  const rdV2 = readout({ key: "secondary V", value: "", tone: "x" });
  const rdI2 = readout({ key: "secondary I", value: "", tone: "y" });
  const rdI1 = readout({ key: "primary I", value: "", tone: "y" });
  const rdZ = readout({ key: "Z at the source", value: "", tone: "r" });
  const rdS = readout({ key: "apparent power", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(a) {
    p.clear("curve", "label", "mark", "shade");
    const V2 = V1 / a;
    const I2 = V2 / Zload;
    const I1 = I2 / a;
    const Zin = a * a * Zload;
    const S = V1 * I1;

    /* --- the schematic --------------------------------------------------- */
    const CX = 284;                       // the core, centred
    // primary loop
    p.line(70, 40, CX - 26, 40, { color: "ink", width: 1.8 });
    p.line(70, -40, CX - 26, -40, { color: "ink", width: 1.8 });
    p.line(70, 40, 70, 18, { color: "ink", width: 1.8 });
    p.line(70, -40, 70, -18, { color: "ink", width: 1.8 });
    p.add("curve", circleAt(p, 70, 0, 18, "ink"));
    p.text(70, 0, "∼", { color: "ink", size: 18, dy: 6 });
    p.text(70, -56, `${num(V1, 0)} V`, { color: "q-x", size: 12.5, weight: 600 });
    p.text(70, -71, "primary", { color: "muted", size: 10.5 });

    // the core: two coils and the two bars between them
    coil(p, CX - 26, 1);
    coil(p, CX + 26, -1);
    p.line(CX - 6, 34, CX - 6, -34, { color: "ink", width: 1.6 });
    p.line(CX + 6, 34, CX + 6, -34, { color: "ink", width: 1.6 });
    p.text(CX, 56, `${fixed(a, 1)} : 1`, { color: "ink", size: 13, weight: 600 });
    p.text(CX, -71, "ideal", { color: "muted", size: 10.5 });

    // secondary loop
    p.line(CX + 26, 40, 500, 40, { color: "ink", width: 1.8 });
    p.line(CX + 26, -40, 500, -40, { color: "ink", width: 1.8 });
    p.line(500, 40, 500, 14, { color: "ink", width: 1.8 });
    p.line(500, -40, 500, -14, { color: "ink", width: 1.8 });
    boxAt(p, 500, 0, 26, 30, "ink");
    p.text(524, 0, `${Zload} Ω`, { color: "ink", size: 11.5, weight: 600, anchor: "start", dy: 4 });
    p.text(500, -71, "secondary", { color: "muted", size: 10.5 });

    // the live quantities
    p.text(180, 52, `I₁ = ${fixed(I1, 2)} A`, { color: "q-y", size: 11.5, weight: 600 });
    p.text(400, 52, `I₂ = ${fixed(I2, 2)} A`, { color: "q-y", size: 11.5, weight: 600 });
    p.text(430, -56, `${fixed(V2, 1)} V`, { color: "q-x", size: 12.5, weight: 600 });

    // what the source actually sees
    p.line(140, -40, 140, -68, { color: "q-r", width: 1.2, dash: "4 3" });
    p.line(140, 40, 140, 68, { color: "q-r", width: 1.2, dash: "4 3" });
    p.text(140, 78, `source sees ${num(Zin, 0)} Ω`, { color: "q-r", size: 11.5, weight: 600 });

    rdA.set(`${fixed(a, 1)} : 1`);
    rdV2.set(`${fixed(V2, 1)} V`);
    rdI2.set(`${fixed(I2, 2)} A`);
    rdI1.set(`${fixed(I1, 2)} A`);
    rdZ.set(`${num(Zin, 0)} Ω`, ` = ${fixed(a, 1)}² × ${Zload}`);
    rdS.set(`${num(S, 0)} VA`, " both sides");
    rdNote.set(
      `Voltage down <b>${fixed(a, 1)}×</b>, current up <b>${fixed(a, 1)}×</b>, and the product ` +
      `unchanged at ${num(S, 0)} VA — an ideal transformer stores nothing and burns nothing. ` +
      `But the impedance moves by <b>${fixed(a, 1)}² = ${num(a * a, 0)}</b>, which is the ` +
      `relationship that does the real work in Part 5 and in Electronics.`
    );
  }

  const k = knob({
    label: "turns ratio", min: 1, max: 30, step: 0.5, value: 20,
    format: (v) => `${fixed(v, 1)} : 1`,
    onInput: draw,
  });
  draw(20);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdA, rdV2, rdI2, rdI1, rdZ, rdS, rdNote),
  };
}

/* ==========================================================================
   Plate 45 — the four three-phase connections
   One control: the connection pair. Lesson: the per-transformer turns ratio
   is not the line-to-line ratio unless both sides match, and the discrepancy
   is exactly root three.
   ========================================================================== */

const CONN = {
  yy: { p: "Y", s: "Y", k: 1, name: "wye – wye",
        note: "Ratios line up, and both sides have a neutral. Rare in practice all the same: with no delta anywhere in the bank there is no path for third-harmonic magnetising current, and the voltages distort." },
  dd: { p: "Δ", s: "Δ", k: 1, name: "delta – delta",
        note: "Also a clean ratio. Its real advantage is that one transformer can be removed and the other two keep running at 58% of the bank's rating — the open-delta connection." },
  dy: { p: "Δ", s: "Y", k: RT3, name: "delta – wye",
        note: "<b>The workhorse.</b> Steps up by an extra √3 and hands you a neutral on the low side, which is what makes 208Y/120 and 480Y/277 possible. This is the standard distribution transformer." },
  yd: { p: "Y", s: "Δ", k: 1 / RT3, name: "wye – delta",
        note: "Steps down by an extra √3. Used at the transmission end, where the wye side wants a neutral for grounding and the delta side traps the third harmonic." },
};

function threePhaseXfmr() {
  const a = 20, VL1 = XF.V1;

  const p = new Plot({
    w: 560, h: 158, xr: [0, 528], yr: [-56.6977, 68.7674],
    pad: { l: 16, r: 16, t: 14, b: 14 },
    label:
      "A one-line diagram of a three-phase transformer bank, with the primary " +
      "and secondary winding connections drawn as wye or delta symbols and the " +
      "resulting line-to-line voltage on each side.",
  });

  const rdConn = readout({ key: "connection", value: "" });
  const rdA = readout({ key: "nameplate", value: `${a} : 1`, sub: " per transformer" });
  const rdRatio = readout({ key: "line-to-line", value: "", tone: "r" });
  const rdV2 = readout({ key: "secondary V", value: "", tone: "x" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(key) {
    p.clear("curve", "label", "mark", "shade");
    const c = CONN[key];
    const ratio = a / c.k;
    const V2 = VL1 / ratio;

    p.line(30, 0, 175, 0, { color: "ink", width: 1.8 });
    p.line(353, 0, 498, 0, { color: "ink", width: 1.8 });

    // the two winding-connection glyphs, drawn as the one-line symbols they are
    connGlyph(p, 205, 0, c.p);
    connGlyph(p, 323, 0, c.s);
    p.text(205, -58, `primary ${c.p}`, { color: "muted", size: 11 });
    p.text(323, -58, `secondary ${c.s}`, { color: "muted", size: 11 });

    p.text(84, 30, `${num(VL1, 0)} V`, { color: "q-x", size: 13.5, weight: 600 });
    p.text(84, 13, "line to line", { color: "muted", size: 10.5 });
    p.text(444, 30, `${fixed(V2, 1)} V`, { color: "q-x", size: 13.5, weight: 600 });
    p.text(444, 13, "line to line", { color: "muted", size: 10.5 });

    p.text(264, 62, `overall ${fixed(ratio, 2)} : 1`, { color: "q-r", size: 12.5, weight: 600 });
    p.text(264, 46,
      c.k === 1 ? "= the turns ratio" : `= ${a} ${c.k > 1 ? "÷" : "×"} √3`,
      { color: "muted", size: 10.5 });

    rdConn.set(c.name);
    rdRatio.set(`${fixed(ratio, 2)} : 1`, c.k === 1 ? " = turns ratio" : ` = ${a} ${c.k > 1 ? "÷" : "×"} √3`);
    rdV2.set(`${fixed(V2, 1)} V`, " line to line");
    rdNote.set(c.note);
  }

  const sc = scenarios({
    label: "connection",
    options: [
      { id: "dy", label: "Δ – Y" },
      { id: "yd", label: "Y – Δ" },
      { id: "yy", label: "Y – Y" },
      { id: "dd", label: "Δ – Δ" },
    ],
    value: "dy",
    onChange: draw,
  });
  draw("dy");

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root),
    readouts: readouts(rdConn, rdA, rdRatio, rdV2, rdNote),
  };
}

/* -------------------------------------------------------------------------
   drawing helpers
   ------------------------------------------------------------------------- */

/** One transformer winding: four bumps on a vertical run, facing `side`. */
function coil(p, ux, side) {
  const x = p.x(ux), y0 = p.y(34), y1 = p.y(-34);
  const n = 4, h = (y1 - y0) / n, r = 9 * side;
  let d = `M ${x} ${y0}`;
  for (let i = 0; i < n; i++) {
    d += ` a ${Math.abs(r)} ${Math.abs(h / 2)} 0 0 ${side > 0 ? 0 : 1} 0 ${h}`;
  }
  const el2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el2.setAttribute("d", d);
  el2.setAttribute("fill", "none");
  el2.setAttribute("stroke", V("ink"));
  el2.setAttribute("stroke-width", 1.8);
  p.add("curve", el2);
}

/** The wye or delta symbol used inside a transformer circle on a one-line. */
function connGlyph(p, ux, uy, kind) {
  const cx = p.x(ux), cy = p.y(uy), R = 34;
  p.add("curve", rawCircle(cx, cy, R));
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const mk = (d) => {
    const n = document.createElementNS("http://www.w3.org/2000/svg", "path");
    n.setAttribute("d", d); n.setAttribute("fill", "none");
    n.setAttribute("stroke", V("q-x")); n.setAttribute("stroke-width", 2);
    n.setAttribute("stroke-linejoin", "round");
    return n;
  };
  const r = 17;
  if (kind === "Y") {
    const arms = [90, 210, 330].map((d) => (d * Math.PI) / 180);
    arms.forEach((t) => g.appendChild(
      mk(`M ${cx} ${cy} L ${cx + r * Math.cos(t)} ${cy - r * Math.sin(t)}`)));
  } else {
    const v = [90, 210, 330].map((d) => (d * Math.PI) / 180)
      .map((t) => [cx + r * Math.cos(t), cy - r * Math.sin(t)]);
    g.appendChild(mk(`M ${v[0][0]} ${v[0][1]} L ${v[1][0]} ${v[1][1]} L ${v[2][0]} ${v[2][1]} Z`));
  }
  p.add("curve", g);
}

function rawCircle(cx, cy, r) {
  const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", r);
  c.setAttribute("fill", "var(--plate)");
  c.setAttribute("stroke", V("ink")); c.setAttribute("stroke-width", 1.8);
  return c;
}

function circleAt(p, ux, uy, r) {
  return rawCircle(p.x(ux), p.y(uy), r);
}

function boxAt(p, ux, uy, w, h) {
  const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  r.setAttribute("x", p.x(ux) - w / 2); r.setAttribute("y", p.y(uy) - h / 2);
  r.setAttribute("width", w); r.setAttribute("height", h); r.setAttribute("rx", 2);
  r.setAttribute("fill", "var(--plate)");
  r.setAttribute("stroke", V("ink")); r.setAttribute("stroke-width", 1.8);
  p.add("curve", r);
  return r;
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("idealTransformer", { no: 44, build: () => {
  const f = idealTransformer();
  return plate({
    no: 44, title: "The ideal transformer", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Two things move in opposite directions and one thing does not move at " +
      "all. Voltage scales by <b>a</b>, current by <b>1/a</b>, and their product " +
      "— the apparent power — is identical on both sides, because an ideal " +
      "transformer neither stores nor dissipates. <b>Impedance, being volts over " +
      "amps, therefore scales by a².</b> That squared term is what lets a " +
      "20 : 1 transformer make the plant's 5 Ω look like 2000 Ω, and it is the " +
      "same idea Electronics uses to match a loudspeaker to an amplifier.",
  });
} });

register("threePhaseXfmr", { no: 45, build: () => {
  const f = threePhaseXfmr();
  return plate({
    no: 45, title: "Three-phase connections", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "The turns ratio of each individual transformer is 20 : 1 in every one of " +
      "these. <b>The line-to-line ratio is not.</b> When both sides are connected " +
      "the same way the √3 appears twice and cancels; when they differ it appears " +
      "once and survives, so a delta–wye bank steps up by an extra √3 and a " +
      "wye–delta steps down by one. Reading the nameplate ratio as the line ratio " +
      "is a standard exam trap and a standard field error.",
  });
} });
