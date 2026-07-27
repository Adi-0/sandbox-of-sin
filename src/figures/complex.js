/* ==========================================================================
   figures/complex.js — Plates 6 to 8.

   The colour vocabulary continues unchanged from Part 1:
     q-x  the real part (horizontal)
     q-y  the imaginary part (vertical)
     q-r  the magnitude (the arrow itself)
   ========================================================================== */

import { svg, el, knob, scenarios, readout, readouts, draggable } from "../lib/dom.js";
import { register, plate, loop } from "../lib/figure.js";
import { Plot } from "../lib/plot.js";
import { num, fixed, degv, cplx } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;
const DEG = 180 / Math.PI;

/* ==========================================================================
   Plate 6 — the complex plane, draggable
   One input: the point. Lesson: rectangular and polar are one object.
   ========================================================================== */

function complexPlane() {
  const p = new Plot({
    w: 470, h: 430, xr: [-6.5, 6.5], yr: [-6.5, 6.5],
    pad: { l: 34, r: 24, t: 20, b: 32 },
    label: "The complex plane with a draggable point, starting at 3 plus 4j. The " +
           "horizontal leg is the real part, the vertical leg the imaginary part, " +
           "and the arrow from the origin is the magnitude.",
  });
  p.equalize();
  p.grid({ xStep: 1, yStep: 1 });
  p.axes({
    xStep: 2, yStep: 2, xLabel: "Re", yLabel: "Im",
    xFmt: (v) => (v === 0 ? "" : num(v, 0)),
    yFmt: (v) => (v === 0 ? "" : `${num(v, 0)}j`),
  });
  // circles of constant magnitude, so "same length, different angle" is visible
  for (const r of [2, 4, 5]) {
    p.param((t) => [r * Math.cos(t), r * Math.sin(t)], [0, 2 * Math.PI],
      { color: r === 5 ? "q-r" : "rule", width: r === 5 ? 1.25 : 1,
        dash: r === 5 ? "5 4" : "2 5", layer: "grid", opacity: r === 5 ? 0.55 : 1 });
  }

  const reLeg = p.line(0, 0, 3, 0, { color: "q-x", width: 3.5 });
  const imLeg = p.line(3, 0, 3, 4, { color: "q-y", width: 3.5 });
  const arrow = p.vector(0, 0, 3, 4, { color: "q-r", width: 2.5 });
  const arc = p.angleArc(0, 0, 0, Math.atan2(4, 3), 34, { color: "muted", fill: "q-r-soft", label: null });
  const pt = p.dot(3, 4, { color: "q-r", r: 6 });
  const tag = p.text(3, 4, "3 + 4j", { color: "ink", size: 13, dx: 12, dy: -12, anchor: "start", bg: true });
  p.hitArea();

  const rdRect = readout({ key: "rectangular", value: "3 + 4j" });
  const rdRe = readout({ key: "Re(z) = a", value: "3.00", tone: "x" });
  const rdIm = readout({ key: "Im(z) = b", value: "4.00", tone: "y" });
  const rdMag = readout({ key: "|z| = r", value: "5.00", tone: "r" });
  const rdAng = readout({ key: "∠z = θ", value: "53.13°" });

  function draw(a, b) {
    reLeg.setAttribute("x2", p.x(a));
    imLeg.setAttribute("x1", p.x(a)); imLeg.setAttribute("x2", p.x(a));
    imLeg.setAttribute("y1", p.y(0)); imLeg.setAttribute("y2", p.y(b));
    arrow.setAttribute("x2", p.x(a)); arrow.setAttribute("y2", p.y(b));
    for (const c of pt.childNodes) { c.setAttribute("cx", p.x(a)); c.setAttribute("cy", p.y(b)); }
    for (const t of tag.childNodes) {
      t.setAttribute("x", p.x(a) + (a >= 0 ? 12 : -12));
      t.setAttribute("y", p.y(b) + (b >= 0 ? -12 : 18));
      t.setAttribute("text-anchor", a >= 0 ? "start" : "end");
      t.textContent = cplx(a, b, 2);
    }

    const th = Math.atan2(b, a);
    const steps = Math.max(6, Math.round(Math.abs(th) * 30));
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * th;
      pts.push(`${(p.x(0) + 34 * Math.cos(t)).toFixed(2)} ${(p.y(0) - 34 * Math.sin(t)).toFixed(2)}`);
    }
    arc.firstChild.setAttribute("d", `M ${p.x(0)} ${p.y(0)} L ` + pts.join(" L ") + " Z");

    const r = Math.hypot(a, b);
    rdRect.set(cplx(a, b, 2));
    rdRe.set(fixed(a, 2));
    rdIm.set(fixed(b, 2));
    rdMag.set(fixed(r, 2));
    // the exam quotes angles in (−180°, 180°]; say so rather than silently wrapping
    rdAng.set(degv(th * DEG, 2));
  }

  draggable(p.root, ({ x, y }) => {
    const a = Math.max(-6, Math.min(6, Math.round(p.ux(x) * 4) / 4));
    const b = Math.max(-6, Math.min(6, Math.round(p.uy(y) * 4) / 4));
    draw(a, b);
  });

  const preset = scenarios({
    label: "Jump to",
    options: [
      { id: "3,4", label: "3 + 4j" },
      { id: "-3,4", label: "−3 + 4j" },
      { id: "-3,-4", label: "−3 − 4j" },
      { id: "0,5", label: "5j" },
      { id: "5,0", label: "5" },
    ],
    value: "3,4",
    onChange: (id) => { const [a, b] = id.split(",").map(Number); draw(a, b); },
  });

  draw(3, 4);

  return plate({
    no: 6,
    title: "One number, two names",
    tag: "interactive",
    label: "Complex plane",
    stage: p.root,
    controls: el("div.plate-controls", null, preset.root,
      el("p.gloss", { text: "Drag anywhere on the plate to move the point.", style: { flex: "1 1 12rem" } })),
    readouts: readouts(rdRect, rdRe, rdIm, rdMag, rdAng),
    caption:
      "Press <b>−3 − 4j</b> and read the angle: −126.87°, in the third quadrant. A " +
      "calculator asked for <span class='math'>arctan(−4 / −3)</span> answers 53.13° " +
      "instead, because the two minus signs cancel before it ever sees them. The " +
      "dashed circle is <span class='math'>|z| = 5</span> — every point on it has " +
      "the same magnitude and a different angle.",
  });
}

