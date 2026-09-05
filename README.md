# liminal

[![ci](https://github.com/nathanssantos/liminal/actions/workflows/ci.yml/badge.svg)](https://github.com/nathanssantos/liminal/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-black)](LICENSE)
[![board](https://img.shields.io/badge/board-open-black)](https://github.com/users/nathanssantos/projects/9)

**A platform for generating and steering music. Its first product is an endless set.**

You paste a YouTube link as a reference, write what you want, press play — and the set plays until
you tell it to stop, answering what you ask mid-set. Paste another link while it plays and the set
travels there, without a cut.

Desktop app (Electron). The LLM plans; a deterministic engine plays. **The LLM is never in the
audio path.**

## Why it is built this way

| The gap | What we do about it |
|---|---|
| music is not a document | everything that plays is a schema'd, versioned document — bar 37 exists, an edit is a diff |
| the model is deaf | the reference becomes numbers, and every section is rendered and measured before it is heard |
| latency is fought instead of designed around | the engine holds the beat alone; the model plans a phrase ahead, and a missed answer changes nothing |

The score, the transforms, the generators, the style cards, the brains and the engine are
platform primitives. The endless set is what they were built for first.

## Status

**v0.0.0 — the foundation.** There is nothing to hear yet. What exists is the ground: the
monorepo, the seven packages with their boundaries enforced by a test, an Electron shell that
opens, a Python analyzer worker, continuous integration, and the board and scripts the autonomous
loop runs on. Sound arrives in M1.

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
| [docs/product/](docs/product/) | who it is for, how it is positioned, what good use looks like |
| [docs/design/](docs/design/) | the visual and interaction language |
| [docs/specs/](docs/specs/) | the specs, per milestone and cross-cutting |
| [docs/memory/](docs/memory/) | learned rules, recorded decisions, measurements |
| [CONTRIBUTING.md](CONTRIBUTING.md) | the process in one read, and how to propose something |

## License

MIT.
