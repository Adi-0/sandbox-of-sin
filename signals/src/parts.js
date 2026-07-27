/*
 * The arc.
 *
 * Parts are strictly ordered and each one genuinely needs the last:
 *
 *   1 gives you signals, 2 gives you the two promises that make a system
 *   predictable, and 3 cashes those promises in for convolution. 4 finds
 *   the one signal shape a system cannot distort, 5 shows every other
 *   signal is built from that shape, and 6 combines them: the hard
 *   operation from 3 becomes multiplication. 7 lets the test tone decay
 *   as well as spin, which turns a system into a handful of points on a
 *   map. 8 places those points deliberately, 9 asks what survives being
 *   measured only now and then, and 10 spends the whole toolkit on a
 *   radio and a car. 11 counts how few ideas were actually doing the work.
 */

export const PARTS = [
  {
    n: 1, id: 'signals', file: 'content/01-signals.html', mins: 8,
    title: 'Everything That Varies',
    blurb: 'What a signal is, and the four shapes everything else is built from.',
    lede: 'A signal is a number that changes its mind over time. That is the whole definition, and it is enough.',
  },
  {
    n: 2, id: 'systems', file: 'content/02-systems.html', mins: 7,
    title: 'The Two Promises',
    blurb: 'The two properties that make a system knowable at all.',
    lede: 'Most systems are hopeless. Two promises rescue a small, spectacularly useful family of them.',
  },
  {
    n: 3, id: 'clap', file: 'content/03-clap.html', mins: 13,
    title: 'One Clap Tells All',
    blurb: 'The impulse response, and the sliding sum that turns it into every answer.',
    lede: 'Clap once. What comes back is a complete description of the room — for every sound you will ever make in it.',
  },
  {
    n: 4, id: 'arrow', file: 'content/04-arrow.html', mins: 10,
    title: 'The Spinning Arrow',
    blurb: 'The one signal shape no system can bend, and why it is a rotation.',
    lede: 'Put a pure tone into a room and a pure tone comes out. Only two numbers change. That is a stranger fact than it sounds.',
  },
  {
    n: 5, id: 'stack', file: 'content/05-stack.html', mins: 13,
    title: 'A Stack of Tones',
    blurb: 'Fourier: every signal is a pile of the shape from Part 4.',
    lede: 'If a room only handles pure tones gracefully, the obvious move is to stop sending it anything else.',
  },
  {
    n: 6, id: 'response', file: 'content/06-response.html', mins: 11,
    title: 'The Room, Tone by Tone',
    blurb: 'The frequency response, the Bode plot, and the trade that pays for everything.',
    lede: 'One curve replaces the entire sliding sum — and turns the hardest operation in Part 3 into multiplication.',
  },
  {
    n: 7, id: 'poles', file: 'content/07-poles.html', mins: 14,
    title: 'Poles',
    blurb: 'Laplace, the s-plane, transfer functions, block diagrams and stability.',
    lede: 'Let the test tone decay as well as spin, and a whole system collapses into a few points on a map.',
  },
  {
    n: 8, id: 'filters', file: 'content/08-filters.html', mins: 9,
    title: 'Rooms Built on Purpose',
    blurb: 'Filters: choosing where the poles go, and what sharpness costs.',
    lede: 'Every filter you have ever used is somebody deciding where to put a handful of points.',
  },
  {
    n: 9, id: 'sampling', file: 'content/09-sampling.html', mins: 11,
    title: 'Photographs of a Signal',
    blurb: 'Sampling, aliasing, Nyquist, and putting the signal back together.',
    lede: 'Look at a signal only now and then and you may be watching something that was never there.',
  },
  {
    n: 10, id: 'world', file: 'content/10-world.html', mins: 9,
    title: 'Out in the World',
    blurb: 'A radio station and a cruise control, built from nothing new.',
    lede: 'Two industries, no new mathematics.',
  },
  {
    n: 11, id: 'close', file: 'content/11-close.html', mins: 6,
    title: 'Closing the Loop',
    blurb: 'How few ideas were actually doing the work, plus the cheat sheet.',
    lede: 'Count them. There are five.',
  },
];

export const BENCH = {
  id: 'bench', file: 'content/12-bench.html',
  title: 'The Bench',
  lede: 'Everything you have learned, with the guard rails taken off.',
};

export const byId = (id) => PARTS.find((p) => p.id === id);
export const indexOfId = (id) => PARTS.findIndex((p) => p.id === id);
