# ADR-0007 · Score with time in integer ticks and its own seed

**Status:** accepted · 2026-09-05

## Context
"Music is a document" only works if the document is deterministic and diffable. Floats in
positions accumulate error; `Math.random` breaks reproducibility; JSON with unstable key order
dirties the diff.

## Decision
Positions and durations in integer ticks, 960 per quarter note. A uint32 `seed` in the document
and an own PRNG (xorshift32). Serialization with sorted keys. Seconds exist only inside the engine.

## Alternatives discarded
- **Seconds as floats** — drift and noisy diffs.
- **`seedrandom`** — a dependency for 10 lines.

## Consequences
- Generators and transforms are pure functions of (document, seed).
- `git diff` of two documents is readable.
- A BPM change moves no note: only the tick → second map.
