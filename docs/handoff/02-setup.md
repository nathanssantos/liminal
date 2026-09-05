# HANDOFF 02 — liminal setup (M0)

Paste this into a new Claude Code session opened at `~/Documents/dev/liminal`.

---

You will execute **M0 · Foundation** of liminal: turn a folder of documents into a public repo,
monorepo, CI, board and autonomous loop, ready for another agent to start implementing. **Read
before acting**, in this order, and skip nothing:

1. `AGENTS.md` (the rules — including: everything in the repo and on GitHub in English) and
   `CLAUDE.md` (what only applies in Claude Code). Then `CLAUDE.local.md` (not versioned) for the
   owner's local preferences, such as the chat language.
2. `docs/plan.md` → `docs/architecture.md` → `docs/stack.md` → `docs/process.md` (whole; §2, §8,
   §11, §15 and §16 shape how the board, the sync, the decisions and the docs work).
3. `docs/product/strategy.md`, `docs/product/usability.md`, `docs/research/README.md`.
4. `docs/memory/rules.md` › General and process; `docs/memory/measurements.md` (what was already
   measured on the machine — do not measure again); the eight ADRs in `docs/memory/decisions/`.
5. `docs/specs/cross-cutting/board.md` (the contract of the scripts you will write).
6. `docs/specs/M0-foundation/README.md` and the ten cards `M0-01.md` … `M0-10.md`.

## What exists for real

Only documents, agents and skills. **No git, no `package.json`, no remote repo, no board, no
`tools/`.** Nothing was compiled or run. Do not assume any command listed in `AGENTS.md › Commands`
already works — you are the one making them work.

```
AGENTS.md  CLAUDE.md  GEMINI.md -> AGENTS.md  README.md
.claude/agents/            13 agents (10 reviewers, 3 advisors), all read-only
.claude/skills/            8 project skills: liminal, queue, start, review, deliver, spec, research, release
docs/plan.md architecture.md stack.md process.md journal.md
docs/product/              strategy.md · usability.md
docs/research/             README.md · topics.md · one brief
docs/memory/               rules.md · measurements.md · decisions/ADR-0001..0008
docs/specs/cross-cutting/  score.md · style-card.md · two-clocks.md · board.md
docs/specs/M0-foundation/  README + 10 cards (your work)
docs/specs/M1-sound/       README + 5 cards (the next agent's work)
docs/specs/M2-ear/         README only (specs in M2's spec iteration)
docs/handoff/              this file and 03
docs/process.html          the published explainer (keep it current — process §16)
```

## Environment — checked on 2026-09-05

| Item | Value |
|---|---|
| Machine | macOS (Darwin 25.6), Apple Silicon |
| Node | 25.9.0 installed; **the project pins 24 LTS** (`.nvmrc`) — install via `nvm`/`fnm` if missing |
| pnpm | use `corepack`/`packageManager` from `package.json`; `marketmind` runs pnpm 11 |
| Python | `python3` with numpy and scipy; **no** `uv`, `librosa`, `yt-dlp` — `brew install uv`. `tools/` is **one** uv project with the packages `analyzer` and `board` |
| ffmpeg | installed, with `ebur128` and `astats` |
| `gh` | two accounts. **Active: `atom6nathan` (work). The repo belongs to `nathanssantos`** → `gh auth switch -u nathanssantos` before anything. The token **lacks** the Projects scope → `gh auth refresh -s project,read:project` |
| repo name | `nathanssantos/liminal` is free (checked) |
| skills | **the repo's**, in `.claude/skills/`. They depend on nothing in `~/.claude/skills` |
| agents | `~/.claude/agents` (14, frontend) are the machine's. The project's in `.claude/agents/` load only **after restarting** Claude Code |

## Execution order

M0 is the only milestone not born on the board — the board is one of its cards. So:

1. **M0-01** (repo and monorepo) and **M0-05** (board, milestones, labels) first — one commit per
   card, directly on `main` while there is no CI or protection (the only phase where that is allowed).
2. **M0-03** (Python) and **M0-02** (packages) → **M0-04** (CI).
3. **M0-06** (sync) and run it: creates the issues of **every** card of M0 (retroactive, already
   `Done` where applicable), M1 and M2 and puts them on the board with the status derived from the
   spec.
4. **M0-07** (board scripts: `queue`, `open`, `move`, `comment`, `check`, `deliver` — contract in
   `docs/specs/cross-cutting/board.md`). **M0-08** (agents and skills loading; restart Claude Code).
   **M0-09** (local gate and `main` protection) — from here on, everything by PR. **M0-10**
   (open-source hygiene).
5. Close M0 as the process says (§7, §14): prove the milestone gate, paste the evidence in the
   `milestone` issue, `/release` (`v0.0.0`), close the milestone, open M1 and create its `milestone`
   issue.

Per card: one line in `docs/journal.md`; lessons into `docs/memory/` (rule, ADR or measurement);
every doc the change made stale updated — **in the same change** (process §16). Fill
`AGENTS.md › Commands` with the real scripts.

## Rules that matter most here

- **Everything in the repo and on GitHub in English**; the chat follows `CLAUDE.local.md`.
- **Zero comments in code**, including configs and scripts. Sweep the diff on every edit.
- **Commits in English**, Conventional Commits, imperative, ≤ 72 chars on the first line.
- **Never name a person** in a commit, PR, issue, doc.
- **No truncated output** (`| tail`, `| head` in a gate). If it does not fit, save to a file and read.
- **Versions:** check the registry on the day (`npm view`, `uv pip index`), pin exact ones, record in
  `measurements.md`. If a pair does not fit (e.g. electron-vite × Vite 8), use the pair from
  `~/Documents/dev/marketmind` and record it in `rules.md › desktop`.
- **A doubt that changes the outcome → a question in the chat, with options** (AskUserQuestion).
  In this handoff there is no board yet for `question`; ask directly. A **course decision**
  (process §15) → stop and ask, always.
- **Secrets:** none. The scripts use the authenticated `gh`; no token in any file.
- **Blockers are announced**: in the chat, and — once the board exists — as cards in the `Blocked`
  or `Decision needed` columns.

## How to know you are done

The M0 gate, proven: CI green with one real test per package; `/queue` lists the board's cards;
`/start #<an M1 card>` returns `CLEARED` or `CHECK` with the whole card; `/liminal` loads and reaches
§1 choosing an M1 card; `v0.0.0` released with notes.

When done, update `docs/handoff/03-loop.md › What exists for real` with the real state, republish
`docs/process.html` if the process changed, and say in the chat: what was done, what was left out
(and why), and the command the next agent runs.
