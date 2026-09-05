# ADR-0002 · Audio plays in the renderer, never in main

**Status:** accepted · 2026-09-05 · depends on ADR-0001

## Context
With Electron there are two possible homes for the engine: `main` (Node, via
`node-web-audio-api`) or the `renderer` (Chromium's Web Audio).

## Decision
Engine in the renderer. `main` never plays audio. The soundcheck runs the **same code** in a
second hidden window. In CI, the same engine runs headless in Node with `node-web-audio-api` —
`devDependencies` only.

## Alternatives discarded
- **Engine in `main`** — a native module rebuilt for Electron's ABI on every upgrade, and a less
  battle-tested reimplementation than Chromium. It would gain "plays with no window", which the
  product does not ask for.

## Consequences
- The LLM (in `main`) stays out of the audio path **by construction**, not by discipline.
- Determinism is per implementation: identical bytes only between two renders of the same Chromium.
- `@liminal/engine` is isomorphic: it receives the `AudioContext`, it does not create one.
