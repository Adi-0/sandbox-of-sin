/* ==========================================================================
   problems/comms.js — generators for Communications.

   Part 1 (13.B): Fourier transforms. The exam does not ask for the integral.
   It asks whether you can recognise a pair, apply a property, and convert
   between a pulse width and the bandwidth it needs.

   The distractors are the errors that survive into the rest of the module:
   inverting the time-bandwidth relation, forgetting that a frequency shift
   halves the amplitude and produces TWO copies, and confusing a time shift
   (phase only) with a frequency shift (magnitude moves).
   ========================================================================== */

import { defineProblem, defineReflex } from "../lib/bench.js";
import { num, fixed, sig } from "../lib/fmt.js";
import { amPower } from "../lib/comms.js";

const T = (s) => `<span data-tex="${s.replace(/"/g, "&quot;")}"></span>`;
const D = (s) => `<span class="math display" data-tex="${s.replace(/"/g, "&quot;")}"></span>`;

/** Right answer first; duplicates dropped, topped up from `spare`. */
function options(right, wrong, spare = []) {
  const norm = (c) => (typeof c === "string" ? { text: c, why: "" } : c);
  const key = (c) => c.tex ?? c.html ?? String(c.text ?? "");
  const seen = new Set();
  const out = [];
  for (const c of [right, ...wrong, ...spare]) {
    const n = norm(c);
    if (seen.has(key(n))) continue;
    seen.add(key(n));
    out.push(n);
    if (out.length === 4) break;
  }
  return out;
}

/* ==========================================================================
   Part 1 — Fourier transforms and duality
   ========================================================================== */

defineProblem("ft-pair", {
  topic: "Fourier transform pairs",
  lookup: "Electrical → Communications → Fourier transform pairs",
  make(rng) {
    const which = rng.pick(["rect", "delta", "dc", "tri"]);
    const CASES = {
      rect: {
        stem: "A single rectangular pulse of width τ. What is the shape of its magnitude spectrum?",
        right: { text: "a sinc, with nulls at every multiple of 1/τ" },
        wrong: [
          { text: "another rectangle, of width 1/τ", why: `That would be an <b>ideal</b> band-limited spectrum, which no time-limited pulse has. A signal cannot be finite in both time and frequency — this is the duality, and the rectangle is the extreme case of it.` },
          { text: "a sinc, with nulls at every multiple of τ", why: `The nulls are at multiples of <b>1/τ</b>, not τ. Check the units: nulls are a frequency, so they must be a reciprocal time.` },
          { text: "a decaying exponential", why: `That is the transform of a Lorentzian, not of a rectangle. A rectangle's transform rings — it has <b>zero crossings</b> — because the pulse has sharp edges.` },
        ],
        steps: [
          `<b>Recognise, do not integrate.</b> rect ↔ sinc is the pair the exam uses most, because a rectangle is what a single bit looks like.`,
          D(`\\text{rect}(t/\\tau) \\ \\longleftrightarrow \\ \\tau\\,\\text{sinc}(f\\tau)`),
          `<b>Nulls wherever fτ is a whole number</b>, so at f = 1/τ, 2/τ, 3/τ, … The first null is the usual working definition of the pulse's bandwidth.`,
          `Note the tails never stop. <b>A perfectly square pulse needs infinite bandwidth</b>, which is why real systems shape their pulses.`,
        ],
      },
      tri: {
        stem: "A triangular pulse and a rectangular pulse have the same width. How do their spectra differ?",
        right: { text: "same first null; the triangle's tails fall off faster" },
        wrong: [
          { text: "the triangle's first null is at twice the frequency", why: `The first null is set by the pulse <b>width</b>, which is the same for both. What differs is how fast the tails decay beyond it.` },
          { text: "they are identical", why: `A triangle is smoother than a rectangle, and smoother always means a faster-decaying spectrum — sinc² rather than sinc.` },
          { text: "the triangle's spectrum is a rectangle", why: `Nothing time-limited has a rectangular spectrum. The triangle transforms to <b>sinc²</b>.` },
        ],
        steps: [
          `A triangle is two rectangles convolved, and convolution in time is <b>multiplication</b> in frequency — so the transform is the sinc squared.`,
          D(`\\text{tri} \\ \\longleftrightarrow \\ \\tau\\,\\text{sinc}^2(f\\tau)`),
          `<b>Squaring keeps the zeros where they are</b> but pushes the tails down: they now fall as 1/f² instead of 1/f.`,
          `This is the same rule Signal Processing Part 1 gave for periodic waves — <b>a jump costs 1/k, a corner costs 1/k²</b> — restated for a single pulse. The triangle has corners; the rectangle has jumps.`,
        ],
      },
      delta: {
        stem: "What is the Fourier transform of an impulse, δ(t)?",
        right: { text: "a constant — every frequency, equally" },
        wrong: [
          { text: "another impulse, δ(f)", why: `That is the transform of a <b>constant</b>, not of an impulse. The two are duals of each other, and swapping them is the classic slip.` },
          { text: "zero everywhere", why: `An impulse has unit area, so its transform at f = 0 is 1, not 0.` },
          { text: "a sinc", why: `A sinc comes from a rectangle of finite width. An impulse is the limit as that width goes to zero, and the sinc widens to a constant as it does.` },
        ],
        steps: [
          `Substitute into the definition — the sifting property does the integral for you:`,
          D(`X(f) = \\int \\delta(t)e^{-j2\\pi ft}dt = e^{0} = 1`),
          `<b>An instant contains every frequency in equal measure.</b> That is why striking anything sharply excites all of its resonances at once.`,
          `The dual is worth memorising alongside it: <b>a constant transforms to δ(f)</b> — something that never changes contains only DC. These two are the endpoints of the whole duality.`,
        ],
      },
      dc: {
        stem: "A signal is a constant, x(t) = 1 for all time. What is its spectrum?",
        right: { text: "an impulse at f = 0" },
        wrong: [
          { text: "a constant at every frequency", why: `That is the transform of an <b>impulse in time</b>. You have the duality the wrong way round: a signal that never changes contains only DC.` },
          { text: "zero everywhere", why: `A constant is not nothing — it is DC, and DC is a frequency.` },
          { text: "a sinc centred at zero", why: `A sinc comes from a rectangle of finite duration. A constant lasts for ever, which is the limit as that duration grows without bound.` },
        ],
        steps: [
          `Think about what frequencies a constant can contain. <b>It never changes</b>, so nothing oscillates — the only component is DC.`,
          D(`1 \\ \\longleftrightarrow \\ \\delta(f)`),
          `<b>All the energy at one frequency</b>, which is what an impulse in the frequency domain means.`,
          `Pair it with its dual, δ(t) ↔ 1. <b>The more spread out a signal is in one domain, the more concentrated it is in the other</b>, and these two are the extreme case.`,
        ],
      },
    }[which];
    return {
      stem: CASES.stem,
      choices: options(CASES.right, CASES.wrong),
      answer: 0,
      steps: CASES.steps,
    };
  },
});

