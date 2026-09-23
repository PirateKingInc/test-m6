// Pure game simulation for a single level attempt. No DOM access.
import { WORLD, TIMING, SPLASH, OVERHEAD, SCORE } from './config.js';
import { createRng } from './rng.js';
import { makeRound } from './questions.js';

// f = max(0, 1 - t/w): 1 for an instant answer, 0 once the splash window has passed.
export function speedFactor(answerTime, splashWindow) {
  return Math.max(0, 1 - answerTime / splashWindow);
}

export function splashRadius(f) {
  return SPLASH.baseRadius + SPLASH.extraRadius * f;
}

// Every correct hit pushes the formation back up by this much (SPEC §3).
export function knockbackFor(spec) {
  return spec.descentSpeed * (spec.safeAnswerTime + OVERHEAD);
}

// Boss levels reserve two extra lanes in the middle for the boss.
export function laneCount(spec) {
  return spec.enemies + (spec.boss ? 2 : 0);
}

export function laneLayout(spec) {
  const sway = spec.sway ?? 0;
  const count = laneCount(spec);
  const left = WORLD.laneMin + sway;
  const width = (WORLD.laneMax - sway - left) / count;
  return Array.from({ length: count }, (_, i) => ({ x: left + (i + 0.5) * width, width }));
}

function buildFormation(spec) {
  const lanes = laneLayout(spec);
  const staggered = lanes.length >= 5;
  const bossLane = spec.boss ? Math.floor(lanes.length / 2) - 1 : -1;
  const enemies = [];
  lanes.forEach((lane, i) => {
    if (spec.boss && i === bossLane + 1) return; // second half of the boss
    const boss = i === bossLane;
    const x = boss ? (lane.x + lanes[i + 1].x) / 2 : lane.x;
    enemies.push({
      id: enemies.length,
      lane: i,
      boss,
      baseX: x,
      baseY: boss ? WORLD.startY + 20 : WORLD.startY + (staggered && i % 2 === 1 ? WORLD.stagger : 0),
      halfWidth: boss ? lane.width : lane.width / 2,
      x,
      y: 0,
      r: boss ? WORLD.bossR : WORLD.enemyR,
      hp: boss ? spec.boss.hp : 1,
      maxHp: boss ? spec.boss.hp : 1,
      alive: true,
      value: null,
      rule: null,
      wobble: 0,
      flash: 0,
    });
  });
  return enemies;
}

export function createGame(spec, seed = 1) {
  const state = {
    spec,
    rng: createRng(seed),
    t: 0,
    offsetY: 0,
    swayX: 0,
    enemies: buildFormation(spec),
    cannon: { x: WORLD.W / 2, cooldown: 0 },
    beams: [],
    nextBeamId: 1,
    question: null,
    questionCount: 0,
    nextQuestionAt: TIMING.firstQuestion,
    result: null,
    lives: TIMING.lives,
    score: 0,
    combo: 0,
    stats: { fired: 0, correct: 0, misses: 0, breaches: 0, fast: 0, splashKills: 0, answerTimes: [], maxDepth: 0 },
    events: [],
  };
  positionEnemies(state);
  return state;
}

export const aliveEnemies = (state) => state.enemies.filter((e) => e.alive);

function positionEnemies(state) {
  const amp = state.spec.sway ?? 0;
  state.swayX = amp * Math.sin((2 * Math.PI * state.t) / TIMING.swayPeriod);
  for (const e of state.enemies) {
    e.x = e.baseX + state.swayX;
    e.y = e.baseY + state.offsetY;
  }
}

// The living enemy whose lane contains x (lanes tile the band, so at most one).
export function targetAt(state, x) {
  return state.enemies.find((e) => e.alive && Math.abs(x - e.x) <= e.halfWidth) ?? null;
}

export function setCannonX(state, x) {
  state.cannon.x = clamp(x, WORLD.laneMin, WORLD.laneMax);
}

// Fire a pearl beam from the crab. It locks onto the enemy in the crab's lane.
export function fire(state) {
  if (state.result || state.cannon.cooldown > 0) return null;
  const target = targetAt(state, state.cannon.x);
  const q = state.question;
  const beam = {
    id: state.nextBeamId++,
    x: state.cannon.x,
    y: WORLD.cannonY - 30,
    targetId: target ? target.id : null,
    qid: q ? q.id : null,
    firedAt: state.t,
    correct: Boolean(q && target && target.value === q.answer),
  };
  state.beams.push(beam);
  state.cannon.cooldown = TIMING.fireCooldown;
  state.stats.fired++;
  state.events.push({ type: 'fire', x: beam.x });
  return beam;
}

// Touch/click on the playfield: move under that lane and fire.
export function fireAtX(state, x) {
  setCannonX(state, x);
  return fire(state);
}

export function fireAt(state, enemyId) {
  const e = state.enemies.find((en) => en.id === enemyId && en.alive);
  if (!e) return null;
  return fireAtX(state, e.x);
}

function newQuestion(state) {
  const alive = aliveEnemies(state);
  const decoyCount = Math.min(state.spec.decoys, alive.length - 1);
  const { question, decoys } = makeRound(state.spec, state.rng, decoyCount);
  state.questionCount++;
  state.question = { ...question, id: state.questionCount, shownAt: state.t };
  const order = state.rng.shuffle([...alive]);
  order.forEach((e, i) => {
    if (i === 0) {
      e.value = question.answer;
      e.rule = 'answer';
    } else if (i <= decoys.length) {
      e.value = decoys[i - 1].value;
      e.rule = decoys[i - 1].rule;
    } else {
      e.value = null;
      e.rule = null;
    }
  });
  state.events.push({ type: 'question', text: question.text });
}

