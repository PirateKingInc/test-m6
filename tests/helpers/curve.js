// Runs the "typical child" policy over every level and scores how hard each one felt.
import { allLevels } from '../../src/data/levels.js';
import { playLevel, childPolicy } from './policies.js';

export const SPIKE_THRESHOLD = 0.15;

// difficulty = mean pressure (fraction of the way to the defence line the formation got)
//            + mean lives lost / 3 + failure rate
export function measureCurve(seeds = 40) {
  const policy = childPolicy();
  return allLevels().map((spec) => {
    let pressure = 0;
    let livesLost = 0;
    let fails = 0;
    let time = 0;
    let misses = 0;
    for (let s = 1; s <= seeds; s++) {
      const r = playLevel(spec, s * 104729 + spec.id.length, policy);
      pressure += Math.min(1, r.pressure);
      livesLost += 3 - r.lives;
      fails += r.result === 'clear' ? 0 : 1;
      time += r.time;
      misses += r.misses;
    }
    const n = seeds;
    const m = { id: spec.id, section: spec.section, pressure: pressure / n, livesLost: livesLost / n, failRate: fails / n, time: time / n, misses: misses / n };
    m.difficulty = m.pressure + m.livesLost / 3 + m.failRate;
    return m;
  });
}

// A spike is a level noticeably harder than both of its neighbours in play order.
export function findSpikes(curve, threshold = SPIKE_THRESHOLD) {
  const spikes = [];
  for (let i = 0; i < curve.length; i++) {
    const prev = curve[i - 1]?.difficulty ?? -Infinity;
    const next = curve[i + 1]?.difficulty ?? -Infinity;
    const neighbours = [prev, next].filter(Number.isFinite);
    if (curve[i].difficulty > Math.max(...neighbours) + threshold) spikes.push(curve[i].id);
  }
  return spikes;
}
