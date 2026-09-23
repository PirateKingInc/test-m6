# Tidelight Tally — Game Specification

An original arcade game: a lantern-crab defends the Tidelight Reef from
**Murkjellies** that drift down from the surface. Every jelly carries a number.
A sum appears at the top of the screen; the crab fires a pearl beam at the jelly
showing the answer. Shooting *is* answering — there is no typing and there are
no answer buttons.

This document is the contract. The level numbers below are mirrored in
`src/data/levels.js` (the single source of truth at runtime) and a test keeps the
two in sync.

---

## 1. Core rules

| Rule | Value |
|---|---|
| Playfield | 600 × 800 logical units, portrait, scaled to fit the viewport (letterboxed) |
| Question banner | top 100 units |
| Formation start | top row centre at y = 150; with ≥ 5 lanes odd lanes sit one stagger (72) lower |
| Enemy radius | 30 (boss: 56, occupies two lanes) |
| Lanes | one enemy per lane, lanes evenly split the band x ∈ [40 + sway, 560 − sway]. No enemy is ever behind another, so no shot is ever blocked |
| Defence line | y = 640. An enemy whose lower edge touches it **breaches** |
| Crab cannon | y = 730 |
| Pearl beam | 1000 units/s, locks onto the enemy whose lane the crab is under when it fires |
| Question gap | 0.4 s between a correct hit and the next question (enemies keep moving) |
| First question | 1.0 s after the level starts |
| Fire cooldown | 0.2 s; a miss adds 0.5 s (the only consequence of a miss) |
| Lives | 3 per level attempt |

**Continuous advance.** The formation descends at the level's `descentSpeed`
*v* (units/s) at all times. The game never pauses for a question. The formation
also sways sideways (`sway` amplitude/period) purely for motion; lanes move with it.

**Breach = lose a life (applied consistently everywhere, bosses included).**
When any enemy breaches, the player loses one life and the whole formation is
swept back to its start height. The level continues with the same enemies. At
0 lives the attempt ends (Game Over → retry the level; section progress is kept).

**Questions.** One question is active at a time. When it appears, every living
enemy is relabelled: exactly one enemy shows the correct answer, up to
`decoys` other enemies show distractors, and any remaining enemies show a blank
bubble. Values on screen are always unique.

**Shooting.**
- Correct enemy hit → it takes damage (normal enemies have 1 HP), the whole
  formation is knocked back up by **K** (see §3) and the next question appears
  after the gap.
- Decoy or blank enemy hit → a *miss*: the enemy wobbles, the combo resets, a
  0.5 s cooldown is added. Nothing else happens; misses never cost lives.
- A beam whose question has already been answered fizzles harmlessly.

**Level clear** when every enemy (including the boss) is destroyed.

---

## 2. Speed-to-damage (splash) formula

Let *t* be the time from the question appearing to the correct beam being
fired and *w* the level's `splashWindow` (seconds).

```
f = max(0, 1 − t / w)          // speed factor, 1 = instant, 0 = slow
fast  ⇔ f > 0  (t < w)
R = 110 + 90 · f               // splash radius in units (110 … 200)
```

- **Fast** correct hit: every other non-boss enemy whose centre is within *R*
  of the target's centre is destroyed as well. A boss inside *R* takes 1 damage.
  If the target itself is the boss it takes **2** damage instead of 1.
- **Slow** correct hit: only the target takes 1 damage. No other effect differs:
  knockback, the next question and scoring of the hit itself are unchanged.

Score: `100 + round(100·f)` per correct hit, `+50` per splash kill, `+500`
for defeating a boss, `+200` per remaining life on level clear.

---

## 3. Survivability guarantee (slow-but-correct is always safe)

Each level declares a `safeAnswerTime` *s*: the longest per-question thinking
time the level promises to tolerate indefinitely. With overhead
Ω = gap (0.4) + maximum beam travel (0.6) = 1.0 s:

```
knockback K = v · (s + Ω)
```

A player who fires the correct answer within *s* seconds of every question
(no matter how far outside the splash window) never makes net downward
progress: per question the formation sinks at most v·(s+Ω) and is knocked back
by K ≥ that. So the deepest the formation ever gets is v·(s+Ω) below its start,
and every level satisfies

```
v · (s + Ω) ≤ 0.8 · D0        D0 = 640 − 30 − 222 = 388 units (lowest start row to breach)
```

`tests/survivability.test.js` proves this by simulation for every level
(including bosses and mixed levels) across many seeds with a policy that always
shoots the correct enemy at exactly `max(w, s)` seconds — never fast enough for
splash.

---

## 4. Level difficulty specs

Columns: operand ranges (`a`, `b`), `answer` range the correct result must fall
in, `display` range every on-screen number (answer and decoys) must fall in,
`N` enemies, `D` decoys shown per question, `v` descent speed (units/s), `s`
safe answer time (s), `w` splash window (s), `sway` amplitude (units), allowed
distractor rules. For ÷, `b` is the divisor, `answer` is the quotient range and
the dividend is `b × answer` (always exact). Boss levels add a boss with `HP`
beside `N` escorts.

