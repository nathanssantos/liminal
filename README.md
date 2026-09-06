# liminal

[![ci](https://github.com/nathanssantos/liminal/actions/workflows/ci.yml/badge.svg)](https://github.com/nathanssantos/liminal/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-black)](LICENSE)
[![board](https://img.shields.io/badge/board-open-black)](https://github.com/users/nathanssantos/projects/9)

**A platform for automated music production and live steering — music you can hand a song to.**

Give it music — a YouTube link now; a file or a melody later — and it plays it back as electronic
music: as a **track** you can rework down to every layer, or as an **endless set** that travels
from one reference to the next with transitions that make sense. Say what you want in words. See
every layer that plays and change any of it. Hear where the set is going before it gets there.

Desktop app (Electron). The LLM plans; a deterministic engine plays. **The LLM is never in the
audio path.**

## Why it is built this way

| The gap | What we do about it |
|---|---|
| music is not a document | everything that plays is a schema'd, versioned document — bar 37 exists, an edit is a diff |
| the model is deaf | the reference becomes numbers, and every section is rendered and measured before it is heard |
| latency is fought instead of designed around | the engine holds the beat alone; the model plans a phrase ahead, and a missed answer changes nothing |

The score, the transforms, the generators, the style and content cards, the brains and the engine
are platform primitives. The products on them: the **endless set** (first), the **production** of a
track from a brief and a reference, and the **rework** of any music into electronic (under
exploration). The proposal itself evolves — the bets and the candidate uses are in
[docs/product/bets.md](docs/product/bets.md).

## Status

**v0.0.0 — M1 · Sound, in progress.** The app plays. Open it and there is a sixteen-bar set
already loaded: press play and it comes out of your speakers, with the tempo, the key, the bar and
the elapsed time on screen, a volume that starts at a safe level and never comes back louder, a
mute, and a picker for which output it goes to. Under it: the eight packages with their boundaries
enforced by a test, a deterministic engine that also renders offline, the design system every
screen composes from, a Python analyzer worker, continuous integration, and the board and scripts
the autonomous loop runs on. The endless set and the steering arrive in M4.

Follow the work on the [board](https://github.com/users/nathanssantos/projects/9).

## Running it

Needs Node 24 (`.nvmrc`), pnpm, and [uv](https://docs.astral.sh/uv/).

```
pnpm install
pnpm check                     # Biome, tsc, Vitest, ruff, mypy, pytest
pnpm --filter desktop dev      # opens the window
```

## Documentation

| File | What it brings |
|---|---|
| [docs/plan.md](docs/plan.md) | the product, the requirements, the principles, the milestones, the risks |
| [docs/architecture.md](docs/architecture.md) | processes, packages and boundaries, what proves what |
| [docs/stack.md](docs/stack.md) | every choice, with the discarded alternative |
| [docs/process.md](docs/process.md) | how the work moves: board, iteration, agents, memory |
| [docs/product/](docs/product/) | who it is for, the bets, what must exist (controls, completeness), how people use it (scenarios) |
| [docs/design/](docs/design/) | the visual and interaction language |
| [docs/specs/](docs/specs/) | the specs, per milestone and cross-cutting |
| [docs/memory/](docs/memory/) | learned rules, recorded decisions, measurements |
| [CONTRIBUTING.md](CONTRIBUTING.md) | the process in one read, and how to propose something |

## License

MIT.
