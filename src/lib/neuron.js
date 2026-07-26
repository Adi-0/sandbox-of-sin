/*
 * THE SHARED SPIKING ENGINE.
 *
 * Every figure in this guide — from the first leaky bucket to the
 * sandbox — runs on this file. That is deliberate: one model, one set
 * of parameters, one recurring cast of numbers the reader learns once.
 *
 * The cast:
 *   tau_m  = 20 ms      membrane time constant (how fast the bucket leaks)
 *   R      = 100 MOhm   input resistance -> 100 mV of drive per nA
 *   V_th   = 20 mV      threshold, measured from rest
 *   V_reset= 0 mV       back to the floor after a spike
 *   tau_ref= 2 ms       refractory period (righting the bucket)
 *
 * Consequences worth memorising, all exact for these numbers:
 *   rheobase        = V_th / R = 0.2 nA   (below this: silence, forever)
 *   I = 0.4 nA      -> 63 Hz
 *   I = 0.6 nA      -> 99 Hz
 *
 * Units: voltage mV, current nA, time SECONDS, weight mV per spike.
 */

export const CAST = Object.freeze({
  tauM: 0.020,
  R: 100,
  vRest: 0,
  vTh: 20,
  vReset: 0,
  tauRef: 0.002,
});

/** Leaky integrate-and-fire neuron. */
export class LIF {
  constructor(p = {}) {
    this.p = { ...CAST, ...p };
    this.reset();
  }
  reset(v = this.p.vRest) {
    this.v = v;
    this.t = 0;
    this.refUntil = -1;
    this.spiked = false;
    this.lastSpike = -Infinity;
    this.count = 0;
  }
  /**
   * Advance dt seconds.
   *   I       — sustained input current, nA
   *   inject  — instantaneous synaptic kick this step, mV
   * Returns true on the step where it spikes.
   */
  step(dt, I = 0, inject = 0) {
    const p = this.p;
    this.t += dt;
    this.spiked = false;

    if (this.t < this.refUntil) { this.v = p.vReset; return false; }

    if (inject) this.v += inject;

    // Exact solution over the step for constant I — stable at any dt.
    const vInf = p.vRest + p.R * I;
    this.v = vInf + (this.v - vInf) * Math.exp(-dt / p.tauM);

    if (this.v >= p.vTh) {
      this.v = p.vReset;
      this.refUntil = this.t + p.tauRef;
      this.spiked = true;
      this.lastSpike = this.t;
      this.count++;
      return true;
    }
    return false;
  }
}

/** Analytic firing rate for a constant current. Hz. */
export function rateFromCurrent(I, p = CAST) {
  const drive = p.R * I;
  const th = p.vTh - p.vRest;
  if (drive <= th) return 0;
  return 1 / (p.tauRef + p.tauM * Math.log(drive / (drive - th)));
}

/** The current below which the neuron is silent no matter how long you wait. nA. */
export const rheobase = (p = CAST) => (p.vTh - p.vRest) / p.R;

/** Steady-state voltage a sub-threshold current settles at. mV. */
export const steadyV = (I, p = CAST) => p.vRest + p.R * I;

/* ---------------------------------------------------------------- */
/*  Spike sources                                                    */
/* ---------------------------------------------------------------- */

/** Poisson spike train — the standard stand-in for "irregular input". */
export class Poisson {
  constructor(rate, rand = Math.random) { this.rate = rate; this.rand = rand; }
  step(dt) { return this.rand() < this.rate * dt; }
}

/** Perfectly regular spike train, for figures where jitter would confuse. */
export class Metronome {
  constructor(rate, phase = 0) { this.rate = rate; this.acc = phase; }
  step(dt) {
    if (this.rate <= 0) return false;
    this.acc += dt * this.rate;
    if (this.acc >= 1) { this.acc -= 1; return true; }
    return false;
  }
}

/* ---------------------------------------------------------------- */
/*  Synapses, plasticity, networks                                   */
/* ---------------------------------------------------------------- */

/** Spike-timing-dependent plasticity window. */
/*
 * Amplitudes are near-equal; the asymmetry that matters lives in the time
 * constants. What decides whether an uncorrelated synapse drifts up or down
 * is the AREA under each lobe, A*tau. Here that is
 *      weakening / strengthening = (0.0105 * 34) / (0.010 * 20) = 1.8
 * so random timing nets out negative and useless synapses starve. Measured
 * windows (Bi & Poo 1998) also have the longer tail on the weakening side.
 */