defineProblem("time-bandwidth", {
  topic: "Pulse width and bandwidth",
  lookup: "Electrical → Communications → Time-bandwidth / pulse spectra",
  make(rng) {
    const mode = rng.pick(["bw", "bw", "tau", "scale"]);

    /* --- bandwidth of a pulse of stated width --------------------------- */
    if (mode === "bw") {
      const tau = rng.pick([1, 2, 5, 10, 20, 50]);      // microseconds
      const bw = 1000 / tau;                            // kHz, first null
      return {
        stem: `A rectangular pulse is ${num(tau, 0)} μs wide. Taking the first null as its bandwidth, how much spectrum does it occupy?`,
        choices: options(
          { text: `${sig(bw, 3)} kHz`, why: "" },
          [
            { text: `${sig(tau, 3)} kHz`, why: `That is the pulse <b>width</b> with the units changed, not a bandwidth. Bandwidth is the <em>reciprocal</em> of a time — check by substituting: 1/(${num(tau, 0)} μs) = ${sig(bw, 3)} kHz.` },
            { text: `${sig(bw / 2, 3)} kHz`, why: `Halved. The first null of τ·sinc(fτ) is at f = 1/τ exactly; there is no factor of two in it.` },
            { text: `${sig(bw * 2, 3)} kHz`, why: `Doubled. That would be the <em>second</em> null, or the full width of the main lobe counting both sides of zero — the usual convention is the first null on one side.` },
            { text: `${sig(bw / 1000, 4)} kHz`, why: `A factor of a thousand out — microseconds and kilohertz are reciprocals of each other only after the megahertz conversion. 1/(1 μs) = 1 MHz = 1000 kHz.` },
          ]),
        answer: 0,
        steps: [
          `A rectangle of width τ transforms to a sinc with its first null at <b>f = 1/τ</b>:`,
          D(`B = \\frac{1}{\\tau} = \\frac{1}{${num(tau, 0)} \\times 10^{-6}\\text{ s}} = ${sig(bw * 1000, 4)}\\text{ Hz}`),
          `<b>${sig(bw, 3)} kHz.</b> Worth carrying as a rule of thumb: <b>a 1 μs pulse needs about 1 MHz</b>, and everything else scales from there.`,
          `<b>The relation is reciprocal, always.</b> Shorten the pulse and the spectrum widens in exact proportion — that is the whole of duality, and it is why fast links are expensive in spectrum.`,
        ],
      };
    }

    /* --- the pulse a stated bandwidth allows ---------------------------- */
    if (mode === "tau") {
      /* B = 1 MHz is excluded: it gives τ = 1 μs, so the "carried the number
         across without inverting" distractor becomes the answer. */
      const bw = rng.pick([2, 4, 5, 8, 10]);            // MHz
      const tau = 1 / bw;                               // microseconds
      return {
        stem: `A channel has ${num(bw, 0)} MHz of bandwidth. What is the shortest rectangular pulse it can pass without losing the main lobe?`,
        choices: options(
          { text: `${sig(tau, 3)} μs`, why: "" },
          [
            { text: `${sig(bw, 3)} μs`, why: `The numbers were carried across without inverting. <b>Width and bandwidth are reciprocals</b>: more bandwidth means a <em>shorter</em> pulse, not a longer one.` },
            { text: `${sig(tau * 2, 3)} μs`, why: `Twice as long as necessary — this pulse would fit in half the bandwidth. The relation is τ = 1/B with no factor of two.` },
            { text: `${sig(tau / 2, 3)} μs`, why: `Too short: this pulse's first null is at ${num(2 * bw, 0)} MHz, so its main lobe would be cut in half by the channel.` },
          ]),
        answer: 0,
        steps: [
          D(`\\tau = \\frac{1}{B} = \\frac{1}{${num(bw, 0)} \\times 10^{6}} = ${sig(tau, 3)}\\,\\mu\\text{s}`),
          `<b>${sig(tau, 3)} μs.</b> Read it as the exchange rate: <b>one microsecond costs one megahertz</b>.`,
          `This is the same statement as the bit-rate limit in Part 5, in different clothes. A channel that can pass a ${sig(tau, 3)} μs pulse can carry roughly ${sig(1 / tau, 3)} million of them a second.`,
        ],
      };
    }

    /* --- what scaling does --------------------------------------------- */
    const f = rng.pick([2, 3, 4, 5]);
    return {
      stem: `A pulse is compressed to <b>one ${f === 2 ? "half" : f === 3 ? "third" : f === 4 ? "quarter" : "fifth"}</b> of its original duration. What happens to the bandwidth it occupies?`,
      choices: options(
        { text: `it increases by a factor of ${f}`, why: "" },
        [
          { text: `it decreases by a factor of ${f}`, why: `Backwards. <b>Compressing in time spreads the spectrum</b> — a faster signal contains faster components, so it needs more room, not less.` },
          { text: "it does not change", why: `Then a link could run arbitrarily fast in a fixed bandwidth, and no communication system would have a capacity. The scaling property says the product τ·B is fixed.` },
          { text: `it increases by a factor of ${f * f}`, why: `The relation is reciprocal, not inverse-square. Compress by ${f} and the bandwidth grows by exactly ${f}.` },
        ]),
      answer: 0,
      steps: [
        `The scaling property, which is the whole content of duality:`,
        D(`x(at) \\ \\longleftrightarrow \\ \\frac{1}{|a|}X(f/a)`),
        `Compressing in time by ${f} means a = ${f}, so the spectrum is stretched by ${f} (and its amplitude drops by ${f}, conserving area).`,
        `<b>A factor of ${f} more bandwidth.</b> The product τ·B has not moved, and it never does. <b>Time is what you save and bandwidth is what you pay</b>, at a fixed exchange rate.`,
      ],
    };
  },
});

