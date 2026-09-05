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
- ⚠️ **`gh project …` answers `unknown owner type` with a classic PAT that has only `project` and
  `repo`.** Measured 2026-09-05 with the `BOARD_TOKEN` candidate. Assumed fix: add `read:org` to the
  token (the `gh` owner lookup needs it even for a user-owned project). Direct `gh api graphql`
  calls with `user(login:)` should not need it — the CI run of the sync is what proves either way.
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

- (empty — the first rule is born in M1-01)

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
