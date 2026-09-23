// SPEC §3: a player who always shoots the right jelly, but never fast enough to splash,
// clears every level without ever losing a life to descent — bosses and Mixed included.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allLevels } from '../src/data/levels.js';
import { createGame } from '../src/game.js';
import { playLevel, slowPolicy, breachDistance, worstCaseDepth } from './helpers/policies.js';

const SEEDS = 20;

for (const spec of allLevels()) {
  test(`${spec.id}: correct-but-slow policy clears with zero breaches (${SEEDS} seeds)`, () => {
    const d0 = breachDistance(createGame(spec, 1));
    // Analytic bound: the deepest a slow-but-correct player can let the formation sink.
    assert.ok(worstCaseDepth(spec) <= 0.8 * d0, `${spec.id}: v(s+Ω)=${worstCaseDepth(spec)} > 0.8·D0=${0.8 * d0}`);
    for (let seed = 1; seed <= SEEDS; seed++) {
      const r = playLevel(spec, seed * 7919, slowPolicy);
      assert.equal(r.result, 'clear', `${spec.id} seed ${seed}`);
      assert.equal(r.breaches, 0, `${spec.id} seed ${seed} lost a life`);
      assert.equal(r.lives, 3);
      assert.equal(r.fast, 0, 'the slow policy must never splash');
      assert.ok(r.maxDepth <= worstCaseDepth(spec) + 1e-6, `${spec.id} sank ${r.maxDepth}`);
    }
  });
}
