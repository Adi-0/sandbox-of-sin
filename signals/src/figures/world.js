/* Part 10 — Out in the World. Figures 29-30. */

import { figure, knob, readout, fmt, sgn, s } from '../lib/dom.js';
import { scope, note } from '../lib/plot.js';
import { listen, render } from '../lib/audio.js';
import * as L from '../lib/lti.js';

/* ------------------------------------------------------------------
   Figure 29 — a radio station is a spectrum, moved.
   ------------------------------------------------------------------ */

const NEIGHBOURS = [620, 890, 1210, 1520];        // kHz — fixed stations

export function radioFig() {
  const fig = figure({
    n: 29, title: 'Every station is the same spectrum, moved', tag: 'interactive', domains: ['w'],
    aria: 'A speech spectrum at the origin, and copies of it centred on several carrier frequencies across the AM band. A movable station can be slid into or on top of its neighbours.',
    caption: 'Multiplying a signal by a cosine at frequency f<sub>c</sub> does one thing: it picks the spectrum up and sets it down at ±f<sub>c</sub>. Slide the movable station onto a fixed one and the readout turns red — that is a real collision, and it is why the band is divided into 10 kHz channels by regulation rather than politeness. <b>Honest note:</b> the sidebands are drawn hugely exaggerated in width; at this scale a real 10 kHz channel would be a third of a pixel.',
  });

  const svg = fig.svg('0 0 720 250', 'A baseband speech spectrum and its shifted copies across the AM broadcast band.');
  const sc = scope(svg, {
    w: 720, h: 250, pad: { l: 52, r: 18, t: 40, b: 34 },
    x: { min: 0, max: 1800, step: 300, title: 'frequency (kHz)', decimals: 0 },
    y: { min: 0, max: 1.25, ticks: [0, 0.5, 1], title: 'amplitude', decimals: 1 },
  });
  svg.appendChild(note(52, 15, 'THE WHOLE AM BAND, WITH ONE STATION YOU CAN MOVE', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  svg.appendChild(note(702, 15, 'sideband widths hugely exaggerated', { color: 'var(--ink-3)', size: 9.5, anchor: 'end' }));

  const W = 26;                                    // drawn half-width, kHz
  const hump = (centre, height = 1) => {
    const xs = [], ys = [];
    for (let f = centre - W; f <= centre + W; f += 1) {
      xs.push(f); ys.push(height * Math.pow(Math.cos((Math.PI * (f - centre)) / (2 * W)), 2));
    }
    return { xs, ys };
  };

  sc.band(530, 1700, { color: 'var(--in-wash)' });
  sc.text(535, 1.14, 'the licensed AM band, 530 – 1700 kHz', { color: 'var(--ink-3)', size: 9.5 });

  {
    const base = hump(0, 1);
    sc.path({ color: 'var(--in)', width: 2.4 }).set(base.xs.filter((f) => f >= 0), base.ys.slice(base.xs.findIndex((f) => f >= 0)));
    sc.text(6, 1.02, 'the voice itself', { color: 'var(--in)', size: 9.5 });
  }
  for (const f of NEIGHBOURS) {
    const hh = hump(f, 0.8);
    sc.path({ color: 'var(--ink-3)', width: 1.8 }).set(hh.xs, hh.ys);
    sc.text(f, 0.86, `${f}`, { color: 'var(--ink-3)', size: 9, anchor: 'middle', dy: -4 });
  }
  const mine = sc.path({ color: 'var(--out)', width: 2.6 });
  const mineLabel = sc.text(1050, 0.9, 'yours', { color: 'var(--out)', size: 10, anchor: 'middle', dy: -6 });

  const roFc = readout('your carrier', '—', 'out');
  const roBand = readout('you occupy', '—', 'out');
  const roGap = readout('nearest neighbour', '—', 'ok');
  const roFit = readout('stations that fit at 10 kHz each', '117');

  function update(fc) {
    const hh = hump(fc, 0.8);
    mine.set(hh.xs, hh.ys);
    mineLabel.move(fc, 0.9);
    const gap = Math.min(...NEIGHBOURS.map((f) => Math.abs(f - fc)));
    roFc.set(`${fmt(fc, 0)} kHz`, 'out');
    roBand.set(`${fmt(fc - 5, 0)} – ${fmt(fc + 5, 0)} kHz`, 'out');
    roGap.set(`${fmt(gap, 0)} kHz away`, gap < 10 ? 'bad' : 'ok');
  }

  const k = knob({
    id: 'fig29-fc', label: 'your carrier', min: 540, max: 1690, step: 10, value: 1050,
    format: (v) => `${fmt(v, 0)} kHz`,
    oninput: update,
  });

  fig.controls(
    k.el,
    listen({
      label: 'a tone, modulated', seconds: 2.4,
      build: (sr, n) => {
        // A 300 Hz "message" on a 3 kHz "carrier" — the real ratio is a
        // hundred times larger and entirely inaudible, so the carrier is
        // brought down into the audio band to make the shape hearable.
        const half = Math.round(n / 2.4);
        const gap = Math.round(0.18 * sr);
        const out = new Float32Array(half * 2 + gap);
        const msg = render((t) => Math.sin(L.TAU * 300 * t), sr, half);
        const am = render((t) => (1 + 0.8 * Math.sin(L.TAU * 300 * t)) * Math.sin(L.TAU * 3000 * t), sr, half);
        for (let i = 0; i < half; i++) { out[i] = msg[i] * 0.55; out[half + gap + i] = am[i] * 0.45; }
        return out;
      },
    })
  );
  fig.readouts(roFc.el, roBand.el, roGap.el, roFit.el);
  update(1050);
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 30 — cruise control.

   The plant is Figure 23's three lags, wearing a car: an engine that
   takes ten seconds to deliver, a body that takes one to respond, and a
   speedometer half a second behind. Same poles, same cliff at K ≈ 35.
   ------------------------------------------------------------------ */

const CAR = L.threeLag(1);
const TARGET = 100;                                // km/h
const HILL = -15;                                  // km/h, if uncorrected
const HILL_AT = 60;                                // s

export function cruiseFig() {
  const fig = figure({
    n: 30, title: 'Cruise control', tag: 'interactive', domains: ['t'],
    aria: 'The speed of a car under cruise control, settling towards a target and then meeting a hill. Higher gain reduces the error but makes the response oscillate, and above about 35 the car surges uncontrollably.',
    caption: 'Every number here comes from the same three poles as Figure 23 — this is that figure wearing a car. Notice that the car never quite reaches 100: a controller that acts only on the present error must <b>keep</b> an error in order to keep pushing. Curing that is the integral term of a PID controller, and it is the first thing you would learn next.',
  });

  const svg = fig.svg('0 0 720 270', 'Car speed against time under proportional cruise control, with a hill at sixty seconds.');
  const sc = scope(svg, {
    w: 720, h: 270, pad: { l: 56, r: 18, t: 30, b: 34 },
    x: { min: 0, max: 150, step: 25, title: 'time (seconds)', decimals: 0 },
    y: { min: 0, max: 160, step: 40, title: 'speed (km/h)', decimals: 0 },
  });
  svg.appendChild(note(56, 16, 'SET TO 100 km/h · A HILL AT 60 SECONDS', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  sc.hline(TARGET, { color: 'var(--ink-3)', dash: '4 4', label: 'what you asked for' });
  sc.vline(HILL_AT, { color: 'var(--ink-3)', dash: '2 4', label: 'the hill' });
  const speed = sc.path({ color: 'var(--out)', width: 2.6 });

  const roK = readout('gain K', '—', 'sys');
  const roCruise = readout('settles at', '—', 'out');
  const roSag = readout('sags on the hill by', '—', 'out');
  const roOver = readout('overshoot', '—');
  const roVerdict = readout('verdict', '—', 'ok');

  const NT = 900, DT = 150 / (NT - 1);
  const tsec = Array.from({ length: NT }, (_, i) => i * DT);

  function update(K) {
    // Superposition, straight out of Part 2: the answer to the target and
    // the answer to the hill, computed separately and added.
    const T = L.closeLoop(CAR, K);
    const den = T.a;
    const dist = { zeros: [], poles: T.poles, k: 1, b: CAR.b.map((c) => c / (den[den.length - 1] || 1)), a: den };
    const yRef = L.lsim(T, () => TARGET, DT, NT);
    const yDis = L.lsim(dist, (t) => (t >= HILL_AT ? HILL : 0), DT, NT);
    const y = Array.from({ length: NT }, (_, i) => yRef[i] + yDis[i]);
    speed.set(tsec, y);

    const worst = Math.max(...T.poles.map((p) => (typeof p === 'number' ? p : p.re)));
    const cruise = y[Math.round(55 / DT)];
    const sag = cruise - Math.min(...y.slice(Math.round(HILL_AT / DT), Math.round(120 / DT)));
    const over = Math.max(...y.slice(0, Math.round(HILL_AT / DT))) - TARGET;

    roK.set(fmt(K, 1), 'sys');
    roCruise.set(worst > 0 ? '—' : `${fmt(cruise, 1)} km/h`, 'out');
    roSag.set(worst > 0 ? '—' : `${fmt(sag, 1)} km/h`, 'out');
    roOver.set(worst > 0 ? '—' : `${fmt(Math.max(0, over), 1)} km/h`);
    roVerdict.set(
      worst > 0 ? 'surging — the car is out of control'
        : worst > -0.06 ? 'wallowing — technically stable'
        : over > 6 ? 'nervous, but it gets there'
        : K < 4 ? 'placid, and badly off target' : 'a decent compromise',
      worst > 0 ? 'bad' : worst > -0.06 ? 'warn' : 'ok'
    );
  }

  const k = knob({
    id: 'fig30-k', label: 'controller gain', min: 1, max: 50, step: 0.5, value: 10,
    format: (v) => `K = ${fmt(v, 1)}`,
    oninput: update,
  });

  fig.controls(k.el);
  fig.readouts(roK.el, roCruise.el, roSag.el, roOver.el, roVerdict.el);
  update(10);
  return fig.root;
}
