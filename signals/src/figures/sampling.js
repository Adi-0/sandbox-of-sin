/* Part 9 — Photographs of a Signal. Figures 26-28. */

import { figure, knob, readout, fmt, sgn, s } from '../lib/dom.js';
import { scope, note } from '../lib/plot.js';
import { createLoop } from '../lib/anim.js';
import { listen, EAR, render } from '../lib/audio.js';
import * as L from '../lib/lti.js';

const FS = 1000;                                  // the recurring sample rate

/* ------------------------------------------------------------------
   Figure 26 — the ghost.

   Sample rate fixed at 1 kHz; the tone is what moves. At 900 Hz the
   ghost lands on 100 Hz — the fundamental the reader has been staring
   at since Part 1.
   ------------------------------------------------------------------ */

export function samplingFig() {
  const fig = figure({
    n: 26, title: 'The tone you sent, and the ghost that comes back', tag: 'listen', domains: ['t'],
    aria: 'A grey dashed sinusoid with orange sample dots on it, and an orange curve reconstructed from those dots. Above the Nyquist frequency the reconstructed curve is a different, lower tone that passes through every dot.',
    caption: 'Above 500 Hz the orange curve is not an approximation of the grey one — it passes through <b>every single sample exactly</b> and is a different tone entirely. Nothing has gone wrong with the arithmetic; the samples are simply consistent with two answers, and there is no way, from the dots alone, to tell which one you meant. Try 900 Hz and read the ghost\'s frequency.',
  });

  const svg = fig.svg('0 0 720 250', 'A sinusoid, its samples, and the lower-frequency tone reconstructed from them.');
  const sc = scope(svg, {
    w: 720, h: 250, pad: { l: 52, r: 18, t: 28, b: 34 },
    x: { min: 0, max: 20, step: 5, title: 'time (ms)  —  the dots are 1 ms apart', decimals: 0 },
    y: { min: -1.35, max: 1.35, ticks: [-1, 0, 1], title: 'amplitude', decimals: 0 },
  });
  svg.appendChild(note(52, 15, 'SAMPLED 1000 TIMES A SECOND', { color: 'var(--ink-2)', size: 10, weight: 600 }));
  sc.hline(0, { color: 'var(--grid-major)', dash: null });

  const truePath = sc.path({ color: 'var(--ink-3)', width: 1.4, dash: '4 4' });
  const ghostPath = sc.path({ color: 'var(--out)', width: 2.6 });
  const sampleDots = sc.dots({ color: 'var(--in)', r: 3.6 });
  sc.text(0.15, 1.2, 'grey dashed: what you sent · blue dots: all the machine keeps · orange: what comes back', { color: 'var(--ink-3)', size: 9.5 });

  const roF = readout('tone sent', '—', 'in');
  const roNy = readout('Nyquist = fs/2', '500 Hz');
  const roBack = readout('what comes back', '—', 'out');
  const roVerdict = readout('verdict', '—', 'ok');

  const tms = Array.from(L.linspace(0, 20, 900));
  const sampT = Array.from({ length: 21 }, (_, i) => i);
  let freq = 900;

  function update(f) {
    freq = f;
    const alias = L.aliasOf(f, FS);
    truePath.set(tms, tms.map((ms) => Math.sin(L.TAU * f * (ms / 1000))));
    sampleDots.set(sampT, sampT.map((ms) => Math.sin(L.TAU * f * (ms / 1000))));

    // The exact reconstruction of a sampled sinusoid is a sinusoid at the
    // alias frequency — with a sign flip on the phase when the tone has
    // folded back off the Nyquist wall.
    const folded = Math.floor(f / (FS / 2)) % 2 === 1;
    ghostPath.set(tms, tms.map((ms) => Math.sin((folded ? -1 : 1) * L.TAU * alias * (ms / 1000))));

    roF.set(`${fmt(f, 0)} Hz`, 'in');
    roBack.set(`${fmt(alias, 0)} Hz`, alias === f ? 'ok' : 'out');
    roVerdict.set(alias === f ? 'faithful — below Nyquist' : 'a ghost — this tone is lost', alias === f ? 'ok' : 'bad');
  }

  const k = knob({
    id: 'fig26-f', label: 'tone frequency', min: 50, max: 1900, step: 10, value: 900,
    format: (v) => `${fmt(v, 0)} Hz`,
    oninput: update,
  });

  fig.controls(
    k.el,
    listen({
      label: 'sent, then received', seconds: 2.2,
      build: (sr, n) => {
        const half = Math.round(n / 2.2);
        const gap = Math.round(0.18 * sr);
        const out = new Float32Array(half * 2 + gap);
        const sent = render((t) => Math.sin(L.TAU * freq * EAR * t), sr, half);
        const back = render((t) => Math.sin(L.TAU * L.aliasOf(freq, FS) * EAR * t), sr, half);
        for (let i = 0; i < half; i++) { out[i] = sent[i] * 0.6; out[half + gap + i] = back[i] * 0.6; }
        return out;
      },
    }),
    listen({
      label: 'sweep it past the wall', seconds: 3.4,
      build: (sr, n) => {
        // sweep 100 Hz -> 1900 Hz; you hear it rise, hit Nyquist, and fall
        const out = new Float32Array(n);
        let phase = 0;
        for (let i = 0; i < n; i++) {
          const f = 100 + (1800 * i) / n;
          phase += (L.TAU * L.aliasOf(f, FS) * EAR) / sr;
          out[i] = Math.sin(phase) * 0.6;
        }
        return out;
      },
    })
  );
  fig.readouts(roF.el, roNy.el, roBack.el, roVerdict.el);
  update(900);
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 27 — the same event, seen in the frequency room.
   ------------------------------------------------------------------ */

export function copiesFig() {
  const fig = figure({
    n: 27, title: 'Sampling makes copies', tag: 'interactive', domains: ['w'],
    aria: 'A spectrum blob at the origin with identical copies centred at multiples of the sample rate. As the sample rate falls the copies slide inwards and begin to overlap.',
    caption: 'This is the whole sampling theorem in one picture. Sampling does not blur the spectrum or lose detail — it <b>duplicates</b> it at every multiple of the sample rate. Keep the copies apart and you can throw the extras away and recover the original perfectly. Let them touch and the overlap is permanent: the shaded region belongs to two copies at once, and no filter can separate them again.',
  });

  const B = 400;                                   // the signal's bandwidth, Hz
  const svg = fig.svg('0 0 720 250', 'A spectrum and its repeated copies at multiples of the sample rate.');
  const sc = scope(svg, {
    w: 720, h: 250, pad: { l: 52, r: 18, t: 28, b: 34 },
    x: { min: -2600, max: 2600, step: 650, title: 'frequency (Hz)', decimals: 0 },
    y: { min: 0, max: 1.3, ticks: [0, 0.5, 1], title: 'X(f)', decimals: 1 },
  });
  svg.appendChild(note(52, 15, 'THE SPECTRUM, AFTER SAMPLING', { color: 'var(--ink-2)', size: 10, weight: 600 }));

  const blob = (centre) => {
    const xs = [], ys = [];
    for (let f = centre - B; f <= centre + B; f += 8) {
      xs.push(f); ys.push(Math.pow(Math.cos((Math.PI * (f - centre)) / (2 * B)), 2));
    }
    return { xs, ys };
  };

  const copies = Array.from({ length: 6 }, () => sc.path({ color: 'var(--tone)', width: 1.6 }));
  const original = sc.path({ color: 'var(--in)', width: 2.6 });
  const overlapBand = sc.band(0, 0, { color: 'var(--out-wash)' });
  const nyqLo = sc.vline(-500, { color: 'var(--ink-3)', dash: '3 4' });
  const nyqHi = sc.vline(500, { color: 'var(--ink-3)', dash: '3 4', label: 'fs/2' });
  sc.text(-2560, 1.16, 'blue: the original · green: the copies sampling creates', { color: 'var(--ink-3)', size: 9.5 });

  const roFs = readout('sample rate', '—', 'in');
  const roNy = readout('Nyquist', '—');
  const roB = readout('signal reaches to', '400 Hz', 'tone');
  const roVerdict = readout('verdict', '—', 'ok');

  {
    const o = blob(0);
    original.set(o.xs, o.ys);
  }

  function update(fs) {
    let ci = 0;
    for (const k of [-3, -2, -1, 1, 2, 3]) {
      const c = blob(k * fs);
      copies[ci].show(Math.abs(k * fs) - B < 2600);
      copies[ci].set(c.xs, c.ys);
      ci++;
    }
    nyqLo.move(-fs / 2); nyqHi.move(fs / 2, 'fs/2');

    const overlapping = fs < 2 * B;
    overlapBand.show(overlapping);
    if (overlapping) overlapBand.set(fs - B, B);

    roFs.set(`${fmt(fs, 0)} Hz`, 'in');
    roNy.set(`${fmt(fs / 2, 0)} Hz`);
    roVerdict.set(overlapping ? `overlapping — ${fmt(B - (fs - B), 0)} Hz of damage` : 'clean — a gap between copies',
                  overlapping ? 'bad' : 'ok');
  }

  const k = knob({
    id: 'fig27-fs', label: 'sample rate', min: 500, max: 2400, step: 20, value: 1000,
    format: (v) => `${fmt(v, 0)} Hz`,
    oninput: update,
  });

  fig.controls(k.el);
  fig.readouts(roFs.el, roNy.el, roB.el, roVerdict.el);
  update(1000);
  return fig.root;
}

/* ------------------------------------------------------------------
   Figure 28 — the wagon wheel. The one everybody has already seen.
   ------------------------------------------------------------------ */

export function wagonWheelFig() {
  const fig = figure({
    n: 28, title: 'The wagon wheel', tag: 'interactive', domains: ['n'],
    aria: 'Two wheels side by side. The left one turns smoothly; the right one is shown only at camera shutter instants and can appear to turn slowly backwards.',
    caption: 'The wheel on the right is the wheel on the left, drawn only at the shutter instants. At 25 frames a second a wheel turning 24 times a second is caught one twenty-fifth of a turn short each frame, so it appears to creep <b>backwards</b> at one turn a second. Every sample is correct. The story they tell together is a fiction, and it is the same fiction as the orange curve in Figure 26.',
  });

  const svg = fig.svg('0 0 720 260', 'A smoothly rotating wheel beside a strobed wheel that can appear to rotate backwards.');
  const TRUE_RPS = 24;
  const SPOKES = 5;
  const LC = 190, RC = 530, CY = 132, R = 88;

  for (const [cx, label] of [[LC, 'THE REAL WHEEL — 24 turns a second'], [RC, 'THROUGH THE CAMERA']]) {
    svg.appendChild(s('circle', { cx, cy: CY, r: R, fill: 'none', stroke: 'var(--grid-major)', 'stroke-width': 1.4 }));
    svg.appendChild(s('circle', { cx, cy: CY, r: 5, fill: 'var(--ink-3)' }));
    svg.appendChild(note(cx, 30, label, { color: 'var(--ink-2)', size: 10, weight: 600, anchor: 'middle' }));
  }

  const spokes = [[], []];
  [LC, RC].forEach((cx, side) => {
    for (let i = 0; i < SPOKES; i++) {
      const line = s('line', {
        stroke: side ? 'var(--out)' : 'var(--in)', 'stroke-width': i === 0 ? 4 : 2.2, 'stroke-linecap': 'round',
      });
      svg.appendChild(line);
      spokes[side].push(line);
    }
  });

  const roFps = readout('camera', '—', 'in');
  const roTrue = readout('the wheel really turns', '+24.0 /s', 'tone');
  const roApp = readout('it appears to turn', '—', 'out');
  const roVerdict = readout('verdict', '—', 'ok');

  let fps = 25;

  function drawWheel(side, angle) {
    for (let i = 0; i < SPOKES; i++) {
      const a = angle + (i * L.TAU) / SPOKES;
      const cx = side ? RC : LC;
      spokes[side][i].setAttribute('x1', cx);
      spokes[side][i].setAttribute('y1', CY);
      spokes[side][i].setAttribute('x2', cx + R * Math.cos(a));
      spokes[side][i].setAttribute('y2', CY - R * Math.sin(a));
    }
  }

  function apparent(f) {
    // signed: how far the wheel seems to move per frame, unwrapped to the
    // smallest turn that explains it
    const perFrame = TRUE_RPS / f;
    return (perFrame - Math.round(perFrame)) * f;
  }

  function setFps(v) {
    fps = v;
    const app = apparent(v);
    roFps.set(`${fmt(v, 0)} frames/s`, 'in');
    roApp.set(`${sgn(app, 1)} /s${app < -0.05 ? '  — backwards' : app > -0.05 && app < 0.05 ? '  — frozen' : ''}`,
              Math.abs(app - TRUE_RPS) < 0.05 ? 'ok' : 'out');
    roVerdict.set(v > 2 * TRUE_RPS ? 'fast enough — the truth' : 'too slow — a fiction', v > 2 * TRUE_RPS ? 'ok' : 'bad');
  }

  const loop = createLoop(fig.root, (dt, elapsed) => {
    const slow = 0.06;                       // wall-clock is slowed so the eye can follow
    const trueAngle = L.TAU * TRUE_RPS * elapsed * slow;
    drawWheel(0, trueAngle);
    const frame = Math.floor(elapsed * fps * slow * 40) / (fps * slow * 40);
    drawWheel(1, L.TAU * TRUE_RPS * frame * slow);
  }, { autoplay: true, speed: 1 });

  const k = knob({
    id: 'fig28-fps', label: 'camera frame rate', min: 10, max: 60, step: 1, value: 25,
    format: (v) => `${fmt(v, 0)} fps`,
    oninput: setFps,
  });

  fig.controls(k.el, loop.button);
  fig.readouts(roFps.el, roTrue.el, roApp.el, roVerdict.el);
  setFps(25);
  drawWheel(0, 0); drawWheel(1, 0);
  return fig.root;
}
