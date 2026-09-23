# Tidelight Tally

An original math arcade game. Murkjellies drift down toward the Tidelight Reef,
each one carrying a number. A sum appears at the top of the screen, and the
lantern-crab answers it by firing a pearl beam at the jelly showing the right
result. **Shooting is answering.** There's no typing and there are no answer
buttons.

**Play it live: https://piratekinginc.github.io/test-m6/**

It's a static site in vanilla HTML, CSS and JS on one `<canvas>`. It has zero
runtime dependencies. All art is drawn in code and all sound is synthesised
with the Web Audio API.

## How it plays

- The jellies keep sinking. The game never pauses for a question.
- Every question relabels the jellies. One shows the answer, a few show
  near-miss decoys (off by one, wrong operation, sign slip, one group off…),
  and the rest show a blank bubble.
- **A correct hit** destroys that jelly and pushes the whole swarm back up.
- **Answer fast** (while the gold bar under the question is still lit) and the
  hit **splashes**, taking nearby jellies with it. The faster the answer, the
  bigger the splash.
- **A slow but correct answer is always safe.** Every level promises a think
  time per question. Answer within it and the swarm can never reach the reef.
  This is proven for every level in CI (see below).
- **Shooting a wrong jelly** is only a miss. The jelly wobbles and there's a
  half-second cooldown. You never lose a life for a wrong answer.
- A jelly touching the glowing line at the bottom costs one of your 3 shells
  (lives) and sweeps the swarm back to the top. Losing all 3 lets you retry
  the level.

## Sections and Mixed Operations

| Section | Operation | Levels | Boss |
|---|---|---|---|
| Sunlit Shallows | Addition | A1–A5 + boss | Captain Carryclaw |
| Kelp Forest | Subtraction | S1–S5 + boss | Borrowfin |
| Coral Canyon | Multiplication | M1–M5 + boss | Timestentacle |
| Twilight Trench | Division | D1–D5 + boss | Splitshell |
| The Abyss *(optional)* | Mixed | X1–X3 + boss | The Tidemind |

Levels unlock in order, and each section ends in a boss wave. The boss is a
big jelly with health pips. It takes 1 damage from a slow hit and 2 from a
fast one. Numbers, swarm size, decoys and speed all ramp up level by level
and section by section. A1 is built for young children: three jellies, one
decoy, single-digit sums and a 12-second think time.

Beating the Division boss plays the **ending**. Mixed Operations (every
question picks +, −, × or ÷) unlocks after that. It's entirely optional and
has its own extended ending. The map shows every level and each section's
high score. Progress, best scores and the mute setting are saved in
`localStorage`.

The full difficulty spec for every level is in [SPEC.md](SPEC.md). The
runtime copy of that data is [`src/data/levels.js`](src/data/levels.js).

## Controls

| | |
|---|---|
| Touch | Tap a jelly (anywhere in its column). The crab jumps under it and fires |
| Mouse | Move to aim, click to fire |
| Keyboard | ← → (or A / D) to move, Space to fire, Enter for menu buttons |
| M / speaker button | Toggle sound |
| P / Esc / pause button | Pause |

## Running locally

```sh
npm run serve        # then open http://localhost:8080
```

Any static file server works. The page uses ES modules, so opening
`index.html` from `file://` won't.

## Tests

```sh
npm test             # all unit, property, verification and headless bot tests (node:test)
npm run e2e          # browser bot playthroughs (needs Playwright + Chromium)
npm run difficulty   # prints the typical-child difficulty table
```

CI (`.github/workflows/ci.yml`) runs all of these on every push and PR:

- **Generator property tests**: 10,000 questions per level (280,000 total). They
  check the answer is correct, the ranges exactly match the spec, no decoy
  equals the answer, no two jellies show the same number, and every decoy is a
  near-miss reproducible from its rule.
- **Survivability proof**: on every level, bosses included, a correct-but-slow
  bot (never fast enough to splash) clears the level with zero lives lost
  across 20 seeds.
- **Difficulty curve**: a "typical child" bot plays every level with
  human-like reaction times and occasional misses. The test fails if any level
  spikes relative to its neighbours.
- **Bot playthroughs**: New Game → all four sections → ending, and a second run
  through Mixed Operations. Both run headless on the game logic and in
  headless Chromium by clicking the real canvas.

Merges to `main` deploy to GitHub Pages (`.github/workflows/deploy.yml`). The
deploy job polls the live URL until it returns HTTP 200 with the new version.

## Code map

| File | Role |
|---|---|
| `src/data/levels.js` | Level difficulty specs (data only) |
| `src/questions.js` | Procedural questions + distractor rules |
| `src/game.js` | Pure, seeded, fixed-timestep simulation of one level |
| `src/flow.js`, `src/progress.js` | Screens, unlocks, endings, save data (pure) |
| `src/render.js`, `src/screens.js`, `src/fx.js` | Canvas drawing and effects |
| `src/audio.js` | Web Audio sound effects |
| `src/main.js` | Browser wiring: loop, input, storage |

Ideas that didn't make the cut are in [BACKLOG.md](BACKLOG.md).
