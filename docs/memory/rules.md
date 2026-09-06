# Learned rules

> One rule per mistake made or measurement taken. By area. Read the area's section **before**
> opening a card there. Process lives in [process.md](../process.md); decisions live in
> [decisions/](decisions/).

## General

- ⚠️ **`AGENTS.md` is not read by Claude Code.** It reads `CLAUDE.md`; its first line is
  `@AGENTS.md`. Codex, Cursor, Copilot and Gemini read `AGENTS.md` directly. (measured: docs as
  of August 2026)
- ⚠️ **A new agent in `.claude/agents/` only loads after restarting Claude Code** — the watcher
  covers only folders that existed when the session started. (measured on another project)
- ⚠️ **The `gh` token has no Projects scope by default.** `gh project …` answers
  `missing required scopes [read:project]`. Fix: `gh auth refresh -s project,read:project` on the
  right account. (measured 2026-09-05)
- ⚠️ **"No secrets" means no secret in the tree.** A GitHub Actions secret is fine, and there is
  exactly one: `BOARD_TOKEN`, a personal access token with the Projects scope, used only by the
  spec ↔ board sync workflow. Locally the scripts use the authenticated `gh` and need no token.
  Any second secret is a course decision (process §15). (decided 2026-09-05)
- 🔴 **Never invent a commit identity.** `<login>@users.noreply.github.com` is attributed to whoever
  owns that login on GitHub — a made-up one credited an unrelated real account as co-author, and
  removing it took a history rewrite of `main` with the loop paused (2026-09-06). A human commits
  with their own `git config`; automation commits as
  `github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>`. Trailers follow the
  same rule: no `Co-authored-by` with an address nobody controls.
- ⚠️ **`gh project …` answers `unknown owner type` with a classic PAT that has only `project` and
  `repo`.** Measured 2026-09-05 with `BOARD_TOKEN`. ⚠️ Correction: direct `gh api graphql` calls with
  `user(login:)` do **not** need more — the CI sync ran green with `project` + `repo` alone before
  `read:org` was added (run 33997931460). `read:org` is only for the `gh project` subcommands.
- ⚠️ **The loop depends on no skill outside the repo.** Everything it calls is in
  `.claude/skills/` and `tools/board`; the only external prerequisite is an authenticated `gh`
  with the `project` scope.
- ⚠️ **Two `gh` accounts on this machine.** The default active one is the work account; the repo
  belongs to the personal one. `gh auth switch -u nathanssantos` before any `gh repo` /
  `gh project`.
- ⚠️ **Everything in the repo and everything public on GitHub is in English** — folders, files,
  skills, docs, specs, commits, issues, labels, release notes, memory. The chat language is a local
  preference in `CLAUDE.local.md`, never in a versioned file. (decided 2026-09-05, ADR-0008)

## score

- 🔴 **xorshift32 has a fixed point at 0, and `seed: 0` is a legal document.** An unnormalized
  state gives an endless stream of zeros: every `newId` identical (E3 fails) and every generated
  note at tick 0. `createRng` normalizes `state = (seed >>> 0) || 0x9e3779b9`. (measured
  2026-09-06, test `does not collapse on seed 0, which is xorshift32 fixed point`)
- ⚠️ **`newId` ids are unique within one PRNG stream, never globally.** Two documents built from
  the same seed get the **same** ids. Fine for E3, which is scoped per document; a hazard for
  `lineage.parentId`, which points across documents. Whatever links two documents needs its own
  identity, not `newId`. (measured 2026-09-06)
- ⚠️ **The ids are ULID-shaped, not ULIDs.** All 26 characters come from the PRNG, so they carry
  no timestamp and do not sort by creation. Sorting by id is meaningless. (decided 2026-09-06)
- ⚠️ **The Zod schema carries shape only; legality lives in `validate`.** Ranges and integrality
  in the schema would report Zod's own codes, and the invariant table needs `E9` plus the element
  id. `parse` is the only door that runs both — `scoreSchema.parse` alone accepts a document the
  engine refuses. (decided 2026-09-06)
- ⚠️ **A `Score` byte-compared against a committed file needs `eol=lf` in `.gitattributes`.**
  Without it the comparison passes on macOS and fails on a CRLF checkout. Biome also reformats a
  committed `.json`, so `stringify` emits exactly Biome's shape: two spaces, sorted keys, trailing
  newline. (decided 2026-09-06)
- ⚠️ **`@liminal/score` must stay usable in the renderer**, so no `node:` import outside its
  tests and `zod` as the only runtime dependency. A test asserts both, because the package's
  tsconfig now carries node types for the byte-comparison test. (measured 2026-09-06)

## composition

- (empty — the first rule is born in M3)

