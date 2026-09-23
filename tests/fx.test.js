import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFx, fxHandle, fxUpdate, shakeOffset } from '../src/fx.js';
import { createGame, step, fireAt } from '../src/game.js';
import { getLevel } from '../src/data/levels.js';
import { stepUntil, answerEnemy } from './helpers/sim.js';

test('effects react to game events and fade out', () => {
  const fx = createFx();
  fxHandle(fx, [
    { type: 'kill', x: 100, y: 100, lane: 1 },
    { type: 'correct', x: 100, y: 100, fast: true, radius: 180, points: 250, splashKills: 2 },
    { type: 'breach', x: 300, y: 640 },
  ]);
  assert.ok(fx.particles.length > 0 && fx.rings.length === 1 && fx.texts.length === 1);
  assert.ok(fx.shake > 0 && fx.flash > 0);
  for (let i = 0; i < 180; i++) fxUpdate(fx, 1 / 60);
  assert.equal(fx.particles.length + fx.rings.length + fx.texts.length, 0);
  const s = shakeOffset(fx, 1);
  assert.ok(s.x === 0 && s.y === 0);
});

test('effects are cosmetic: consuming events never changes game outcomes', () => {
  const run = (withFx) => {
    const g = createGame(getLevel('A3'), 99);
    const fx = createFx();
    while (!g.result) {
      stepUntil(g, (s) => (s.question && s.cannon.cooldown === 0) || s.result);
      if (g.result) break;
      fireAt(g, answerEnemy(g).id);
      for (let i = 0; i < 30; i++) {
        step(g);
        if (withFx) {
          fxHandle(fx, g.events);
          fxUpdate(fx, 1 / 60);
        }
        g.events.length = 0;
      }
    }
    return { score: g.score, t: g.t, lives: g.lives };
  };
  assert.deepEqual(run(true), run(false));
});