defineProblem("ft-property", {
  topic: "Fourier transform properties",
  lookup: "Electrical → Communications → Fourier transform properties",
  make(rng) {
    const which = rng.pick(["shiftfreq", "shiftfreq", "shifttime", "linear"]);

    if (which === "shiftfreq") {
      const fc = rng.pick([100, 455, 1000, 10700]);
      const bw = rng.pick([3, 5, 10]);
      return {
        stem: `A baseband signal occupying 0 to ${num(bw, 0)} kHz is multiplied by cos(2πf<sub>c</sub>t) with f<sub>c</sub> = ${num(fc, 0)} kHz. Where does its spectrum end up?`,
        choices: options(
          { text: `two copies, centred at +${num(fc, 0)} and −${num(fc, 0)} kHz, each at half amplitude`, why: "" },
          [
            { text: `one copy, centred at ${num(fc, 0)} kHz, at full amplitude`, why: `A real cosine is <b>two</b> exponentials, so it produces <b>two</b> copies and each gets half the amplitude. A single full-amplitude copy would need a complex exponential, which no real circuit generates on its own.` },
            { text: `one copy, shifted up to ${num(fc + bw, 0)} kHz`, why: `The spectrum is moved <b>bodily</b> to be centred on the carrier, not pushed up by its own width. Its shape is unchanged; only its location moves.` },
            { text: `unchanged in frequency, but doubled in amplitude`, why: `That describes multiplying by a constant. Multiplying by a <b>cosine</b> moves the spectrum — that is precisely what makes modulation possible.` },
          ]),
        answer: 0,
        steps: [
          `The frequency-shift property, which is the single most used line in this module:`,
          D(`x(t)\\cos(2\\pi f_c t) \\ \\longleftrightarrow \\ \\tfrac{1}{2}\\left[X(f-f_c) + X(f+f_c)\\right]`),
          `<b>Two copies, at ±${num(fc, 0)} kHz, each half as tall.</b> The occupied band around the carrier runs from ${num(fc - bw, 0)} to ${num(fc + bw, 0)} kHz — <b>${num(2 * bw, 0)} kHz wide, twice the baseband width</b>, because both sides of the spectrum come along.`,
          `Everything in Part 2 is this line. So is every mixer, and so is the reason a receiver can pick one station out of a crowded dial.`,
        ],
      };
    }

    if (which === "shifttime") {
      const d = rng.pick([1, 2, 5]);
      return {
        stem: `A signal is delayed by ${num(d, 0)} ms. What happens to its Fourier transform?`,
        choices: options(
          { text: "the magnitude is unchanged; only the phase changes", why: "" },
          [
            { text: "the magnitude is shifted along the frequency axis", why: `That is a <b>frequency</b> shift, caused by multiplying by a carrier. A <b>time</b> shift cannot change which frequencies are present — delaying a piece of music does not retune it.` },
            { text: "both magnitude and phase are unchanged", why: `The phase does change, by −2πfT, and that matters: it is a delay that grows with frequency unless the phase is linear, which is exactly the Bessel-filter argument from Signal Processing Part 4.` },
            { text: "the magnitude is scaled down by the delay", why: `A delay does not attenuate. Nothing is lost by waiting.` },
          ]),
        answer: 0,
        steps: [
          D(`x(t - T) \\ \\longleftrightarrow \\ X(f)\\,e^{-j2\\pi fT}`),
          `The factor multiplying X(f) has <b>magnitude exactly 1</b>, so |X(f)| does not move at all. Only the angle does, by −2πfT.`,
          `<b>Magnitude unchanged, phase shifted.</b> Sanity check it physically: a delayed signal contains exactly the frequencies it contained before — <b>waiting cannot create or destroy a frequency</b>.`,
          `Note the phase shift is <b>proportional to f</b>. That is what "linear phase" means, and it is why a linear-phase filter delays every component equally and so preserves a pulse's shape.`,
        ],
      };
    }

    const a = rng.pick([2, 3, 4]);
    return {
      stem: `Two signals with transforms X(f) and Y(f) are added, and the sum is multiplied by ${num(a, 0)}. What is the transform of the result?`,
      choices: options(
        { tex: `${num(a, 0)}\\left[X(f) + Y(f)\\right]`, why: "" },
        [
          { tex: `${num(a, 0)}X(f) \\cdot ${num(a, 0)}Y(f)`, why: `Addition in time stays addition in frequency. <b>Multiplication</b> in one domain becomes convolution in the other — but nothing here was multiplied together.` },
          { tex: `X(f) + Y(f)`, why: `The factor of ${num(a, 0)} carries through. The transform is linear in the signal, so scaling the signal scales the transform.` },
          { tex: `${num(a * a, 0)}\\left[X(f) + Y(f)\\right]`, why: `The scale factor appears once, not squared. It would be squared for <b>power</b>, but the transform is of the signal itself.` },
        ]),
      answer: 0,
      steps: [
        `<b>The transform is linear</b>, which is the property that makes it useful at all:`,
        D(`a\\,x(t) + b\\,y(t) \\ \\longleftrightarrow \\ a\\,X(f) + b\\,Y(f)`),
        `<b>${num(a, 0)}[X(f) + Y(f)].</b>`,
        `Linearity is why a spectrum can be reasoned about piece by piece — the spectrum of a sum is the sum of the spectra, so a signal can be decomposed, handled, and reassembled. <b>Everything in this module assumes it.</b>`,
      ],
    };
  },
});

