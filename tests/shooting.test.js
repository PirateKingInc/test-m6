import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, fire, fireAt, fireAtX, targetAt, aliveEnemies } from '../src/game.js';
import { TIMING, WORLD } from '../src/config.js';
import { getLevel } from '../src/data/levels.js';
import { stepUntil, answerEnemy, decoyEnemy } from './helpers/sim.js';

const spec = getLevel('A3');

test('a question appears after the intro and relabels every living enemy', () => {
  const g = createGame(spec, 3);
  assert.equal(g.question, null);
  assert.ok(stepUntil(g, (s) => s.question));
  assert.ok(Math.abs(g.t - TIMING.firstQuestion) < 0.02);
  const shown = g.enemies.filter((e) => e.value !== null).map((e) => e.value);
  assert.equal(shown.length, 1 + spec.decoys);
  assert.equal(new Set(shown).size, shown.length);
  assert.equal(shown.filter((v) => v === g.question.answer).length, 1);
});

test('shooting the correct enemy destroys it and brings the next question after the gap', () => {
  const g = createGame(spec, 4);
  stepUntil(g, (s) => s.question);
  const target = answerEnemy(g);
  const beam = fireAt(g, target.id);
  assert.ok(beam.correct);
  assert.ok(stepUntil(g, () => !target.alive, 120));
  assert.equal(g.question, null);
  assert.ok(g.enemies.every((e) => e.value === null), 'labels cleared between questions');
  const clearedAt = g.t;
  assert.ok(stepUntil(g, (s) => s.question, 120));
  assert.ok(g.t - clearedAt >= TIMING.questionGap - 1e-9);
  assert.equal(g.stats.correct, 1);
});

test('shooting a decoy is a harmless miss', () => {
  const g = createGame(spec, 5);
  stepUntil(g, (s) => s.question);
  const decoy = decoyEnemy(g);
  const qid = g.question.id;
  fireAt(g, decoy.id);
  assert.ok(stepUntil(g, (s) => s.stats.misses === 1, 120));
  assert.ok(decoy.alive);
  assert.ok(decoy.wobble > 0);
  assert.equal(g.question.id, qid, 'same question stays up');
  assert.ok(g.cannon.cooldown > TIMING.fireCooldown);
  assert.equal(aliveEnemies(g).length, spec.enemies);
});

test('shooting a blank enemy is also just a miss', () => {
  const g = createGame(spec, 6);
  stepUntil(g, (s) => s.question);
  const blank = g.enemies.find((e) => e.value === null);
  fireAt(g, blank.id);
  assert.ok(stepUntil(g, (s) => s.stats.misses === 1, 120));
  assert.ok(blank.alive);
});

test('a beam aimed at an empty lane flies off without effect', () => {
  const g = createGame(spec, 7);
  stepUntil(g, (s) => s.question);
  const target = answerEnemy(g);
  fireAt(g, target.id);
  stepUntil(g, () => !target.alive, 120);
  stepUntil(g, (s) => s.cannon.cooldown === 0, 60);
  const beam = fireAtX(g, target.x);
  assert.equal(beam.targetId, null);
  stepUntil(g, (s) => s.beams.length === 0, 120);
  assert.equal(g.stats.misses, 0);
});

test('beams from an already-answered question fizzle', () => {
  const g = createGame(spec, 8);
  stepUntil(g, (s) => s.question);
  const right = answerEnemy(g);
  const wrong = decoyEnemy(g);
  // Fire at the decoy first but make the correct beam land first by putting it closer.
  fireAt(g, right.id);
  g.cannon.cooldown = 0;
  const late = fireAt(g, wrong.id);
  late.y = WORLD.cannonY + 400; // still far away when the answer lands
  stepUntil(g, () => !right.alive, 120);
  stepUntil(g, (s) => s.beams.length === 0, 240);
  assert.ok(wrong.alive);
  assert.equal(g.stats.misses, 0);
  assert.ok(g.events.some((e) => e.type === 'fizzle'));
});

test('fire cooldown blocks rapid fire; lanes map x to exactly one target', () => {
  const g = createGame(spec, 9);
  stepUntil(g, (s) => s.question);
  assert.ok(fire(g));
  assert.equal(fire(g), null);
  for (const e of g.enemies) assert.equal(targetAt(g, e.x), e);
});
