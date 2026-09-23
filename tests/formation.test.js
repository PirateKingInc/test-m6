import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, laneLayout } from '../src/game.js';
import { WORLD, TIMING } from '../src/config.js';
import { getLevel } from '../src/data/levels.js';

const spec = { ...getLevel('A5'), enemies: 7, sway: 20 };

test('one enemy per lane, lanes never overlap and fit the playfield', () => {
  for (let n = 1; n <= 7; n++) {
    const lanes = laneLayout({ ...spec, enemies: n });
    assert.equal(lanes.length, n);
    for (const l of lanes) {
      assert.ok(l.width >= 2 * WORLD.enemyR, 'lane wide enough for a jelly');
      assert.ok(l.x - l.width / 2 >= WORLD.laneMin + spec.sway - 1e-9);
      assert.ok(l.x + l.width / 2 <= WORLD.laneMax - spec.sway + 1e-9);
    }
    const xs = lanes.map((l) => l.x);
    assert.equal(new Set(xs).size, n);
  }
});

test('formation descends continuously at v units per second', () => {
  const g = createGame(spec, 1);
  const y0 = g.enemies[0].y;
  for (let i = 0; i < 120; i++) step(g);
  assert.ok(Math.abs(g.enemies[0].y - y0 - spec.descentSpeed * 2) < 1e-6);
});

test('five or more lanes are staggered into two rows', () => {
  const g = createGame(spec, 1);
  assert.equal(g.enemies[1].y - g.enemies[0].y, WORLD.stagger);
  const small = createGame({ ...spec, enemies: 4 }, 1);
  assert.ok(small.enemies.every((e) => e.y === WORLD.startY));
});

test('same seed and inputs give identical state', () => {
  const a = createGame(spec, 5);
  const b = createGame(spec, 5);
  for (let i = 0; i < 300; i++) {
    step(a, { move: i % 3 - 1 });
    step(b, { move: i % 3 - 1 });
  }
  assert.deepEqual(a.enemies, b.enemies);
  assert.equal(a.cannon.x, b.cannon.x);
});

test('cannon moves and is clamped to the lane band', () => {
  const g = createGame(spec, 1);
  for (let i = 0; i < 600; i++) step(g, { move: 1 });
  assert.equal(g.cannon.x, WORLD.laneMax);
  assert.ok(TIMING.dt > 0);
});