defineReflex([
  {
    part: "fourier",
    stem: "Transform of a rectangular pulse of width τ?",
    tool: "A sinc, with nulls at every multiple of 1/τ",
    because: "A rectangle is what one bit looks like, so this pair sets the bandwidth of every digital link.",
  },
  {
    part: "fourier",
    stem: "δ(t) transforms to what? And what transforms to δ(f)?",
    tool: "δ(t) ↔ 1, and 1 ↔ δ(f)",
    because: "An instant holds every frequency; a constant holds only DC. They are the two extremes of duality.",
  },
  {
    part: "fourier",
    stem: "A pulse is compressed in time by a factor of 4. Its bandwidth?",
    tool: "Four times wider — τ·B is constant",
    because: "Time is what you save and bandwidth is what you pay, at a fixed exchange rate no shaping escapes.",
  },
  {
    part: "fourier",
    stem: "Multiplying a signal by cos(2πfct) does what to its spectrum?",
    tool: "Copies it to +fc AND −fc, each at half amplitude",
    because: "This one line is amplitude modulation, every mixer, and frequency-division multiplexing.",
  },
  {
    part: "fourier",
    stem: "Delaying a signal changes what about its transform?",
    tool: "The phase only — magnitude is untouched",
    because: "Waiting cannot create or destroy a frequency. Confusing this with a frequency shift is the standard error.",
  },
  {
    part: "fourier",
    stem: "Minimum bandwidth to carry a bit rate Rb without intersymbol interference?",
    tool: "Rb/2 — alternating bits are a square wave at half the bit rate",
    because: "Below it the worst-case pattern's fundamental does not get through and the eye closes with no noise present.",
  },
  {
    part: "fourier",
    stem: "Which pulse shape is its own Fourier transform?",
    tool: "The Gaussian",
    because: "It also achieves the smallest possible time-bandwidth product, which is why it is used where spectrum is scarce.",
  },
]);

