/* Part 7 figure: the honest reason training a spiking network is hard. */

import { figure, knob, readout, fmt, s } from '../lib/dom.js';
import { scope } from '../lib/plot.js';

/* ---------------------------------------------------------------
   FIGURE 16 — the derivative that isn't there
   Knob: the width of the surrogate.
   Lesson: a spike is a step, a step has no useful derivative, and the
   whole of gradient-trained spiking networks rests on substituting one.
   --------------------------------------------------------------- */
export function surrogate() {
  const fig = figure({
    n: 16,
    title: 'Lying about a derivative, carefully',
    tag: 'interactive',
    block: 'Spike function and its stand-in gradient',
    sweep: 'u = Vm − threshold',
    aria: 'Top: the spike function, a step from zero to one at threshold. Bottom: its true derivative, which is zero everywhere, drawn against an adjustable smooth surrogate gradient.',
    caption: 'The true derivative of a spike is zero everywhere except at threshold, where it is infinite — backpropagation multiplies by it and gets nothing. The surrogate is a deliberate fiction with the right shape. <b>Narrow it and only neurons already at the brink can learn; widen it and neurons that never came close get credit they did not earn.</b> Nobody has a principled way to pick the width; people tune it.',
  });

  const svg = fig.svg('0 0 720 300');
  const top = s('svg', { x: 0, y: 0, width: 720, height: 126 });
  const bot = s('svg', { x: 0, y: 130, width: 720, height: 170 });
  svg.append(top, bot);

  const scTop = scope(top, {
    w: 720, h: 126, pad: { l: 56, r: 20, t: 12, b: 26 },
    x: { min: -20, max: 20, step: 10, decimals: 0 },
    y: { min: -0.15, max: 1.2, ticks: [0, 1], decimals: 0, title: 'SPIKE' },
    xLabels: false,
  });
  scTop.vline(0, { color: 'var(--spike)', dash: '3 3' });
  const stepXs = [], stepYs = [];
  for (let u = -20; u <= 20; u += 0.1) { stepXs.push(u); stepYs.push(u < 0 ? 0 : 1); }
  scTop.path({ color: 'var(--v)', width: 2.2 }).set(stepXs, stepYs);
  scTop.text(-18, 0.9, 'it fires, or it does not', { color: 'var(--ink-2)', size: 9.5 });
  scTop.text(1.5, 1.1, 'threshold', { color: 'var(--spike)', size: 9.5 });

  const scBot = scope(bot, {
    w: 720, h: 170, pad: { l: 56, r: 20, t: 14, b: 44 },
    x: { min: -20, max: 20, step: 10, decimals: 0, title: 'HOW FAR FROM THRESHOLD (mV)' },
    y: { min: -0.08, max: 1.15, ticks: [0, 0.5, 1], decimals: 1, title: 'GRADIENT' },
  });
  scBot.hline(0, { color: 'var(--ink-3)', dash: '2 4' });
  scBot.vline(0, { color: 'var(--spike)', dash: '3 3' });
  // the true derivative: flat zero, plus a spike at threshold that no
  // optimiser can use
  scBot.path({ color: 'var(--ink-3)', width: 2, dash: '4 4' }).set([-20, -0.2], [0, 0]);
  scBot.path({ color: 'var(--ink-3)', width: 2, dash: '4 4' }).set([0.2, 20], [0, 0]);
  scBot.text(-19, 0.07, 'the true derivative: zero, everywhere it matters', { color: 'var(--ink-3)', size: 9.5 });

  const surrFill = scBot.path({ fill: 'var(--exc-wash)' });
  const surrLine = scBot.path({ color: 'var(--exc)', width: 2.2 });
  const probeNear = scBot.dot(-2, 1, { color: 'var(--v)', r: 4.5 });
  const probeFar = scBot.dot(-10, 1, { color: 'var(--inh)', r: 4.5 });

  const roBeta = readout('Surrogate width', '—', 'exc');
  const roNear = readout('Gradient at 2 mV away', '—', 'v');
  const roFar  = readout('Gradient at 10 mV away', '—', 'inh');
  const roNote = readout('Effect', '—');
  fig.readouts(roBeta.el, roNear.el, roFar.el, roNote.el);

  // fast-sigmoid surrogate:  1 / (1 + beta*|u|)^2
  const g = (u, beta) => 1 / Math.pow(1 + beta * Math.abs(u), 2);

  function update(beta) {
    const xs = [], ys = [];
    for (let u = -20; u <= 20; u += 0.1) { xs.push(u); ys.push(g(u, beta)); }
    surrLine.set(xs, ys);
    surrFill.setArea(xs, ys, 0);
    const near = g(2, beta), far = g(10, beta);
    probeNear.move(-2, near);
    probeFar.move(-10, far);
    roBeta.set(`β = ${fmt(beta, 2)}`);
    roNear.set(fmt(near, 3));
    roFar.set(fmt(far, 3));
    roNote.set(beta > 1.4
      ? 'sharp — only neurons at the brink learn'
      : beta < 0.35
        ? 'broad — silent neurons get undeserved credit'
        : 'a workable compromise');
  }

  const k = knob({
    id: 'surrogate-beta', label: 'Surrogate sharpness',
    min: 0.1, max: 3, step: 0.05, value: 0.5,
    format: (v) => `β = ${fmt(v, 2)}`,
    oninput: update,
  });
  fig.controls(k.el);
  update(0.5);
  return fig.root;
}
