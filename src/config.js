// Fixed world geometry and timing (SPEC §1). Level-specific numbers live in data/levels.js.
export const WORLD = {
  W: 600,
  H: 800,
  bannerH: 100,
  startY: 150,
  stagger: 72,
  enemyR: 34,
  bossR: 56,
  defenseY: 640,
  cannonY: 730,
  laneMin: 40,
  laneMax: 560,
  cannonSpeed: 520,
};

export const TIMING = {
  dt: 1 / 60,
  swayPeriod: 5,
  beamSpeed: 1000,
  firstQuestion: 1.0,
  questionGap: 0.4,
  fireCooldown: 0.2,
  missCooldown: 0.5,
};
