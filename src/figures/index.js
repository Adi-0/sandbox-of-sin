/* Figure registry. Content HTML references these by name:
   <div data-fig="leak"></div>  */

import { dataTax, idleTax } from './energy.js';
import { anatomy, leak, fiCurve } from './bucket.js';
import { twoReaders, coincidence } from './timing.js';
import { synapse, chain, winnerTakeAll } from './wiring.js';
import { stdpWindow, patternLearning } from './learning.js';
import { crossbar, sparsityPayoff, framesVsEvents } from './silicon.js';
import { surrogate } from './reality.js';
import { bench } from './sandbox.js';

export const FIGURES = {
  'data-tax': dataTax,             // 1
  'idle-tax': idleTax,             // 2
  'anatomy': anatomy,              // 3
  'leak': leak,                    // 4
  'fi-curve': fiCurve,             // 5
  'two-readers': twoReaders,       // 6
  'coincidence': coincidence,      // 7
  'synapse': synapse,              // 8
  'chain': chain,                  // 9
  'winner-take-all': winnerTakeAll,// 10
  'stdp-window': stdpWindow,       // 11
  'pattern-learning': patternLearning, // 12
  'crossbar': crossbar,            // 13
  'sparsity': sparsityPayoff,      // 14
  'frames-vs-events': framesVsEvents, // 15
  'surrogate': surrogate,          // 16
  'bench': bench,
};