/* ==========================================================================
   Plate 7 — multiplication is rotation
   One knob: the angle of the multiplier. Lesson: angles add.
   ========================================================================== */

function complexMultiply() {
  const p = new Plot({
    w: 470, h: 420, xr: [-9, 9], yr: [-9, 9],
    pad: { l: 30, r: 22, t: 18, b: 30 },
    label: "The complex plane showing 3 plus 4j and its product with a second " +
           "complex number whose angle you control. The product's arrow is the " +
           "first arrow rotated by that angle and scaled by its length.",
  });
  p.equalize();
  p.grid({ xStep: 2, yStep: 2 });
  p.axes({ xStep: 4, yStep: 4, xLabel: "Re", yLabel: "Im",
    xFmt: (v) => (v === 0 ? "" : num(v, 0)), yFmt: (v) => (v === 0 ? "" : `${num(v, 0)}j`) });

  const Z = { a: 3, b: 4, r: 5, th: Math.atan2(4, 3) };
  let wMag = 1;

  // the circle the product travels on — its radius is |z||w|
  const track = p.param((t) => [Z.r * Math.cos(t), Z.r * Math.sin(t)], [0, 2 * Math.PI],
    { color: "rule", width: 1, dash: "3 4", layer: "grid" });

  p.vector(0, 0, Z.a, Z.b, { color: "q-x", width: 2.5 });
  p.text(Z.a, Z.b, "z = 3 + 4j", { color: "q-x", size: 12, dx: 8, dy: -8, anchor: "start", bg: true });

  const wArrow = p.vector(0, 0, 1, 0, { color: "q-y", width: 2 });
  const wLab = p.text(1, 0, "w", { color: "q-y", size: 12, dx: 6, dy: 14, anchor: "start", bg: true });
  const zwArrow = p.vector(0, 0, Z.a, Z.b, { color: "q-r", width: 3 });
  const zwDot = p.dot(Z.a, Z.b, { color: "q-r", r: 5.5 });
  const zwLab = p.text(Z.a, Z.b, "zw", { color: "q-r", size: 12.5, dx: 10, dy: 16, anchor: "start", bg: true });

  const rdW = readout({ key: "w", value: "1∠0°", tone: "y" });
  const rdZW = readout({ key: "z · w", value: "3 + 4j", tone: "r" });
  const rdMag = readout({ key: "lengths multiply", value: "5.00 × 1.00 = 5.00", tone: "r" });
  const rdAng = readout({ key: "angles add", value: "53.13° + 0° = 53.13°" });
  rdMag.root.classList.add("wide");
  rdAng.root.classList.add("wide");

  function draw(wDeg) {
    const wt = (wDeg * Math.PI) / 180;
    const wa = wMag * Math.cos(wt), wb = wMag * Math.sin(wt);
    const ra = Z.r * wMag, rt = Z.th + wt;
    const za = ra * Math.cos(rt), zb = ra * Math.sin(rt);

    wArrow.setAttribute("x2", p.x(wa)); wArrow.setAttribute("y2", p.y(wb));
    for (const t of wLab.childNodes) { t.setAttribute("x", p.x(wa) + 6); t.setAttribute("y", p.y(wb) + 14); }
    zwArrow.setAttribute("x2", p.x(za)); zwArrow.setAttribute("y2", p.y(zb));
    for (const c of zwDot.childNodes) { c.setAttribute("cx", p.x(za)); c.setAttribute("cy", p.y(zb)); }
    for (const t of zwLab.childNodes) {
      t.setAttribute("x", p.x(za) + (za >= 0 ? 10 : -10));
      t.setAttribute("y", p.y(zb) + (zb >= 0 ? 18 : -10));
      t.setAttribute("text-anchor", za >= 0 ? "start" : "end");
    }
    track.setAttribute("d", circlePath(p, ra));

    rdW.set(`${num(wMag, 2)}∠${num(wDeg, 1)}°`);
    rdZW.set(cplx(za, zb, 2));
    rdMag.set(`${num(Z.r, 2)} × ${num(wMag, 2)} = ${fixed(ra, 2)}`);
    rdAng.set(`53.13° + ${num(wDeg, 1)}° = ${num(53.13 + wDeg, 1)}°`);
  }

  const k = knob({
    label: "angle of w", min: -180, max: 180, step: 0.5, value: 53.13,
    format: (v) => `${num(v, 1)}°`,
    onInput: draw,
  });

  const magPick = scenarios({
    label: "length of w",
    options: [{ id: "0.6", label: "0.6" }, { id: "1", label: "1" }, { id: "1.6", label: "1.6" }],
    value: "1",
    onChange: (id) => { wMag = Number(id); draw(k.value()); },
  });

  draw(53.13);

  return plate({
    no: 7,
    title: "Multiplying rotates",
    tag: "interactive",
    label: "Complex multiplication as rotation",
    stage: p.root,
    controls: el("div.plate-controls", null, k.root, magPick.root),
    readouts: readouts(rdW, rdZW, rdMag, rdAng),
    caption:
      "With <b>w</b> of length 1, the teal arrow sweeps around a circle and never " +
      "changes size: multiplying by a unit complex number is <b>pure rotation</b>. " +
      "Leave the angle at 53.13° — the angle z already has — and the product lands " +
      "at 106.26°, exactly doubled. Doubling the angle is half of what squaring does; " +
      "the other half is squaring the length, which would put " +
      "<span class='math'>z²</span> = 25∠106.26° = −7 + 24j well off this plate.",
  });
}

