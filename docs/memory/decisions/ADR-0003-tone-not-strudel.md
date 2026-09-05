# ADR-0003 · Tone.js is the engine; Strudel, at most, notation

**Status:** accepted · 2026-09-05

## Context
Strudel/superdough is the dominant choice of "LLM + live music" projects. But superdough does not
run outside a browser (their headless mode is Puppeteer), and the engine must run in Node for CI.

## Decision
Engine in Tone.js 15 over Web Audio, with an own document (`@liminal/score`) as input.
`@strudel/core` (patterns → events, plain JS) may be evaluated as **notation** for the LLM to
write patterns, in an M3 spike — never as the engine.

## Alternatives discarded
- **superdough as engine** — no Node, no headless CI, no controlled offline render.
- **SuperCollider** — an external runtime to install, out of process. Stays as an advanced
  synthesis option after M5.

## Consequences
- The document is the source; any notation (Strudel, MIDI) compiles into it.
- Genre reach depends on samples/soundfonts, which come after M5.
