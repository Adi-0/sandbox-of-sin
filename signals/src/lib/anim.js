/*
 * anim.js — one animation loop manager for the whole guide.
 *
 * Motion etiquette, enforced centrally so no figure can forget it:
 *   - every loop hands you a real pause/play button
 *   - nothing auto-plays when prefers-reduced-motion is set
 *   - loops stop while their figure is scrolled off screen, so a dozen
 *     live simulations do not fight over one main thread
 *   - time advances by measured timestamp deltas, never by frame count,
 *     so a 120 Hz display and a 60 Hz display show the same physics
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
  for (const l of loops) if (l.running && l.visible) l._advance(dt);
  rafId = loops.size ? requestAnimationFrame(tick) : ((last = 0), null);
}

function ensureRaf() {
  if (rafId === null) { last = 0; rafId = requestAnimationFrame(tick); }
}

/**
 * createLoop(el, step, opts)
 *   step(dt, elapsed) is called with seconds of *simulated* time.
 *   opts.autoplay  start running (unless reduced motion is on)
 *   opts.speed     simulated seconds per wall-clock second
 *   opts.label     button text when paused, default 'Play'
 */
export function createLoop(el, step, { autoplay = true, speed = 1, label = 'Play' } = {}) {
  const loop = {
    running: false,
    visible: true,
    elapsed: 0,
    speed,
    _advance(dtWall) {
      const d = dtWall * this.speed;
      this.elapsed += d;
      step(d, this.elapsed);
    },
    play() { this.running = true; sync(); ensureRaf(); },
    pause() { this.running = false; sync(); },
    toggle() { this.running ? this.pause() : this.play(); },
    reset() { this.elapsed = 0; },
  };

  const btn = h('button', {
    type: 'button', class: 'btn', 'aria-pressed': 'false', text: label,
    onclick: () => loop.toggle(),
  });
  function sync() {
    btn.textContent = loop.running ? 'Pause' : label;
    btn.setAttribute('aria-pressed', String(loop.running));
  }
  loop.button = btn;

  if (el && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => { loop.visible = entries[0].isIntersecting; if (loop.visible) ensureRaf(); },
      { rootMargin: '140px' }
    );
    io.observe(el);
  }

  loops.add(loop);
  if (autoplay && !reducedMotion()) loop.play(); else sync();
  return loop;
}

/** Stop and forget every loop. The router calls this on navigation. */
export function clearLoops() {
  for (const l of loops) l.running = false;
  loops.clear();
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; last = 0; }
}