/* ==========================================================================
   Part 2 — amplitude modulation

   Three shapes, all of which the exam sets: read the index off an envelope,
   split the power, and choose between the schemes. The distractors are the
   missing square root in the current relation, halving the bandwidth when it
   should be doubled, and treating the carrier as though it carried something.
   ========================================================================== */

defineProblem("am-index", {
  topic: "AM modulation index",
  lookup: "Electrical → Communications → Amplitude modulation",
  make(rng) {
    const ask = rng.pick(["scope", "scope", "amps", "bw"]);

    /* --- index from the envelope, the way it is measured ---------------- */
    if (ask === "scope") {
      const Ac = rng.pick([4, 5, 8, 10, 20]);
      const m = rng.pick([0.25, 0.4, 0.5, 0.6, 0.75, 0.8]);
      const hi = Ac * (1 + m), lo = Ac * (1 - m);
      return {
        stem: `An AM envelope on an oscilloscope swings between <b>${sig(lo, 3)} V</b> and <b>${sig(hi, 3)} V</b>. What is the modulation index?`,
        choices: options(
          { text: fixed(m, 2), why: "" },
          [
            { text: fixed(lo / hi, 3), why: `That is the ratio of the two readings. The index is the <b>difference over the sum</b>, which is what makes it 0 for an unmodulated carrier and 1 when the envelope just touches zero.` },
            { text: fixed((hi - lo) / hi, 3), why: `Divided by the maximum instead of by the sum. Check the limits: with this formula a fully modulated signal (min = 0) would give 1 — correct — but an unmodulated one gives 0 only by coincidence, and every value between is wrong.` },
            { text: fixed(hi - lo, 3), why: `That is a voltage, not an index. <b>m is dimensionless</b> — it has to be, since it multiplies a cosine inside a bracket that is added to 1.` },
            { text: fixed((hi - lo) / (2 * Ac), 3), why: `Correct in form but the denominator has to come from the <em>measurement</em>. Amax + Amin = ${sig(hi + lo, 3)} V, and that is what to divide by.` },
          ]),
        answer: 0,
        steps: [
          D(`m = \\frac{A_{max} - A_{min}}{A_{max} + A_{min}} = \\frac{${sig(hi, 3)} - ${sig(lo, 3)}}{${sig(hi, 3)} + ${sig(lo, 3)}}`),
          D(`= \\frac{${sig(hi - lo, 3)}}{${sig(hi + lo, 3)}} = ${fixed(m, 3)}`),
          `<b>m = ${fixed(m, 2)}.</b> Note what the sum gives you for free: A<sub>max</sub> + A<sub>min</sub> = 2A<sub>c</sub>, so the carrier amplitude is <b>${sig(Ac, 3)} V</b> without needing the transmitter's specification.`,
          `<b>The formula only works for m ≤ 1.</b> Above that the envelope reaches zero, the measured minimum is 0 whatever the real index is, and the ratio returns exactly 1 every time.`,
        ],
      };
    }

    /* --- antenna current, where the square root gets dropped ------------ */
    if (ask === "amps") {
      const Ic = rng.pick([8, 10, 12, 20]);
      /* m = 0.4 is excluded: sqrt(1 + m^2/2) and sqrt(1 + m^2) are then only
         3.6% apart, so the "dropped the /2" distractor is indistinguishable. */
      const m = rng.pick([0.5, 0.6, 0.8, 1.0]);
      const It = Ic * Math.sqrt(1 + (m * m) / 2);
      return {
        stem: `An AM transmitter draws <b>${num(Ic, 0)} A</b> of antenna current unmodulated. What is the current at a modulation index of ${fixed(m, 2)}?`,
        choices: options(
          { text: `${sig(It, 4)} A`, why: "" },
          [
            { text: `${sig(Ic * (1 + (m * m) / 2), 4)} A`, why: `The square root was dropped. That expression is the <b>power</b> ratio; current goes as the square root of power, so I<sub>t</sub> = I<sub>c</sub>√(1 + m²/2).` },
            { text: `${sig(Ic * (1 + m), 4)} A`, why: `That is the peak of the <em>envelope</em>, not the RMS antenna current. The current is set by total power, which depends on m².` },
            { text: `${sig(Ic * Math.sqrt(1 + m * m), 4)} A`, why: `The factor of two under the m² is missing. Both sidebands together carry m²/2 of the carrier power, not m².` },
          ]),
        answer: 0,
        steps: [
          `Power first, because that is what the relation is built on:`,
          D(`\\frac{P_t}{P_c} = 1 + \\frac{m^2}{2} = 1 + \\frac{${fixed(m * m, 3)}}{2} = ${fixed(1 + (m * m) / 2, 4)}`),
          `<b>Current is the square root of power</b> into a fixed antenna resistance:`,
          D(`I_t = I_c\\sqrt{1 + \\frac{m^2}{2}} = ${num(Ic, 0)}\\sqrt{${fixed(1 + (m * m) / 2, 4)}} = ${sig(It, 4)}\\text{ A}`),
          `<b>${sig(It, 4)} A</b> — only ${fixed(100 * (It / Ic - 1), 1)}% above the unmodulated value even at m = ${fixed(m, 2)}. <b>The square root is the whole question</b>, and leaving it out is the standard error.`,
        ],
      };
    }

    /* --- bandwidth ------------------------------------------------------ */
    const fm = rng.pick([3.4, 5, 10, 15]);
    const fc = rng.pick([540, 1000, 1600]);
    return {
      stem: `A ${num(fc, 0)} kHz carrier is amplitude-modulated by a message occupying up to ${num(fm, 1)} kHz. What bandwidth does the transmission occupy, and where?`,
      choices: options(
        { text: `${num(2 * fm, 1)} kHz, from ${num(fc - fm, 1)} to ${num(fc + fm, 1)} kHz`, why: "" },
        [
          { text: `${num(fm, 1)} kHz, from ${num(fc, 0)} to ${num(fc + fm, 1)} kHz`, why: `That is <b>single</b>-sideband. Ordinary AM produces <b>both</b> sidebands, one either side of the carrier, so the occupied band is twice the message width.` },
          { text: `${num(fc + fm, 1)} kHz`, why: `That is the highest frequency present, not the bandwidth. <b>Bandwidth is a width</b> — the span between the edges, not the distance from zero.` },
          { text: `${num(4 * fm, 1)} kHz`, why: `Doubled twice. Each sideband is f<sub>m</sub> wide, and there are two of them: 2f<sub>m</sub> total.` },
        ]),
      answer: 0,
      steps: [
        `Multiplying by the carrier puts a copy of the message spectrum <b>either side</b> of f<sub>c</sub>:`,
        D(`\\text{BW} = 2f_m = 2(${num(fm, 1)}) = ${num(2 * fm, 1)}\\text{ kHz}`),
        `Occupying <b>${num(fc - fm, 1)} to ${num(fc + fm, 1)} kHz</b>.`,
        `<b>This holds however small m is.</b> The index sets how tall the sidebands are, never where they sit — so a lightly modulated station takes exactly as much dial as a heavily modulated one.`,
      ],
    };
  },
});

