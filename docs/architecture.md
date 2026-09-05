# Architecture

> What each part is, where it lives, and what only it guarantees. Product decisions are in
> [plan.md](plan.md); per-mechanism specifics are in `specs/cross-cutting/`.

---

## Overview

```
┌───────────────────────────── Electron ─────────────────────────────┐
│                                                                     │
│  main (Node)                        renderer (Chromium)            │
│  ┌───────────────────────┐   IPC    ┌──────────────────────────┐   │
│  │ conductor             │◄────────►│ UI (React)               │   │
│  │ brain                 │          │ engine  (live)           │──► speakers
│  │ analysis (client)     │          └──────────────────────────┘   │
│  │ files, cache, log     │   IPC    ┌──────────────────────────┐   │
│  └───────────┬───────────┘◄────────►│ hidden window            │   │
│              │ stdio                │ engine  (soundcheck)     │──► wav on disk
│              ▼                      └──────────────────────────┘   │
│  tools/analyzer (Python worker)                                     │
│  yt-dlp · librosa · measure                                         │
└─────────────────────────────────────────────────────────────────────┘
```

Three processes, three responsibilities:

| Process | Responsibility | Never does |
|---|---|---|
| **main** | plan the set, talk to the LLM, run the analyzer, read and write files | play audio |
| **renderer** | play what main sent, show state, receive prompts and feedback | decide what comes next |
| **hidden window** | render the next section offline and return the wav | play audio |

🔴 **The LLM stays out of the audio path by construction**: it lives in main; the engine lives in
the renderer. Only documents and commands cross between them, over typed IPC.

---

## Packages and boundaries

pnpm + Turborepo monorepo. Each package has **one** reason to exist and a closed list of what it
may import.

| Package | What it is | May import |
|---|---|---|
| `@liminal/score` | the document: schemas, types, invariants, tick positions, fixtures | nothing internal |
| `@liminal/composition` | theory (over `tonal`), parametric generators, pure transforms | `score` |
| `@liminal/engine` | **isomorphic** Tone.js engine: given an `AudioContext`, plays or renders a score | `score` |
| `@liminal/analysis` | style card schema, Python worker client, `measure` | `score` |
| `@liminal/brain` | the head: rules brain and LLM brain (Agent SDK), validated structured output | `score`, `composition`, `analysis`, `protocol` |
| `@liminal/conductor` | the conductor: layered state, queues, horizon, controllers, transitions | `score`, `composition`, `analysis`, `brain`, `protocol` |
| `@liminal/protocol` | main ↔ renderer IPC contracts, in Zod | `score`, `analysis` |
| `apps/desktop` | Electron: main, preload, renderer | all |
| `tools/analyzer` | Python: `yt-dlp`, `librosa`, stdio worker (package of the `uv` project in `tools/`, next to `board`) | — |

🔴 **The boundary is a test, not a convention.** A test reads every `package.json` and fails any
dependency outside this table. `engine` does not know the DOM exists; `conductor` does not know
Electron exists; nobody imports `apps/desktop`.

---

## The document

Everything that plays is a `Score`. Time in **integer ticks** (960 per quarter note); no floats in
positions. Sections with role and energy; tracks with role and instrument; clips with notes;
automation; mix. A `seed` in the document: the same document produces the same audio.

Full spec: [score.md](specs/cross-cutting/score.md).

## The engine

`@liminal/engine` is a class that receives an `AudioContext` (or `OfflineAudioContext`) and a
document. It does not create contexts, touch the DOM, or know Electron. That is why the same code
runs in three places: renderer (live), hidden window (soundcheck), Node with `node-web-audio-api`
(headless CI tests).

Schedules with lookahead over Tone.js's `Transport`. Exposes current position (bar, beat, tick),
`play`, `stop`, `load`, `dispose`, and `renderOffline(score) → wav`.

⚠️ **Determinism is per implementation.** Chromium twice → identical bytes. Chromium × Node →
same duration and same measurements within tolerance, not the same bytes.

## The conductor

`@liminal/conductor` is where "endless" and "makes sense" live together.

**Layered state**, each with its own clock: set arc → track → section → phrase → bar. The brain
decides on the first three. The last two are rules.

**Six controllers**, each against one specific way a set falls apart:

| Controller | Kills |
|---|---|
| harmonic mixing (Camelot ±1 or relative) | key jumps |
| BPM budget (≤ 4 per track) | tempo jumps |
| motif memory (small bank; returns transformed) | a set that sounds like a playlist |
| energy curve as target, checked by measurement | a section that fails what the arc asked |
| novelty budget (distance between consecutive sections within a track) | boredom **and** chaos |
| transition as an object (filter, EQ, drum bridge, loop roll, modulation) | dumb crossfades |

**Horizon.** The conductor always keeps `COMMIT_HORIZON` bars committed ahead. Below
`MIN_HORIZON`, the fallback extends the current section **synchronously**. Numbers and proofs in
[two-clocks.md](specs/cross-cutting/two-clocks.md).

## The brain

`@liminal/brain` has one interface and two implementations:

| Brain | What it is | For |
|---|---|---|
| `rules` | deterministic TypeScript policy | baseline: proves the whole loop without spending tokens, and is the fallback |
| `claude` | persistent session via the Agent SDK (the credential is Claude Code's) | the product |

The brain receives **context** (target card, standing prompts, live prompts, accumulated
feedback, set state, motif bank, recent measurements) and returns a **structured plan** validated
by Zod. Invalid plan = fallback, never an exception in the loop.

Every call has a **deadline**: the time until the horizon. Past it, the result is discarded and
the rules carry on.

⭐ Measured on another project with the same design: a persistent session cuts the decision from
~10 s to ~2 s because the system prompt stays cached. The session restarts every N turns.

## The analyzer

`tools/analyzer` is Python (uv). Two doors:

- `analyze <url|file>` → style card as JSON;
- `measure <wav>` → measurements of a render (bands, loudness, density, centroid).

Runs as a **long-lived worker** speaking JSON lines over stdio. Importing `librosa` costs 1–2 s;
one process per measurement would blow the soundcheck budget.

The schema is **one**: Zod in `@liminal/analysis` is the source; the JSON Schema exported from it
validates the Python output in tests.

## IPC protocol

`@liminal/protocol` declares every channel with a Zod schema for input and output. The preload
exposes only typed functions; `contextIsolation` on; no Node in the renderer.

M1 channels: `score:load`, `transport:play`, `transport:stop`, `transport:position` (stream),
`render:offline`. The rest arrive per milestone, in each card's spec.

## Determinism

- `seed` in the document; own PRNG (xorshift, no dependency); never `Math.random`.
- Positions in integer ticks. Conversion to seconds only inside the engine, at scheduling time.
- Generators and transforms are pure: same input, same output, no clock, no I/O.

## What proves what

| Layer | Runs where | Proves | Does **not** prove |
|---|---|---|---|
| unit (Vitest) | Node | invariants, theory, generators, transforms, conductor with a fake engine | sound |
| headless engine | Node + `node-web-audio-api` | scheduling, duration, non-silence, measurements within tolerance | Chromium bytes |
| Chromium engine | Playwright + Electron | identical bytes across two renders; the UI plays and stops | taste |
| human | the speakers | whether it is good | — |

🔴 **A new component, or anything resting on a browser API, does not ship without opening the app
and listening.** Lint, type-check and tests pass with the audio visibly wrong.
