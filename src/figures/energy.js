/* Part 1 figures: the two taxes that motivate the entire field. */

import { figure, knob, scenarios, readout, fmt, rng, s } from '../lib/dom.js';
import { barChart } from '../lib/plot.js';
import { ENERGY_PJ } from '../lib/neuron.js';

/* ---------------------------------------------------------------
   FIGURE 1 — the postage is the cost
   Knob: three scenario buttons choosing where the operand lives.
   Lesson: arithmetic is nearly free; fetching the operand is not.
   --------------------------------------------------------------- */
export function dataTax() {
  const fig = figure({
    n: 1,
    title: 'What one multiplication really costs',
    tag: 'interactive',
    block: 'Energy · picojoules · 45 nm',
    sweep: 'log scale',
    aria: 'Bar chart comparing the energy of a 32-bit multiply with the energy of fetching its operand from a register, cache or main memory.',
    caption: 'Bars are on a <b>logarithmic</b> scale. Drawn linearly at this width, the multiply bar would be about three pixels wide. Figures from Horowitz, <i>Computing’s Energy Problem</i>, ISSCC 2014, measured at 45&nbsp;nm and 0.9&nbsp;V. Newer nodes shrink every bar, but they shrink the arithmetic far more than the memory, so the gap has widened since.',
  });

  const svg = fig.svg('0 0 720 160');
  const chart = barChart(svg, { w: 720, max: 700, log: true, pad: { l: 168, r: 88, t: 6, b: 6 } });

  const rows = {
    mul: chart.add({ label: '32-bit multiply', value: ENERGY_PJ.fpMul, color: 'var(--exc)', note: '3.7 pJ' }),
    reg: chart.add({ label: 'fetch from register', value: 0.1, color: 'var(--ink-3)', note: '0.1 pJ' }),
    sram: chart.add({ label: 'fetch from cache', value: ENERGY_PJ.sramRead, color: 'var(--ink-3)', note: '5 pJ' }),
    dram: chart.add({ label: 'fetch from main memory', value: ENERGY_PJ.dramRead, color: 'var(--ink-3)', note: '640 pJ' }),
  };
  chart.finish();

  const roTotal = readout('Total for one multiply', '—');
  const roWaste = readout('Spent moving, not computing', '—', 'spike');
  const roRatio = readout('Overhead vs the arithmetic', '—', 'v');
  fig.readouts(roTotal.el, roWaste.el, roRatio.el);

  const COSTS = { reg: 0.1, sram: ENERGY_PJ.sramRead, dram: ENERGY_PJ.dramRead };

  function select(where) {
    for (const k of ['reg', 'sram', 'dram']) {
      rows[k].setColor(k === where ? 'var(--spike)' : 'var(--ink-3)');
    }
    const move = COSTS[where];
    const total = move + ENERGY_PJ.fpMul;
    roTotal.set(`${fmt(total, 1)} pJ`);
    roWaste.set(`${fmt((move / total) * 100, 1)} %`);
    roRatio.set(`${fmt(move / ENERGY_PJ.fpMul, move > 100 ? 0 : 1)} ×`);
  }

  const sc = scenarios({
    options: [
      { value: 'reg', label: 'From a register' },
      { value: 'sram', label: 'From cache' },
      { value: 'dram', label: 'From main memory' },
    ],
    value: 'dram',
    onchange: select,
  });
  fig.controls(
    s('span', {}), // spacer keeps the strip aligned with the other figures
    sc.el
  );
  // default state teaches: main memory is the interesting case
  select('dram');
  return fig.root;
}

/* ---------------------------------------------------------------
   FIGURE 2 — the idle tax
   Knob: how much of the time the world is actually doing something.
   Lesson: a clocked machine pays for silence; an event-driven one does not.
   --------------------------------------------------------------- */