### Section 1 — Addition · *Sunlit Shallows* (boss: Captain Carryclaw)

| Level | a | b | answer | display | N | D | v | s | w | sway | rules |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A1 | 0–5 | 0–4 | 0–9 | 0–9 | 3 | 1 | 8 | 12 | 4.0 | 0 | off1, off2 |
| A2 | 0–9 | 0–9 | 0–9 | 0–9 | 4 | 2 | 9 | 11 | 3.6 | 10 | off1, off2 |
| A3 | 1–9 | 1–9 | 2–18 | 0–20 | 5 | 3 | 10 | 10 | 3.2 | 16 | off1, off2, op, place |
| A4 | 10–40 | 1–9 | 11–49 | 0–60 | 5 | 3 | 11 | 10 | 3.0 | 16 | off1, off2, place, op |
| A5 | 10–50 | 10–49 | 20–99 | 0–120 | 6 | 4 | 12 | 9 | 2.8 | 20 | off1, off2, place, op |
| A-Boss | 15–69 | 15–29 | 30–99 | 0–120 | 4 + boss HP 4 | 4 | 10 | 10 | 2.8 | 12 | off1, off2, place, op |

### Section 2 — Subtraction · *Kelp Forest* (boss: Borrowfin)

| Level | a | b | answer | display | N | D | v | s | w | sway | rules |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 1–9 | 0–9 | 0–9 | 0–9 | 4 | 2 | 10 | 11 | 3.6 | 10 | off1, off2 |
| S2 | 5–18 | 1–9 | 0–9 | 0–20 | 5 | 3 | 11 | 10 | 3.2 | 16 | off1, off2, op |
| S3 | 10–50 | 1–9 | 1–49 | 0–60 | 5 | 3 | 12 | 10 | 3.0 | 16 | off1, off2, op, place |
| S4 | 20–99 | 10–49 | 1–89 | 0–150 | 6 | 4 | 13 | 9 | 2.8 | 20 | off1, off2, op, place |
| S5 | 0–20 | 0–20 | −20–20 | −40–40 | 6 | 4 | 14 | 9 | 2.6 | 20 | off1, off2, sign, op |
| S-Boss | 0–50 | 0–50 | −50–50 | −100–100 | 4 + boss HP 5 | 4 | 12 | 10 | 2.6 | 12 | off1, off2, sign, op, place |

### Section 3 — Multiplication · *Coral Canyon* (boss: Timestentacle)

| Level | a | b | answer | display | N | D | v | s | w | sway | rules |
|---|---|---|---|---|---|---|---|---|---|---|---|
| M1 | 0–5 | 1–2 | 0–10 | 0–12 | 4 | 2 | 12 | 10 | 3.4 | 10 | off1, off2, group |
| M2 | 1–5 | 1–5 | 1–25 | 0–30 | 5 | 3 | 13 | 10 | 3.2 | 16 | group, off1, op |
| M3 | 2–9 | 2–5 | 4–45 | 0–60 | 5 | 3 | 14 | 9 | 3.0 | 16 | group, off1, op |
| M4 | 2–9 | 2–9 | 4–81 | 0–100 | 6 | 4 | 15 | 9 | 2.8 | 20 | group, off1, op, place |
| M5 | 2–12 | 2–12 | 4–144 | 0–160 | 7 | 5 | 16 | 8 | 2.6 | 20 | group, off1, op, place |
| M-Boss | 3–12 | 3–12 | 9–144 | 0–160 | 5 + boss HP 5 | 5 | 14 | 9 | 2.6 | 12 | group, off1, op, place |

### Section 4 — Division · *Twilight Trench* (boss: Splitshell)

| Level | b (divisor) | answer (quotient) | display | N | D | v | s | w | sway | rules |
|---|---|---|---|---|---|---|---|---|---|---|
| D1 | 1–2 | 0–5 | 0–9 | 4 | 2 | 13 | 10 | 3.4 | 10 | off1, off2 |
| D2 | 2–5 | 1–5 | 0–12 | 5 | 3 | 14 | 10 | 3.2 | 16 | off1, off2, divisor |
| D3 | 2–5 | 1–10 | 0–15 | 5 | 3 | 15 | 9 | 3.0 | 16 | off1, off2, divisor |
| D4 | 2–9 | 2–9 | 0–15 | 6 | 4 | 16 | 9 | 2.8 | 20 | off1, off2, divisor |
| D5 | 2–12 | 2–12 | 0–20 | 7 | 5 | 17 | 8 | 2.6 | 20 | off1, off2, divisor, place |
| D-Boss | 3–12 | 3–12 | 0–20 | 5 + boss HP 5 | 5 | 15 | 9 | 2.6 | 12 | off1, off2, divisor, place |

### Mixed Operations · *The Abyss* (optional; boss: The Tidemind)

