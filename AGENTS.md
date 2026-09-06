# AGENTS.md — how to work in this repo

> Read by any coding agent (Codex, Cursor, Copilot, Gemini CLI, Claude Code via `CLAUDE.md`).
> What is here applies to all. What is specific to one tool lives in that tool's file.

## What it is

liminal: a platform for automated music production and live steering. Give it music — a link, a
file, a melody — and it plays it back as electronic music: a track editable down to every layer,
or an endless set with transitions that make sense, steered by words and references. Electron app.
The LLM plans in `main`; the deterministic engine plays in the `renderer`. **The LLM is never in
the audio path.** The proposal evolves (`docs/product/bets.md`).

## Language

**Everything in this repo and everything public on GitHub is in English**: folder and file names,
identifiers, docs, specs, cards, issues, PRs, labels, release notes, agents, skills, memory
(ADR-0008). The language of the chat with the owner is a **local preference**, kept in
`CLAUDE.local.md` (not versioned) — read it at the start of a session; never put it in a
versioned file.

## Read in this order, before the first line

1. `docs/plan.md` — what it is, the requirements (the accepted bets), the three principles.
2. `docs/architecture.md` — packages, boundaries, what proves what.
3. `docs/process.md` — how work moves (SDD + loop). **§12 says what to read per area; §15 says
   when to stop and ask; §16 says which docs a change makes stale.**
3½. `docs/product/strategy.md`, `bets.md`, `usability.md`, `controls.md`, `completeness.md`, `scenarios.md` —
   who it is for, what good looks like, what must exist, what a person expects, how they use it;
   `docs/design/principles.md` — the visual and interaction language; `docs/research/` — what the
   loop has learned about the domain.
3¾. `docs/craft/` — what the brain knows as a DJ and a producer; read it whole before any card in
   `composition`, `brain` or `conductor`, and keep it true (§16).
4. `docs/memory/rules.md` — the section of the area you will touch. Then the ADRs in
   `docs/memory/decisions/` that cite that area, and `docs/memory/measurements.md`.
5. The card's spec: `docs/specs/<milestone>/<id>.md`. No spec, no card.

## Rules that always apply

- **Zero comments in code.** Information lives in the name, the test, the PR or the memory.
  Exceptions: a lint suppression with a reason, `TODO(#issue)`, and the result of an arithmetic
  expression (`60 * 1000 // 1 min`).
- **Strict card scope.** A finding outside it becomes one comment on the issue, and move on.
- **Never name a person** in a commit, PR, card, comment or doc. The origin is always an
  artifact: card number, ADR, measurement.
- **Determinism:** `seed` and own PRNG; never `Math.random`; integer ticks (ADR-0007).
- **Package boundaries are a test.** Importing outside the architecture table is an ADR, not a
  `package.json` edit.
- **Measure, do not assume.** A new number goes to `docs/memory/measurements.md` with date and
  method.
- **A lesson becomes a file** in the same PR: rule, ADR or measurement. What stays in the chat dies.
- **A doubt that changes the outcome → a question, with options.** Do not invent UI, behaviour
  or criteria.
- **Documentation evolves with the code.** A PR is not done while any doc it made stale still
  says the old thing (`docs/process.md › §16`). `board.deliver --stale-docs` must be clean.
- **Platform, not one track.** Describe the whole as a platform whose first product is the endless
  set; the score, transforms, generators, style cards, brains and engine are primitives.
- **Completeness is the loop's.** What a person would expect from a surface (`docs/product/completeness.md`)
  or a scenario (`docs/product/scenarios.md`) is found and proposed by the loop, never left for the
  owner to notice (`docs/process.md › §17`).
- **The proposal evolves.** The product is a set of bets (`docs/product/bets.md`); the loop explores
  new uses and questions old assumptions, and brings proposals (`docs/process.md › §18`).
- **Course decisions are the owner's.** When a doubt changes the product's direction, stop and ask
  (`docs/process.md › §15`); local doubts become a `question` and the loop moves on.
- **Screens are proven on screen.** Playwright with Electron opens the app, drives it, measures
  and takes a screenshot; the screenshot goes into the PR (`docs/process.md › §3.4`). Unit tests
  do not see positioning or CSS.

## Commands

| Command | Does |
|---|---|
| `pnpm check` | Biome, tsc, Vitest, ruff, mypy, pytest — full output, never truncated |
| `pnpm --filter desktop dev` | opens the app (with `--remote-debugging-port` so Playwright can attach) |
| `pnpm --filter desktop shot <state>` | launches the app, drives it to the state, saves screenshot and measurements to `evidence/` |
| `pnpm --filter engine play:fixture` | plays the sixteen-bar fixture through the speakers, for the listening gate |
| `LIMINAL_AUDIO_DEVICE=1 pnpm --filter engine test` | adds the live-clock engine tests, which need a real audio output device |
| `uv run --directory tools python -m analyzer` | the analyzer worker |
| `uv run --directory tools python -m board.sync --dry-run` | mirrors the specs onto the board |
| `uv run --directory tools python -m board.queue` | board, PRs, human inbox, git — what the skills read |
| `uv run --directory tools python -m board.open <nº>` | a card's gates, the area's memory, what the repo already has |
| `uv run --directory tools python -m board.move <nº> "<Status>"` | moves a card; parking needs `--reason` |
| `uv run --directory tools python -m board.comment <nº> --file text.md` | comments on an issue, optionally labelling it |
| `uv run --directory tools python -m board.review --card <id> --prepare` | one worktree at HEAD with the install done, for every review agent of the round |
| `uv run --directory tools python -m board.review --card <id> --scratch` | a throwaway worktree with an install of its own, for an agent that reverts a fix |
| `uv run --directory tools python -m board.review --card <id> --state` | the review state: round, heads, findings |
| `uv run --directory tools python -m board.check --area <path>` | dead mocks and branches, work out of the card's area |
| `uv run --directory tools python -m board.deliver --gates-only` | the delivery gates, full output into `evidence/_gates/` |
| `pnpm --filter desktop test:e2e` | Playwright with Electron opens the built app |
| `pnpm --filter desktop build` | builds main, preload and renderer |

## Definition of done

In `docs/process.md › §6`. Summary: every "done when" with evidence in the PR; `pnpm check`
green; review agents with no blocking finding; zero comments; spec and memory updated.

## Structure

```
apps/desktop         Electron: main (Node) · preload · renderer (React)
packages/score       the document
packages/composition theory, generators, transforms
packages/engine      Tone.js engine, isomorphic
packages/analysis    style card, worker client
packages/brain       brains: rules and Claude
packages/conductor   the conductor
packages/protocol    IPC channels
tools/               one uv project, two packages:
  analyzer/          Python: yt-dlp, librosa, worker
  board/             Python: sync, queue, open, move, comment, check, review, deliver
docs/                plan, architecture, process, specs, memory
```