defineProblem("am-power", {
  topic: "AM power distribution",
  lookup: "Electrical → Communications → AM power and efficiency",
  make(rng) {
    const Pc = rng.pick([1, 2, 5, 10, 50]);              // kW
    const m = rng.pick([0.4, 0.5, 0.6, 0.8]);
    /* m = 1 is excluded here: m squared then equals m, which collapses the
       "no /2" distractor onto the "not squared" one in the total branch, the
       two sideband distractors onto each other, and the efficiency branch's
       "100 m" onto the literal 100%. The 1/3 ceiling is made in the prose. */
    const P = amPower(m);
    const Pt = Pc * P.total;
    const ask = rng.pick(["total", "total", "side", "eff"]);

    if (ask === "side") {
      const each = Pc * P.perSideband;
      return {
        stem: `An AM transmitter has a carrier power of ${num(Pc, 0)} kW and is modulated to m = ${fixed(m, 2)}. What power is in <b>each</b> sideband?`,
        choices: options(
          { text: `${sig(each, 3)} kW`, why: "" },
          [
            { text: `${sig(2 * each, 3)} kW`, why: `That is <b>both</b> sidebands together, m²P<sub>c</sub>/2. The question asks for one of them, so halve it.` },
            { text: `${sig(Pt, 3)} kW`, why: `That is the total transmitted power, carrier included. The sidebands are the part <em>above</em> the carrier.` },
            { text: `${sig(Pc * m / 2, 3)} kW`, why: `The index was not squared. <b>Power goes as amplitude squared</b>, and each sideband has amplitude mA<sub>c</sub>/2 — so its power carries m².` },
          ]),
        answer: 0,
        steps: [
          `Each sideband has amplitude mA<sub>c</sub>/2, and power goes as amplitude squared:`,
          D(`P_{SB} = \\frac{m^2}{4}P_c = \\frac{${fixed(m * m, 3)}}{4}(${num(Pc, 0)}) = ${sig(each, 4)}\\text{ kW}`),
          `<b>${sig(each, 3)} kW each</b>, so ${sig(2 * each, 3)} kW in the pair — and the carrier is still the full ${num(Pc, 0)} kW on top of that.`,
          `<b>Only these two carry the message.</b> Everything else is the carrier, which is unchanged whatever the programme does.`,
        ],
      };
    }

    if (ask === "eff") {
      return {
        stem: `An AM signal is modulated to m = ${fixed(m, 2)}. What fraction of the transmitted power carries information?`,
        choices: options(
          { text: `${fixed(100 * P.efficiency, 1)}%`, why: "" },
          [
            { text: `${fixed(100 * m, 0)}%`, why: `The index is not a percentage of power. <b>Power goes as m²</b>, and the carrier is in the denominator too.` },
            { text: `${fixed(100 * (m * m) / 2, 1)}%`, why: `That is the sideband power as a fraction of the <b>carrier</b>, not of the total. Divide by 1 + m²/2, not by 1.` },
            { text: "100%", why: `That would be DSB-SC or SSB, where the carrier is suppressed. Full-carrier AM always spends most of its power on the carrier — <b>at best a third goes to the sidebands</b>.` },
          ]),
        answer: 0,
        steps: [
          D(`\\eta = \\frac{P_{SB}}{P_t} = \\frac{m^2/2}{1 + m^2/2} = \\frac{m^2}{2 + m^2}`),
          D(`= \\frac{${fixed(m * m, 3)}}{2 + ${fixed(m * m, 3)}} = ${fixed(P.efficiency, 4)}`),
          `<b>${fixed(100 * P.efficiency, 1)}%.</b> ${m >= 0.999 ? "This is the ceiling — <b>exactly 1/3 at m = 1</b>, and m cannot legally go higher." : `And m = 1 would only reach 33.3%, so <b>the ceiling is 1/3 no matter what</b>.`}`,
          `<b>The carrier is the reason.</b> It is a constant sinusoid, identical whether the programme is speech or silence, and it takes ${fixed(100 * (1 - P.efficiency), 1)}% of the transmitter here.`,
        ],
      };
    }

    return {
      stem: `An AM transmitter with a ${num(Pc, 0)} kW carrier is modulated to m = ${fixed(m, 2)}. What is the total transmitted power?`,
      /* At m = 1 the "no /2" and "not squared" distractors are both 2Pc, so
         build the list and keep only the distinct values. */
      choices: options(
        { text: `${sig(Pt, 4)} kW`, why: "" },
        [
          { v: Pc * (1 + m * m), why: `The factor of two under the m² is missing. Both sidebands together are m²/2 of the carrier, not m².` },
          { v: Pc * (1 + m), why: `The index was not squared. <b>Power goes as amplitude squared</b>, so m enters as m².` },
          { v: Pc, why: `That is the carrier alone. Modulating adds the sidebands on top — the carrier does not shrink to make room for them.` },
          { v: Pc * (m * m) / 2, why: `That is the sideband power only. The question asks for the <b>total</b>, which includes the carrier.` },
        ].reduce((acc, c) => {
          const t = `${sig(c.v, 4)} kW`;
          if (t !== `${sig(Pt, 4)} kW` && !acc.some((x) => x.text === t)) acc.push({ text: t, why: c.why });
          return acc;
        }, [])),
      answer: 0,
      steps: [
        D(`P_t = P_c\\left(1 + \\frac{m^2}{2}\\right) = ${num(Pc, 0)}\\left(1 + \\frac{${fixed(m * m, 3)}}{2}\\right)`),
        D(`= ${num(Pc, 0)}(${fixed(P.total, 4)}) = ${sig(Pt, 4)}\\text{ kW}`),
        `<b>${sig(Pt, 4)} kW</b>, of which ${sig(Pt - Pc, 3)} kW is the sidebands and ${num(Pc, 0)} kW is the carrier.`,
        `<b>Modulation only ever adds power.</b> The carrier stays exactly where it was — which is why the efficiency here is just ${fixed(100 * P.efficiency, 1)}%.`,
      ],
    };
  },
});

