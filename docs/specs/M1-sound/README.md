# M1 · Sound

> The score, the engine and the app shell. At the end of the milestone the app opens, plays 16
> bars of a fixed score, stops, and the same score rendered offline twice yields identical bytes.

**Milestone gate:** the two paragraphs above, proven: Playwright plays and stops; the determinism
test green in Chromium; and the human heard kick, hat, bass and chords.

## What already exists

No code. The cross-cutting specs this milestone implements: [score.md](../cross-cutting/score.md)
(whole) and [two-clocks.md](../cross-cutting/two-clocks.md) (only the engine hooks: `bar` event,
position, segment `load`).

## Cards, in order

| Id | Title | Depends on | Listening |
|---|---|---|---|
| M1-01 | The score: schema, invariants, fixture | M0 | no |
| M1-02 | Engine plays a score live | M1-01 | **yes** |
| M1-03 | Offline render and determinism | M1-02 | no |
| M1-04 | IPC protocol and the app shell | M1-02 | **yes** |
| M1-05 | Soundcheck in the hidden window | M1-03, M1-04 | no |
| M1-06 | `board.review`: prepared worktree, review state and the merge gate | — | no |

## Decisions of this milestone

- The engine receives the `AudioContext`; it never creates one (ADR-0002).
- v1 synth presets are the nine in the score; **no sampler**.
- The M1 UI is as small as possible **but with tokens**: colour, space and type as CSS vars from
  the start.
- Everything measured here goes to `measurements.md`: render time, Chromium × Node difference.
