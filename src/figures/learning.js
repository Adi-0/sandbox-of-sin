/* Part 5 figures: plasticity from timing alone. */

import { figure, knob, readout, fmt, s, h, rng } from '../lib/dom.js';
import { scope } from '../lib/plot.js';
import { createLoop } from '../lib/anim.js';
import { LIF, CAST, deltaW, STDP } from '../lib/neuron.js';

/* ---------------------------------------------------------------
   FIGURE 11 — the window
   Knob: the gap between the input spike and the output spike.
   Lesson: the sign of the weight change is the sign of the causality.
   --------------------------------------------------------------- */
export function stdpWindow() {
  const fig = figure({
    n: 11,
    title: 'Which came first',
    tag: 'interactive',
    block: 'Δw · % of full strength',
    sweep: 'Δt = t_post − t_pre',
    aria: 'Left: a timeline with one input spike and one output spike whose separation is adjustable. Right: the spike-timing-dependent plasticity curve, showing strengthening for positive time differences and weakening for negative ones.',
    caption: 'Drag through zero and watch the sign flip. The strengthening lobe decays with the membrane’s own 20&nbsp;ms constant — <b>not a coincidence</b>: the synapse is asking exactly the question the membrane can answer, namely “was I still standing when the neuron fired?” The weakening lobe is deliberately wider, 34&nbsp;ms, so the <b>area</b> under it is about 1.8× the area under the strengthening lobe. That imbalance is the only thing stopping every weight in a network from drifting to maximum.',
  });

  const svg = fig.svg('0 0 720 240');
  const left = s('svg', { x: 0, y: 0, width: 330, height: 240 });
  const right = s('svg', { x: 340, y: 0, width: 380, height: 240 });
  svg.append(left, right);

  const tl = scope(left, {
    w: 330, h: 240, pad: { l: 40, r: 14, t: 18, b: 44 },
    x: { min: -70, max: 70, step: 35, decimals: 0, title: 'TIME (ms)' },
    y: { min: 0, max: 3, ticks: [], title: '' },
  });
  tl.text(-68, 2.5, 'input spike', { color: 'var(--exc)', size: 9.5 });
  tl.text(-68, 0.9, 'output spike', { color: 'var(--spike)', size: 9.5 });
  const preMark = tl.vline(0, { color: 'var(--exc)', width: 2.4, y0: 1.7, y1: 2.4 });
  const postMark = tl.vline(14, { color: 'var(--spike)', width: 2.4, y0: 0.15, y1: 0.85 });
  const arrow = tl.path({ color: 'var(--ink-3)', width: 1.2, dash: '3 3' });
  const gapLabel = tl.text(7, 1.3, '', { color: 'var(--ink-2)', size: 10, anchor: 'middle', weight: 600 });

  const curve = scope(right, {
    w: 380, h: 240, pad: { l: 52, r: 16, t: 18, b: 44 },
    x: { min: -70, max: 70, step: 35, decimals: 0, title: 'Δt (ms)' },
    y: { min: -1.3, max: 1.3, ticks: [-1, 0, 1], decimals: 0, title: 'Δw (%)' },
  });
  curve.hline(0, { color: 'var(--ink-3)', dash: '2 4' });
  curve.vline(0, { color: 'var(--ink-3)', dash: '2 4' });

  const potXs = [], potYs = [], depXs = [], depYs = [];
  for (let i = 0; i <= 140; i++) {
    const dtMs = -70 + i;
    const v = deltaW(dtMs / 1000) * 100;
    if (dtMs > 0) { potXs.push(dtMs); potYs.push(v); }
    else if (dtMs < 0) { depXs.push(dtMs); depYs.push(v); }
  }
  curve.path({ fill: 'var(--exc-wash)' }).setArea(potXs, potYs, 0);
  curve.path({ fill: 'var(--inh-wash)' }).setArea(depXs, depYs, 0);
  curve.path({ color: 'var(--exc)', width: 2 }).set(potXs, potYs);
  curve.path({ color: 'var(--inh)', width: 2 }).set(depXs, depYs);
  curve.text(66, 1.12, 'strengthen', { color: 'var(--exc)', size: 9.5, anchor: 'end' });
  curve.text(-66, -1.12, 'weaken', { color: 'var(--inh)', size: 9.5 });
  const marker = curve.dot(14, deltaW(0.014) * 100, { color: 'var(--v)', r: 5.5 });

  const roDt  = readout('Δt', '—', 'v');
  const roDw  = readout('Weight change', '—');
  const roWho = readout('Reading', '—');
  fig.readouts(roDt.el, roDw.el, roWho.el);

  function run(dtMs) {
    postMark.move(dtMs);
    arrow.set([0, dtMs], [1.3, 1.3]);
    gapLabel.move(dtMs / 2, 1.45);
    gapLabel.set(`${dtMs > 0 ? '+' : ''}${fmt(dtMs, 0)} ms`);
    const dw = deltaW(dtMs / 1000) * 100;
    marker.move(dtMs, dw);
    roDt.set(`${dtMs > 0 ? '+' : ''}${fmt(dtMs, 0)} ms`);
    roDw.set(`${dw > 0 ? '+' : ''}${fmt(dw, 2)} %`);
    roDw.el.querySelector('.ro__v').setAttribute('data-q', dw > 0 ? 'exc' : 'inh');
    roWho.set(dtMs > 0
      ? 'input fired first — it may have helped'
      : dtMs < 0 ? 'input fired after — it cannot have helped' : 'simultaneous — no verdict');
  }

  const k = knob({
    id: 'stdp-dt', label: 'Output spike relative to input',
    min: -70, max: 70, step: 1, value: 14,
    format: (v) => `${v > 0 ? '+' : ''}${fmt(v, 0)} ms`,
    oninput: run,
  });
  fig.controls(k.el);
  run(14);
  return fig.root;
}

