/* Part 8: the bench. Everything from Parts 2–5, with the rails off. */

import { h, s, fmt } from '../lib/dom.js';
import { scope } from '../lib/plot.js';
import { createLoop } from '../lib/anim.js';
import { Network, CAST, Trace } from '../lib/neuron.js';

const N = 5;
const NAMES = ['A', 'B', 'C', 'D', 'E'];
const POS = [[110, 44], [212, 112], [174, 226], [46, 226], [8, 112]];

const PRESETS = {
  solo: {
    label: 'One neuron',
    note: 'Just A, driven by a steady current. Turn the current below 0.20 nA and it goes silent forever.',
    currents: [0.40, 0, 0, 0, 0],
    edges: [],
  },
  relay: {
    label: 'Relay chain',
    note: 'A drives B drives C. Drop any weight below about 7.9 mV and the message dies at that link.',
    currents: [0.60, 0, 0, 0, 0],
    edges: [[0, 1, 9], [1, 2, 9]],
  },
  decision: {
    label: 'Winner take all',
    note: 'A, B and C get almost identical drive, each excites itself (+8) and inhibits the others (−12). Only one survives. Weaken the self-connections and the winner loses its grip.',
    currents: [0.24, 0.23, 0.22, 0, 0],
    edges: [
      [0, 0, 8], [1, 1, 8], [2, 2, 8],
      [0, 1, -12], [0, 2, -12], [1, 0, -12], [1, 2, -12], [2, 0, -12], [2, 1, -12],
    ],
  },
  oscillator: {
    label: 'Half-centre oscillator',
    note: 'Two neurons, equal drive, each inhibiting the other. Nothing tells them to alternate — they cannot do anything else.',
    currents: [0.50, 0.50, 0, 0, 0],
    edges: [[0, 1, -7], [1, 0, -7]],
  },
  detector: {
    label: 'Coincidence detector',
    note: 'A, B and C each feed D with 8 mV. D needs 20 mV, so it fires only when at least three arrive close together.',
    currents: [0.50, 0.50, 0.50, 0, 0],
    edges: [[0, 3, 8], [1, 3, 8], [2, 3, 8]],
  },
};