export function idleTax() {
  const fig = figure({
    n: 2,
    title: 'Paying attention to nothing',
    tag: 'interactive',
    block: 'Activity · 1 second window',
    aria: 'A one-second timeline comparing a fixed 1 kHz sampling clock against an event-driven sensor that only reports changes, with energy bars for each.',
    caption: 'Drag the slider to the left — the way most of the world actually behaves — and the event-driven row empties while the clocked row stays exactly as dense. <b>Notice the crossover:</b> above roughly 50&nbsp;% activity the event-driven machine is the more expensive one. Sparsity is not a free win; it is a bet on the world being quiet.',
  });

  const W = 720, H = 168;
  const svg = fig.svg(`0 0 ${W} ${H}`);
  const L = 118, R = 24, IW = W - L - R;
  const SLOTS = 200;                     // 200 drawn marks stand in for 1000 real ones
  const rand = rng(7);
  const roll = Array.from({ length: SLOTS }, () => rand());

  const label = (t, y, color = 'var(--ink-2)') => s('text', {
    x: L - 12, y, 'text-anchor': 'end', fill: color,
    'font-family': 'var(--font-mono)', 'font-size': 10.5, text: t,
  });

  // clocked row: always full, never changes
  const clockG = s('g', { stroke: 'var(--ink-3)', 'stroke-width': 1.4 });
  for (let i = 0; i < SLOTS; i++) {
    const x = L + (i + 0.5) * (IW / SLOTS);
    clockG.appendChild(s('line', { x1: x, x2: x, y1: 30, y2: 52 }));
  }
  const eventG = s('g', { stroke: 'var(--spike)', 'stroke-width': 1.8, 'stroke-linecap': 'round' });

  svg.append(
    s('text', { x: L, y: 16, fill: 'var(--ink-3)', 'font-family': 'var(--font-mono)',
      'font-size': 10, 'letter-spacing': '0.12em', text: 'ONE SECOND OF THE WORLD' }),
    clockG,
    label('clocked, 1 kHz', 45),
    eventG,
    label('event-driven', 90, 'var(--spike)'),
    s('line', { x1: L, x2: L + IW, y1: 108, y2: 108, stroke: 'var(--rule)' })
  );

  // energy bars
  const barY = 124, barH = 15;
  const mkBar = (y, color) => {
    const bg = s('rect', { x: L, y, width: IW, height: barH, fill: 'var(--paper-3)', rx: 1 });
    const fg = s('rect', { x: L, y, width: 0, height: barH, fill: color, rx: 1 });
    const txt = s('text', { x: L + 6, y: y + barH - 4, fill: 'var(--paper)',
      'font-family': 'var(--font-mono)', 'font-size': 10, text: '' });
    svg.append(bg, fg, txt);
    return { fg, txt };
  };
  const barClock = mkBar(barY, 'var(--ink-2)');
  const barEvent = mkBar(barY + barH + 6, 'var(--spike)');
  svg.append(
    label('energy, clocked', barY + barH - 4),
    label('energy, event-driven', barY + barH + 6 + barH - 4, 'var(--spike)')
  );

  const roEvents = readout('Events per second', '—', 'spike');
  const roClock  = readout('Clocked, per hour', '—');
  const roEvt    = readout('Event-driven, per hour', '—', 'spike');
  const roWin    = readout('Advantage', '—', 'exc');
  fig.readouts(roEvents.el, roClock.el, roEvt.el, roWin.el);

  // model: 1 nJ per evaluation, 1 kHz clock, 5 nW static leakage
  const CLOCK_HZ = 1000, E_EVAL_NJ = 1, STATIC_NW = 5;
  const CLOCK_NW = CLOCK_HZ * E_EVAL_NJ;   // 1000 nW = 1 µW

  function update(pct) {
    const a = Math.pow(10, (pct - 100) / 33.333);   // 0.1 % … 100 %
    let shown = 0;
    while (eventG.firstChild) eventG.removeChild(eventG.firstChild);
    for (let i = 0; i < SLOTS; i++) {
      if (roll[i] < a) {
        const x = L + (i + 0.5) * (IW / SLOTS);
        eventG.appendChild(s('line', { x1: x, x2: x, y1: 75, y2: 97 }));
        shown++;
      }
    }
    const eventsPerSec = a * CLOCK_HZ;
    const eventNW = eventsPerSec * E_EVAL_NJ + STATIC_NW;

    barClock.fg.setAttribute('width', IW);
    barClock.txt.textContent = '1.0 µW — always';
    const frac = Math.min(1, eventNW / CLOCK_NW);
    barEvent.fg.setAttribute('width', Math.max(2, frac * IW));
    barEvent.txt.textContent = eventNW < 1000 ? `${fmt(eventNW, 0)} nW` : `${fmt(eventNW / 1000, 2)} µW`;
    barEvent.txt.setAttribute('fill', frac > 0.14 ? 'var(--paper)' : 'var(--ink-2)');
    barEvent.txt.setAttribute('x', frac > 0.14 ? L + 6 : L + frac * IW + 6);

    roEvents.set(fmt(eventsPerSec, eventsPerSec < 10 ? 1 : 0));
    roClock.set('3.60 mJ');
    roEvt.set(`${fmt(eventNW * 3600 / 1e6, 3)} mJ`);
    const win = CLOCK_NW / eventNW;
    roWin.set(win >= 1 ? `${fmt(win, win > 20 ? 0 : 1)} × cheaper` : `${fmt(1 / win, 2)} × costlier`);
    roWin.el.querySelector('.ro__v').setAttribute('data-q', win >= 1 ? 'exc' : 'spike');
    void shown;
  }

  const k = knob({
    id: 'idle-activity', label: 'How often the world changes',
    min: 0, max: 100, step: 1, value: 25,
    format: (v) => {
      const a = Math.pow(10, (v - 100) / 33.333) * 100;
      return a < 1 ? `${fmt(a, 2)} % of the time` : `${fmt(a, a < 10 ? 1 : 0)} % of the time`;
    },
    oninput: update,
  });
  fig.controls(k.el);
  update(25);
  return fig.root;
}
