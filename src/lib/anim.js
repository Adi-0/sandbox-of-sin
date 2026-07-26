/*
 * Animation loop manager.
 * Motion etiquette, enforced centrally:
 *   - every loop gets a real pause/play button
 *   - autoplay only when prefers-reduced-motion is off
 *   - loops halt when their figure scrolls out of view (a dozen live
 *     simulations should not fight over one main thread)
 *   - fixed-step integration with a timestamp delta, so the physics
 *     is frame-rate independent
 */

import { h } from './dom.js';

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const loops = new Set();
let rafId = null;
let last = 0;

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
  last = now;
  let alive = false;
  for (const l of loops) {
    if (l.running && l.visible) { l._advance(dt); alive = true; }
  }
  rafId = alive || loops.size ? requestAnimationFrame(tick) : (last = 0, null);
}

function ensureRaf() {
  if (rafId === null) { last = 0; rafId = requestAnimationFrame(tick); }
}

/**
 * createLoop(el, step, opts)
 *   step(dt, elapsed) is called with seconds.
 *   opts.autoplay  — start running (subject to reduced motion)
 *   opts.speed     — simulated seconds per wall-clock second
 *   opts.maxStep   — largest integration step, seconds (default 1 ms)
 */
export function createLoop(el, step, { autoplay = true, speed = 1, maxStep = 0.001 } = {}) {
  const loop = {
    running: false,
    visible: true,
    elapsed: 0,
    speed,
    _advance(dtWall) {
      let t = dtWall * this.speed;
      // fixed sub-steps keep the neuron integration stable and identical
      // regardless of the display's refresh rate
      let guard = 0;
      while (t > 0 && guard++ < 400) {
        const d = Math.min(maxStep, t);
        this.elapsed += d;
        step(d, this.elapsed);
        t -= d;
      }
    },
    play()  { this.running = true;  sync(); ensureRaf(); },
    pause() { this.running = false; sync(); },
    toggle() { this.running ? this.pause() : this.play(); },
    reset() { this.elapsed = 0; },
    destroy() { loops.delete(loop); },
  };

  const btn = h('button', {
    type: 'button', class: 'btn', 'aria-pressed': 'false', text: 'Play',
    onclick: () => loop.toggle(),
  });
  function sync() {
    btn.textContent = loop.running ? 'Pause' : 'Play';
    btn.setAttribute('aria-pressed', String(loop.running));
  }
  loop.button = btn;

  if (el && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => { loop.visible = entries[0].isIntersecting; if (loop.visible) ensureRaf(); },
      { rootMargin: '120px' }
    );
    io.observe(el);
  }

  loops.add(loop);
  if (autoplay && !reducedMotion()) loop.play();
  else sync();
  return loop;
}

/** Stop and forget every loop — called by the router on navigation. */
export function clearLoops() {
  for (const l of loops) l.running = false;
  loops.clear();
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; last = 0; }
}
