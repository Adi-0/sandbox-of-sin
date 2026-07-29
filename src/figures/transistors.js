/* ==========================================================================
   figures/transistors.js — Plates 53, 54 and 55.

   Plate 53 is the BJT output family with a load line across it, which is the
   same picture as Plate 49 with one extra dimension — the base current picks
   which curve you are on.

   Plate 54 is the FET transfer characteristic, where both device families
   obey the same square law with different names for its constants.

   Plate 55 is the region check itself: assume active, solve, and see whether
   the collector voltage the assumption predicts is physically possible.

   The cast: a 10 V rail, 1 kΩ collector resistor, beta of 100. Saturation
   begins at 3.93 V of input, which the knob can reach.
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;
const NS = "http://www.w3.org/2000/svg";

const BJT = { Vcc: 10, Rc: 1000, Rb: 33000, beta: 100, Vbe: 0.7, Vsat: 0.2, Va: 100 };

/** Output characteristic, smoothed through the knee so the curve is drawable. */
const icOf = (ib, vce) =>
  BJT.beta * ib * (1 - Math.exp(-vce / 0.055)) * (1 + vce / BJT.Va);

/* ==========================================================================
   Plate 53 — the output family and the load line
   One knob: base current. Lesson: the base current selects a curve, the load
   line selects a point on it, and where they meet decides the region.
   ========================================================================== */