/* ---------------------------------------------------------------
   FIGURE 12 — finding a needle nobody pointed at
   Knob: how much noise is buried around the pattern. Live, with reset.
   Lesson: STDP is an unsupervised pattern detector. No labels, no error
   signal, no backward pass — just timing.
   --------------------------------------------------------------- */
export function patternLearning() {
  const fig = figure({
    n: 12,
    title: 'A synapse learns, unsupervised',
    tag: 'interactive',
    block: 'CH1–12 · inputs · rolling 400 ms   +   weights',
    sweep: 'live · 4× real time',
    aria: 'Twelve input lines firing noisily into one neuron. Six of them repeatedly fire together at moments marked by shaded bands. Weight bars on the right show the synapses reorganising until only those six survive.',
    caption: 'Six of the twelve lines fire together at the shaded moments. With patience you could pick them out yourself — but the neuron is never told that the shaded moments are special, nor which lines to watch, nor that there is anything to find. Press play and give it ten seconds or so — the six responsible synapses climb to the 8&nbsp;mV ceiling while the other six are pruned to nearly nothing. <b>Learning rates here are far faster than biological</b> so the demonstration fits in a coffee break; the shape of the outcome is unchanged. Push the noise past about 18&nbsp;Hz and you can watch it lose its grip.',
  });

  // W_INIT is chosen so the six coincident inputs (6 x 3.6 = 21.6 mV) clear
  // the 20 mV threshold while background noise on its own rarely does.
  const N = 12, W_MAX = 8, W_INIT = 3.6;
  const PATTERN = [1, 3, 4, 6, 9, 10];
  const isPattern = Array.from({ length: N }, (_, i) => PATTERN.includes(i));
  // same window shape as Figure 11, run twice as fast so the demo fits a coffee break
  const LEARN = { ...STDP, aPlus: 0.020, aMinus: 0.021 };

  const svg = fig.svg('0 0 720 310');
  const left = s('svg', { x: 0, y: 0, width: 462, height: 310 });
  const right = s('svg', { x: 470, y: 0, width: 250, height: 310 });
  svg.append(left, right);

  const WIN = 0.4;
  const sc = scope(left, {
    w: 462, h: 310, pad: { l: 32, r: 14, t: 18, b: 44 },
    x: { min: 0, max: WIN, step: 0.1, decimals: 1, title: 'ROLLING WINDOW (s)' },
    y: { min: -0.6, max: N + 0.4, ticks: [], title: '' },
  });
  const bands = Array.from({ length: 6 }, () => sc.band(-1, -1, { color: 'var(--v-wash)' }));
  const inRows = Array.from({ length: N }, (_, i) =>
    sc.raster(N - 1 - i + 0.4, { color: 'var(--exc)', height: 8, width: 1.8 })
  );
  const outRow = sc.raster(-0.25, { color: 'var(--spike)', height: 11, width: 2.4 });
  sc.text(-0.008, -0.25, 'out', { color: 'var(--spike)', size: 9, anchor: 'end', dy: 3.5 });
  sc.text(-0.008, N - 0.6, 'in', { color: 'var(--exc)', size: 9, anchor: 'end', dy: 3.5 });

  // weight bars
  const bl = 46, bw = 168, bh = 15, gap = 22, top = 30;
  right.appendChild(s('text', {
    x: bl, y: 18, fill: 'var(--ink-3)', 'font-family': 'var(--font-mono)',
    'font-size': 9.5, 'letter-spacing': '0.1em', text: 'SYNAPTIC WEIGHT (mV)',
  }));
  const bars = Array.from({ length: N }, (_, i) => {
    const y = top + i * gap;
    right.append(
      s('text', { x: bl - 8, y: y + bh - 3.5, 'text-anchor': 'end', fill: 'var(--ink-3)',
        'font-family': 'var(--font-mono)', 'font-size': 9, text: String(i + 1) }),
      s('rect', { x: bl, y, width: bw, height: bh, fill: 'var(--paper-3)', rx: 1 })
    );
    const fgEl = s('rect', { x: bl, y, width: 0, height: bh, fill: 'var(--exc)', rx: 1 });
    const txt = s('text', { x: bl + bw + 6, y: y + bh - 3.5, fill: 'var(--ink-3)',
      'font-family': 'var(--font-mono)', 'font-size': 9, text: '' });
    right.append(fgEl, txt);
    return { fgEl, txt };
  });

  const roT    = readout('Learning time', '—', 'v');
  const roSig  = readout('Mean weight, the six', '—', 'exc');
  const roNoi  = readout('Mean weight, the rest', '—', 'inh');
  const roOut  = readout('Output', '—', 'spike');
  fig.readouts(roT.el, roSig.el, roNoi.el, roOut.el);

  /* --- simulation state --- */
  let w, x, y, neuron, rand, spikes, outSpikes, patTimes, nextPattern, pending, tSim, noiseHz;
  let hits = 0, misses = 0;

  function reset() {
    w = Array(N).fill(W_INIT);
    x = Array(N).fill(0);
    y = 0;
    neuron = new LIF();
    rand = rng(11);
    spikes = Array.from({ length: N }, () => []);
    outSpikes = [];
    patTimes = [];
    pending = [];
    tSim = 0;
    nextPattern = 0.08;
    hits = 0; misses = 0;
    draw();
  }

  function step(dt) {
    tSim += dt;
    const decayP = Math.exp(-dt / LEARN.tauPlus);
    const decayM = Math.exp(-dt / LEARN.tauMinus);
    for (let i = 0; i < N; i++) x[i] *= decayP;
    y *= decayM;

    // schedule a pattern presentation
    if (tSim >= nextPattern) {
      patTimes.push(tSim);
      PATTERN.forEach((idx) => pending.push({ t: tSim, i: idx }));
      nextPattern = tSim + 0.09 + rand() * 0.03;
    }

    // which inputs fire this step
    const firing = [];
    pending = pending.filter((p) => {
      if (p.t <= tSim) { firing.push(p.i); return false; }
      return true;
    });
    for (let i = 0; i < N; i++) if (rand() < noiseHz * dt) firing.push(i);

    let inject = 0;
    for (const i of firing) {
      spikes[i].push(tSim);
      x[i] += 1;
      w[i] = Math.max(0, w[i] - LEARN.aMinus * W_MAX * y);   // pre after post -> weaken
      inject += w[i];
    }

    if (neuron.step(dt, 0, inject)) {
      outSpikes.push(tSim);
      y += 1;
      for (let i = 0; i < N; i++) {
        w[i] = Math.min(W_MAX, w[i] + LEARN.aPlus * W_MAX * x[i]);  // pre before post -> strengthen
      }
      // did this output spike land on a pattern presentation?
      const last = patTimes[patTimes.length - 1];
      if (last !== undefined && tSim - last < 0.02) hits++; else misses++;
    }

    const cutoff = tSim - WIN;
    for (let i = 0; i < N; i++) while (spikes[i].length && spikes[i][0] < cutoff) spikes[i].shift();
    while (outSpikes.length && outSpikes[0] < cutoff) outSpikes.shift();
    while (patTimes.length && patTimes[0] < cutoff) patTimes.shift();
  }

  function draw() {
    const t0 = Math.max(0, tSim - WIN);
    for (let i = 0; i < N; i++) inRows[i].set(spikes[i].map((t) => t - t0));
    outRow.set(outSpikes.map((t) => t - t0));
    bands.forEach((b, k) => {
      const t = patTimes[k];
      if (t === undefined) b.set(-1, -1);
      else b.set(Math.max(0, t - t0 - 0.004), Math.min(WIN, t - t0 + 0.012));
    });
    for (let i = 0; i < N; i++) {
      bars[i].fgEl.setAttribute('width', Math.max(0, (w[i] / W_MAX) * bw));
      bars[i].fgEl.setAttribute('fill', w[i] >= W_INIT - 0.05 ? 'var(--exc)' : 'var(--ink-3)');
      bars[i].txt.textContent = fmt(w[i], 1);
    }
    const sig = PATTERN.reduce((a, i) => a + w[i], 0) / PATTERN.length;
    const noi = w.filter((_, i) => !isPattern[i]).reduce((a, v) => a + v, 0) / (N - PATTERN.length);
    roT.set(`${fmt(tSim, 1)} s`);
    roSig.set(`${fmt(sig, 2)} mV`);
    roNoi.set(`${fmt(noi, 2)} mV`);
    const total = hits + misses;
    roOut.set(total ? `${fmt((hits / total) * 100, 0)} % on the pattern` : 'waiting');
  }

  noiseHz = 8;
  reset();

  let acc = 0;
  const loop = createLoop(fig.root, (dt) => {
    step(dt);
    acc += dt;
    if (acc > 0.02) { acc = 0; draw(); }
  }, { speed: 4, maxStep: 0.0005, autoplay: false });

  const k = knob({
    id: 'stdp-noise', label: 'Background noise on every line',
    min: 0, max: 24, step: 1, value: 8,
    format: (v) => `${fmt(v, 0)} Hz`,
    oninput: (v) => { noiseHz = v; },
  });
  fig.controls(
    k.el,
    loop.button,
    h('button', { type: 'button', class: 'btn', text: 'Restart', onclick: () => reset() })
  );

  return fig.root;
}
