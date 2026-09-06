# HANDOFF 03 — enter the loop (M1 onward)

Paste this into a new Claude Code session opened at `~/Documents/dev/liminal`, **after** handoff 02
finished and M0 closed.

---

You will develop liminal in an **autonomous loop**: take a card from the board, implement, prove,
review, deliver, merge, and take the next — without waiting for anyone, for as long as there is
workable work. When a milestone closes, you release and write the specs of the next. When the plan
runs out, you propose the next milestone and **wait for the owner's decision**. When nothing is
workable, you research the domain and write it down. The owner steers through the chat and GitHub;
you read both at the start of every iteration. Everything you write in the repo or on GitHub is in
English; the chat follows the owner's preference in `CLAUDE.local.md` (not versioned).

**Read before acting**, in this order:

1. `AGENTS.md`, `CLAUDE.md`, and `CLAUDE.local.md` (local preferences).
2. `docs/plan.md` → `docs/architecture.md` → `docs/process.md` (whole — it is the law of the loop;
   §15 says when to stop for a decision, §16 which docs a change makes stale).
3. `docs/product/strategy.md`, `docs/product/usability.md` — who it is for and what good looks like.
4. `docs/memory/` whole: `rules.md`, `measurements.md`, the ADRs. Then, per card, only the area's
   section.
5. `docs/specs/cross-cutting/score.md`, `style-card.md`, `two-clocks.md`, `board.md` — what M1 and
   M2 implement and what the scripts do.
6. `docs/specs/M1-sound/README.md` and the five cards.
7. `docs/research/README.md` and `topics.md` — what the loop already learned and what it will study.
8. `.claude/skills/liminal/SKILL.md` — the execution order of one iteration; the other seven skills
   (`queue`, `start`, `review`, `deliver`, `spec`, `research`, `release`) are its steps.

## What exists for real

**M0 closed on 2026-09-05, released as `v0.0.0`.** Everything below was run, not assumed.

| Thing | State |
|---|---|
| repo | [`nathanssantos/liminal`](https://github.com/nathanssantos/liminal), public, MIT. `main` protected: a pull request is required, `node`, `python` and `desktop` must pass, the branch must be up to date, no force push, no deletion — **administrators included**, so nothing reaches `main` outside a pull request |
| monorepo | pnpm 11 + Turborepo. Node 24 (`.nvmrc`), TypeScript 6 strict with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` and `allowImportingTsExtensions` — **relative imports carry the `.ts`/`.tsx` extension** |
| packages | the eight `@liminal/*` and `apps/desktop`, each with a real test. `tools/boundaries.ts` reads every `package.json` against the architecture table and has three negative cases |
| desktop | Electron 44 + electron-vite 5 + Vite 7 + React 19 + Tailwind 4. `pnpm --filter desktop dev` opens the window on `--remote-debugging-port=9222`; `pnpm --filter desktop shot <state> --id <card>` saves `evidence/<id>/<state>-<width>.png` plus a `.json` of measurements at 1024/1440/1920. Tokens live in `packages/ui/src/tokens.css`, and the app imports them; every control comes from `@liminal/ui` (M1-07) |
| analyzer | `tools/` is one uv project with `analyzer` and `board`. `echo '{"cmd":"ping"}' \| uv run --directory tools python -m analyzer` answers |
| `pnpm check` | Biome, tsc, root and per-package, Vitest, ruff, mypy `--strict`, pytest. It runs **all** of them, never truncates, and ends with a line per tool. 44 Python tests, 17 TypeScript tests |
| CI | `ci.yml` with `node`, `python` and `desktop`; the desktop job always reports and only builds when its scope changed. `sync-board.yml` runs the sync on `main` and opens an auto-merging pull request. `release.yml` cuts the release from the `CHANGELOG.md` section on a `v*` tag |
| board | [project 9](https://github.com/users/nathanssantos/projects/9), public, eight Status columns with `Decision needed` and `Blocked` first, plus Priority and Listening. **Listening is a single-select `yes`/`no`** — Projects v2 has no checkbox |
| cards | the ten M0 cards `Done`; the five M1 cards on the board, `Specified`. M2 has only a README |
| scripts | `board.sync`, `queue`, `open`, `move`, `comment`, `check`, `deliver`, all listed in `AGENTS.md › Commands` |
| secrets | one: `BOARD_TOKEN`, used only by `sync-board.yml` |

**What M0 left for you**

- `M1-01` is the first card. `board.open 11` returns `CHECK` with no barrier — the `CHECK` is only
  the dirty tree, if yours is dirty.
- The skills call the modules directly; `/liminal` has never run a full iteration. Yours is the
  first.
- `board.check` and `board.comment` were written against their contract and unit-tested, but have
  not been exercised in a real iteration.

Until it is filled, **check yourself**: `git remote -v`, `gh project list --owner nathanssantos`,
`pnpm check`, `uv run --directory tools python -m board.queue`. If anything from M0 is not standing,
that is the first card — do not assume.

## How to start

```
/loop 3m /liminal
```

That is all. The skill reads the inputs, chooses the card, and follows the process. Before the first
iteration, say in the chat in one line what you are about to do, and then **do not stop to ask**
outside what the process provides for (§3.2: a local doubt becomes a `question` and another card;
§15: a course decision stops the loop and waits).

## What only the owner does, and how you ask

| Needs | How to ask |
|---|---|
| listening (`listening: true`) | the PR's evidence table with "pending: `heard: ok`"; one line in the chat saying **what** to listen for and **how** to run it (`pnpm --filter engine play:fixture`) |
| a local answer that changes what gets built | comment on the issue **with options**, `question` label, card to `Blocked`, one line in the chat; take another card |
| a **course decision** (a requirement, an ADR, a new milestone, money, user data, licences, anything that would waste several cards if guessed) | card to `Decision needed` with options and a recommendation, the same in the chat, **stop** |
| unblocking the environment (credential, service) | stop and report (§4) — not work, environment |

The owner follows the kanban: `Blocked` and `Decision needed` are the columns that mean "needs you".

## What goes wrong most, and memory already knows

- Tone.js in Node: polyfill **before** the import (`rules.md › engine`).
- The `AudioContext` in the renderer is born **on the click**, never on mount (M1-04).
- Determinism is per implementation: bytes only between two renders of the **same** Chromium (ADR-0002).
- One LLM process per decision costs 5× a persistent session (`measurements.md`).
- Truncated output lies twice; rebase drops commits silently (`rules.md › process`).
- Documentation goes stale in the same PR that changes the code — `board.deliver --stale-docs` and the
  `docs-reviewer` are gates, not suggestions (§16).

## How to know the session was good

`docs/journal.md` has a line per iteration; every merged PR has the evidence table; memory grew
where something cost; the docs still describe the code; no card sat `In progress` without a
branch; and the stop report, if any, says what waits on what. Cards in `Blocked` with a clear
comment **are a result** — not a failure. A card in `Decision needed` with options is the loop doing
its job.