function bjtCurves() {
  const { Vcc, Rc } = BJT;
  const IcMax = (Vcc / Rc) * 1000 * 1.18;      // mA, with headroom above the load line

  const p = new Plot({
    w: 620, h: 350, xr: [-0.15, 11], yr: [-0.6, IcMax],
    pad: { l: 58, r: 74, t: 18, b: 42 },
    label:
      "Collector current against collector-emitter voltage for a family of base " +
      "currents. Each curve rises steeply near the origin and then flattens; a " +
      "straight load line crosses them all, and the operating point sits where " +
      "it meets the selected curve.",
  });
  p.grid({ xStep: 1, yStep: 1 });
  p.axes({
    xStep: 2, yStep: 2, xLabel: "VCE (volts)", yLabel: "mA",
    xFmt: (v) => (v === 0 ? "" : fixed(v, 0)),
    yFmt: (v) => (v === 0 ? "0" : fixed(v, 0)),
  });

  // the saturation boundary — left of it, the transistor cannot hold its curve
  p.line(BJT.Vsat, -0.6, BJT.Vsat, IcMax, { color: "muted", width: 1.2, dash: "3 4" });
  p.text(BJT.Vsat, IcMax * 0.90, "saturation", { color: "muted", size: 10.5, dx: 7, anchor: "start" });

  // the fixed family, drawn once
  const FAMILY = [20, 40, 60, 80, 100, 120];
  FAMILY.forEach((uA) => {
    const pts = [];
    for (let i = 0; i <= 300; i++) {
      const vce = (i / 300) * 11;
      pts.push(`${p.x(vce).toFixed(2)} ${p.y(icOf(uA * 1e-6, vce) * 1000).toFixed(2)}`);
    }
    p.add("curve", pathOf(pts, "muted", 1.2, 0.55));
    p.text(11, icOf(uA * 1e-6, 11) * 1000, `${uA} µA`,
      { color: "muted", size: 9.5, dx: 5, dy: 3, anchor: "start" });
  });

  // the load line never moves — it belongs to the circuit, not the device
  p.line(0, (Vcc / Rc) * 1000, Vcc, 0, { color: "q-x", width: 2.25 });
  p.text(8.6, ((Vcc - 8.6) / Rc) * 1000, "load line", { color: "q-x", size: 11, dy: -9 });

  const live = pathOf([], "q-r", 2.75);
  p.add("curve", live);
  const dot = p.dot(0, 0, { color: "q-y", r: 6 });
  const vGuide = p.line(0, 0, 0, 0, { color: "q-y", width: 1.2, dash: "4 3" });

  const rdIb = readout({ key: "base current", value: "", tone: "x" });
  const rdIc = readout({ key: "collector", value: "", tone: "y" });
  const rdVce = readout({ key: "VCE", value: "", tone: "r" });
  const rdRegion = readout({ key: "region", value: "" });
  const rdGain = readout({ key: "actual gain", value: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  function draw(uA) {
    const ib = uA * 1e-6;
    const pts = [];
    for (let i = 0; i <= 300; i++) {
      const vce = (i / 300) * 11;
      pts.push(`${p.x(vce).toFixed(2)} ${p.y(icOf(ib, vce) * 1000).toFixed(2)}`);
    }
    live.setAttribute("d", "M " + pts.join(" L "));

    /* Where the load line meets this curve. The device curve rises with V_CE
       and the load line falls, so their difference increases monotonically —
       above the crossing it is positive, below it negative. */
    let lo = 0, hi = Vcc;
    for (let k = 0; k < 60; k++) {
      const m = (lo + hi) / 2;
      if (icOf(ib, m) > (Vcc - m) / Rc) hi = m; else lo = m;
    }
    const vce = (lo + hi) / 2;
    const ic = (Vcc - vce) / Rc;
    const active = vce > BJT.Vsat * 1.5;
    const gain = ib > 0 ? ic / ib : 0;

    dot.querySelectorAll("circle").forEach((c) => {
      c.setAttribute("cx", p.x(vce)); c.setAttribute("cy", p.y(ic * 1000));
    });
    vGuide.setAttribute("x1", p.x(vce)); vGuide.setAttribute("y1", p.y(ic * 1000));
    vGuide.setAttribute("x2", p.x(vce)); vGuide.setAttribute("y2", p.y(0));

    rdIb.set(`${num(uA, 0)} µA`);
    rdIc.set(`${fixed(ic * 1000, 2)} mA`);
    rdVce.set(`${fixed(vce, 2)} V`);
    rdRegion.set(uA < 1 ? "cutoff" : active ? "active" : "saturated");
    rdGain.set(`${fixed(gain, 0)}`, active ? " ≈ β" : " — below β");
    rdNote.set(
      uA < 1
        ? "<b>Cutoff.</b> No base current, so no collector current, and the full supply appears across the transistor. This is the OFF state of a switch."
        : active
          ? `<b>Active.</b> The operating point sits on the flat part of the curve, so ${fixed(ic * 1000, 2)} mA is set by the base alone: ${fixed(gain, 0)} × ${num(uA, 0)} µA. <b>The collector voltage does not affect it</b>, which is exactly what makes the device an amplifier.`
          : `<b>Saturated.</b> The load line has run off the flat region onto the steep part. The collector current is now limited by the <em>resistor</em>, not by the base — the actual gain has fallen to ${fixed(gain, 0)}, well below β. Pushing more base current in changes almost nothing. This is the ON state of a switch.`
    );
  }

  const k = knob({
    label: "base current", min: 0, max: 130, step: 1, value: 40,
    format: (v) => `${num(v, 0)} µA`,
    onInput: draw,
  });
  draw(40);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdIb, rdIc, rdVce, rdRegion, rdGain, rdNote),
  };
}

/* ==========================================================================
   Plate 54 — the FET square law
   One control: which device. Lesson: JFETs and enhancement MOSFETs obey the
   same square law, and only the names and the useful range of V_GS differ.
   ========================================================================== */

const FETS = {
  jfet: {
    name: "n-channel JFET", xr: [-4.6, 0.6],
    Idss: 10, Vp: -4,
    id: (vgs) => (vgs <= -4 ? 0 : vgs >= 0 ? 10 : 10 * (1 - vgs / -4) ** 2),
    gm: (vgs) => (vgs <= -4 || vgs > 0 ? 0 : (2 * 10 / 4) * (1 - vgs / -4)),
    tex: "I_D = I_{DSS}\\left(1 - \\frac{V_{GS}}{V_P}\\right)^2",
    params: "IDSS = 10 mA,   VP = −4 V",
    note: "A JFET conducts <b>with no gate voltage at all</b> and is pinched off by making the gate negative. It is a <em>depletion</em> device, so V<sub>GS</sub> is normally between V<sub>P</sub> and zero.",
  },
  mosfet: {
    name: "n-channel enhancement MOSFET", xr: [-0.4, 6],
    Vt: 2, k: 0.5,
    id: (vgs) => (vgs <= 2 ? 0 : 0.5 * (vgs - 2) ** 2),
    gm: (vgs) => (vgs <= 2 ? 0 : 2 * 0.5 * (vgs - 2)),
    tex: "I_D = k\\left(V_{GS} - V_t\\right)^2",
    params: "k = 0.5 mA/V²,   Vt = 2 V",
    note: "An enhancement MOSFET is <b>off</b> until the gate exceeds the threshold, then conducts more the harder it is driven. That is why it makes such a clean switch, and why every logic gate is built from them.",
  },
};

