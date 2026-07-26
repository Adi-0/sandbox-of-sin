/* The arc. Parts are strictly ordered; each one needs the last. */

export const PARTS = [
  {
    n: 1, id: 'wall', file: 'content/01-wall.html', mins: 7,
    title: 'The Wall',
    blurb: 'Why anyone builds a different kind of computer at all.',
    lede: 'Every computer you have ever used spends most of its energy not computing.',
  },
  {
    n: 2, id: 'bucket', file: 'content/02-bucket.html', mins: 9,
    title: 'The Leaky Bucket',
    blurb: 'One neuron, one analogy, the whole model.',
    lede: 'A neuron is a bucket with a hole in it. Everything else is detail.',
  },
  {
    n: 3, id: 'timing', file: 'content/03-timing.html', mins: 8,
    title: 'Time Is the Medium',
    blurb: 'What a spike actually carries, and why *when* beats *how much*.',
    lede: 'All spikes are identical. The only thing left to vary is the moment they arrive.',
  },
  {
    n: 4, id: 'wiring', file: 'content/04-wiring.html', mins: 9,
    title: 'Wiring Things Up',
    blurb: 'Synapses, weights, and the first circuit that makes a decision.',
    lede: 'One neuron is a detector. Two neurons and a wire are a computer.',
  },
  {
    n: 5, id: 'learning', file: 'content/05-learning.html', mins: 9,
    title: 'Learning Without a Teacher',
    blurb: 'How weights change themselves using nothing but timing.',
    lede: 'Causality has a direction, and a synapse can feel it.',
  },
  {
    n: 6, id: 'silicon', file: 'content/06-silicon.html', mins: 9,
    title: 'The Silicon',
    blurb: 'Crossbars, event buses, and where the energy actually goes.',
    lede: 'The whole point was to stop moving numbers. Here is how the chips manage it.',
  },
  {
    n: 7, id: 'reality', file: 'content/07-reality.html', mins: 8,
    title: 'Where It Wins',
    blurb: 'The honest scorecard: real deployments, and the unsolved parts.',
    lede: 'A technology is only interesting once you can say precisely when not to use it.',
  },
  {
    n: 8, id: 'bench', file: 'content/08-bench.html', mins: 6,
    title: 'The Bench',
    blurb: 'Build your own network and break it.',
    lede: 'Everything you have learned, with the guard rails removed.',
  },
];

export const byId = (id) => PARTS.find((p) => p.id === id);
export const indexOfId = (id) => PARTS.findIndex((p) => p.id === id);