export const STDP = Object.freeze({
  aPlus: 0.010,      // max strengthening, as a fraction of wMax
  aMinus: 0.0105,    // max weakening
  tauPlus: 0.020,    // 20 ms — the membrane's own time constant
  tauMinus: 0.034,   // deliberately longer: the weakening lobe reaches further
});

/**
 * Weight change for one pre/post pair.
 *   dt = t_post - t_pre, in seconds.
 *   dt > 0  (pre fired first, so it may have helped cause the spike) -> strengthen
 *   dt < 0  (pre fired after, so it cannot have helped)              -> weaken
 */
export function deltaW(dt, s = STDP) {
  if (dt === 0) return 0;
  return dt > 0
    ?  s.aPlus  * Math.exp(-dt / s.tauPlus)
    : -s.aMinus * Math.exp( dt / s.tauMinus);
}

/**
 * A small event-driven network: neurons, weighted delayed connections,
 * optional STDP on the input weights. Used by the wiring, learning and
 * sandbox figures so they cannot drift apart.
 */
export class Network {
  constructor({ n = 1, params = {}, seed = 20 } = {}) {
    this.neurons = Array.from({ length: n }, () => new LIF(params));
    this.edges = [];          // {from, to, w, delay, kind}
    this.queue = [];          // pending {t, to, mV}
    this.t = 0;
    this.spikes = [];         // {t, i} log, trimmed by the caller
    void seed;
  }
  addNeuron(params = {}) { this.neurons.push(new LIF(params)); return this.neurons.length - 1; }
  connect(from, to, w, delay = 0.001) {
    this.edges.push({ from, to, w, delay, kind: w >= 0 ? 'exc' : 'inh' });
    return this.edges[this.edges.length - 1];
  }
  /** Deliver an external kick to neuron i, mV, at the next step. */
  inject(i, mV) { this.queue.push({ t: this.t, to: i, mV }); }

  step(dt, currents = []) {
    this.t += dt;
    const inbox = new Float64Array(this.neurons.length);
    this.queue = this.queue.filter((e) => {
      if (e.t <= this.t) { inbox[e.to] += e.mV; return false; }
      return true;
    });
    const fired = [];
    for (let i = 0; i < this.neurons.length; i++) {
      if (this.neurons[i].step(dt, currents[i] || 0, inbox[i])) fired.push(i);
    }
    for (const i of fired) {
      this.spikes.push({ t: this.t, i });
      for (const e of this.edges) {
        if (e.from === i) this.queue.push({ t: this.t + e.delay, to: e.to, mV: e.w });
      }
    }
    return fired;
  }
  trimSpikes(window) {
    const cutoff = this.t - window;
    while (this.spikes.length && this.spikes[0].t < cutoff) this.spikes.shift();
  }
}

/* ---------------------------------------------------------------- */
/*  Energy accounting — the numbers Part 1 and Part 6 argue with     */
/* ---------------------------------------------------------------- */

/**
 * Published per-operation energies. Sources are named in the prose;
 * all of them are order-of-magnitude claims, not spec guarantees.
 *
 * Horowitz, "Computing's Energy Problem", ISSCC 2014 — 45 nm, 0.9 V.
 * Loihi synaptic-operation energy — Davies et al., IEEE Micro 2018.
 */
export const ENERGY_PJ = Object.freeze({
  intAdd: 0.1,
  fpAdd: 0.9,
  intMul: 3.1,
  fpMul: 3.7,
  sramRead: 5,      // 32 bit, 8 KB cache
  dramRead: 640,    // 32 bit
  loihiSynOp: 23.6, // one spike arriving at one synapse
});

/** A scrolling fixed-length trace buffer. */
export class Trace {
  constructor(capacity) {
    this.cap = capacity;
    this.xs = [];
    this.ys = [];
  }
  push(x, y) {
    this.xs.push(x); this.ys.push(y);
    if (this.xs.length > this.cap) { this.xs.shift(); this.ys.shift(); }
  }
  clear() { this.xs.length = 0; this.ys.length = 0; }
  get length() { return this.xs.length; }
}
