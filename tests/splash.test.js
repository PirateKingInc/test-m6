import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, fireAt, speedFactor, splashRadius, knockbackFor, aliveEnemies, step } from '../src/game.js';
import { getLevel } from '../src/data/levels.js';
import { stepUntil, answerEnemy } from './helpers/sim.js';

const spec = getLevel('A5'); // 6 enemies, staggered

test('speed factor and radius follow SPEC §2', () => {
  assert.equal(speedFactor(0, 3), 1);
  assert.equal(speedFactor(1.5, 3), 0.5);
  assert.equal(speedFactor(3, 3), 0);
  assert.equal(speedFactor(10, 3), 0);
  assert.equal(splashRadius(0), 110);
  assert.equal(splashRadius(1), 200);
  assert.equal(splashRadius(0.5), 155);
});

function play(seed, delay) {
  const g = createGame(spec, seed);
  stepUntil(g, (s) => s.question);
  const shownAt = g.question.shownAt;
  stepUntil(g, (s) => s.t - shownAt >= delay);
  const target = answerEnemy(g);
  const others = aliveEnemies(g).filter((e) => e !== target);
  const beam = fireAt(g, target.id);
  const f = speedFactor(beam.firedAt - shownAt, spec.splashWindow);
  const expectedSplash = others.filter((e) => Math.hypot(e.x - target.x, e.y - target.y) <= splashRadius(f));
  const scoreBefore = g.score;
  stepUntil(g, () => !target.alive, 120);
  return { g, target, others, f, expectedSplash, points: g.score - scoreBefore };
}

test('a fast correct answer splashes every enemy within R', () => {
  let splashed = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const { others, f, expectedSplash, points } = play(seed, 0);
    assert.ok(f > 0.99);
    for (const e of others) assert.equal(e.alive, !expectedSplash.includes(e));
    assert.equal(points, 100 + Math.round(100 * f) + 50 * expectedSplash.length);
    splashed += expectedSplash.length;
  }
  assert.ok(splashed > 20, 'instant answers usually take neighbours with them');
});

test('a slow correct answer kills only the target and scores the base 100', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const { g, target, others, f, points } = play(seed, spec.splashWindow + 0.1);
    assert.equal(f, 0);
    assert.equal(target.alive, false);
    assert.ok(others.every((e) => e.alive));
    assert.equal(points, 100);
    assert.equal(g.stats.fast, 0);
  }
});

test('fast and slow answers both knock the formation back by K', () => {
  const K = knockbackFor(spec);
  assert.equal(K, spec.descentSpeed * (spec.safeAnswerTime + 1));
  for (const delay of [0, spec.splashWindow + 0.5]) {
    const g = createGame(spec, 11);
    // Let the formation sink far enough that knockback isn't clamped at the top.
    for (let i = 0; i < 60 * 14; i++) step(g);
    stepUntil(g, (s) => s.question);
    const shownAt = g.question.shownAt;
    stepUntil(g, (s) => s.t - shownAt >= delay);
    const target = answerEnemy(g);
    fireAt(g, target.id);
    let before = g.offsetY;
    while (target.alive) {
      before = g.offsetY;
      step(g);
    }
    const expected = Math.max(0, before + spec.descentSpeed / 60 - K);
    assert.ok(Math.abs(g.offsetY - expected) < 1e-6, `delay ${delay}`);
  }
});
