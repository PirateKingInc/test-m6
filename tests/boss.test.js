import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, fireAt, targetAt, laneLayout, aliveEnemies, step } from '../src/game.js';
import { allLevels, getLevel, SECTIONS } from '../src/data/levels.js';
import { WORLD } from '../src/config.js';
import { stepUntil, answerEnemy } from './helpers/sim.js';

test('every section ends with a boss level', () => {
  for (const section of SECTIONS) {
    const last = section.levels[section.levels.length - 1];
    assert.ok(last.boss && last.boss.hp >= 4, `${section.id} ends with a boss`);
    assert.ok(section.levels.slice(0, -1).every((l) => !l.boss));
  }
});

test('the boss spans two lanes and every lane still maps to one target', () => {
  for (const spec of allLevels().filter((l) => l.boss)) {
    const g = createGame(spec, 1);
    const boss = g.enemies.find((e) => e.boss);
    assert.equal(g.enemies.length, spec.enemies + 1);
    assert.equal(boss.hp, spec.boss.hp);
    const lanes = laneLayout(spec);
    assert.equal(lanes.length, spec.enemies + 2);
    assert.ok(lanes[0].width >= 2 * WORLD.enemyR, `${spec.id} lanes wide enough`);
    assert.ok(2 * lanes[0].width >= 2 * WORLD.bossR, `${spec.id} boss fits two lanes`);
    for (const lane of lanes) assert.ok(targetAt(g, lane.x + g.swayX), `${spec.id} lane at ${lane.x}`);
  }
});

// Put the current answer on the boss by swapping labels with the answer jelly.
function answerOnBoss(g) {
  const boss = g.enemies.find((e) => e.boss);
  const ans = answerEnemy(g);
  [boss.value, ans.value] = [ans.value, boss.value];
  [boss.rule, ans.rule] = [ans.rule, boss.rule];
  return boss;
}

function hitBoss(g, delay) {
  stepUntil(g, (s) => s.question && s.cannon.cooldown === 0);
  const shownAt = g.question.shownAt;
  stepUntil(g, (s) => s.t - shownAt >= delay);
  const boss = answerOnBoss(g);
  const hp = boss.hp;
  fireAt(g, boss.id);
  stepUntil(g, (s) => !s.question, 120);
  return hp - boss.hp;
}

test('slow hits deal 1 to the boss, fast hits deal 2', () => {
  const spec = getLevel('A-Boss');
  const g = createGame(spec, 2);
  assert.equal(hitBoss(g, spec.splashWindow + 0.2), 1);
  assert.equal(hitBoss(g, 0), 2);
});

test('fast splash on a nearby escort chips the boss for 1', () => {
  const spec = getLevel('M-Boss');
  for (let seed = 1; seed < 40; seed++) {
    const g = createGame(spec, seed);
    stepUntil(g, (s) => s.question);
    const ans = answerEnemy(g);
    if (ans.boss) continue;
    const boss = g.enemies.find((e) => e.boss);
    if (Math.hypot(ans.x - boss.x, ans.y - boss.y) > 190) continue;
    fireAt(g, ans.id);
    stepUntil(g, (s) => !s.question, 120);
    assert.equal(boss.hp, spec.boss.hp - 1);
    return;
  }
  assert.fail('no seed put the answer next to the boss');
});

test('defeating the boss scores the boss bonus and the level clears only when all are gone', () => {
  const spec = getLevel('A-Boss');
  const g = createGame(spec, 3);
  const boss = g.enemies.find((e) => e.boss);
  while (boss.alive) hitBoss(g, spec.splashWindow + 0.2);
  assert.ok(g.events.some((e) => e.type === 'bossDefeated'));
  assert.equal(g.result, null, 'escorts remain');
  while (!g.result) {
    stepUntil(g, (s) => (s.question && s.cannon.cooldown === 0) || s.result);
    if (g.result) break;
    fireAt(g, answerEnemy(g).id);
    stepUntil(g, (s) => !s.question || s.result, 120);
  }
  assert.equal(g.result, 'clear');
  assert.equal(aliveEnemies(g).length, 0);
  step(g);
});