function fetSquareLaw() {
  const p = new Plot({
    w: 600, h: 330, xr: [-4.6, 0.6], yr: [-1.2, 13],
    pad: { l: 58, r: 20, t: 18, b: 42 },
    label:
      "Drain current against gate-to-source voltage. The curve is a parabola " +
      "rising from the cut-off point, with a straight tangent at the operating " +
      "point whose slope is the transconductance.",
  });

  const rdDev = readout({ key: "device", value: "" });
  const rdVgs = readout({ key: "VGS", value: "", tone: "x" });
  const rdId = readout({ key: "drain current", value: "", tone: "y" });
  const rdGm = readout({ key: "transconductance", value: "", tone: "r" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  let cur = "jfet";

  function redraw(vgs) {
    p.clear("curve", "label", "mark", "shade", "grid");
    const F = FETS[cur];
    p.xr = F.xr;
    p.grid({ xStep: 0.5, yStep: 1 });
    p.axes({
      xStep: 1, yStep: 2, xLabel: "VGS (volts)", yLabel: "mA",
      xFmt: (v) => (v === 0 ? "" : fixed(v, 0)),
      yFmt: (v) => (v === 0 ? "0" : fixed(v, 0)),
    });

    const pts = [];
    for (let i = 0; i <= 400; i++) {
      const x = F.xr[0] + (i / 400) * (F.xr[1] - F.xr[0]);
      pts.push(`${p.x(x).toFixed(2)} ${p.y(F.id(x)).toFixed(2)}`);
    }
    p.add("curve", pathOf(pts, "q-r", 2.75));
    p.text(F.xr[0] + (F.xr[1] - F.xr[0]) * 0.06, 12.1, F.params,
      { color: "muted", size: 10.5, anchor: "start" });

    // the cut-off point, which is the whole difference between the two families
    const off = cur === "jfet" ? F.Vp : F.Vt;
    p.line(off, -1.2, off, 13, { color: "muted", width: 1.2, dash: "3 4" });
    p.text(off, -0.75, cur === "jfet" ? "VP" : "Vt",
      { color: "muted", size: 10.5, dx: cur === "jfet" ? 12 : -10, anchor: cur === "jfet" ? "start" : "end" });

    const id = F.id(vgs), gm = F.gm(vgs);
    // the tangent, whose slope IS the transconductance
    const span = (F.xr[1] - F.xr[0]) * 0.16;
    p.line(vgs - span, id - gm * span, vgs + span, id + gm * span,
      { color: "q-x", width: 2 });
    p.dot(vgs, id, { color: "q-y", r: 6 });
    p.line(vgs, id, vgs, 0, { color: "q-y", width: 1.2, dash: "4 3" });

    rdDev.set(F.name);
    rdVgs.set(`${fixed(vgs, 2)} V`);
    rdId.set(`${fixed(id, 2)} mA`);
    rdGm.set(`${fixed(gm, 2)} mS`, " = the tangent's slope");
    rdNote.set(
      id < 0.001
        ? `<b>Cut off.</b> ${cur === "jfet" ? "The gate is at or below the pinch-off voltage, so the channel is closed." : "The gate has not reached the threshold, so no channel has formed."} No drain current, and the transconductance is zero — a device with no slope cannot amplify.`
        : `${F.note} Transconductance is the <b>slope</b> of this curve, so it grows as the device is driven harder — <b>g<sub>m</sub> = 2√(k·I<sub>D</sub>)</b> for a MOSFET, <b>2√(I<sub>DSS</sub>·I<sub>D</sub>) / |V<sub>P</sub>|</b> for a JFET. Both are just the derivative of the square law.`
    );
  }

  const k = knob({
    label: "gate voltage", min: -4.5, max: 0.5, step: 0.05, value: -1.5,
    format: (v) => `${fixed(v, 2)} V`,
    onInput: (v) => redraw(v),
  });

  const sc = scenarios({
    label: "device",
    options: [
      { id: "jfet", label: "JFET" },
      { id: "mosfet", label: "MOSFET" },
    ],
    value: "jfet",
    onChange: (id) => {
      cur = id;
      const F = FETS[id];
      // the useful gate range differs completely between the two families
      k.input.min = F.xr[0] + 0.1;
      k.input.max = F.xr[1] - 0.1;
      k.set(id === "jfet" ? -1.5 : 4);
    },
  });
  redraw(-1.5);

  return {
    stage: p.root,
    controls: el("div.controls", null, sc.root, k.root),
    readouts: readouts(rdDev, rdVgs, rdId, rdGm, rdNote),
  };
}

/* ==========================================================================
   Plate 55 — the region check
   One knob: the input. Lesson: assume active, compute, and see whether the
   collector voltage that comes out is physically possible.
   ========================================================================== */

function regionCheck() {
  const { Vcc, Rc, Rb, beta, Vbe, Vsat } = BJT;

  const p = new Plot({
    w: 600, h: 250, xr: [0, 568], yr: [-84, 108],
    pad: { l: 16, r: 16, t: 14, b: 14 },
    label:
      "A single-transistor bias circuit with an input through a base resistor, " +
      "showing base and collector currents, the collector-emitter voltage, and " +
      "which region of operation the transistor is in.",
  });

  const rdVin = readout({ key: "input", value: "", tone: "x" });
  const rdIb = readout({ key: "base current", value: "", tone: "y" });
  const rdIcA = readout({ key: "βIB says", value: "" });
  const rdIc = readout({ key: "actual IC", value: "", tone: "y" });
  const rdVce = readout({ key: "VCE", value: "", tone: "r" });
  const rdRegion = readout({ key: "region", value: "" });
  const rdNote = readout({ key: "", value: "" });
  rdNote.root.classList.add("wide");

  const IcSat = (Vcc - Vsat) / Rc;

  function draw(vin) {
    p.clear("curve", "label", "mark", "shade");
    const ib = Math.max(0, (vin - Vbe) / Rb);
    const icActive = beta * ib;
    const sat = icActive > IcSat;
    const ic = sat ? IcSat : icActive;
    const vce = sat ? Vsat : Vcc - ic * Rc;
    const region = ib <= 0 ? "cutoff" : sat ? "saturated" : "active";
    const tone = region === "active" ? "q-r" : region === "saturated" ? "q-bad" : "muted";

    /* --- the circuit ----------------------------------------------------- */
    const XB = 250, XC = 330, YE = -54, YC = 12, YT = 66;
    p.line(XC, YT, XC, YC + 24, { color: "ink", width: 1.8 });      // Vcc rail down
    p.line(XC - 40, YT, XC + 40, YT, { color: "ink", width: 1.8 });
    p.text(XC, YT + 16, `+${Vcc} V`, { color: "q-x", size: 12, weight: 600 });
    boxAt(p, XC, YC + 4, 20, 38);                                    // Rc
    p.text(XC + 30, YC + 6, "RC = 1 kΩ", { color: "ink", size: 11, weight: 600, anchor: "start" });

    p.line(XC, YC - 15, XC, -6, { color: "ink", width: 1.8 });       // collector lead
    npn(p, XB, XC, -6, YE);
    p.line(XB - 60, -6, XB, -6, { color: "ink", width: 1.8 });       // base lead
    boxAt(p, XB - 96, -6, 46, 18);                                   // Rb
    p.text(XB - 96, -26, "RB = 33 kΩ", { color: "ink", size: 11, weight: 600 });
    p.line(XB - 119, -6, 90, -6, { color: "ink", width: 1.8 });
    p.add("curve", circleAt(p, 74, -6, 16));
    p.text(74, -30, `${fixed(vin, 2)} V`, { color: "q-x", size: 12, weight: 600 });

    p.line(XC, YE, XC, YE - 14, { color: "ink", width: 1.8 });       // emitter to ground
    ground(p, XC, YE - 14);

    // the live values
    p.text(XB - 60, 16, `${fixed(ib * 1e6, 1)} µA`, { color: "q-y", size: 11, weight: 600 });
    p.text(XC + 30, -18, `IC = ${fixed(ic * 1000, 2)} mA`, { color: "q-y", size: 11, weight: 600, anchor: "start" });
    p.text(XC + 30, -36, `VCE = ${fixed(vce, 2)} V`, { color: "q-r", size: 11.5, weight: 600, anchor: "start" });

    p.text(160, 92, `${region.toUpperCase()}`, { color: tone, size: 14, weight: 600 });

    rdVin.set(`${fixed(vin, 2)} V`);
    rdIb.set(`${fixed(ib * 1e6, 1)} µA`);
    rdIcA.set(`${fixed(icActive * 1000, 2)} mA`);
    rdIc.set(`${fixed(ic * 1000, 2)} mA`);
    rdVce.set(`${fixed(vce, 2)} V`);
    rdRegion.set(region);
    rdNote.set(
      ib <= 0
        ? `<b>Cutoff.</b> The input is below ${Vbe} V, so no base current flows at all and the transistor is an open switch. V<sub>CE</sub> sits at the full ${Vcc} V.`
        : sat
          ? `<b>Assume active:</b> βI<sub>B</sub> would be ${fixed(icActive * 1000, 2)} mA, which through 1 kΩ needs ${fixed(icActive * Rc, 1)} V — <b>more than the ${Vcc} V supply</b>. Impossible, so the assumption fails and the transistor is <b>saturated</b>: V<sub>CE</sub> collapses to about ${Vsat} V and I<sub>C</sub> is fixed at ${fixed(IcSat * 1000, 2)} mA by the resistor.`
          : `<b>Assume active:</b> I<sub>C</sub> = βI<sub>B</sub> = ${fixed(ic * 1000, 2)} mA, leaving V<sub>CE</sub> = ${Vcc} − ${fixed(ic * Rc, 2)} = ${fixed(vce, 2)} V. That is comfortably above ${Vsat} V, so the assumption <b>holds</b> and the transistor really is active.`
    );
  }

  const k = knob({
    label: "input voltage", min: 0, max: 5, step: 0.05, value: 2,
    format: (v) => `${fixed(v, 2)} V`,
    onInput: draw,
  });
  draw(2);

  return {
    stage: p.root,
    controls: el("div.controls", null, k.root),
    readouts: readouts(rdVin, rdIb, rdIcA, rdIc, rdVce, rdRegion, rdNote),
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
  return n;
}

function circleAt(p, ux, uy, r) {
  const c = document.createElementNS(NS, "circle");
  c.setAttribute("cx", p.x(ux)); c.setAttribute("cy", p.y(uy)); c.setAttribute("r", r);
  c.setAttribute("fill", V("plate"));
  c.setAttribute("stroke", V("ink")); c.setAttribute("stroke-width", 1.8);
  return c;
}

function boxAt(p, ux, uy, w, h) {
  const r = document.createElementNS(NS, "rect");
  r.setAttribute("x", p.x(ux) - w / 2); r.setAttribute("y", p.y(uy) - h / 2);
  r.setAttribute("width", w); r.setAttribute("height", h); r.setAttribute("rx", 2);
  r.setAttribute("fill", V("plate"));
  r.setAttribute("stroke", V("ink")); r.setAttribute("stroke-width", 1.8);
  p.add("curve", r);
}

function ground(p, ux, uy) {
  const x = p.x(ux), y = p.y(uy);
  const g = document.createElementNS(NS, "g");
  [[13, 0], [8, 5], [3, 10]].forEach(([w, dy]) => {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", x - w); l.setAttribute("y1", y + dy);
    l.setAttribute("x2", x + w); l.setAttribute("y2", y + dy);
    l.setAttribute("stroke", V("ink")); l.setAttribute("stroke-width", 1.6);
    g.appendChild(l);
  });
  p.add("curve", g);
}

/** An NPN symbol: base bar at xb, collector and emitter running to xc. */
function npn(p, xb, xc, yc, ye) {
  const bx = p.x(xb), cx = p.x(xc), cy = p.y(yc), ey = p.y(ye);
  const my = (cy + ey) / 2;
  const g = document.createElementNS(NS, "g");
  const line = (x1, y1, x2, y2, w = 1.8) => {
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", x1); l.setAttribute("y1", y1);
    l.setAttribute("x2", x2); l.setAttribute("y2", y2);
    l.setAttribute("stroke", V("ink")); l.setAttribute("stroke-width", w);
    g.appendChild(l);
  };
  line(bx, my - 24, bx, my + 24, 2.4);            // the base bar
  const jx = bx + 4, dy = 16;
  line(jx, my - dy, cx, my - dy - 14);            // collector lead, angled
  line(cx, my - dy - 14, cx, cy);
  line(jx, my + dy, cx, my + dy + 14);            // emitter lead, angled
  line(cx, my + dy + 14, cx, ey);
  // the arrow on the emitter, pointing away from the base — this is what
  // makes the symbol an NPN rather than a PNP
  const ux = (cx - jx), uy = (my + dy + 14) - (my + dy);
  const L = Math.hypot(ux, uy), ax = ux / L, ay = uy / L;
  const tipX = jx + ax * L * 0.66, tipY = (my + dy) + ay * L * 0.66;
  const a = document.createElementNS(NS, "path");
  a.setAttribute("d",
    `M ${tipX} ${tipY} L ${tipX - ax * 11 - ay * 4} ${tipY - ay * 11 + ax * 4} ` +
    `L ${tipX - ax * 11 + ay * 4} ${tipY - ay * 11 - ax * 4} Z`);
  a.setAttribute("fill", V("ink"));
  g.appendChild(a);
  p.add("curve", g);
}

/* -------------------------------------------------------------------------
   registration
   ------------------------------------------------------------------------- */

register("bjtCurves", { no: 53, build: () => {
  const f = bjtCurves();
  return plate({
    no: 53, title: "The output family and the load line", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "This is Plate 49's picture with one more dimension. The load line still " +
      "belongs to the circuit and never moves; what the base current does is " +
      "<b>choose which curve you land on</b>. Slide upward and the operating " +
      "point walks down the load line until it runs off the flat region — at " +
      "which point the collector current stops obeying β and is set by the " +
      "resistor instead. <b>That is saturation, and it is not a fault; it is how " +
      "a transistor switch turns on.</b>",
  });
} });

register("fetSquareLaw", { no: 54, build: () => {
  const f = fetSquareLaw();
  return plate({
    no: 54, title: "The FET square law", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Both FET families obey the <b>same parabola</b>; only the constants and " +
      "the useful gate range differ. A JFET conducts fully at zero gate voltage " +
      "and is pinched off by going negative; an enhancement MOSFET is off until " +
      "the threshold and turns on going positive. The straight line through the " +
      "operating point is the <b>transconductance</b> — literally the slope of " +
      "this curve, which is why it is not a constant and why it grows as the " +
      "device is driven harder.",
  });
} });

register("regionCheck", { no: 55, build: () => {
  const f = regionCheck();
  return plate({
    no: 55, title: "Which region?", tag: "interactive",
    label: f.stage.getAttribute("aria-label"),
    stage: f.stage, controls: f.controls, readouts: f.readouts,
    caption:
      "Part 1's method, one device later. <b>Assume active, compute βI<sub>B</sub>, " +
      "and check whether the collector voltage that implies is possible.</b> " +
      "Watch the two current readouts diverge as you slide past 3.93 V: βI<sub>B</sub> " +
      "keeps climbing and the actual collector current stops, because the resistor " +
      "and the supply will not permit any more. When βI<sub>B</sub> demands more " +
      "voltage than the rail can give, the assumption has failed and the answer " +
      "is saturation.",
  });
} });