function circlePath(p, r) {
  const pts = [];
  for (let i = 0; i <= 96; i++) {
    const t = (i / 96) * 2 * Math.PI;
    pts.push(`${p.x(r * Math.cos(t)).toFixed(2)} ${p.y(r * Math.sin(t)).toFixed(2)}`);
  }
  return "M " + pts.join(" L ");
}

/* ==========================================================================
   Plate 8 — the phasor and the wave it writes
   One knob: the phase. Lesson: a sinusoid is the shadow of a spinning arrow.
   ========================================================================== */

function phasor() {
  const W = 680, H = 268;
  const root = svg("svg", {
    viewBox: `0 0 ${W} ${H}`, role: "img",
    "aria-label":
      "On the left, an arrow of length 5 spinning about the origin. On the right, " +
      "the height of that arrow plotted against time, which traces a sine wave. " +
      "Changing the phase slides the whole wave sideways.",
    style: { display: "block", width: "100%", height: "auto" },
  });

  /* --- left: the spinning arrow ------------------------------------------- */
  const CX = 96, CY = H / 2, RAD = 74;
  const dial = svg("g");
  dial.appendChild(svg("circle", { cx: CX, cy: CY, r: RAD, fill: "none", stroke: V("rule"), strokeWidth: 1.25 }));
  dial.appendChild(svg("line", { x1: CX - RAD - 12, y1: CY, x2: CX + RAD + 12, y2: CY, stroke: V("rule"), strokeWidth: 1 }));
  dial.appendChild(svg("line", { x1: CX, y1: CY - RAD - 12, x2: CX, y2: CY + RAD + 12, stroke: V("rule"), strokeWidth: 1 }));
  root.appendChild(dial);

  const head = svg("marker", {
    id: "ph-head", viewBox: "0 0 10 10", refX: 8.5, refY: 5,
    markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse", markerUnits: "userSpaceOnUse",
  }, svg("path", { d: "M 0 1 L 9 5 L 0 9 z", fill: V("q-r") }));
  root.appendChild(svg("defs", null, head));

  const arm = svg("line", { x1: CX, y1: CY, stroke: V("q-r"), strokeWidth: 2.5, markerEnd: "url(#ph-head)" });
  const vProj = svg("line", { stroke: V("q-y"), strokeWidth: 3 });
  root.append(vProj, arm);

  /* --- right: the wave ----------------------------------------------------- */
  const PX = 236, PW = W - PX - 26, PH = 186, PY = CY;
  const AX = PH / 2 / 5;                                  // pixels per unit, amplitude 5
  const CYCLES = 2;
  const tx = (ph) => PX + (ph / (CYCLES * 2 * Math.PI)) * PW;

  const axes = svg("g");
  axes.appendChild(svg("line", { x1: PX, y1: PY, x2: PX + PW + 8, y2: PY, stroke: V("ink"), strokeWidth: 1.25 }));
  axes.appendChild(svg("line", { x1: PX, y1: PY - PH / 2 - 8, x2: PX, y2: PY + PH / 2 + 8, stroke: V("ink"), strokeWidth: 1.25 }));
  for (let k = 0; k <= CYCLES * 2; k++) {
    const ph = (k * Math.PI);
    axes.appendChild(svg("line", { x1: tx(ph), y1: PY - 4, x2: tx(ph), y2: PY + 4, stroke: V("ink"), strokeWidth: 1 }));
    if (k % 2 === 0 && k) axes.appendChild(svg("line", {
      x1: tx(ph), y1: PY - PH / 2, x2: tx(ph), y2: PY + PH / 2,
      stroke: V("rule"), strokeWidth: 1, strokeDasharray: "2 5",
    }));
    axes.appendChild(svg("text", {
      class: "lbl", x: tx(ph), y: PY + PH / 2 + 20, textAnchor: "middle", fill: V("faint"), fontSize: "10px",
      text: k === 0 ? "0" : k % 2 === 0 ? `${k / 2}T` : `${k}π`,
    }));
  }
  for (const v of [-5, 5]) {
    axes.appendChild(svg("line", {
      x1: PX, y1: PY - v * AX, x2: PX + PW, y2: PY - v * AX,
      stroke: V("rule"), strokeWidth: 1, strokeDasharray: "3 4",
    }));
    axes.appendChild(svg("text", {
      class: "lbl", x: PX - 6, y: PY - v * AX + 4, textAnchor: "end", fill: V("faint"), fontSize: "10px", text: v,
    }));
  }
  axes.appendChild(svg("text", {
    class: "lbl", x: PX + PW + 6, y: PY - 8, textAnchor: "end", fill: V("muted"), fontSize: "11px", text: "time →",
  }));
  axes.appendChild(svg("text", {
    class: "lbl", x: CX, y: CY + RAD + 30, textAnchor: "middle", fill: V("muted"),
    fontSize: "11px", text: "spinning at ω",
  }));
  root.appendChild(axes);

  const wave = svg("path", { fill: "none", stroke: V("q-y"), strokeWidth: 2.25, strokeLinejoin: "round" });
  const link = svg("line", { stroke: V("q-y"), strokeWidth: 1, strokeDasharray: "2 3", opacity: 0.8 });
  const nowDot = svg("circle", { r: 4.5, fill: V("q-y") });
  root.append(wave, link, nowDot);

  const rdPhase = readout({ key: "phase φ", value: "0°" });
  const rdNow = readout({ key: "v(t) now", value: "0.00", tone: "y", sub: " V" });
  const rdPeak = readout({ key: "amplitude", value: "5.00", tone: "r", sub: " V" });
  const rdPhasor = readout({ key: "phasor", value: "5∠0°", tone: "r" });

  let phi = 0, spin = 0;

  function draw() {
    // the arrow
    const a = spin + phi;
    const hx = CX + RAD * Math.cos(a), hy = CY - RAD * Math.sin(a);
    arm.setAttribute("x2", hx); arm.setAttribute("y2", hy);
    vProj.setAttribute("x1", hx); vProj.setAttribute("x2", hx);
    vProj.setAttribute("y1", CY); vProj.setAttribute("y2", hy);

    // the wave: the arrow's height, back-dated over two full cycles
    const pts = [];
    for (let i = 0; i <= 260; i++) {
      const ph = (i / 260) * CYCLES * 2 * Math.PI;
      pts.push(`${tx(ph).toFixed(2)} ${(PY - 5 * Math.sin(ph + phi) * AX).toFixed(2)}`);
    }
    wave.setAttribute("d", "M " + pts.join(" L "));

    const nowPh = spin % (CYCLES * 2 * Math.PI);
    const ny = PY - 5 * Math.sin(nowPh + phi) * AX;
    nowDot.setAttribute("cx", tx(nowPh)); nowDot.setAttribute("cy", ny);
    link.setAttribute("x1", hx); link.setAttribute("y1", hy);
    link.setAttribute("x2", tx(nowPh)); link.setAttribute("y2", ny);

    rdNow.set(fixed(5 * Math.sin(nowPh + phi), 2), " V");
  }

  const anim = loop((dt) => { spin = (spin + dt * 1.6) % (CYCLES * 2 * Math.PI); draw(); }, { node: root });

  const k = knob({
    label: "phase φ", min: -180, max: 180, step: 1, value: 0,
    format: (v) => `${num(v, 0)}°`,
    onInput: (v) => {
      phi = (v * Math.PI) / 180;
      rdPhase.set(`${num(v, 0)}°`);
      rdPhasor.set(`5∠${num(v, 0)}°`);
      draw();
    },
  });

  draw();

  return {
    node: plate({
      no: 8,
      title: "A sinusoid is the shadow of a spinning arrow",
      tag: "interactive",
      label: "Phasor and waveform",
      stage: root,
      controls: el("div.plate-controls", null, k.root, anim.control),
      readouts: readouts(rdPhase, rdNow, rdPeak, rdPhasor),
      caption:
        "The brass segment on the dial is the arrow's <em>height</em>, and the brass " +
        "curve on the right is that height written down over time. Change the phase " +
        "and the whole wave slides sideways without changing shape — which is why a " +
        "phase shift is stored as an <b>angle</b>, not as a delay in seconds. " +
        "Everything a circuit does to a steady sinusoid is captured by " +
        "<span class='math'>5∠φ</span>.",
    }),
    destroy: () => anim.stop(),
  };
}

/* --- registration ---------------------------------------------------------- */

register("complexPlane", { no: 6, build: complexPlane });
register("complexMultiply", { no: 7, build: complexMultiply });
register("phasor", { no: 8, build: phasor });