## conductor

- (empty — the first rule is born in M4)

## engine

- 🔴 **superdough and Strudel do not run outside a browser.** Their "headless" is Puppeteer. An
  engine that must run in Node (CI, tests) cannot be Strudel. (measured: docs and issues, 2026-09)
- ⚠️ **Tone.js in Node needs the polyfill before the import.** `import 'node-web-audio-api/polyfill'`
  and only then `await import('tone')` — Tone uses `standardized-audio-context`, which does
  `instanceof` against globals such as `window.AudioParam`. (measured: node-web-audio-api README)
- ⚠️ **`AudioWorklet` in `node-web-audio-api` runs synchronously**, with no thread of its own. Do
  not measure worklet latency in Node and call it product latency. (measured: docs)
- ⚠️ **Determinism is per implementation.** Chromium × Node do not yield the same bytes. Compare
  duration and measurements with tolerance; bytes only between two renders of the same Chromium.
  (assumed until M1-05 measures)

## brain

- 🔴 **One LLM process per decision costs 5× a persistent session.** Measured on another project
  with the same design: 10,432 ms × 2,075 ms per decision, because ~9,700 tokens of system prompt
  come from cache in the session. See [measurements.md](measurements.md).
- ⚠️ **`--output-format stream-json` of `claude -p` requires `--verbose`** — without it the
  process dies immediately. Relevant if the Agent SDK is ever swapped for the raw CLI. (measured
  on another project)

## analyzer

- ⚠️ **yt-dlp without a PO token provider fails intermittently in 2026.** YouTube binds the token
  to the video; manual extraction no longer works. Install `bgutil-ytdlp-pot-provider` and treat a
  download failure as an explicit error with retry, never as "video without audio". (measured:
  yt-dlp wiki, 2026-09)
- ⚠️ **Importing `librosa` costs 1–2 s.** That is why the analyzer is a long-lived worker, not a
  process per call. (assumed until M2-06 measures)

## desktop

- 🔴 **UI does not ship without opening the screen.** Lint, types and unit tests pass with the
  component visibly broken; the gate is Playwright opening the app, measuring and taking a
  screenshot per state and width. (measured on other projects, several times)
- ⚠️ **A native module in Electron's main needs a rebuild for Electron's ABI.** Avoided by
  decision: audio plays in the renderer and `node-web-audio-api` only enters tests, in plain
  Node. See ADR-0002.
- ⚠️ **`electron-vite` 5 caps Vite at 7** (peer `^5 || ^6 || ^7`), so the newest Vite does not fit.
  The pinned pair is electron-vite 5.0.0 + Vite 7.3.6 + Electron 44.2.0 + `@vitejs/plugin-react`
  5.2.0. `@vitejs/plugin-react` 6 needs Vite 8 and is therefore out. (measured 2026-09-05, `npm view`)

## process

- 🔴 **`git rebase` silently drops commits** since git 2.34. Always `--reapply-cherry-picks`, and
  check commit count, `rev-list --count HEAD..upstream` = 0, and one symbol of the delivery in
  `git grep`. (measured on another project)
- 🔴 **Truncated output lies twice**: `| tail` hides the error in the middle **and** zeroes the
  exit code. No gate truncates. (measured on another project)
- 🔴 **`--reapply-cherry-picks` does NOT stop the drop.** git reapplies the commit and then drops it
  as empty — `dropping <sha> … patch contents already upstream` — while printing
  `Successfully rebased`. What catches it is comparing the commit count before and after, which is
  what `board.deliver --rebase-only` does. (measured 2026-09-05, test
  `rebase only aborts when git silently drops a commit`)
- ⚠️ **Projects v2 has no checkbox field.** The `Listening` field of the board is a single-select
  with `yes` and `no`; the board scripts read it as a boolean. (measured 2026-09-05)
- ⚠️ **Two commits made in the same second with the same tree, parent, message and author get the
  same SHA.** A git fixture that needs two distinct commits must vary the message. (measured
  2026-09-05, while writing the rebase test)
- 🔴 **`enforce_admins: true` blocks the workflows too.** With `main` protected against everyone, a
  workflow that pushes to `main` fails — the board sync opens an auto-merging pull request instead.
  The alternative, leaving admins outside the protection, would let any owner token push straight to
  `main` and would make the gate a decoration. (measured 2026-09-05, M0-09)
- 🔴 **A script that switches branches must put the branch back in a `finally`.** The sync opened a
  `docs/sync-<nº>` branch, failed on `gh pr merge`, and left the session on that branch — the next
  commits landed there without anyone noticing. It also must refuse to run at all while the tree is
  dirty. (measured 2026-09-05, during M0-07)
