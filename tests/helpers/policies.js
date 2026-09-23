// Scripted players used by the verification tests and bots. They only use the public
// game API (fireAt / step) and read state the way a player would read the screen.
import { createGame, step, fireAt, aliveEnemies } from '../../src/game.js';
import { OVERHEAD } from '../../src/config.js';
import { createRng } from '../../src/rng.js';

const digits = (n) => String(Math.abs(n)).length;

// "Correct but slow": always the right jelly, always outside the splash window,
// taking the level's full promised think time s on every question.
export const slowPolicy = {
  name: 'correct-but-slow',
  plan: (q, g) => ({ delay: Math.max(g.spec.safeAnswerTime, g.spec.splashWindow + 0.01), miss: false }),
};

// "Typical child": correct answers with a human-ish reaction time that grows with
// number size, operation, carrying/borrowing and how many numbers are on screen,
// log-normal noise, and an occasional wrong shot.
export function childPolicy({ missRate = 0.08 } = {}) {
  return {
    name: 'typical-child',
    plan(q, g, rng) {
      const opCost = { add: 0, sub: 0.5, mul: 1.0, div: 1.5 }[q.op];
      const carry =
        (q.op === 'add' && (q.a % 10) + (q.b % 10) >= 10) || (q.op === 'sub' && q.a % 10 < q.b % 10) || q.answer < 0 ? 0.8 : 0;
      const shown = g.enemies.filter((e) => e.alive && e.value !== null).length;
      const think = 1.2 + 0.45 * (digits(q.a) + digits(q.b)) + opCost + carry + 0.1 * shown;
      // Box-Muller log-normal noise, sigma 0.3.
      const z = Math.sqrt(-2 * Math.log(1 - rng.next())) * Math.cos(2 * Math.PI * rng.next());
      return { delay: think * Math.exp(0.3 * z) + 0.4, miss: rng.chance(missRate) };
    },
    rethink: 1.0,
  };
}

// Distance from the lowest jelly's start position to the defence line.
export function breachDistance(g) {
  const { defenseY } = { defenseY: 640 };
  return defenseY - Math.max(...g.enemies.map((e) => e.baseY + e.r));
}

export function worstCaseDepth(spec) {
  return spec.descentSpeed * (spec.safeAnswerTime + OVERHEAD);
}

// Play one level to the end with a policy. Returns summary stats.
export function playLevel(spec, seed, policy, { maxSeconds = 900 } = {}) {
  const g = createGame(spec, seed);
  const rng = createRng(seed ^ 0x5eed);
  let planFor = null;
  let plan = null;
  let readyAt = 0;
  const maxSteps = maxSeconds * 60;
  for (let i = 0; i < maxSteps && !g.result; i++) {
    const q = g.question;
    if (q && planFor !== q.id) {
      planFor = q.id;
      plan = policy.plan(q, g, rng);
      readyAt = q.shownAt + plan.delay;
    }
    if (q && plan && g.t >= readyAt && g.cannon.cooldown === 0 && g.beams.length === 0) {
      const decoys = aliveEnemies(g).filter((e) => e.value !== null && e.value !== q.answer);
      if (plan.miss && decoys.length) {
        fireAt(g, rng.pick(decoys).id);
        plan = { ...plan, miss: false };
        readyAt = g.t + (policy.rethink ?? 1);
      } else {
        fireAt(g, aliveEnemies(g).find((e) => e.value === q.answer).id);
        plan = null;
      }
    }
    step(g);
    g.events.length = 0;
  }
  return {
    result: g.result,
    lives: g.lives,
    breaches: g.stats.breaches,
    fast: g.stats.fast,
    misses: g.stats.misses,
    questions: g.stats.correct,
    time: g.t,
    score: g.score,
    maxDepth: g.stats.maxDepth,
    pressure: g.stats.maxDepth / breachDistance(g),
  };
}