function clearQuestion(state) {
  state.question = null;
  state.nextQuestionAt = state.t + TIMING.questionGap;
  for (const e of state.enemies) {
    e.value = null;
    e.rule = null;
  }
}

function kill(state, e, cause) {
  e.alive = false;
  e.hp = 0;
  state.events.push({ type: 'kill', x: e.x, y: e.y, cause, lane: e.lane, boss: e.boss });
  if (e.boss) {
    state.score += SCORE.boss;
    state.events.push({ type: 'bossDefeated', x: e.x, y: e.y });
  }
}

function correctHit(state, target, beam) {
  const { spec, stats } = state;
  const answerTime = beam.firedAt - state.question.shownAt;
  const f = speedFactor(answerTime, spec.splashWindow);
  const fast = f > 0;
  stats.correct++;
  stats.answerTimes.push(answerTime);
  // A fast hit on the boss counts double (the boss can't be splashed by its own hit).
  target.hp -= target.boss && fast ? 2 : 1;
  target.flash = 1;
  if (target.hp <= 0) kill(state, target, 'hit');
  let splashKills = 0;
  const radius = fast ? splashRadius(f) : 0;
  if (fast) {
    stats.fast++;
    for (const e of aliveEnemies(state)) {
      if (e === target || Math.hypot(e.x - target.x, e.y - target.y) > radius) continue;
      e.hp -= 1;
      e.flash = 1;
      if (e.hp <= 0) {
        kill(state, e, 'splash');
        splashKills++;
      }
    }
  }
  stats.splashKills += splashKills;
  state.combo = fast ? state.combo + 1 : 0;
  const points = SCORE.hit + Math.round(SCORE.speedBonus * f) + SCORE.splashKill * splashKills;
  state.score += points;
  state.offsetY = Math.max(0, state.offsetY - knockbackFor(spec));
  positionEnemies(state);
  state.events.push({ type: 'correct', x: target.x, y: target.y, fast, f, radius, points, splashKills });
  clearQuestion(state);
  if (aliveEnemies(state).length === 0) {
    state.result = 'clear';
    state.score += SCORE.lifeBonus * state.lives;
    state.events.push({ type: 'clear' });
  }
}

function resolveBeam(state, beam, target) {
  const q = state.question;
  if (!q || beam.qid !== q.id) {
    state.events.push({ type: 'fizzle', x: target.x, y: target.y });
  } else if (beam.correct) {
    correctHit(state, target, beam);
  } else {
    state.stats.misses++;
    state.combo = 0;
    target.wobble = 1;
    state.cannon.cooldown = Math.max(state.cannon.cooldown, TIMING.missCooldown);
    state.events.push({ type: 'miss', x: target.x, y: target.y });
  }
}

function updateBeams(state) {
  const dy = TIMING.beamSpeed * TIMING.dt;
  const remaining = [];
  for (const beam of state.beams) {
    const target = beam.targetId === null ? null : state.enemies[beam.targetId];
    beam.y -= dy;
    if (target) {
      if (!target.alive) {
        state.events.push({ type: 'fizzle', x: beam.x, y: beam.y });
        continue;
      }
      beam.x = target.x;
      if (beam.y <= target.y) {
        resolveBeam(state, beam, target);
        continue;
      }
    } else if (beam.y < 0) {
      continue;
    }
    remaining.push(beam);
  }
  state.beams = remaining;
}

export function breached(e) {
  return e.alive && e.y + e.r >= WORLD.defenseY;
}

// Any enemy touching the defence line costs one life and sweeps the formation back
// to its start height. Same rule on every level, bosses included (SPEC §1).
function checkBreach(state) {
  const culprit = state.enemies.find(breached);
  if (!culprit) return;
  state.lives--;
  state.stats.breaches++;
  state.combo = 0;
  state.events.push({ type: 'breach', x: culprit.x, y: WORLD.defenseY });
  state.offsetY = 0;
  positionEnemies(state);
  if (state.lives <= 0) {
    state.result = 'lost';
    state.events.push({ type: 'gameover' });
  }
}

// Advance the simulation by exactly one fixed timestep.
export function step(state, input = {}) {
  if (state.result) return state;
  const dt = TIMING.dt;
  state.t += dt;
  const move = input.move ?? 0;
  if (move) setCannonX(state, state.cannon.x + move * WORLD.cannonSpeed * dt);
  state.cannon.cooldown = Math.max(0, state.cannon.cooldown - dt);
  for (const e of state.enemies) {
    e.wobble = Math.max(0, e.wobble - dt * 2.5);
    e.flash = Math.max(0, e.flash - dt * 3);
  }
  state.offsetY += state.spec.descentSpeed * dt;
  state.stats.maxDepth = Math.max(state.stats.maxDepth, state.offsetY);
  positionEnemies(state);
  checkBreach(state);
  if (state.result) return state;
  updateBeams(state);
  if (!state.result && !state.question && state.t >= state.nextQuestionAt && aliveEnemies(state).length) {
    newQuestion(state);
  }
  return state;
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