Unlocks only after the Division boss. Each question picks one of the four
operations uniformly and generates it with the referenced level's number
ranges, display range and rules. Never required for the ending.

| Level | mixes | N | D | v | s | w | sway |
|---|---|---|---|---|---|---|---|
| X1 | A3, S2, M2, D2 | 6 | 4 | 16 | 9 | 2.8 | 16 |
| X2 | A4, S3, M3, D3 | 6 | 4 | 17 | 8 | 2.6 | 20 |
| X3 | A5, S4, M4, D4 | 7 | 5 | 18 | 8 | 2.4 | 20 |
| X-Boss | A5, S5, M5, D5 | 5 + boss HP 6 | 5 | 16 | 9 | 2.4 | 12 |

Max v·(s+Ω) across all levels is 18·9 = 162 ≤ 0.8·388 = 310.4 ✓.

**Why the curve suits young children:** A1 has three jellies, one decoy, single
digit sums, a 12 s think time, no sway, and decoys that differ by 1–2
(clearly different digits). The only text during play is digits and the
operator symbol; menus use icons.

---

## 5. Question generation

All questions are procedurally generated from the level spec with the seeded
RNG (`src/rng.js`, mulberry32). Nothing is hand-written.

- **+ / − / ×:** draw `a` and `b` uniformly from their ranges, compute the result,
  reject and redraw until it lies in `answer`.
- **÷:** draw divisor `b` and quotient `c` uniformly, dividend `a = b·c`, question
  `a ÷ b`. Division is always exact.
- The generator computes the correct answer; it is never stored by hand.

### Distractor rules

Each distractor carries the rule that produced it. For result *c* of `a ∘ b`:

| Rule | Candidates | Applies to |
|---|---|---|
| `off1` | c − 1, c + 1 (off by one) | all |
| `off2` | c − 2, c + 2 | all |
| `op` | the wrong operation: + → \|a − b\| and a·b; − → a + b; × → a + b; ÷ → a − b | + − × ÷ |
| `place` | c − 10, c + 10 (carry/borrow/place-value slip) | all, only when \|c\| ≥ 10 |
| `sign` | −c (sign confusion, i.e. b − a) | −, only when c ≠ 0 |
| `group` | c − b, c + b, c − a, c + a (one group too few/many) | × |
| `divisor` | b (answering with the divisor) | ÷ |
| `offk` | c ± 3, c ± 4, … (fallback, nearest first) | all, only to fill |

Selection per question:
1. Build candidates from the level's rules. Drop any candidate that equals *c*,
   is outside `display`, duplicates another candidate, or is further than the
   **near-miss bound** `B = max(10, |c|, |a|, |b|)` from *c*.
2. Shuffle (seeded). "Misconception" rules (`op`, `sign`, `group`, `divisor`,
   `place`) are preferred for up to half of the decoys, then off-by-one/two.
3. If fewer than `D` remain, fill with `offk` nearest-first inside `display`.

Invariants (property-tested over ≥ 10 000 questions per level):
correct value is mathematically correct; operands and answer lie in the spec
ranges exactly; every on-screen value lies in `display`; no decoy equals the
answer; no two on-screen values are equal; every decoy satisfies its rule's
formula and the near-miss bound.

---

## 6. Structure and progression

- 4 sections × (5 levels + boss) = 24 required levels, then 4 optional mixed levels.
- Levels unlock in order; a section's first level unlocks when the previous
  section's boss is beaten. Mixed Operations unlocks after the Division boss.
- **Ending screen** appears after the Division boss the first time it is beaten
  (the game can be finished without Mixed). Beating the Mixed boss shows the
  extended ending.
- A **progress map** shows every section, level state (locked / open /
  cleared) and per-section high score.
- `localStorage` persists unlocks, per-level best scores (section high score =
  sum of its level bests) and whether each ending was seen.

## 7. Controls

- Desktop: ← / → (or A / D) move the crab, Space fires; mouse moves the crab,
  click fires.
- Touch: tap a jelly (anywhere in its lane) — the crab jumps under it and fires.
- M toggles sound, P / Esc pauses (the only pause — never triggered by the game).
- No scrolling or zooming during play (`touch-action: none`, fixed viewport).

## 8. Technical constraints

- Static site: vanilla HTML/CSS/JS modules on a single `<canvas>`. No runtime
  dependencies, no asset files: all art is drawn in code, all audio is Web Audio.
- Game logic (`src/game.js`, `src/questions.js`, `src/flow.js`,
  `src/progress.js`) is pure and DOM-free; rendering/input/audio live in
  separate modules. Seeded RNG, fixed 1/60 s timestep.
- Level specs live in `src/data/levels.js`, separate from the generator and renderer.

## 9. Out of scope

- Typed input of any kind
- Currency, shop, or unlockable purchases
- More than one weapon type
- Procedural level layouts (levels are hand-tuned specs; only questions are generated)
- Accounts, cloud saves, leaderboards

Extra ideas go to `BACKLOG.md`.
