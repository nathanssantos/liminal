# Contributing

liminal is a platform for automated music production and live steering — any music played back as
electronic, as a track you can rework down to every layer or as an endless set that flows between
references; the endless set ships first.
It is built by an autonomous loop with a human steering it, and the whole way of working is
written down. This page is that process in one read.

Everything in this repository and everything public on GitHub is in English.

## How the work is decided

The **spec is the source**. One file per card in [`docs/specs`](docs/specs), with frontmatter and
five sections, and a "done when" list where every item says how it is proven. A criterion without
a proof is not a criterion.

A script mirrors each spec onto a GitHub issue and a card on the board, **both ways**: edit the
issue here on GitHub and the change is pulled back into the spec. Editing the issue is a
legitimate way to steer the work.

## The board

The columns are `Backlog` → `Specified` → `Ready` → `In progress` → `In review` → `Done`, plus two
parking columns: **`Blocked`** (waiting on something the loop cannot resolve) and **`Decision
needed`** (waiting on a decision the owner must make). Those two are where a human is needed.

## The loop

One iteration is one card: read what humans changed, choose the card, open it, implement, prove,
review, deliver, merge, close, and start the next. When a milestone runs out of cards the loop
releases it and writes the specs for the next one. It stops only for a course decision, for a
broken environment, or when asked.

The full law is [`docs/process.md`](docs/process.md).

## How to propose something

| You want | Open an issue labelled | What happens |
|---|---|---|
| a feature or a change to the product | `idea` | it enters the next spec or planning iteration |
| a question answered about the domain | `research` | the next research iteration picks it up |
| a bug | `bug` | it becomes a card |
| a decision recorded | `decision` | it goes to `Decision needed` and stops the loop |

## The rules the code follows

- **Zero comments in code.** The information lives in the name, in the test, in the pull request
  or in [`docs/memory`](docs/memory). The sanctioned exceptions are a lint suppression with a
  reason, `TODO(#issue)`, and the result of an arithmetic expression.
- **Determinism.** A `seed` in the document and our own generator; never `Math.random`; integer
  ticks.
- **Package boundaries are a test.** Importing outside the table in
  [`docs/architecture.md`](docs/architecture.md) is a recorded decision, not a `package.json` edit.
- **Measure, do not assume.** A new number goes to `docs/memory/measurements.md` with its date and
  method.
- **Screens are proven on screen.** Playwright opens the app, drives it, measures and takes a
  screenshot; the screenshot goes into the pull request.
- **Never name a person** in a commit, a pull request, a card or a document. The origin is always
  an artifact: a card number, a decision, a measurement.

## Running it

```
pnpm install
pnpm check
```

`pnpm check` runs Biome, tsc, Vitest, ruff, mypy and pytest, prints all of it, and reports every
tool that failed. It needs Node 24 (`.nvmrc`), pnpm and [uv](https://docs.astral.sh/uv/).

Commits follow Conventional Commits, in English, in the imperative, at most 72 characters on the
first line. A hook installed by `pnpm install` enforces it.
