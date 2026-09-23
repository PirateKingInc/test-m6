import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, breached, fireAt } from '../src/game.js';
import { WORLD, TIMING } from '../src/config.js';
import { getLevel } from '../src/data/levels.js';
import { stepUntil, answerEnemy } from './helpers/sim.js';

const spec = getLevel('A2');

test('an idle player loses exactly one life per breach and the formation resets', () => {
  const g = createGame(spec, 1);
  assert.equal(g.lives, TIMING.lives);
  assert.ok(stepUntil(g, (s) => s.stats.breaches === 1, 60 * 200));
  assert.equal(g.lives, TIMING.lives - 1);
  assert.equal(g.offsetY, 0);
  assert.ok(g.enemies.every((e) => !breached(e)));
  assert.ok(g.enemies.every((e) => e.alive), 'breaching does not remove enemies');
  const breachEvents = g.events.filter((e) => e.type === 'breach');
  assert.equal(breachEvents.length, 1);
});

test('breach happens exactly when the lowest jelly touches the defence line', () => {
  const g = createGame(spec, 2);
  const lowest = Math.max(...g.enemies.map((e) => e.baseY));
  const expected = (WORLD.defenseY - WORLD.enemyR - lowest) / spec.descentSpeed;
  stepUntil(g, (s) => s.stats.breaches === 1, 60 * 200);
  assert.ok(Math.abs(g.t - expected) <= TIMING.dt + 1e-9, `${g.t} vs ${expected}`);
});

test('losing the last life ends the attempt as lost', () => {
  const g = createGame(spec, 3);
  stepUntil(g, (s) => s.result, 60 * 600);
  assert.equal(g.result, 'lost');
  assert.equal(g.lives, 0);
  assert.equal(g.stats.breaches, TIMING.lives);
  const t = g.t;
  step(g);
  assert.equal(g.t, t, 'a finished game no longer advances');
});

test('clearing a level adds the life bonus', () => {
  const g = createGame(getLevel('A1'), 4);
  while (!g.result) {
    stepUntil(g, (s) => s.question || s.result);
    if (g.result) break;
    const target = answerEnemy(g);
    stepUntil(g, (s) => s.cannon.cooldown === 0);
    fireAt(g, target.id);
    stepUntil(g, (s) => !s.question || s.result, 120);
  }
  assert.equal(g.result, 'clear');
  assert.equal(g.lives, 3);
  assert.ok(g.score >= 3 * 100 + 3 * 200);
});