defineProblem("am-scheme", {
  topic: "Choosing a modulation scheme",
  lookup: "Electrical → Communications → DSB-SC and SSB",
  make(rng) {
    const q = rng.pick(["ssb", "why", "dsb"]);

    if (q === "ssb") {
      const fm = rng.pick([3, 3.4, 5, 15]);
      return {
        stem: `A message occupying up to ${num(fm, 1)} kHz is sent by <b>single-sideband</b>. What bandwidth does it occupy, and what is its transmission efficiency?`,
        choices: options(
          { text: `${num(fm, 1)} kHz, 100% efficient`, why: "" },
          [
            { text: `${num(2 * fm, 1)} kHz, 100% efficient`, why: `That is the bandwidth of <b>DSB-SC</b>, which also suppresses the carrier but keeps both sidebands. SSB throws one away, halving the bandwidth.` },
            { text: `${num(fm, 1)} kHz, 33% efficient`, why: `The 33% ceiling belongs to <b>full-carrier</b> AM. With the carrier suppressed there is nothing left to waste power on.` },
            { text: `${num(2 * fm, 1)} kHz, 33% efficient`, why: `Those are full-carrier AM's figures. SSB improves on both — half the bandwidth <em>and</em> all the power in the sideband.` },
          ]),
        answer: 0,
        steps: [
          `The two sidebands of a real signal are <b>mirror images</b>, so one of them carries no information the other does not.`,
          `Transmit one and the occupied band is just the message width: <b>${num(fm, 1)} kHz</b>, half what AM or DSB-SC would need.`,
          `With no carrier, <b>every watt is in the sideband: 100% efficient</b>.`,
          `<b>The cost is the receiver.</b> Without a carrier to ride on, the envelope no longer resembles the message, so the receiver must regenerate a carrier at the right frequency <em>and phase</em>. That is why SSB is used point-to-point and never for broadcasting.`,
        ],
      };
    }

    if (q === "dsb") {
      return {
        stem: `DSB-SC and full-carrier AM carry the same message over the same bandwidth. What does suppressing the carrier actually change?`,
        choices: options(
          { text: "all the power goes into the sidebands, but the receiver must regenerate the carrier", why: "" },
          [
            { text: "the bandwidth halves", why: `That is <b>SSB</b>, which removes a sideband. DSB-SC removes the <em>carrier</em> and keeps both sidebands, so the occupied band is unchanged at 2f<sub>m</sub>.` },
            { text: "nothing measurable — the carrier held no power", why: `Backwards. The carrier holds <b>most</b> of the power in full-carrier AM — at least two thirds — and none of the information.` },
            { text: "the message can be sent at a lower frequency", why: `The carrier frequency sets where the transmission sits, and suppressing the carrier does not move the sidebands. They stay at f<sub>c</sub> ± f<sub>m</sub>.` },
          ]),
        answer: 0,
        steps: [
          `The carrier is a constant sinusoid: it is identical whether the message is loud, quiet or absent, so it <b>carries no information</b>.`,
          `Removing it means the transmitter spends everything on the sidebands — <b>efficiency goes from at most 33% to 100%</b>.`,
          `<b>The bandwidth does not change</b>, because both sidebands are still there: still 2f<sub>m</sub>.`,
          `<b>What is lost is the envelope.</b> With no carrier the envelope stops resembling the message, so a diode detector no longer works and the receiver must generate its own carrier, correct in both frequency and phase.`,
        ],
      };
    }

    return {
      stem: `Broadcast AM wastes at least two thirds of its transmitted power on the carrier. Why is it still used for broadcasting?`,
      choices: options(
        { text: "the carrier lets the receiver be an envelope detector — a diode and a capacitor", why: "" },
        [
          { text: "it needs less bandwidth than the alternatives", why: `It needs <b>more</b>: 2f<sub>m</sub>, against SSB's f<sub>m</sub>. Bandwidth is not the argument.` },
          { text: "the carrier improves the signal-to-noise ratio at the receiver", why: `The carrier adds no information, so it adds no signal in the sense that matters. Spending the same power on the sidebands would do strictly better.` },
          { text: "suppressed-carrier schemes cannot carry audio", why: `They carry it perfectly well — SSB has carried voice for a century. The difficulty is entirely in the receiver.` },
        ]),
      answer: 0,
      steps: [
        `With the carrier present and m ≤ 1, the <b>envelope is the message plus a constant</b> — so recovering it needs a diode, a capacitor and a resistor.`,
        `Suppress the carrier and that stops being true: the receiver must regenerate a carrier locked in frequency <em>and phase</em>, which is far more circuitry.`,
        `<b>The economics decide it.</b> There is one transmitter and there are millions of receivers, so paying in transmitter power to make every receiver cheap is a good trade.`,
        `<b>Reverse the economics and the answer reverses.</b> Point-to-point links — one transmitter, one receiver, spectrum at a premium — use SSB, and always have.`,
      ],
    };
  },
});

