# M0 · Foundation

> Repo, monorepo, CI, board, project skills and agent instructions. No product yet — but
> everything the product will need to be developed in a loop.

**Milestone gate:** CI green with one real test per package; `/queue` lists the board's cards;
`/start #n` opens a card and passes its gates; `v0.0.0` released with notes.

## What already exists

Only documents: `docs/`, `AGENTS.md`, `CLAUDE.md`, `.claude/agents/`, `.claude/skills/`.
**No git, no `package.json`, no remote repo, no `tools/`.** The name `nathanssantos/liminal` is
free (checked 2026-09-05).

## Cards, in order

| Id | Title | Depends on |
|---|---|---|
| M0-01 | Repo and monorepo | — |
| M0-02 | Package skeletons and boundaries | M0-01 |
| M0-03 | Analyzer: Python skeleton | M0-01 |
| M0-04 | CI | M0-02, M0-03 |
| M0-05 | Board, milestones, labels and templates | M0-01 |
| M0-06 | Spec ↔ board sync | M0-03, M0-05 |
| M0-07 | Board scripts and project skills working | M0-05, M0-06 |
| M0-08 | Agent instructions loading | M0-01 |
| M0-09 | Local gate and `main` protection | M0-04 |
| M0-10 | Open-source hygiene and release scaffolding | M0-04, M0-05 |

⚠️ **M0 is the only milestone not born on the board**, because the board is one of its cards. The
real order: M0-01 → M0-05 → create the issues of every M0, M1 and M2 card through the sync
(M0-06) → continue from the board.

## Decisions that apply to every card

- Commits in English, Conventional Commits, imperative, ≤ 72 chars on the first line.
- Zero comments in code. Sweep the diff on every edit.
- Every card closes with one line in `docs/journal.md`.
- A doubt that changes the outcome → a question in the chat, with options.