export function bench() {
  /* ---------------- state ---------------- */
  let currents = [0.4, 0, 0, 0, 0];
  let taus = Array(N).fill(20);
  let W = Array.from({ length: N }, () => Array(N).fill(0));
  let selNeuron = 0;
  let selEdge = null;              // [from, to]
  let net, trace, glow, counts, rateWindow, rates;

  const WIN = 1.0;

  function rebuild() {
    net = new Network({ n: 0 });
    for (let i = 0; i < N; i++) net.addNeuron({ tauM: taus[i] / 1000 });
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) if (W[i][j] !== 0) net.connect(i, j, W[i][j], 0.002);
    }
    trace = new Trace(600);
    glow = Array(N).fill(0);
    counts = Array(N).fill(0);
    rates = Array(N).fill(0);
    rateWindow = 0;
  }

  /* ---------------- drawing surface ---------------- */
  const svg = s('svg', {
    viewBox: '0 0 720 470', role: 'img',
    'aria-label': 'A network of five neurons you configure yourself, with a live raster of their spikes and a voltage trace of the selected neuron.',
  });
  const graph = s('svg', { x: 0, y: 0, width: 250, height: 290 });
  const plots = s('svg', { x: 256, y: 0, width: 464, height: 290 });
  const traceSvg = s('svg', { x: 0, y: 296, width: 720, height: 174 });
  svg.append(graph, plots, traceSvg);

  /* graph nodes and edges */
  const edgeLayer = s('g');
  graph.appendChild(edgeLayer);
  const nodeEls = POS.map(([x, y], i) => {
    const c = s('circle', {
      cx: x + 22, cy: y + 22, r: 21, fill: 'var(--paper-3)',
      stroke: 'var(--ink-3)', 'stroke-width': 1.8, style: 'cursor:pointer',
    });
    const t = s('text', {
      x: x + 22, y: y + 27, 'text-anchor': 'middle', fill: 'var(--ink)',
      'font-family': 'var(--font-mono)', 'font-size': 13, 'font-weight': 600,
      text: NAMES[i], style: 'cursor:pointer; user-select:none',
    });
    c.addEventListener('click', () => selectNeuron(i));
    t.addEventListener('click', () => selectNeuron(i));
    graph.append(c, t);
    return c;
  });

  const raster = scope(plots, {
    w: 464, h: 290, pad: { l: 34, r: 14, t: 20, b: 40 },
    x: { min: 0, max: WIN, step: 0.25, decimals: 2, title: 'ROLLING WINDOW (s)' },
    y: { min: 0, max: N, ticks: [], title: '' },
  });
  const rows = Array.from({ length: N }, (_, i) => {
    raster.text(-0.02, N - 0.5 - i, NAMES[i], { color: 'var(--ink-2)', size: 11, anchor: 'end', dy: 4 });
    return raster.raster(N - 0.5 - i, { color: 'var(--spike)', height: 30, width: 2 });
  });

  const vScope = scope(traceSvg, {
    w: 720, h: 174, pad: { l: 46, r: 16, t: 26, b: 38 },
    x: { min: 0, max: WIN, step: 0.25, decimals: 2, title: 'TIME (s)' },
    y: { min: -14, max: 28, ticks: [0, 20], title: 'Vm (mV)' },
  });
  vScope.hline(CAST.vTh, { color: 'var(--spike)', dash: '4 4' });
  vScope.hline(0, { color: 'var(--ink-3)', dash: '2 4' });
  const vPath = vScope.path({ color: 'var(--v)', width: 1.6 });
  const vTitle = vScope.text(0, 28, '', { color: 'var(--ink-2)', size: 9.5, dy: -12 });

  function drawEdges() {
    while (edgeLayer.firstChild) edgeLayer.removeChild(edgeLayer.firstChild);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const w = W[i][j];
        if (!w) continue;
        const [ax, ay] = [POS[i][0] + 22, POS[i][1] + 22];
        const [bx, by] = [POS[j][0] + 22, POS[j][1] + 22];
        if (i === j) {
          edgeLayer.appendChild(s('path', {
            d: `M${ax - 8} ${ay - 19} a 15 15 0 1 1 16 0`,
            stroke: w > 0 ? 'var(--exc)' : 'var(--inh)', 'stroke-width': Math.min(4, 1 + Math.abs(w) / 4),
            fill: 'none',
          }));
          continue;
        }
        const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const off = 5;
        const x1 = ax + ux * 21 + uy * off, y1 = ay + uy * 21 - ux * off;
        const x2 = bx - ux * 25 + uy * off, y2 = by - uy * 25 - ux * off;
        edgeLayer.appendChild(s('line', {
          x1, y1, x2, y2,
          stroke: w > 0 ? 'var(--exc)' : 'var(--inh)',
          'stroke-width': Math.min(4.5, 1 + Math.abs(w) / 3.5),
        }));
        edgeLayer.appendChild(s('path', {
          d: `M${x2} ${y2} l ${-ux * 8 + uy * 4} ${-uy * 8 - ux * 4} l ${-ux * 8 - uy * 4} ${-uy * 8 + ux * 4}`,
          stroke: w > 0 ? 'var(--exc)' : 'var(--inh)', 'stroke-width': 1.6, fill: 'none',
        }));
      }
    }
  }

  /* ---------------- sidebar ---------------- */
  const noteEl = h('p', { class: 'hint', style: 'margin:0 0 .6rem' });

  const presetBtns = Object.entries(PRESETS).map(([key, p]) =>
    h('button', {
      type: 'button', class: 'btn', 'data-preset': key, text: p.label,
      onclick: () => loadPreset(key),
    })
  );

  const pills = NAMES.map((nm, i) =>
    h('button', {
      type: 'button', class: 'node-pill', 'data-sel': String(i === 0),
      onclick: () => selectNeuron(i),
    },
      h('span', { text: nm }),
      h('span', { class: 'rate', text: '0 Hz', style: 'color:var(--spike)' })
    )
  );

  const curOut = h('output', { text: '0.40 nA' });
  const curInput = h('input', {
    type: 'range', min: 0, max: 1, step: 0.01, value: 0.4,
    'aria-label': 'Input current for the selected neuron',
    oninput: (e) => {
      currents[selNeuron] = Number(e.target.value);
      curOut.textContent = `${fmt(currents[selNeuron], 2)} nA`;
    },
  });

  const tauOut = h('output', { text: '20 ms' });
  const tauInput = h('input', {
    type: 'range', min: 4, max: 60, step: 1, value: 20,
    'aria-label': 'Membrane time constant for the selected neuron',
    oninput: (e) => {
      taus[selNeuron] = Number(e.target.value);
      tauOut.textContent = `${fmt(taus[selNeuron], 0)} ms`;
      net.neurons[selNeuron].p.tauM = taus[selNeuron] / 1000;
    },
  });

  /* connection matrix */
  const cells = [];
  const matrix = h('div', {
    style: `display:grid;grid-template-columns:1.1rem repeat(${N},1fr);gap:2px;font-family:var(--font-mono);font-size:.6rem`,
  });
  matrix.appendChild(h('span', {}));
  for (let j = 0; j < N; j++) {
    matrix.appendChild(h('span', { style: 'text-align:center;color:var(--ink-3)', text: NAMES[j] }));
  }
  for (let i = 0; i < N; i++) {
    matrix.appendChild(h('span', { style: 'color:var(--ink-3);line-height:1.7', text: NAMES[i] }));
    for (let j = 0; j < N; j++) {
      const cell = h('button', {
        type: 'button',
        'aria-label': `Connection from ${NAMES[i]} to ${NAMES[j]}`,
        style: 'border:1px solid var(--rule);background:var(--paper);border-radius:2px;cursor:pointer;padding:.15rem 0;font:inherit;color:var(--ink-3)',
        text: '·',
        onclick: () => selectEdge(i, j),
      });
      cells.push({ i, j, el: cell });
      matrix.appendChild(cell);
    }
  }

  const wOut = h('output', { text: '—' });
  const wInput = h('input', {
    type: 'range', min: -12, max: 12, step: 0.5, value: 0, disabled: 'disabled',
    'aria-label': 'Weight of the selected connection',
    oninput: (e) => {
      if (!selEdge) return;
      const v = Number(e.target.value);
      W[selEdge[0]][selEdge[1]] = v;
      wOut.textContent = `${v > 0 ? '+' : ''}${fmt(v, 1)} mV`;
      syncEdges();
      drawEdges(); drawMatrix();
    },
  });

  function syncEdges() {
    net.edges.length = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) if (W[i][j] !== 0) net.connect(i, j, W[i][j], 0.002);
    }
  }

  function drawMatrix() {
    for (const c of cells) {
      const w = W[c.i][c.j];
      const sel = selEdge && selEdge[0] === c.i && selEdge[1] === c.j;
      c.el.textContent = w === 0 ? '·' : fmt(w, 0);
      c.el.style.color = w === 0 ? 'var(--ink-3)' : 'var(--paper)';
      c.el.style.background = w === 0 ? 'var(--paper)' : (w > 0 ? 'var(--exc)' : 'var(--inh)');
      c.el.style.borderColor = sel ? 'var(--v)' : 'var(--rule)';
      c.el.style.boxShadow = sel ? '0 0 0 2px var(--v-wash)' : 'none';
    }
  }

  function selectEdge(i, j) {
    selEdge = [i, j];
    wInput.disabled = false;
    wInput.value = W[i][j];
    wOut.textContent = `${NAMES[i]} → ${NAMES[j]}:  ${W[i][j] > 0 ? '+' : ''}${fmt(W[i][j], 1)} mV`;
    drawMatrix();
  }

  function selectNeuron(i) {
    selNeuron = i;
    pills.forEach((p, k) => p.setAttribute('data-sel', String(k === i)));
    nodeEls.forEach((c, k) => c.setAttribute('stroke-width', k === i ? 3 : 1.8));
    curInput.value = currents[i];
    curOut.textContent = `${fmt(currents[i], 2)} nA`;
    tauInput.value = taus[i];
    tauOut.textContent = `${fmt(taus[i], 0)} ms`;
    vTitle.set(`Vm of ${NAMES[i]}`);
    trace.clear();
  }

  function loadPreset(key) {
    const p = PRESETS[key];
    currents = p.currents.slice();
    taus = Array(N).fill(20);
    W = Array.from({ length: N }, () => Array(N).fill(0));
    for (const [i, j, w] of p.edges) W[i][j] = w;
    selEdge = null;
    wInput.disabled = true;
    wInput.value = 0;
    wOut.textContent = 'pick a cell above';
    noteEl.textContent = p.note;
    presetBtns.forEach((b) => b.classList.toggle('is-on', b.dataset.preset === key));
    rebuild();
    selectNeuron(0);
    drawEdges();
    drawMatrix();
  }

  /* ---------------- run ---------------- */
  let sampleAcc = 0;
  const loop = createLoop(null, (dt) => {
    const fired = net.step(dt, currents);
    for (const i of fired) { counts[i]++; glow[i] = 1; }
    for (let i = 0; i < N; i++) glow[i] = Math.max(0, glow[i] - dt * 12);

    sampleAcc += dt;
    if (sampleAcc >= 0.002) {
      sampleAcc = 0;
      const n = net.neurons[selNeuron];
      trace.push(net.t, n.spiked ? CAST.vTh + 6 : n.v);
    }
    rateWindow += dt;
    if (rateWindow >= 0.3) {
      for (let i = 0; i < N; i++) {
        rates[i] = counts[i] / rateWindow;
        counts[i] = 0;
        pills[i].querySelector('.rate').textContent = `${fmt(rates[i], 0)} Hz`;
      }
      rateWindow = 0;
    }

    net.trimSpikes(WIN);
    const t0 = Math.max(0, net.t - WIN);
    for (let i = 0; i < N; i++) {
      rows[i].set(net.spikes.filter((sp) => sp.i === i).map((sp) => sp.t - t0));
    }
    const xs = [], ys = [];
    for (let k = 0; k < trace.length; k++) {
      if (trace.xs[k] >= t0) { xs.push(trace.xs[k] - t0); ys.push(trace.ys[k]); }
    }
    vPath.set(xs, ys);
    nodeEls.forEach((c, i) => {
      c.setAttribute('fill', glow[i] > 0.02 ? 'var(--spike)' : 'var(--paper-3)');
      c.setAttribute('stroke', glow[i] > 0.02 ? 'var(--spike)' : (i === selNeuron ? 'var(--v)' : 'var(--ink-3)'));
    });
  }, { speed: 0.5, maxStep: 0.0005, autoplay: false });

  /* ---------------- assemble ---------------- */
  const side = h('div', {},
    h('div', { class: 'sandbox__side' },
      h('h4', { text: 'Start from' }),
      h('div', { class: 'stack' }, presetBtns),
      noteEl
    ),
    h('div', { class: 'sandbox__side' },
      h('h4', { text: 'Neurons' }),
      h('div', { class: 'stack', style: 'margin-bottom:.7rem' }, pills),
      h('div', { class: 'field' },
        h('label', { for: 'sb-cur' }, 'Input current ', curOut),
        Object.assign(curInput, { id: 'sb-cur' })
      ),
      h('div', { class: 'field' },
        h('label', { for: 'sb-tau' }, 'Time constant ', tauOut),
        Object.assign(tauInput, { id: 'sb-tau' })
      )
    ),
    h('div', { class: 'sandbox__side' },
      h('h4', { text: 'Connections  (row → column)' }),
      matrix,
      h('div', { class: 'field', style: 'margin-top:.7rem' },
        h('label', { for: 'sb-w' }, 'Weight ', wOut),
        Object.assign(wInput, { id: 'sb-w' })
      ),
      h('p', { class: 'hint', text: 'Teal is excitatory, indigo inhibitory — the same colours as everywhere else in the guide.' })
    )
  );

  const panelBody = h('div', { class: 'panel__body' }, svg);
  const panel = h('div', { class: 'panel' },
    h('div', { class: 'panel__block' },
      h('b', { text: 'BENCH' }),
      h('span', { class: 'sep', text: '·' }),
      h('span', { text: '5 neurons · live · 0.5× real time' }),
      h('span', { class: 'right', text: 'rolling 1 s' })
    ),
    panelBody,
    h('div', { class: 'controls' },
      loop.button,
      h('button', {
        type: 'button', class: 'btn', text: 'Clear spikes',
        onclick: () => { rebuild(); selectNeuron(selNeuron); },
      }),
      h('span', { class: 'hint', text: 'Click a neuron in the diagram to inspect it. Click a matrix cell, then drag the weight slider.' })
    )
  );

  loadPreset('decision');
  drawEdges();
  drawMatrix();

  return h('div', { class: 'sandbox' }, side, panel);
}
