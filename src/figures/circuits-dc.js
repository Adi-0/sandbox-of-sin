/* ==========================================================================
   figures/circuits-dc.js — Plates 26 to 31, the DC half.

   Colour, as declared in lib/circuit.js and held to across the module:
     q-x  voltage      q-y  current      q-r  the result being computed
   ========================================================================== */

import { el, knob, scenarios, readout, readouts } from "../lib/dom.js";
import { register, plate } from "../lib/figure.js";
import { Schematic, solve, parallel } from "../lib/circuit.js";
import { Plot } from "../lib/plot.js";
import { num, fixed } from "../lib/fmt.js";

const V = (n) => `var(--${n})`;

/* ==========================================================================
   Plate 26 — the cast circuit, with both laws checked live
   One knob: the right-hand resistor. Lesson: the two sums balance at every
   value, so they are a free check on any answer.
   ========================================================================== */

function castCircuit() {
  const VS = 100, RS = 2, R1 = 12;

  const s = new Schematic({
    w: 10.4, h: 5.4, unit: 30,
    label: "A 100 volt source in series with a 2 ohm resistor, feeding a 12 ohm " +
           "and an adjustable resistor in parallel. Branch currents and node " +
           "voltages are shown, with the KCL and KVL sums checked below.",
  });

  /* --- the drawing ---------------------------------------------------------- */
  s.wire([[1, 0], [2, 0]]);
  s.wire([[4, 0], [9, 0]]);
  s.wire([[1, 3], [1, 4], [9, 4], [9, 3]]);
  s.wire([[6, 1], [6, 0]]);
  s.wire([[6, 3], [6, 4]]);
  s.wire([[9, 0], [9, 1]]);

  s.source([1, 2], "v", { kind: "dc", label: "100 V", at: "w", color: "q-x" });
  s.wire([[1, 0], [1, 1]]);
  s.resistor([3, 0], "h", { label: "2 Ω", color: "ink", at: "n" });
  s.resistor([6, 2], "v", { label: "12 Ω", color: "ink", at: "w" });
  const rAdj = s.resistor([9, 2], "v", { label: "4 Ω", color: "q-r", at: "e" });

  s.node([6, 0]);
  s.node([6, 4]);
  s.ground([3.5, 4]);
  s.label([6, 0], "P", { at: "nw", color: "muted", size: 12, gap: 15 });

  const iTot = s.current([4.9, 0], "e", { label: "20.0 A", color: "q-y", offset: -13 });
  const i12 = s.current([6, 3.4], "s", { label: "5.0 A", color: "q-y", offset: -13 });
  const i4 = s.current([9, 3.4], "s", { label: "15.0 A", color: "q-y", offset: -13 });
  const vp = s.label([7.45, 1.0], "Vp = 60.0 V", { at: "c", color: "q-x", size: 12.5, weight: 500 });

  /* --- readouts ------------------------------------------------------------- */
  const rdVp = readout({ key: "node P", value: "60.0 V", tone: "x" });
  const rdI = readout({ key: "total current", value: "20.0 A", tone: "y" });
  const rdKcl = readout({ key: "KCL at P", value: "5.0 + 15.0 = 20.0 ✓", tone: "r" });
  const rdKvl = readout({ key: "KVL round the left loop", value: "100 − 40 − 60 = 0 ✓", tone: "r" });
  rdKcl.root.classList.add("wide");
  rdKvl.root.classList.add("wide");

  function draw(R2) {
    // one unknown node, solved the same way the prose does it
    const G = [[1 / RS + 1 / R1 + 1 / R2]];
    const [Vp] = solve(G, [VS / RS]);
    const It = (VS - Vp) / RS, i1 = Vp / R1, i2 = Vp / R2;
    const drop = It * RS;

    Schematic.setLabel(rAdj.label, `${num(R2, 1)} Ω`);
    Schematic.setLabel(iTot.label, `${fixed(It, 1)} A`);
    Schematic.setLabel(i12.label, `${fixed(i1, 1)} A`);
    Schematic.setLabel(i4.label, `${fixed(i2, 1)} A`);
    Schematic.setLabel(vp, `Vp = ${fixed(Vp, 1)} V`);

    rdVp.set(`${fixed(Vp, 1)} V`);
    rdI.set(`${fixed(It, 1)} A`);
    rdKcl.set(`${fixed(i1, 1)} + ${fixed(i2, 1)} = ${fixed(i1 + i2, 1)} ✓`);
    rdKvl.set(`100 − ${fixed(drop, 1)} − ${fixed(Vp, 1)} = ${fixed(VS - drop - Vp, 1)} ✓`);
  }

  const k = knob({
    label: "the right-hand resistor", min: 1, max: 20, step: 0.5, value: 4,
    format: (v) => `${num(v, 1)} Ω`,
    onInput: draw,
  });

  draw(4);

  return plate({
    no: 26,
    title: "The cast circuit, and both laws holding",
    tag: "interactive",
    label: "The cast circuit",
    stage: s.root,
    controls: el("div.plate-controls", null, k.root),
    readouts: readouts(rdVp, rdI, rdKcl, rdKvl),
    caption:
      "Move the resistor anywhere between 1 Ω and 20 Ω and both check lines stay " +
      "balanced — they are not coincidences of the chosen numbers, they are the " +
      "two conservation laws. <b>At 4 Ω every quantity is a whole number</b>, which " +
      "is why that is the value the rest of this module uses. Push it to 1 Ω and " +
      "watch the total current climb: a smaller parallel branch draws more, and " +
      "loads the source harder.",
  });
}

/* --- registration ---------------------------------------------------------- */

register("castCircuit", { no: 26, build: castCircuit });