defineReflex([
  {
    part: "am",
    stem: "Reading the modulation index off a scope?",
    tool: "m = (Amax − Amin)/(Amax + Amin)",
    because: "It needs no knowledge of the transmitter — and it silently returns exactly 1 for any overmodulated signal.",
  },
  {
    part: "am",
    stem: "Bandwidth of an AM transmission?",
    tool: "2fm — both sidebands, whatever the index",
    because: "The index sets how tall the sidebands are, never where they sit, so a quiet station takes the same dial as a loud one.",
  },
  {
    part: "am",
    stem: "Total power of an AM transmitter?",
    tool: "Pt = Pc(1 + m²/2)",
    because: "Modulation only adds; the carrier never shrinks to make room for the sidebands.",
  },
  {
    part: "am",
    stem: "Antenna current under modulation?",
    tool: "It = Ic√(1 + m²/2) — note the square root",
    because: "Current goes as the root of power, and dropping the root is the standard error on this one.",
  },
  {
    part: "am",
    stem: "Best possible efficiency of full-carrier AM?",
    tool: "One third, at m = 1",
    because: "η = m²/(2 + m²), and m cannot legally exceed 1.",
  },
  {
    part: "am",
    stem: "What does SSB change relative to DSB-SC?",
    tool: "Halves the bandwidth — both are already 100% efficient",
    because: "The two sidebands are mirror images, so one is redundant. Suppressing the CARRIER is the efficiency; dropping a SIDEBAND is the bandwidth.",
  },
  {
    part: "am",
    stem: "Why keep a carrier that carries no information?",
    tool: "So the receiver can be a diode and a capacitor",
    because: "One transmitter pays so millions of receivers can be cheap. Reverse that and SSB wins.",
  },
]);
